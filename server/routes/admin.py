"""
Admin routes for cache management, database seeding, and data maintenance
"""

import os
import sys
from pathlib import Path
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from core.cache import invalidate_cache_pattern, get_cache_stats, redis_client

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_SECRET = os.getenv("ADMIN_SECRET")

def check_secret(request: Request):
    """Verify admin secret from header"""
    secret = request.headers.get("X-ADMIN-SECRET")
    if not secret or secret != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

class SeedResponse(BaseModel):
    status: str
    message: str
    details: dict = {}

# ============================================
# Stats Endpoints
# ============================================

@router.get("/stats")
async def get_stats(request: Request):
    """Get endpoint hit counts, cache hit/miss ratio, and unique visitors.
    
    Usage:
        curl https://api.stellarbladeguide.com/api/admin/stats \
            -H "X-ADMIN-SECRET: your-secret"
    """
    check_secret(request)

    endpoints = await redis_client.hgetall("stats:endpoints")
    cache = await redis_client.hgetall("stats:cache")
    status_codes = await redis_client.hgetall("stats:status_codes")
    unique_ips = await redis_client.pfcount("stats:unique_ips")

    # Sort endpoints by hit count descending
    sorted_endpoints = dict(
        sorted(endpoints.items(), key=lambda x: int(x[1]), reverse=True)
    )

    # Calculate cache hit rate
    hits = int(cache.get("HIT", 0))
    misses = int(cache.get("MISS", 0))
    total = hits + misses
    hit_rate = f"{(hits / total * 100):.1f}%" if total > 0 else "N/A"

    return {
        "endpoints": sorted_endpoints,
        "cache": {
            **cache,
            "hit_rate": hit_rate,
        },
        "status_codes": status_codes,
        "unique_visitors": unique_ips,
        "total_requests": sum(int(v) for v in endpoints.values()),
    }

@router.post("/stats/reset")
async def reset_stats(request: Request):
    """Reset all stats counters.
    
    Usage:
        curl -X POST https://api.stellarbladeguide.com/api/admin/stats/reset \
            -H "X-ADMIN-SECRET: your-secret"
    """
    check_secret(request)

    pipe = redis_client.pipeline(transaction=False)
    pipe.delete("stats:endpoints")
    pipe.delete("stats:cache")
    pipe.delete("stats:status_codes")
    pipe.delete("stats:unique_ips")
    await pipe.execute()

    return {"status": "ok", "message": "Stats reset"}

# ============================================
# Cache Endpoints
# ============================================

@router.post("/cache/flush")
async def flush_cache(request: Request):
    """Clear all cache"""
    check_secret(request)
    await invalidate_cache_pattern("*")
    return {"status": "ok", "message": "cache cleared"}

@router.get("/cache/stats")
async def cache_stats(request: Request):
    """Get cache statistics"""
    check_secret(request)
    stats = await get_cache_stats()
    return {"status": "ok", "stats": stats}

# ============================================
# Seed Endpoints
# ============================================

@router.post("/seed/schema", response_model=SeedResponse)
async def seed_schema(request: Request):
    """
    Seed database schema (levels, locations, types)
    
    Usage:
        curl -X POST https://api.stellarbladeguide.com/api/admin/seed/schema \
            -H "X-ADMIN-SECRET: your-secret"
    """
    check_secret(request)
    
    try:
        from scripts.db.seed_db import seed_database
        await seed_database()
        
        return SeedResponse(
            status="success",
            message="Database schema seeded successfully"
        )
    except Exception as e:
        import traceback
        return SeedResponse(
            status="error",
            message=str(e),
            details={"traceback": traceback.format_exc()}
        )

@router.post("/seed/collectibles", response_model=SeedResponse)
async def seed_collectibles(request: Request):
    """
    Seed collectibles data
    
    Usage:
        curl -X POST https://api.stellarbladeguide.com/api/admin/seed/collectibles \
            -H "X-ADMIN-SECRET: your-secret"
    """
    check_secret(request)
    
    try:
        from scripts.db.seed_collectibles import seed_database
        result = await seed_database()
        
        return SeedResponse(
            status="success",
            message="Collectibles seeded successfully",
            details={"result": str(result) if result else "completed"}
        )
    except Exception as e:
        import traceback
        return SeedResponse(
            status="error",
            message=str(e),
            details={"traceback": traceback.format_exc()}
        )

@router.post("/seed/walkthroughs", response_model=SeedResponse)
async def seed_walkthroughs_endpoint(request: Request):
    """
    Seed walkthroughs data
    
    Usage:
        curl -X POST https://api.stellarbladeguide.com/api/admin/seed/walkthroughs \
            -H "X-ADMIN-SECRET: your-secret"
    """
    check_secret(request)
    
    try:
        from scripts.db.seed_walkthroughs import seed_walkthroughs
        await seed_walkthroughs()
        
        return SeedResponse(
            status="success",
            message="Walkthroughs seeded successfully"
        )
    except Exception as e:
        import traceback
        return SeedResponse(
            status="error",
            message=str(e),
            details={"traceback": traceback.format_exc()}
        )

@router.post("/seed/all", response_model=SeedResponse)
async def seed_all(request: Request):
    """
    Seed everything (schema, collectibles, walkthroughs)
    
    Usage:
        curl -X POST https://api.stellarbladeguide.com/api/admin/seed/all \
            -H "X-ADMIN-SECRET: your-secret"
    """
    check_secret(request)
    
    results = {
        "schema": "pending",
        "collectibles": "pending",
        "walkthroughs": "pending"
    }
    
    try:
        from scripts.db.seed_db import seed_database as seed_schema_fn
        await seed_schema_fn()
        results["schema"] = "success"
        
        from scripts.db.seed_collectibles import seed_database as seed_collectibles_fn
        await seed_collectibles_fn()
        results["collectibles"] = "success"
        
        from scripts.db.seed_walkthroughs import seed_walkthroughs
        await seed_walkthroughs()
        results["walkthroughs"] = "success"
        
        return SeedResponse(
            status="success",
            message="All data seeded successfully",
            details=results
        )
    except Exception as e:
        import traceback
        return SeedResponse(
            status="error",
            message=str(e),
            details={
                "results": results,
                "traceback": traceback.format_exc()
            }
        )

# ============================================
# Data Maintenance Endpoints
# ============================================

@router.post("/renumber/collectibles", response_model=SeedResponse)
async def renumber_collectibles(request: Request):
    """
    Renumber all collectible IDs and display_orders sequentially
    
    Usage:
        curl -X POST https://api.stellarbladeguide.com/api/admin/renumber/collectibles \
            -H "X-ADMIN-SECRET: your-secret"
    """
    check_secret(request)
    
    try:
        import json
        import glob
        
        seed_dir = project_root / 'seed-data' / 'collectibles'
        
        if not seed_dir.exists():
            return SeedResponse(
                status="error",
                message="seed-data/collectibles directory not found"
            )
        
        json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))
        
        if not json_files:
            return SeedResponse(
                status="error",
                message="No JSON files found in seed-data/collectibles/"
            )
        
        current_id = 1
        files_modified = 0
        files_with_issues = []
        total_collectibles = 0
        
        for json_file in json_files:
            file_path = Path(json_file)
            rel_path = file_path.relative_to(seed_dir)
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not data:
                continue
            
            file_changed = False
            has_issues = False
            
            for index, item in enumerate(data, start=1):
                old_id = item.get('id')
                old_display_order = item.get('display_order')
                expected_display_order = index
                
                if old_id != current_id:
                    item['id'] = current_id
                    file_changed = True
                    has_issues = True
                
                if old_display_order != expected_display_order:
                    item['display_order'] = expected_display_order
                    file_changed = True
                    has_issues = True
                
                current_id += 1
                total_collectibles += 1
            
            if file_changed:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                files_modified += 1
                if has_issues:
                    files_with_issues.append(str(rel_path))
        
        return SeedResponse(
            status="success",
            message="Collectible IDs renumbered successfully",
            details={
                "files_processed": len(json_files),
                "files_modified": files_modified,
                "total_collectibles": total_collectibles,
                "next_available_id": current_id,
                "files_with_issues": files_with_issues
            }
        )
        
    except Exception as e:
        import traceback
        return SeedResponse(
            status="error",
            message=str(e),
            details={"traceback": traceback.format_exc()}
        )