# # # # # # # # # from fastapi import APIRouter, HTTPException
# # # # # # # # # from pydantic import BaseModel
# # # # # # # # # from typing import List, Union
# # # # # # # # # from database import get_db_connection
# # # # # # # # # import json

# # # # # # # # # router = APIRouter()

# # # # # # # # # @router.get("/levels")
# # # # # # # # # def get_all_levels():
# # # # # # # # #     """Get all levels"""
# # # # # # # # #     conn = get_db_connection()
# # # # # # # # #     cur = conn.cursor()
    
# # # # # # # # #     cur.execute("SELECT id, name, display_order FROM levels ORDER BY display_order")
# # # # # # # # #     levels = cur.fetchall()
    
# # # # # # # # #     cur.close()
# # # # # # # # #     conn.close()
    
# # # # # # # # #     return [{"id": l[0], "name": l[1], "display_order": l[2]} for l in levels]

# # # # # # # # # @router.get("/levels/{level_name}/locations")
# # # # # # # # # def get_locations_by_level(level_name: str):
# # # # # # # # #     """Get all locations for a specific level"""
# # # # # # # # #     conn = get_db_connection()
# # # # # # # # #     cur = conn.cursor()
    
# # # # # # # # #     cur.execute("""
# # # # # # # # #         SELECT loc.id, loc.name, loc.display_order
# # # # # # # # #         FROM locations loc
# # # # # # # # #         JOIN levels lev ON loc.level_id = lev.id
# # # # # # # # #         WHERE lev.name = %s
# # # # # # # # #         ORDER BY loc.display_order
# # # # # # # # #     """, (level_name,))
    
# # # # # # # # #     locations = cur.fetchall()
    
# # # # # # # # #     cur.close()
# # # # # # # # #     conn.close()
    
# # # # # # # # #     if not locations:
# # # # # # # # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # # # # # # # #     return [{"id": loc[0], "name": loc[1], "display_order": loc[2]} for loc in locations]

# # # # # # # # # @router.get("/types")
# # # # # # # # # def get_collectible_types():
# # # # # # # # #     """Get all collectible types"""
# # # # # # # # #     conn = get_db_connection()
# # # # # # # # #     cur = conn.cursor()
    
# # # # # # # # #     cur.execute("SELECT id, name FROM collectible_types ORDER BY name")
# # # # # # # # #     types = cur.fetchall()
    
# # # # # # # # #     cur.close()
# # # # # # # # #     conn.close()
    
# # # # # # # # #     return [{"id": t[0], "name": t[1]} for t in types]

# # # # # # # # # # Pydantic models for request validation
# # # # # # # # # class CollectibleImage(BaseModel):
# # # # # # # # #     cloudinary_url: str
# # # # # # # # #     alt_text: str
# # # # # # # # #     display_order: int

# # # # # # # # # class CollectibleCreate(BaseModel):
# # # # # # # # #     location_id: int
# # # # # # # # #     type_id: int
# # # # # # # # #     title: str
# # # # # # # # #     description: Union[str, List[str]]  # Can be string or array
# # # # # # # # #     display_order: int
# # # # # # # # #     images: List[CollectibleImage]

# # # # # # # # # @router.get("/collectibles")
# # # # # # # # # def get_all_collectibles():
# # # # # # # # #     """Get all collectibles with their level, location, type, and images"""
# # # # # # # # #     conn = get_db_connection()
# # # # # # # # #     cur = conn.cursor()
    
# # # # # # # # #     cur.execute("""
# # # # # # # # #         SELECT 
# # # # # # # # #             c.id, c.title, c.description, c.display_order,
# # # # # # # # #             ct.name as type_name,
# # # # # # # # #             lev.name as level_name,
# # # # # # # # #             loc.name as location_name,
# # # # # # # # #             json_agg(
# # # # # # # # #                 json_build_object(
# # # # # # # # #                     'id', ci.id,
# # # # # # # # #                     'url', ci.cloudinary_url,
# # # # # # # # #                     'alt', ci.alt_text,
# # # # # # # # #                     'order', ci.display_order
# # # # # # # # #                 ) ORDER BY ci.display_order
# # # # # # # # #             ) FILTER (WHERE ci.id IS NOT NULL) as images
# # # # # # # # #         FROM collectibles c
# # # # # # # # #         JOIN collectible_types ct ON c.type_id = ct.id
# # # # # # # # #         JOIN locations loc ON c.location_id = loc.id
# # # # # # # # #         JOIN levels lev ON loc.level_id = lev.id
# # # # # # # # #         LEFT JOIN collectible_images ci ON c.id = ci.collectible_id
# # # # # # # # #         GROUP BY c.id, c.title, c.description, c.display_order, ct.name, lev.name, loc.name
# # # # # # # # #         ORDER BY c.display_order
# # # # # # # # #     """)
    
# # # # # # # # #     collectibles = cur.fetchall()
# # # # # # # # #     cur.close()
# # # # # # # # #     conn.close()
    
# # # # # # # # #     return [{
# # # # # # # # #         "id": col[0],
# # # # # # # # #         "title": col[1],
# # # # # # # # #         "description": col[2],
# # # # # # # # #         "display_order": col[3],
# # # # # # # # #         "type": col[4],
# # # # # # # # #         "level": col[5],
# # # # # # # # #         "location": col[6],
# # # # # # # # #         "images": col[7] if col[7] else []
# # # # # # # # #     } for col in collectibles]

# # # # # # # # # @router.get("/collectibles/{level_name}")
# # # # # # # # # def get_collectibles_by_level(level_name: str):
# # # # # # # # #     """Get all collectibles for a specific level, grouped by location"""
# # # # # # # # #     conn = get_db_connection()
# # # # # # # # #     cur = conn.cursor()
    
# # # # # # # # #     cur.execute("""
# # # # # # # # #         SELECT 
# # # # # # # # #             loc.id as location_id,
# # # # # # # # #             loc.name as location_name,
# # # # # # # # #             loc.display_order as location_order,
# # # # # # # # #             json_agg(
# # # # # # # # #                 json_build_object(
# # # # # # # # #                     'id', c.id,
# # # # # # # # #                     'title', c.title,
# # # # # # # # #                     'description', c.description,
# # # # # # # # #                     'display_order', c.display_order,
# # # # # # # # #                     'type', ct.name,
# # # # # # # # #                     'images', COALESCE((
# # # # # # # # #                         SELECT json_agg(
# # # # # # # # #                             json_build_object(
# # # # # # # # #                                 'id', ci.id,
# # # # # # # # #                                 'url', ci.cloudinary_url,
# # # # # # # # #                                 'alt', ci.alt_text,
# # # # # # # # #                                 'order', ci.display_order
# # # # # # # # #                             ) ORDER BY ci.display_order
# # # # # # # # #                         )
# # # # # # # # #                         FROM collectible_images ci
# # # # # # # # #                         WHERE ci.collectible_id = c.id
# # # # # # # # #                     ), '[]'::json)
# # # # # # # # #                 ) ORDER BY c.display_order
# # # # # # # # #             ) FILTER (WHERE c.id IS NOT NULL) as collectibles
# # # # # # # # #         FROM locations loc
# # # # # # # # #         JOIN levels lev ON loc.level_id = lev.id
# # # # # # # # #         LEFT JOIN collectibles c ON c.location_id = loc.id
# # # # # # # # #         LEFT JOIN collectible_types ct ON c.type_id = ct.id
# # # # # # # # #         WHERE lev.name = %s
# # # # # # # # #         GROUP BY loc.id, loc.name, loc.display_order
# # # # # # # # #         ORDER BY loc.display_order
# # # # # # # # #     """, (level_name,))
    
# # # # # # # # #     locations = cur.fetchall()
# # # # # # # # #     cur.close()
# # # # # # # # #     conn.close()
    
# # # # # # # # #     if not locations:
# # # # # # # # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # # # # # # # #     return [{
# # # # # # # # #         "location_id": loc[0],
# # # # # # # # #         "location_name": loc[1],
# # # # # # # # #         "location_order": loc[2],
# # # # # # # # #         "collectibles": loc[3] if loc[3] else []
# # # # # # # # #     } for loc in locations]

# # # # # # # # # @router.get("/collectibles/{level_name}/{location_name}")
# # # # # # # # # def get_collectibles_by_location(level_name: str, location_name: str):
# # # # # # # # #     """Get collectibles for a specific level and location"""
# # # # # # # # #     conn = get_db_connection()
# # # # # # # # #     cur = conn.cursor()
    
# # # # # # # # #     cur.execute("""
# # # # # # # # #         SELECT 
# # # # # # # # #             c.id, c.title, c.description, c.display_order,
# # # # # # # # #             ct.name as type_name,
# # # # # # # # #             json_agg(
# # # # # # # # #                 json_build_object(
# # # # # # # # #                     'id', ci.id,
# # # # # # # # #                     'url', ci.cloudinary_url,
# # # # # # # # #                     'alt', ci.alt_text,
# # # # # # # # #                     'order', ci.display_order
# # # # # # # # #                 ) ORDER BY ci.display_order
# # # # # # # # #             ) FILTER (WHERE ci.id IS NOT NULL) as images
# # # # # # # # #         FROM collectibles c
# # # # # # # # #         JOIN collectible_types ct ON c.type_id = ct.id
# # # # # # # # #         JOIN locations loc ON c.location_id = loc.id
# # # # # # # # #         JOIN levels lev ON loc.level_id = lev.id
# # # # # # # # #         LEFT JOIN collectible_images ci ON c.id = ci.collectible_id
# # # # # # # # #         WHERE lev.name = %s AND loc.name = %s
# # # # # # # # #         GROUP BY c.id, c.title, c.description, c.display_order, ct.name
# # # # # # # # #         ORDER BY c.display_order
# # # # # # # # #     """, (level_name, location_name))
    
# # # # # # # # #     collectibles = cur.fetchall()
# # # # # # # # #     cur.close()
# # # # # # # # #     conn.close()
    
# # # # # # # # #     if not collectibles:
# # # # # # # # #         raise HTTPException(status_code=404, detail="No collectibles found for this location")
    
# # # # # # # # #     return [{
# # # # # # # # #         "id": col[0],
# # # # # # # # #         "title": col[1],
# # # # # # # # #         "description": col[2],
# # # # # # # # #         "display_order": col[3],
# # # # # # # # #         "type": col[4],
# # # # # # # # #         "images": col[5] if col[5] else []
# # # # # # # # #     } for col in collectibles]

# # # # # # # # # @router.post("/collectibles")
# # # # # # # # # def create_collectible(collectible: CollectibleCreate):
# # # # # # # # #     """Create a new collectible with images"""
# # # # # # # # #     conn = get_db_connection()
# # # # # # # # #     cur = conn.cursor()
    
# # # # # # # # #     try:
# # # # # # # # #         # Format description as JSONB
# # # # # # # # #         if isinstance(collectible.description, list):
# # # # # # # # #             description_json = json.dumps({"type": "list", "items": collectible.description})
# # # # # # # # #         else:
# # # # # # # # #             description_json = json.dumps({"type": "text", "content": collectible.description})
        
# # # # # # # # #         # Insert collectible
# # # # # # # # #         cur.execute("""
# # # # # # # # #             INSERT INTO collectibles (location_id, type_id, title, description, display_order)
# # # # # # # # #             VALUES (%s, %s, %s, %s, %s)
# # # # # # # # #             RETURNING id
# # # # # # # # #         """, (collectible.location_id, collectible.type_id, collectible.title, 
# # # # # # # # #               description_json, collectible.display_order))
        
# # # # # # # # #         collectible_id = cur.fetchone()[0]
        
# # # # # # # # #         # Insert images
# # # # # # # # #         for img in collectible.images:
# # # # # # # # #             cur.execute("""
# # # # # # # # #                 INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
# # # # # # # # #                 VALUES (%s, %s, %s, %s)
# # # # # # # # #             """, (collectible_id, img.cloudinary_url, img.alt_text, img.display_order))
        
# # # # # # # # #         conn.commit()
# # # # # # # # #         cur.close()
# # # # # # # # #         conn.close()
        
# # # # # # # # #         return {"message": "Collectible created successfully", "id": collectible_id}
    
# # # # # # # # #     except Exception as e:
# # # # # # # # #         conn.rollback()
# # # # # # # # #         cur.close()
# # # # # # # # #         conn.close()
# # # # # # # # #         raise HTTPException(status_code=400, detail=str(e))


# # # # # # # # from fastapi import APIRouter, HTTPException
# # # # # # # # from pydantic import BaseModel
# # # # # # # # from typing import List, Union
# # # # # # # # from database import get_db_connection
# # # # # # # # import json

# # # # # # # # router = APIRouter()

# # # # # # # # @router.get("/levels")
# # # # # # # # def get_all_levels():
# # # # # # # #     """Get all levels"""
# # # # # # # #     conn = get_db_connection()
# # # # # # # #     cur = conn.cursor()
    
# # # # # # # #     cur.execute("SELECT id, name, display_order FROM levels ORDER BY display_order")
# # # # # # # #     levels = cur.fetchall()
    
# # # # # # # #     cur.close()
# # # # # # # #     conn.close()
    
# # # # # # # #     return [{"id": l[0], "name": l[1], "display_order": l[2]} for l in levels]

# # # # # # # # @router.get("/levels/{level_name}/locations")
# # # # # # # # def get_locations_by_level(level_name: str):
# # # # # # # #     """Get all locations for a specific level"""
# # # # # # # #     conn = get_db_connection()
# # # # # # # #     cur = conn.cursor()
    
# # # # # # # #     cur.execute("""
# # # # # # # #         SELECT loc.id, loc.name, loc.display_order
# # # # # # # #         FROM locations loc
# # # # # # # #         JOIN levels lev ON loc.level_id = lev.id
# # # # # # # #         WHERE lev.name = %s
# # # # # # # #         ORDER BY loc.display_order
# # # # # # # #     """, (level_name,))
    
# # # # # # # #     locations = cur.fetchall()
    
# # # # # # # #     cur.close()
# # # # # # # #     conn.close()
    
# # # # # # # #     if not locations:
# # # # # # # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # # # # # # #     return [{"id": loc[0], "name": loc[1], "display_order": loc[2]} for loc in locations]

# # # # # # # # @router.get("/types")
# # # # # # # # def get_collectible_types():
# # # # # # # #     """Get all collectible types"""
# # # # # # # #     conn = get_db_connection()
# # # # # # # #     cur = conn.cursor()
    
# # # # # # # #     cur.execute("SELECT id, name FROM collectible_types ORDER BY name")
# # # # # # # #     types = cur.fetchall()
    
# # # # # # # #     cur.close()
# # # # # # # #     conn.close()
    
# # # # # # # #     return [{"id": t[0], "name": t[1]} for t in types]

# # # # # # # # # Pydantic models for request validation
# # # # # # # # class CollectibleImage(BaseModel):
# # # # # # # #     cloudinary_url: str
# # # # # # # #     alt_text: str
# # # # # # # #     display_order: int

# # # # # # # # class CollectibleCreate(BaseModel):
# # # # # # # #     location_id: int
# # # # # # # #     type_id: int
# # # # # # # #     title: str
# # # # # # # #     description: Union[str, List[str]]  # Can be string or array
# # # # # # # #     display_order: int
# # # # # # # #     images: List[CollectibleImage]

# # # # # # # # @router.get("/collectibles")
# # # # # # # # def get_all_collectibles():
# # # # # # # #     """Get all collectibles with their level, location, type, and images"""
# # # # # # # #     conn = get_db_connection()
# # # # # # # #     cur = conn.cursor()
    
# # # # # # # #     cur.execute("""
# # # # # # # #         SELECT 
# # # # # # # #             c.id, c.title, c.description, c.display_order,
# # # # # # # #             ct.name as type_name,
# # # # # # # #             lev.name as level_name,
# # # # # # # #             loc.name as location_name,
# # # # # # # #             json_agg(
# # # # # # # #                 json_build_object(
# # # # # # # #                     'id', ci.id,
# # # # # # # #                     'url', ci.cloudinary_url,
# # # # # # # #                     'alt', ci.alt_text,
# # # # # # # #                     'order', ci.display_order
# # # # # # # #                 ) ORDER BY ci.display_order
# # # # # # # #             ) FILTER (WHERE ci.id IS NOT NULL) as images
# # # # # # # #         FROM collectibles c
# # # # # # # #         JOIN collectible_types ct ON c.type_id = ct.id
# # # # # # # #         JOIN locations loc ON c.location_id = loc.id
# # # # # # # #         JOIN levels lev ON loc.level_id = lev.id
# # # # # # # #         LEFT JOIN collectible_images ci ON c.id = ci.collectible_id
# # # # # # # #         GROUP BY c.id, c.title, c.description, c.display_order, ct.name, lev.name, loc.name
# # # # # # # #         ORDER BY c.display_order
# # # # # # # #     """)
    
# # # # # # # #     collectibles = cur.fetchall()
# # # # # # # #     cur.close()
# # # # # # # #     conn.close()
    
# # # # # # # #     return [{
# # # # # # # #         "id": col[0],
# # # # # # # #         "title": col[1],
# # # # # # # #         "description": col[2],
# # # # # # # #         "display_order": col[3],
# # # # # # # #         "type": col[4],
# # # # # # # #         "level": col[5],
# # # # # # # #         "location": col[6],
# # # # # # # #         "images": col[7] if col[7] else []
# # # # # # # #     } for col in collectibles]

# # # # # # # # @router.get("/collectibles/{level_name}")
# # # # # # # # def get_collectibles_by_level(level_name: str):
# # # # # # # #     """Get all collectibles for a specific level, grouped by location"""
# # # # # # # #     conn = get_db_connection()
# # # # # # # #     cur = conn.cursor()
    
# # # # # # # #     cur.execute("""
# # # # # # # #         SELECT 
# # # # # # # #             loc.id as location_id,
# # # # # # # #             loc.name as location_name,
# # # # # # # #             loc.display_order as location_order,
# # # # # # # #             json_agg(
# # # # # # # #                 json_build_object(
# # # # # # # #                     'id', c.id,
# # # # # # # #                     'title', c.title,
# # # # # # # #                     'description', c.description,
# # # # # # # #                     'display_order', c.display_order,
# # # # # # # #                     'type', ct.name,
# # # # # # # #                     'images', COALESCE((
# # # # # # # #                         SELECT json_agg(
# # # # # # # #                             json_build_object(
# # # # # # # #                                 'id', ci.id,
# # # # # # # #                                 'url', ci.cloudinary_url,
# # # # # # # #                                 'alt', ci.alt_text,
# # # # # # # #                                 'order', ci.display_order
# # # # # # # #                             ) ORDER BY ci.display_order
# # # # # # # #                         )
# # # # # # # #                         FROM collectible_images ci
# # # # # # # #                         WHERE ci.collectible_id = c.id
# # # # # # # #                     ), '[]'::json)
# # # # # # # #                 ) ORDER BY c.display_order
# # # # # # # #             ) FILTER (WHERE c.id IS NOT NULL) as collectibles
# # # # # # # #         FROM locations loc
# # # # # # # #         JOIN levels lev ON loc.level_id = lev.id
# # # # # # # #         LEFT JOIN collectibles c ON c.location_id = loc.id
# # # # # # # #         LEFT JOIN collectible_types ct ON c.type_id = ct.id
# # # # # # # #         WHERE lev.name = %s
# # # # # # # #         GROUP BY loc.id, loc.name, loc.display_order
# # # # # # # #         ORDER BY loc.display_order
# # # # # # # #     """, (level_name,))
    
# # # # # # # #     locations = cur.fetchall()
# # # # # # # #     cur.close()
# # # # # # # #     conn.close()
    
# # # # # # # #     if not locations:
# # # # # # # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # # # # # # #     return [{
# # # # # # # #         "location_id": loc[0],
# # # # # # # #         "location_name": loc[1],
# # # # # # # #         "location_order": loc[2],
# # # # # # # #         "collectibles": loc[3] if loc[3] else []
# # # # # # # #     } for loc in locations]

# # # # # # # # @router.get("/collectibles/{level_name}/{location_name}")
# # # # # # # # def get_collectibles_by_location(level_name: str, location_name: str):
# # # # # # # #     """Get collectibles for a specific level and location"""
# # # # # # # #     conn = get_db_connection()
# # # # # # # #     cur = conn.cursor()
    
# # # # # # # #     cur.execute("""
# # # # # # # #         SELECT 
# # # # # # # #             c.id, c.title, c.description, c.display_order,
# # # # # # # #             ct.name as type_name,
# # # # # # # #             json_agg(
# # # # # # # #                 json_build_object(
# # # # # # # #                     'id', ci.id,
# # # # # # # #                     'url', ci.cloudinary_url,
# # # # # # # #                     'alt', ci.alt_text,
# # # # # # # #                     'order', ci.display_order
# # # # # # # #                 ) ORDER BY ci.display_order
# # # # # # # #             ) FILTER (WHERE ci.id IS NOT NULL) as images
# # # # # # # #         FROM collectibles c
# # # # # # # #         JOIN collectible_types ct ON c.type_id = ct.id
# # # # # # # #         JOIN locations loc ON c.location_id = loc.id
# # # # # # # #         JOIN levels lev ON loc.level_id = lev.id
# # # # # # # #         LEFT JOIN collectible_images ci ON c.id = ci.collectible_id
# # # # # # # #         WHERE lev.name = %s AND loc.name = %s
# # # # # # # #         GROUP BY c.id, c.title, c.description, c.display_order, ct.name
# # # # # # # #         ORDER BY c.display_order
# # # # # # # #     """, (level_name, location_name))
    
# # # # # # # #     collectibles = cur.fetchall()
# # # # # # # #     cur.close()
# # # # # # # #     conn.close()
    
# # # # # # # #     if not collectibles:
# # # # # # # #         raise HTTPException(status_code=404, detail="No collectibles found for this location")
    
# # # # # # # #     return [{
# # # # # # # #         "id": col[0],
# # # # # # # #         "title": col[1],
# # # # # # # #         "description": col[2],
# # # # # # # #         "display_order": col[3],
# # # # # # # #         "type": col[4],
# # # # # # # #         "images": col[5] if col[5] else []
# # # # # # # #     } for col in collectibles]

# # # # # # # # @router.get("/types/{type_name}/collectibles")
# # # # # # # # def get_collectibles_by_type(type_name: str):
# # # # # # # #     """Get all collectibles of a specific type, grouped by level and location"""
# # # # # # # #     conn = get_db_connection()
# # # # # # # #     cur = conn.cursor()
    
# # # # # # # #     # Convert URL-friendly type name back to proper format
# # # # # # # #     # e.g., "beta-cores" -> "Beta Core"
# # # # # # # #     formatted_type = type_name.replace('-', ' ').title()
# # # # # # # #     if formatted_type.endswith('s'):
# # # # # # # #         formatted_type = formatted_type[:-1]  # Remove plural 's'
    
# # # # # # # #     cur.execute("""
# # # # # # # #         SELECT 
# # # # # # # #             lev.id as level_id,
# # # # # # # #             lev.name as level_name,
# # # # # # # #             lev.display_order as level_order,
# # # # # # # #             loc.id as location_id,
# # # # # # # #             loc.name as location_name,
# # # # # # # #             loc.display_order as location_order,
# # # # # # # #             json_agg(
# # # # # # # #                 json_build_object(
# # # # # # # #                     'id', c.id,
# # # # # # # #                     'title', c.title,
# # # # # # # #                     'description', c.description,
# # # # # # # #                     'display_order', c.display_order,
# # # # # # # #                     'type', ct.name,
# # # # # # # #                     'images', COALESCE((
# # # # # # # #                         SELECT json_agg(
# # # # # # # #                             json_build_object(
# # # # # # # #                                 'id', ci.id,
# # # # # # # #                                 'url', ci.cloudinary_url,
# # # # # # # #                                 'alt', ci.alt_text,
# # # # # # # #                                 'order', ci.display_order
# # # # # # # #                             ) ORDER BY ci.display_order
# # # # # # # #                         )
# # # # # # # #                         FROM collectible_images ci
# # # # # # # #                         WHERE ci.collectible_id = c.id
# # # # # # # #                     ), '[]'::json)
# # # # # # # #                 ) ORDER BY c.display_order
# # # # # # # #             ) as collectibles
# # # # # # # #         FROM collectibles c
# # # # # # # #         JOIN collectible_types ct ON c.type_id = ct.id
# # # # # # # #         JOIN locations loc ON c.location_id = loc.id
# # # # # # # #         JOIN levels lev ON loc.level_id = lev.id
# # # # # # # #         WHERE ct.name ILIKE %s
# # # # # # # #         GROUP BY lev.id, lev.name, lev.display_order, loc.id, loc.name, loc.display_order
# # # # # # # #         ORDER BY lev.display_order, loc.display_order
# # # # # # # #     """, (f"%{formatted_type}%",))
    
# # # # # # # #     results = cur.fetchall()
# # # # # # # #     cur.close()
# # # # # # # #     conn.close()
    
# # # # # # # #     if not results:
# # # # # # # #         raise HTTPException(status_code=404, detail="No collectibles found for this type")
    
# # # # # # # #     # Group by level
# # # # # # # #     levels_dict = {}
# # # # # # # #     for row in results:
# # # # # # # #         level_id = row[0]
# # # # # # # #         if level_id not in levels_dict:
# # # # # # # #             levels_dict[level_id] = {
# # # # # # # #                 "level_id": row[0],
# # # # # # # #                 "level_name": row[1],
# # # # # # # #                 "level_order": row[2],
# # # # # # # #                 "locations": []
# # # # # # # #             }
        
# # # # # # # #         levels_dict[level_id]["locations"].append({
# # # # # # # #             "location_id": row[3],
# # # # # # # #             "location_name": row[4],
# # # # # # # #             "location_order": row[5],
# # # # # # # #             "collectibles": row[6] if row[6] else []
# # # # # # # #         })
    
# # # # # # # #     return list(levels_dict.values())

# # # # # # # # @router.post("/collectibles")
# # # # # # # # def create_collectible(collectible: CollectibleCreate):
# # # # # # # #     """Create a new collectible with images"""
# # # # # # # #     conn = get_db_connection()
# # # # # # # #     cur = conn.cursor()
    
# # # # # # # #     try:
# # # # # # # #         # Format description as JSONB
# # # # # # # #         if isinstance(collectible.description, list):
# # # # # # # #             description_json = json.dumps({"type": "list", "items": collectible.description})
# # # # # # # #         else:
# # # # # # # #             description_json = json.dumps({"type": "text", "content": collectible.description})
        
# # # # # # # #         # Insert collectible
# # # # # # # #         cur.execute("""
# # # # # # # #             INSERT INTO collectibles (location_id, type_id, title, description, display_order)
# # # # # # # #             VALUES (%s, %s, %s, %s, %s)
# # # # # # # #             RETURNING id
# # # # # # # #         """, (collectible.location_id, collectible.type_id, collectible.title, 
# # # # # # # #               description_json, collectible.display_order))
        
# # # # # # # #         collectible_id = cur.fetchone()[0]
        
# # # # # # # #         # Insert images
# # # # # # # #         for img in collectible.images:
# # # # # # # #             cur.execute("""
# # # # # # # #                 INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
# # # # # # # #                 VALUES (%s, %s, %s, %s)
# # # # # # # #             """, (collectible_id, img.cloudinary_url, img.alt_text, img.display_order))
        
# # # # # # # #         conn.commit()
# # # # # # # #         cur.close()
# # # # # # # #         conn.close()
        
# # # # # # # #         return {"message": "Collectible created successfully", "id": collectible_id}
    
# # # # # # # #     except Exception as e:
# # # # # # # #         conn.rollback()
# # # # # # # #         cur.close()
# # # # # # # #         conn.close()
# # # # # # # #         raise HTTPException(status_code=400, detail=str(e))

# # # # # # # from fastapi import APIRouter, HTTPException, Depends
# # # # # # # from pydantic import BaseModel
# # # # # # # from typing import List, Union
# # # # # # # from sqlalchemy.orm import Session, joinedload
# # # # # # # from database import get_db_session
# # # # # # # from models import Level, Location, CollectibleType, Collectible, CollectibleImage
# # # # # # # import json
# # # # # # # import re

# # # # # # # router = APIRouter()

# # # # # # # def slugify(text: str) -> str:
# # # # # # #     text = text.lower()
# # # # # # #     text = re.sub(r'[^\w\s-]', '', text)
# # # # # # #     text = re.sub(r'[\s_]+', '-', text)
# # # # # # #     return text.strip('-')

# # # # # # # def unslugify(slug: str, model_class, db: Session):
# # # # # # #     """Convert slug back to original name by querying database"""
# # # # # # #     # Try exact match first
# # # # # # #     obj = db.query(model_class).filter(model_class.name == slug).first()
# # # # # # #     if obj:
# # # # # # #         return obj
    
# # # # # # #     # Generate possible variations
# # # # # # #     variations = [
# # # # # # #         slug.replace('-', ' ').title(),
# # # # # # #         slug.replace('-', ' '),
# # # # # # #         slug.title(),
# # # # # # #         slug.upper()
# # # # # # #     ]
    
# # # # # # #     for variation in variations:
# # # # # # #         obj = db.query(model_class).filter(model_class.name.ilike(variation)).first()
# # # # # # #         if obj:
# # # # # # #             return obj
    
# # # # # # #     return None

# # # # # # # def get_db():
# # # # # # #     db = get_db_session()
# # # # # # #     try:
# # # # # # #         yield db
# # # # # # #     finally:
# # # # # # #         db.close()

# # # # # # # class CollectibleImageSchema(BaseModel):
# # # # # # #     cloudinary_url: str
# # # # # # #     alt_text: str
# # # # # # #     display_order: int

# # # # # # # class CollectibleCreate(BaseModel):
# # # # # # #     location_id: int
# # # # # # #     type_id: int
# # # # # # #     title: str
# # # # # # #     description: Union[str, List[str]]
# # # # # # #     display_order: int
# # # # # # #     images: List[CollectibleImageSchema]

# # # # # # # @router.get("/levels")
# # # # # # # def get_all_levels(db: Session = Depends(get_db)):
# # # # # # #     levels = db.query(Level).order_by(Level.display_order).all()
# # # # # # #     return [{"id": l.id, "name": l.name, "slug": slugify(l.name), "display_order": l.display_order} for l in levels]

# # # # # # # @router.get("/levels/{level_slug}/locations")
# # # # # # # def get_locations_by_level(level_slug: str, db: Session = Depends(get_db)):
# # # # # # #     level = unslugify(level_slug, Level, db)
# # # # # # #     if not level:
# # # # # # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # # # # # #     locations = db.query(Location).filter(Location.level_id == level.id).order_by(Location.display_order).all()
# # # # # # #     return [{"id": loc.id, "name": loc.name, "slug": slugify(loc.name), "display_order": loc.display_order} for loc in locations]

# # # # # # # @router.get("/types")
# # # # # # # def get_collectible_types(db: Session = Depends(get_db)):
# # # # # # #     types = db.query(CollectibleType).order_by(CollectibleType.name).all()
# # # # # # #     return [{"id": t.id, "name": t.name, "slug": slugify(t.name)} for t in types]

# # # # # # # @router.get("/collectibles/types/{type_slug}")
# # # # # # # def get_collectibles_by_type(type_slug: str, db: Session = Depends(get_db)):
# # # # # # #     collectible_type = unslugify(type_slug, CollectibleType, db)
    
# # # # # # #     if not collectible_type:
# # # # # # #         raise HTTPException(status_code=404, detail="Type not found")
    
# # # # # # #     collectibles = db.query(Collectible).filter(Collectible.type_id == collectible_type.id).options(
# # # # # # #         joinedload(Collectible.location).joinedload(Location.level),
# # # # # # #         joinedload(Collectible.images)
# # # # # # #     ).order_by(Collectible.display_order).all()
    
# # # # # # #     if not collectibles:
# # # # # # #         raise HTTPException(status_code=404, detail="No collectibles found for this type")
    
# # # # # # #     levels_dict = {}
# # # # # # #     for c in collectibles:
# # # # # # #         level = c.location.level
# # # # # # #         location = c.location
        
# # # # # # #         if level.id not in levels_dict:
# # # # # # #             levels_dict[level.id] = {
# # # # # # #                 "level_id": level.id,
# # # # # # #                 "level_name": level.name,
# # # # # # #                 "level_slug": slugify(level.name),
# # # # # # #                 "level_order": level.display_order,
# # # # # # #                 "locations": {}
# # # # # # #             }
        
# # # # # # #         if location.id not in levels_dict[level.id]["locations"]:
# # # # # # #             levels_dict[level.id]["locations"][location.id] = {
# # # # # # #                 "location_id": location.id,
# # # # # # #                 "location_name": location.name,
# # # # # # #                 "location_slug": slugify(location.name),
# # # # # # #                 "location_order": location.display_order,
# # # # # # #                 "collectibles": []
# # # # # # #             }
        
# # # # # # #         levels_dict[level.id]["locations"][location.id]["collectibles"].append({
# # # # # # #             "id": c.id,
# # # # # # #             "title": c.title,
# # # # # # #             "description": c.description,
# # # # # # #             "display_order": c.display_order,
# # # # # # #             "type": c.types.name,
# # # # # # #             "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# # # # # # #         })
    
# # # # # # #     result = []
# # # # # # #     for level_data in sorted(levels_dict.values(), key=lambda x: x["level_order"]):
# # # # # # #         level_data["locations"] = sorted(level_data["locations"].values(), key=lambda x: x["location_order"])
# # # # # # #         result.append(level_data)
    
# # # # # # #     return result

# # # # # # # @router.get("/collectibles")
# # # # # # # def get_all_collectibles(db: Session = Depends(get_db)):
# # # # # # #     collectibles = db.query(Collectible).options(
# # # # # # #         joinedload(Collectible.type),
# # # # # # #         joinedload(Collectible.location).joinedload(Location.level),
# # # # # # #         joinedload(Collectible.images)
# # # # # # #     ).order_by(Collectible.display_order).all()
    
# # # # # # #     return [{
# # # # # # #         "id": c.id,
# # # # # # #         "title": c.title,
# # # # # # #         "description": c.description,
# # # # # # #         "display_order": c.display_order,
# # # # # # #         "type": c.types.name,
# # # # # # #         "level": c.location.level.name,
# # # # # # #         "level_slug": slugify(c.location.level.name),
# # # # # # #         "location": c.location.name,
# # # # # # #         "location_slug": slugify(c.location.name),
# # # # # # #         "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# # # # # # #     } for c in collectibles]

# # # # # # # @router.get("/collectibles/{level_slug}")
# # # # # # # def get_collectibles_by_level(level_slug: str, db: Session = Depends(get_db)):
# # # # # # #     level = unslugify(level_slug, Level, db)
# # # # # # #     if not level:
# # # # # # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # # # # # #     locations = db.query(Location).filter(Location.level_id == level.id).options(
# # # # # # #         joinedload(Location.collectibles).joinedload(Collectible.type),
# # # # # # #         joinedload(Location.collectibles).joinedload(Collectible.images)
# # # # # # #     ).order_by(Location.display_order).all()
    
# # # # # # #     result = []
# # # # # # #     for loc in locations:
# # # # # # #         collectibles = sorted(loc.collectibles, key=lambda c: c.display_order)
# # # # # # #         result.append({
# # # # # # #             "location_id": loc.id,
# # # # # # #             "location_name": loc.name,
# # # # # # #             "location_slug": slugify(loc.name),
# # # # # # #             "location_order": loc.display_order,
# # # # # # #             "collectibles": [{
# # # # # # #                 "id": c.id,
# # # # # # #                 "title": c.title,
# # # # # # #                 "description": c.description,
# # # # # # #                 "display_order": c.display_order,
# # # # # # #                 "type": c.types.name,
# # # # # # #                 "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# # # # # # #             } for c in collectibles]
# # # # # # #         })
    
# # # # # # #     return result

# # # # # # # @router.get("/collectibles/{level_slug}/{location_slug}")
# # # # # # # def get_collectibles_by_location(level_slug: str, location_slug: str, db: Session = Depends(get_db)):
# # # # # # #     level = unslugify(level_slug, Level, db)
# # # # # # #     if not level:
# # # # # # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # # # # # #     location = unslugify(location_slug, Location, db)
# # # # # # #     if not location or location.level_id != level.id:
# # # # # # #         raise HTTPException(status_code=404, detail="Location not found")
    
# # # # # # #     collectibles = db.query(Collectible).filter(Collectible.location_id == location.id).options(
# # # # # # #         joinedload(Collectible.type),
# # # # # # #         joinedload(Collectible.images)
# # # # # # #     ).order_by(Collectible.display_order).all()
    
# # # # # # #     if not collectibles:
# # # # # # #         raise HTTPException(status_code=404, detail="No collectibles found for this location")
    
# # # # # # #     return [{
# # # # # # #         "id": c.id,
# # # # # # #         "title": c.title,
# # # # # # #         "description": c.description,
# # # # # # #         "display_order": c.display_order,
# # # # # # #         "type": c.types.name,
# # # # # # #         "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# # # # # # #     } for c in collectibles]

# # # # # # # @router.post("/collectibles")
# # # # # # # def create_collectible(collectible: CollectibleCreate, db: Session = Depends(get_db)):
# # # # # # #     try:
# # # # # # #         if isinstance(collectible.description, list):
# # # # # # #             description_json = {"type": "list", "items": collectible.description}
# # # # # # #         else:
# # # # # # #             description_json = {"type": "text", "content": collectible.description}
        
# # # # # # #         new_collectible = Collectible(
# # # # # # #             location_id=collectible.location_id,
# # # # # # #             type_id=collectible.type_id,
# # # # # # #             title=collectible.title,
# # # # # # #             description=description_json,
# # # # # # #             display_order=collectible.display_order
# # # # # # #         )
# # # # # # #         db.add(new_collectible)
# # # # # # #         db.flush()
        
# # # # # # #         for img in collectible.images:
# # # # # # #             new_image = CollectibleImage(
# # # # # # #                 collectible_id=new_collectible.id,
# # # # # # #                 cloudinary_url=img.cloudinary_url,
# # # # # # #                 alt_text=img.alt_text,
# # # # # # #                 display_order=img.display_order
# # # # # # #             )
# # # # # # #             db.add(new_image)
        
# # # # # # #         db.commit()
# # # # # # #         return {"message": "Collectible created successfully", "id": new_collectible.id}
    
# # # # # # #     except Exception as e:
# # # # # # #         db.rollback()
# # # # # # #         raise HTTPException(status_code=400, detail=str(e))

# # # # # # from fastapi import APIRouter, HTTPException, Depends
# # # # # # from pydantic import BaseModel
# # # # # # from typing import List, Union
# # # # # # from sqlalchemy.orm import Session, joinedload
# # # # # # from database import get_db_session
# # # # # # from models import Level, Location, CollectibleType, Collectible, CollectibleImage
# # # # # # import json

# # # # # # router = APIRouter()

# # # # # # def get_db():
# # # # # #     db = get_db_session()
# # # # # #     try:
# # # # # #         yield db
# # # # # #     finally:
# # # # # #         db.close()

# # # # # # class CollectibleImageSchema(BaseModel):
# # # # # #     cloudinary_url: str
# # # # # #     alt_text: str
# # # # # #     display_order: int

# # # # # # class CollectibleCreate(BaseModel):
# # # # # #     location_id: int
# # # # # #     type_id: int
# # # # # #     title: str
# # # # # #     description: Union[str, List[str]]
# # # # # #     display_order: int
# # # # # #     images: List[CollectibleImageSchema]

# # # # # # @router.get("/levels")
# # # # # # def get_all_levels(db: Session = Depends(get_db)):
# # # # # #     levels = db.query(Level).order_by(Level.display_order).all()
# # # # # #     return [{"id": l.id, "name": l.name, "display_order": l.display_order} for l in levels]

# # # # # # @router.get("/levels/{level_name}/locations")
# # # # # # def get_locations_by_level(level_name: str, db: Session = Depends(get_db)):
# # # # # #     # Try exact match first
# # # # # #     level = db.query(Level).filter(Level.name == level_name).first()
    
# # # # # #     # If not found, try slug conversion
# # # # # #     if not level:
# # # # # #         formatted_name = level_name.replace('-', ' ').title()
# # # # # #         level = db.query(Level).filter(Level.name.ilike(formatted_name)).first()
    
# # # # # #     if not level:
# # # # # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # # # # #     locations = db.query(Location).filter(Location.level_id == level.id).order_by(Location.display_order).all()
# # # # # #     return [{"id": loc.id, "name": loc.name, "display_order": loc.display_order} for loc in locations]

# # # # # # @router.get("/types")
# # # # # # def get_collectible_types(db: Session = Depends(get_db)):
# # # # # #     types = db.query(CollectibleType).order_by(CollectibleType.name).all()
# # # # # #     return [{"id": t.id, "name": t.name} for t in types]

# # # # # # @router.get("/collectibles")
# # # # # # def get_all_collectibles(db: Session = Depends(get_db)):
# # # # # #     collectibles = db.query(Collectible).options(
# # # # # #         joinedload(Collectible.type),
# # # # # #         joinedload(Collectible.location).joinedload(Location.level),
# # # # # #         joinedload(Collectible.images)
# # # # # #     ).order_by(Collectible.display_order).all()
    
# # # # # #     return [{
# # # # # #         "id": c.id,
# # # # # #         "title": c.title,
# # # # # #         "description": c.description,
# # # # # #         "display_order": c.display_order,
# # # # # #         "type": c.types.name,
# # # # # #         "level": c.location.level.name,
# # # # # #         "location": c.location.name,
# # # # # #         "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# # # # # #     } for c in collectibles]

# # # # # # @router.get("/collectibles/{level_name}")
# # # # # # def get_collectibles_by_level(level_name: str, db: Session = Depends(get_db)):
# # # # # #     # Try exact match first
# # # # # #     level = db.query(Level).filter(Level.name == level_name).first()
    
# # # # # #     # If not found, try slug conversion
# # # # # #     if not level:
# # # # # #         formatted_name = level_name.replace('-', ' ').title()
# # # # # #         level = db.query(Level).filter(Level.name.ilike(formatted_name)).first()
    
# # # # # #     if not level:
# # # # # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # # # # #     locations = db.query(Location).filter(Location.level_id == level.id).options(
# # # # # #         joinedload(Location.collectibles).joinedload(Collectible.type),
# # # # # #         joinedload(Location.collectibles).joinedload(Collectible.images)
# # # # # #     ).order_by(Location.display_order).all()
    
# # # # # #     result = []
# # # # # #     for loc in locations:
# # # # # #         collectibles = sorted(loc.collectibles, key=lambda c: c.display_order)
# # # # # #         result.append({
# # # # # #             "location_id": loc.id,
# # # # # #             "location_name": loc.name,
# # # # # #             "location_order": loc.display_order,
# # # # # #             "collectibles": [{
# # # # # #                 "id": c.id,
# # # # # #                 "title": c.title,
# # # # # #                 "description": c.description,
# # # # # #                 "display_order": c.display_order,
# # # # # #                 "type": c.types.name,
# # # # # #                 "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# # # # # #             } for c in collectibles]
# # # # # #         })
    
# # # # # #     return result

# # # # # # @router.get("/collectibles/{level_name}/{location_name}")
# # # # # # def get_collectibles_by_location(level_name: str, location_name: str, db: Session = Depends(get_db)):
# # # # # #     level = db.query(Level).filter(Level.name == level_name).first()
# # # # # #     if not level:
# # # # # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # # # # #     location = db.query(Location).filter(
# # # # # #         Location.level_id == level.id,
# # # # # #         Location.name == location_name
# # # # # #     ).first()
# # # # # #     if not location:
# # # # # #         raise HTTPException(status_code=404, detail="Location not found")
    
# # # # # #     collectibles = db.query(Collectible).filter(Collectible.location_id == location.id).options(
# # # # # #         joinedload(Collectible.type),
# # # # # #         joinedload(Collectible.images)
# # # # # #     ).order_by(Collectible.display_order).all()
    
# # # # # #     if not collectibles:
# # # # # #         raise HTTPException(status_code=404, detail="No collectibles found for this location")
    
# # # # # #     return [{
# # # # # #         "id": c.id,
# # # # # #         "title": c.title,
# # # # # #         "description": c.description,
# # # # # #         "display_order": c.display_order,
# # # # # #         "type": c.types.name,
# # # # # #         "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# # # # # #     } for c in collectibles]

# # # # # # @router.get("/types/{type_name}/collectibles")
# # # # # # def get_collectibles_by_type(type_name: str, db: Session = Depends(get_db)):
# # # # # #     # Try exact match first
# # # # # #     collectible_type = db.query(CollectibleType).filter(CollectibleType.name == type_name).first()
    
# # # # # #     # If not found, try slug conversion (your old logic)
# # # # # #     if not collectible_type:
# # # # # #         formatted_type = type_name.replace('-', ' ').title()
# # # # # #         if formatted_type.endswith('s'):
# # # # # #             formatted_type = formatted_type[:-1]
# # # # # #         collectible_type = db.query(CollectibleType).filter(CollectibleType.name.ilike(f"%{formatted_type}%")).first()
    
# # # # # #     if not collectible_type:
# # # # # #         raise HTTPException(status_code=404, detail="Type not found")
    
# # # # # #     collectibles = db.query(Collectible).filter(Collectible.type_id == collectible_type.id).options(
# # # # # #         joinedload(Collectible.location).joinedload(Location.level),
# # # # # #         joinedload(Collectible.images)
# # # # # #     ).order_by(Collectible.display_order).all()
    
# # # # # #     if not collectibles:
# # # # # #         raise HTTPException(status_code=404, detail="No collectibles found for this type")
    
# # # # # #     levels_dict = {}
# # # # # #     for c in collectibles:
# # # # # #         level = c.location.level
# # # # # #         location = c.location
        
# # # # # #         if level.id not in levels_dict:
# # # # # #             levels_dict[level.id] = {
# # # # # #                 "level_id": level.id,
# # # # # #                 "level_name": level.name,
# # # # # #                 "level_order": level.display_order,
# # # # # #                 "locations": {}
# # # # # #             }
        
# # # # # #         if location.id not in levels_dict[level.id]["locations"]:
# # # # # #             levels_dict[level.id]["locations"][location.id] = {
# # # # # #                 "location_id": location.id,
# # # # # #                 "location_name": location.name,
# # # # # #                 "location_order": location.display_order,
# # # # # #                 "collectibles": []
# # # # # #             }
        
# # # # # #         levels_dict[level.id]["locations"][location.id]["collectibles"].append({
# # # # # #             "id": c.id,
# # # # # #             "title": c.title,
# # # # # #             "description": c.description,
# # # # # #             "display_order": c.display_order,
# # # # # #             "type": c.types.name,
# # # # # #             "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# # # # # #         })
    
# # # # # #     result = []
# # # # # #     for level_data in sorted(levels_dict.values(), key=lambda x: x["level_order"]):
# # # # # #         level_data["locations"] = sorted(level_data["locations"].values(), key=lambda x: x["location_order"])
# # # # # #         result.append(level_data)
    
# # # # # #     return result

# # # # # # @router.post("/collectibles")
# # # # # # def create_collectible(collectible: CollectibleCreate, db: Session = Depends(get_db)):
# # # # # #     try:
# # # # # #         if isinstance(collectible.description, list):
# # # # # #             description_json = {"type": "list", "items": collectible.description}
# # # # # #         else:
# # # # # #             description_json = {"type": "text", "content": collectible.description}
        
# # # # # #         new_collectible = Collectible(
# # # # # #             location_id=collectible.location_id,
# # # # # #             type_id=collectible.type_id,
# # # # # #             title=collectible.title,
# # # # # #             description=description_json,
# # # # # #             display_order=collectible.display_order
# # # # # #         )
# # # # # #         db.add(new_collectible)
# # # # # #         db.flush()
        
# # # # # #         for img in collectible.images:
# # # # # #             new_image = CollectibleImage(
# # # # # #                 collectible_id=new_collectible.id,
# # # # # #                 cloudinary_url=img.cloudinary_url,
# # # # # #                 alt_text=img.alt_text,
# # # # # #                 display_order=img.display_order
# # # # # #             )
# # # # # #             db.add(new_image)
        
# # # # # #         db.commit()
# # # # # #         return {"message": "Collectible created successfully", "id": new_collectible.id}
    
# # # # # #     except Exception as e:
# # # # # #         db.rollback()
# # # # # #         raise HTTPException(status_code=400, detail=str(e))


# # # from fastapi import APIRouter, HTTPException, Depends
# # # from pydantic import BaseModel
# # # from typing import List, Union
# # # from sqlalchemy.orm import Session, joinedload
# # # from database import get_db_session
# # # from models import Level, Location, CollectibleType, Collectible, CollectibleImage
# # # from redis_config import get_cache, set_cache, delete_cache
# # # import json

# # # router = APIRouter()

# # # def get_db():
# # #     db = get_db_session()
# # #     try:
# # #         yield db
# # #     finally:
# # #         db.close()

# # # class CollectibleImageSchema(BaseModel):
# # #     cloudinary_url: str
# # #     alt_text: str
# # #     display_order: int

# # # class CollectibleCreate(BaseModel):
# # #     location_id: int
# # #     type_id: int
# # #     title: str
# # #     description: Union[str, List[str]]
# # #     display_order: int
# # #     images: List[CollectibleImageSchema]

# # # @router.get("/levels")
# # # def get_all_levels(db: Session = Depends(get_db)):
# # #     """Get all levels - cached for 10 minutes"""
# # #     cache_key = "levels:all"
    
# # #     # Try to get from cache
# # #     cached_data = get_cache(cache_key)
# # #     if cached_data:
# # #         return cached_data
    
# # #     # If not in cache, query database
# # #     levels = db.query(Level).order_by(Level.display_order).all()
# # #     result = [{"id": l.id, "name": l.name, "display_order": l.display_order} for l in levels]
    
# # #     # Store in cache for 10 minutes
# # #     set_cache(cache_key, result, expire=600)
    
# # #     return result

# # # @router.get("/levels/{level_name}/locations")
# # # def get_locations_by_level(level_name: str, db: Session = Depends(get_db)):
# # #     """Get locations by level - cached for 10 minutes"""
# # #     cache_key = f"locations:level:{level_name}"
    
# # #     # Try to get from cache
# # #     cached_data = get_cache(cache_key)
# # #     if cached_data:
# # #         return cached_data
    
# # #     # Try exact match first
# # #     level = db.query(Level).filter(Level.name == level_name).first()
    
# # #     # If not found, try slug conversion
# # #     if not level:
# # #         formatted_name = level_name.replace('-', ' ').title()
# # #         level = db.query(Level).filter(Level.name.ilike(formatted_name)).first()
    
# # #     if not level:
# # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # #     locations = db.query(Location).filter(Location.level_id == level.id).order_by(Location.display_order).all()
# # #     result = [{"id": loc.id, "name": loc.name, "display_order": loc.display_order} for loc in locations]
    
# # #     # Store in cache for 10 minutes
# # #     set_cache(cache_key, result, expire=600)
    
# # #     return result

# # # @router.get("/types")
# # # def get_collectible_types(db: Session = Depends(get_db)):
# # #     """Get all collectible types - cached for 10 minutes"""
# # #     cache_key = "types:all"
    
# # #     # Try to get from cache
# # #     cached_data = get_cache(cache_key)
# # #     if cached_data:
# # #         return cached_data
    
# # #     types = db.query(CollectibleType).order_by(CollectibleType.name).all()
# # #     result = [{"id": t.id, "name": t.name} for t in types]
    
# # #     # Store in cache for 10 minutes
# # #     set_cache(cache_key, result, expire=600)
    
# # #     return result

# # # @router.get("/collectibles")
# # # def get_all_collectibles(db: Session = Depends(get_db)):
# # #     """Get all collectibles - cached for 5 minutes (expensive query)"""
# # #     cache_key = "collectibles:all"
    
# # #     # Try to get from cache
# # #     cached_data = get_cache(cache_key)
# # #     if cached_data:
# # #         return cached_data
    
# # #     collectibles = db.query(Collectible).options(
# # #         joinedload(Collectible.type),
# # #         joinedload(Collectible.location).joinedload(Location.level),
# # #         joinedload(Collectible.images)
# # #     ).order_by(Collectible.display_order).all()
    
# # #     result = [{
# # #         "id": c.id,
# # #         "title": c.title,
# # #         "description": c.description,
# # #         "display_order": c.display_order,
# # #         "type": c.types.name,
# # #         "level": c.location.level.name,
# # #         "location": c.location.name,
# # #         "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# # #     } for c in collectibles]
    
# # #     # Store in cache for 5 minutes
# # #     set_cache(cache_key, result, expire=300)
    
# # #     return result

# # # @router.get("/collectibles/level/{level_name}")
# # # def get_collectibles_by_level(level_name: str, db: Session = Depends(get_db)):
# # #     """Get collectibles by level - cached for 5 minutes"""
# # #     cache_key = f"collectibles:level:{level_name}"
    
# # #     # Try to get from cache
# # #     cached_data = get_cache(cache_key)
# # #     if cached_data:
# # #         return cached_data
    
# # #     # Try exact match first
# # #     level = db.query(Level).filter(Level.name == level_name).first()
    
# # #     # If not found, try slug conversion
# # #     if not level:
# # #         formatted_name = level_name.replace('-', ' ').title()
# # #         level = db.query(Level).filter(Level.name.ilike(formatted_name)).first()
    
# # #     if not level:
# # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # #     locations = db.query(Location).filter(Location.level_id == level.id).options(
# # #         joinedload(Location.collectibles).joinedload(Collectible.type),
# # #         joinedload(Location.collectibles).joinedload(Collectible.images)
# # #     ).order_by(Location.display_order).all()
    
# # #     result = []
# # #     for loc in locations:
# # #         collectibles = sorted(loc.collectibles, key=lambda c: c.display_order)
# # #         result.append({
# # #             "location_id": loc.id,
# # #             "location_name": loc.name,
# # #             "location_order": loc.display_order,
# # #             "collectibles": [{
# # #                 "id": c.id,
# # #                 "title": c.title,
# # #                 "description": c.description,
# # #                 "display_order": c.display_order,
# # #                 "type": c.types.name,
# # #                 "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# # #             } for c in collectibles]
# # #         })
    
# # #     # Store in cache for 5 minutes
# # #     set_cache(cache_key, result, expire=300)
    
# # #     return result


# # # @router.get("/collectibles/{level_name}/{location_name}")
# # # def get_collectibles_by_location(level_name: str, location_name: str, db: Session = Depends(get_db)):
# # #     """Get collectibles by location - cached for 5 minutes"""
# # #     cache_key = f"collectibles:level:{level_name}:location:{location_name}"
    
# # #     # Try to get from cache
# # #     cached_data = get_cache(cache_key)
# # #     if cached_data:
# # #         return cached_data
    
# # #     level = db.query(Level).filter(Level.name == level_name).first()
# # #     if not level:
# # #         raise HTTPException(status_code=404, detail="Level not found")
    
# # #     location = db.query(Location).filter(
# # #         Location.level_id == level.id,
# # #         Location.name == location_name
# # #     ).first()
# # #     if not location:
# # #         raise HTTPException(status_code=404, detail="Location not found")
    
# # #     collectibles = db.query(Collectible).filter(Collectible.location_id == location.id).options(
# # #         joinedload(Collectible.type),
# # #         joinedload(Collectible.images)
# # #     ).order_by(Collectible.display_order).all()
    
# # #     if not collectibles:
# # #         raise HTTPException(status_code=404, detail="No collectibles found for this location")
    
# # #     result = [{
# # #         "id": c.id,
# # #         "title": c.title,
# # #         "description": c.description,
# # #         "display_order": c.display_order,
# # #         "type": c.types.name,
# # #         "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# # #     } for c in collectibles]
    
# # #     # Store in cache for 5 minutes
# # #     set_cache(cache_key, result, expire=300)
    
# # #     return result

# # # @router.get("/types/{type_name}/collectibles")
# # # def get_collectibles_by_type(type_name: str, db: Session = Depends(get_db)):
# # #     """Get collectibles by type - cached for 5 minutes"""
# # #     cache_key = f"collectibles:type:{type_name}"
    
# # #     # Try to get from cache
# # #     cached_data = get_cache(cache_key)
# # #     if cached_data:
# # #         return cached_data
    
# # #     # Try exact match first
# # #     collectible_type = db.query(CollectibleType).filter(CollectibleType.name == type_name).first()
    
# # #     # If not found, try slug conversion
# # #     if not collectible_type:
# # #         formatted_type = type_name.replace('-', ' ').title()
# # #         if formatted_type.endswith('s'):
# # #             formatted_type = formatted_type[:-1]
# # #         collectible_type = db.query(CollectibleType).filter(CollectibleType.name.ilike(f"%{formatted_type}%")).first()
    
# # #     if not collectible_type:
# # #         raise HTTPException(status_code=404, detail="Type not found")
    
# # #     collectibles = db.query(Collectible).filter(Collectible.type_id == collectible_type.id).options(
# # #         joinedload(Collectible.location).joinedload(Location.level),
# # #         joinedload(Collectible.images)
# # #     ).order_by(Collectible.display_order).all()
    
# # #     if not collectibles:
# # #         raise HTTPException(status_code=404, detail="No collectibles found for this type")
    
# # #     levels_dict = {}
# # #     for c in collectibles:
# # #         level = c.location.level
# # #         location = c.location
        
# # #         if level.id not in levels_dict:
# # #             levels_dict[level.id] = {
# # #                 "level_id": level.id,
# # #                 "level_name": level.name,
# # #                 "level_order": level.display_order,
# # #                 "locations": {}
# # #             }
        
# # #         if location.id not in levels_dict[level.id]["locations"]:
# # #             levels_dict[level.id]["locations"][location.id] = {
# # #                 "location_id": location.id,
# # #                 "location_name": location.name,
# # #                 "location_order": location.display_order,
# # #                 "collectibles": []
# # #             }
        
# # #         levels_dict[level.id]["locations"][location.id]["collectibles"].append({
# # #             "id": c.id,
# # #             "title": c.title,
# # #             "description": c.description,
# # #             "display_order": c.display_order,
# # #             "type": c.types.name,
# # #             "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# # #         })
    
# # #     result = []
# # #     for level_data in sorted(levels_dict.values(), key=lambda x: x["level_order"]):
# # #         level_data["locations"] = sorted(level_data["locations"].values(), key=lambda x: x["location_order"])
# # #         result.append(level_data)
    
# # #     # Store in cache for 5 minutes
# # #     set_cache(cache_key, result, expire=300)
    
# # #     return result

# # # @router.post("/collectibles")
# # # def create_collectible(collectible: CollectibleCreate, db: Session = Depends(get_db)):
# # #     """Create a new collectible and invalidate related caches"""
# # #     try:
# # #         if isinstance(collectible.description, list):
# # #             description_json = {"type": "list", "items": collectible.description}
# # #         else:
# # #             description_json = {"type": "text", "content": collectible.description}
        
# # #         new_collectible = Collectible(
# # #             location_id=collectible.location_id,
# # #             type_id=collectible.type_id,
# # #             title=collectible.title,
# # #             description=description_json,
# # #             display_order=collectible.display_order
# # #         )
# # #         db.add(new_collectible)
# # #         db.flush()
        
# # #         for img in collectible.images:
# # #             new_image = CollectibleImage(
# # #                 collectible_id=new_collectible.id,
# # #                 cloudinary_url=img.cloudinary_url,
# # #                 alt_text=img.alt_text,
# # #                 display_order=img.display_order
# # #             )
# # #             db.add(new_image)
        
# # #         db.commit()
        
# # #         # Invalidate all collectibles caches after successful creation
# # #         delete_cache("collectibles:*")
# # #         print(f"Cache invalidated after creating collectible ID: {new_collectible.id}")
        
# # #         return {"message": "Collectible created successfully", "id": new_collectible.id}
    
# # #     except Exception as e:
# # #         db.rollback()
# # #         raise HTTPException(status_code=400, detail=str(e))

# # from fastapi import APIRouter, HTTPException, Depends
# # from pydantic import BaseModel
# # from typing import List, Union
# # from sqlalchemy.orm import Session, joinedload
# # from database import get_db_session
# # from models import Level, Location, CollectibleType, Collectible, CollectibleImage
# # from redis_config import get_cache, set_cache, delete_cache

# # router = APIRouter(prefix="/collectibles", tags=["collectibles"])

# # def get_db():
# #     db = get_db_session()
# #     try:
# #         yield db
# #     finally:
# #         db.close()

# # class CollectibleImageSchema(BaseModel):
# #     cloudinary_url: str
# #     alt_text: str
# #     display_order: int

# # class CollectibleCreate(BaseModel):
# #     location_id: int
# #     type_id: int
# #     title: str
# #     description: Union[str, List[str]]
# #     display_order: int
# #     images: List[CollectibleImageSchema]

# # @router.get("/")
# # def get_all_collectibles(db: Session = Depends(get_db)):
# #     """Get all collectibles - cached for 30 minutes"""
# #     cache_key = "collectibles:all"
# #     cached_data = get_cache(cache_key)
# #     if cached_data:
# #         return cached_data
    
# #     collectibles = db.query(Collectible).options(
# #         joinedload(Collectible.type),
# #         joinedload(Collectible.location).joinedload(Location.level),
# #         joinedload(Collectible.images)
# #     ).order_by(Collectible.display_order).all()
    
# #     result = [{
# #         "id": c.id,
# #         "title": c.title,
# #         "description": c.description,
# #         "display_order": c.display_order,
# #         "type": c.types.name,
# #         "level": c.location.level.name,
# #         "location": c.location.name,
# #         "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# #     } for c in collectibles]
    
# #     set_cache(cache_key, result, expire=1800)
# #     return result

# # @router.get("/levels/{level_name}")
# # def get_collectibles_by_level(level_name: str, db: Session = Depends(get_db)):
# #     """Get collectibles by level - cached for 30 minutes"""
# #     cache_key = f"collectibles:level:{level_name}"
# #     cached_data = get_cache(cache_key)
# #     if cached_data:
# #         return cached_data
    
# #     level = db.query(Level).filter(Level.name == level_name).first()
# #     if not level:
# #         formatted_name = level_name.replace('-', ' ').title()
# #         level = db.query(Level).filter(Level.name.ilike(formatted_name)).first()
    
# #     if not level:
# #         raise HTTPException(status_code=404, detail="Level not found")
    
# #     locations = db.query(Location).filter(Location.level_id == level.id).options(
# #         joinedload(Location.collectibles).joinedload(Collectible.type),
# #         joinedload(Location.collectibles).joinedload(Collectible.images)
# #     ).order_by(Location.display_order).all()
    
# #     result = []
# #     for loc in locations:
# #         collectibles = sorted(loc.collectibles, key=lambda c: c.display_order)
# #         result.append({
# #             "location_id": loc.id,
# #             "location_name": loc.name,
# #             "location_order": loc.display_order,
# #             "collectibles": [{
# #                 "id": c.id,
# #                 "title": c.title,
# #                 "description": c.description,
# #                 "display_order": c.display_order,
# #                 "type": c.types.name,
# #                 "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# #             } for c in collectibles]
# #         })
    
# #     set_cache(cache_key, result, expire=1800)
# #     return result

# # @router.get("/types/{type_name}")
# # def get_collectibles_by_type(type_name: str, db: Session = Depends(get_db)):
# #     """Get collectibles by type - cached for 30 minutes"""
# #     cache_key = f"collectibles:type:{type_name}"
# #     cached_data = get_cache(cache_key)
# #     if cached_data:
# #         return cached_data
    
# #     collectible_type = db.query(CollectibleType).filter(CollectibleType.name == type_name).first()
# #     if not collectible_type:
# #         formatted_type = type_name.replace('-', ' ').title()
# #         if formatted_type.endswith('s'):
# #             formatted_type = formatted_type[:-1]
# #         collectible_type = db.query(CollectibleType).filter(CollectibleType.name.ilike(f"%{formatted_type}%")).first()
    
# #     if not collectible_type:
# #         raise HTTPException(status_code=404, detail="Type not found")
    
# #     collectibles = db.query(Collectible).filter(Collectible.type_id == collectible_type.id).options(
# #         joinedload(Collectible.location).joinedload(Location.level),
# #         joinedload(Collectible.images)
# #     ).order_by(Collectible.display_order).all()
    
# #     if not collectibles:
# #         raise HTTPException(status_code=404, detail="No collectibles found for this type")
    
# #     levels_dict = {}
# #     for c in collectibles:
# #         level = c.location.level
# #         location = c.location
        
# #         if level.id not in levels_dict:
# #             levels_dict[level.id] = {
# #                 "level_id": level.id,
# #                 "level_name": level.name,
# #                 "level_order": level.display_order,
# #                 "locations": {}
# #             }
        
# #         if location.id not in levels_dict[level.id]["locations"]:
# #             levels_dict[level.id]["locations"][location.id] = {
# #                 "location_id": location.id,
# #                 "location_name": location.name,
# #                 "location_order": location.display_order,
# #                 "collectibles": []
# #             }
        
# #         levels_dict[level.id]["locations"][location.id]["collectibles"].append({
# #             "id": c.id,
# #             "title": c.title,
# #             "description": c.description,
# #             "display_order": c.display_order,
# #             "type": c.types.name,
# #             "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# #         })
    
# #     result = []
# #     for level_data in sorted(levels_dict.values(), key=lambda x: x["level_order"]):
# #         level_data["locations"] = sorted(level_data["locations"].values(), key=lambda x: x["location_order"])
# #         result.append(level_data)

# #     set_cache(cache_key, result, expire=1800)
# #     return result

# # @router.get("/{level_name}/{location_name}")
# # def get_collectibles_by_location(level_name: str, location_name: str, db: Session = Depends(get_db)):
# #     """Get collectibles by location - cached for 30 minutes"""
# #     cache_key = f"collectibles:level:{level_name}:location:{location_name}"
# #     cached_data = get_cache(cache_key)
# #     if cached_data:
# #         return cached_data
    
# #     level = db.query(Level).filter(Level.name == level_name).first()
# #     if not level:
# #         raise HTTPException(status_code=404, detail="Level not found")
    
# #     location = db.query(Location).filter(
# #         Location.level_id == level.id,
# #         Location.name == location_name
# #     ).first()
# #     if not location:
# #         raise HTTPException(status_code=404, detail="Location not found")
    
# #     collectibles = db.query(Collectible).filter(Collectible.location_id == location.id).options(
# #         joinedload(Collectible.type),
# #         joinedload(Collectible.images)
# #     ).order_by(Collectible.display_order).all()
    
# #     if not collectibles:
# #         raise HTTPException(status_code=404, detail="No collectibles found for this location")
    
# #     result = [{
# #         "id": c.id,
# #         "title": c.title,
# #         "description": c.description,
# #         "display_order": c.display_order,
# #         "type": c.types.name,
# #         "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# #     } for c in collectibles]

# #     set_cache(cache_key, result, expire=3600)
# #     return result

# # @router.post("/")
# # def create_collectible(collectible: CollectibleCreate, db: Session = Depends(get_db)):
# #     """Create a new collectible and invalidate related caches"""
# #     try:
# #         if isinstance(collectible.description, list):
# #             description_json = {"type": "list", "items": collectible.description}
# #         else:
# #             description_json = {"type": "text", "content": collectible.description}
        
# #         new_collectible = Collectible(
# #             location_id=collectible.location_id,
# #             type_id=collectible.type_id,
# #             title=collectible.title,
# #             description=description_json,
# #             display_order=collectible.display_order
# #         )
# #         db.add(new_collectible)
# #         db.flush()
        
# #         for img in collectible.images:
# #             new_image = CollectibleImage(
# #                 collectible_id=new_collectible.id,
# #                 cloudinary_url=img.cloudinary_url,
# #                 alt_text=img.alt_text,
# #                 display_order=img.display_order
# #             )
# #             db.add(new_image)
        
# #         db.commit()
# #         delete_cache("collectibles:*")
# #         print(f"Cache invalidated after creating collectible ID: {new_collectible.id}")
        
# #         return {"message": "Collectible created successfully", "id": new_collectible.id}
    
# #     except Exception as e:
# #         db.rollback()
# #         raise HTTPException(status_code=400, detail=str(e))

# from fastapi import APIRouter, HTTPException, Depends
# from pydantic import BaseModel
# from typing import List, Union
# from sqlalchemy.orm import Session, joinedload
# from database import get_db_session
# from models import Level, Location, CollectibleType, Collectible, CollectibleImage
# from redis_config import get_cache, set_cache, delete_cache

# router = APIRouter(prefix="/collectibles", tags=["collectibles"])

# def get_db():
#     db = get_db_session()
#     try:
#         yield db
#     finally:
#         db.close()

# class CollectibleImageSchema(BaseModel):
#     cloudinary_url: str
#     alt_text: str
#     display_order: int

# class CollectibleCreate(BaseModel):
#     location_id: int
#     type_ids: List[int]  # Changed from type_id to type_ids (plural, list)
#     title: str
#     description: Union[str, List[str]]
#     display_order: int
#     images: List[CollectibleImageSchema]

# @router.get("/types")
# def get_all_collectible_types(db: Session = Depends(get_db)):
#     """Get all collectible types - cached for 10 minutes"""
#     cache_key = "types:all"
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     types = db.query(CollectibleType).order_by(CollectibleType.name).all()
#     result = [{"id": t.id, "name": t.name} for t in types]
#     set_cache(cache_key, result, expire=600)
#     return result

# @router.get("/")
# def get_all_collectibles(db: Session = Depends(get_db)):
#     """Get all collectibles - cached for 30 minutes"""
#     cache_key = "collectibles:all"
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     collectibles = db.query(Collectible).options(
#         joinedload(Collectible.types),  # Changed from type to types
#         joinedload(Collectible.location).joinedload(Location.level),
#         joinedload(Collectible.images)
#     ).order_by(Collectible.display_order).all()
    
#     result = [{
#         "id": c.id,
#         "title": c.title,
#         "description": c.description,
#         "display_order": c.display_order,
#         "types": [t.name for t in c.types],  # Changed: now returns array of type names
#         "level": c.location.level.name,
#         "location": c.location.name,
#         "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
#     } for c in collectibles]
    
#     set_cache(cache_key, result, expire=1800)
#     return result

# @router.get("/levels/{level_name}")
# def get_collectibles_by_level(level_name: str, db: Session = Depends(get_db)):
#     """Get collectibles by level - cached for 30 minutes"""
#     cache_key = f"collectibles:level:{level_name}"
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     level = db.query(Level).filter(Level.name == level_name).first()
#     if not level:
#         formatted_name = level_name.replace('-', ' ').title()
#         level = db.query(Level).filter(Level.name.ilike(formatted_name)).first()
    
#     if not level:
#         raise HTTPException(status_code=404, detail="Level not found")
    
#     locations = db.query(Location).filter(Location.level_id == level.id).options(
#         joinedload(Location.collectibles).joinedload(Collectible.types),  # Changed from type to types
#         joinedload(Location.collectibles).joinedload(Collectible.images)
#     ).order_by(Location.display_order).all()
    
#     result = []
#     for loc in locations:
#         collectibles = sorted(loc.collectibles, key=lambda c: c.display_order)
#         result.append({
#             "location_id": loc.id,
#             "location_name": loc.name,
#             "location_order": loc.display_order,
#             "collectibles": [{
#                 "id": c.id,
#                 "title": c.title,
#                 "description": c.description,
#                 "display_order": c.display_order,
#                 "types": [t.name for t in c.types],  # Changed: now returns array of type names
#                 "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
#             } for c in collectibles]
#         })
    
#     set_cache(cache_key, result, expire=1800)
#     return result

# @router.get("/types/{type_name}")
# def get_collectibles_by_type(type_name: str, db: Session = Depends(get_db)):
#     """Get collectibles by type - cached for 30 minutes"""
#     cache_key = f"collectibles:type:{type_name}"
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     collectible_type = db.query(CollectibleType).filter(CollectibleType.name == type_name).first()
#     if not collectible_type:
#         formatted_type = type_name.replace('-', ' ').title()
#         if formatted_type.endswith('es'):
#             formatted_type = formatted_type[:-2]
#         elif formatted_type.endswith('s'):
#             formatted_type = formatted_type[:-1]
#         collectible_type = db.query(CollectibleType).filter(CollectibleType.name.ilike(f"%{formatted_type}%")).first()
    
#     if not collectible_type:
#         raise HTTPException(status_code=404, detail="Type not found")
    
#     # Query collectibles that have this type (using the many-to-many relationship)
#     collectibles = db.query(Collectible).join(
#         Collectible.types
#     ).filter(
#         CollectibleType.id == collectible_type.id
#     ).options(
#         joinedload(Collectible.types),
#         joinedload(Collectible.location).joinedload(Location.level),
#         joinedload(Collectible.images)
#     ).order_by(Collectible.display_order).all()
    
#     if not collectibles:
#         raise HTTPException(status_code=404, detail="No collectibles found for this type")
    
#     levels_dict = {}
#     for c in collectibles:
#         level = c.location.level
#         location = c.location
        
#         if level.id not in levels_dict:
#             levels_dict[level.id] = {
#                 "level_id": level.id,
#                 "level_name": level.name,
#                 "level_order": level.display_order,
#                 "locations": {}
#             }
        
#         if location.id not in levels_dict[level.id]["locations"]:
#             levels_dict[level.id]["locations"][location.id] = {
#                 "location_id": location.id,
#                 "location_name": location.name,
#                 "location_order": location.display_order,
#                 "collectibles": []
#             }
        
#         levels_dict[level.id]["locations"][location.id]["collectibles"].append({
#             "id": c.id,
#             "title": c.title,
#             "description": c.description,
#             "display_order": c.display_order,
#             "types": [t.name for t in c.types],  # Changed: now returns array of type names
#             "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
#         })
    
#     result = []
#     for level_data in sorted(levels_dict.values(), key=lambda x: x["level_order"]):
#         level_data["locations"] = sorted(level_data["locations"].values(), key=lambda x: x["location_order"])
#         result.append(level_data)

#     set_cache(cache_key, result, expire=1800)
#     return result

# @router.get("/{level_name}/{location_name}")
# def get_collectibles_by_location(level_name: str, location_name: str, db: Session = Depends(get_db)):
#     """Get collectibles by location - cached for 30 minutes"""
#     cache_key = f"collectibles:level:{level_name}:location:{location_name}"
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     level = db.query(Level).filter(Level.name == level_name).first()
#     if not level:
#         raise HTTPException(status_code=404, detail="Level not found")
    
#     location = db.query(Location).filter(
#         Location.level_id == level.id,
#         Location.name == location_name
#     ).first()
#     if not location:
#         raise HTTPException(status_code=404, detail="Location not found")
    
#     collectibles = db.query(Collectible).filter(Collectible.location_id == location.id).options(
#         joinedload(Collectible.types),  # Changed from type to types
#         joinedload(Collectible.images)
#     ).order_by(Collectible.display_order).all()
    
#     if not collectibles:
#         raise HTTPException(status_code=404, detail="No collectibles found for this location")
    
#     result = [{
#         "id": c.id,
#         "title": c.title,
#         "description": c.description,
#         "display_order": c.display_order,
#         "types": [t.name for t in c.types],  # Changed: now returns array of type names
#         "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
#     } for c in collectibles]

#     set_cache(cache_key, result, expire=3600)
#     return result

# # @router.post("/")
# # def create_collectible(collectible: CollectibleCreate, db: Session = Depends(get_db)):
# #     """Create a new collectible and invalidate related caches"""
# #     try:
# #         if isinstance(collectible.description, list):
# #             description_json = {"type": "list", "items": collectible.description}
# #         else:
# #             description_json = {"type": "text", "content": collectible.description}
        
# #         new_collectible = Collectible(
# #             location_id=collectible.location_id,
# #             title=collectible.title,
# #             description=description_json,
# #             display_order=collectible.display_order
# #         )
# #         db.add(new_collectible)
# #         db.flush()
        
# #         # Add type associations
# #         for type_id in collectible.type_ids:
# #             collectible_type = db.query(CollectibleType).filter(CollectibleType.id == type_id).first()
# #             if collectible_type:
# #                 new_collectible.types.append(collectible_type)
        
# #         # Add images
# #         for img in collectible.images:
# #             new_image = CollectibleImage(
# #                 collectible_id=new_collectible.id,
# #                 cloudinary_url=img.cloudinary_url,
# #                 alt_text=img.alt_text,
# #                 display_order=img.display_order
# #             )
# #             db.add(new_image)
        
# #         db.commit()
# #         delete_cache("collectibles:*")
# #         print(f"Cache invalidated after creating collectible ID: {new_collectible.id}")
        
# #         return {"message": "Collectible created successfully", "id": new_collectible.id}
    
# #     except Exception as e:
# #         db.rollback()
# #         raise HTTPException(status_code=400, detail=str(e))

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Union
from sqlalchemy.orm import Session, joinedload
from database import get_db_session
from models import Level, Location, CollectibleType, Collectible, CollectibleImage
from redis_config import get_cache, set_cache, delete_cache
from slowapi import Limiter
from slowapi.util import get_remote_address

# Create limiter instance for this router
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/collectibles", tags=["collectibles"])

def get_db():
    db = get_db_session()
    try:
        yield db
    finally:
        db.close()

class CollectibleImageSchema(BaseModel):
    cloudinary_url: str
    alt_text: str
    display_order: int

class CollectibleCreate(BaseModel):
    location_id: int
    type_ids: List[int]
    title: str
    description: Union[str, List[str]]
    display_order: int
    images: List[CollectibleImageSchema]

@router.get("/types")
@limiter.limit("100/minute")
def get_all_collectible_types(request: Request, db: Session = Depends(get_db)):
    """Get all collectible types - cached for 10 minutes"""
    cache_key = "types:all"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    types = db.query(CollectibleType).order_by(CollectibleType.name).all()
    result = [{"id": t.id, "name": t.name} for t in types]
    set_cache(cache_key, result, expire=600)
    return result

@router.get("/")
@limiter.limit("100/minute")
def get_all_collectibles(request: Request, db: Session = Depends(get_db)):
    """Get all collectibles - cached for 30 minutes"""
    cache_key = "collectibles:all"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    collectibles = db.query(Collectible).options(
        joinedload(Collectible.types),
        joinedload(Collectible.location).joinedload(Location.level),
        joinedload(Collectible.images)
    ).order_by(Collectible.display_order).all()
    
    result = [{
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "display_order": c.display_order,
        "types": [t.name for t in c.types],
        "level": c.location.level.name,
        "location": c.location.name,
        "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
    } for c in collectibles]
    
    set_cache(cache_key, result, expire=1800)
    return result

@router.get("/levels/{level_name}")
@limiter.limit("100/minute")
def get_collectibles_by_level(level_name: str, request: Request, db: Session = Depends(get_db)):
    """Get collectibles by level - cached for 30 minutes"""
    cache_key = f"collectibles:level:{level_name}"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    level = db.query(Level).filter(Level.name == level_name).first()
    if not level:
        formatted_name = level_name.replace('-', ' ').title()
        level = db.query(Level).filter(Level.name.ilike(formatted_name)).first()
    
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    
    locations = db.query(Location).filter(Location.level_id == level.id).options(
        joinedload(Location.collectibles).joinedload(Collectible.types),
        joinedload(Location.collectibles).joinedload(Collectible.images)
    ).order_by(Location.display_order).all()
    
    result = []
    for loc in locations:
        collectibles = sorted(loc.collectibles, key=lambda c: c.display_order)
        result.append({
            "location_id": loc.id,
            "location_name": loc.name,
            "location_order": loc.display_order,
            "collectibles": [{
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "display_order": c.display_order,
                "types": [t.name for t in c.types],
                "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
            } for c in collectibles]
        })
    
    set_cache(cache_key, result, expire=1800)
    return result

@router.get("/types/{type_name}")
@limiter.limit("100/minute")
def get_collectibles_by_type(type_name: str, request: Request, db: Session = Depends(get_db)):
    """Get collectibles by type - cached for 30 minutes"""
    cache_key = f"collectibles:type:{type_name}"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    collectible_type = db.query(CollectibleType).filter(CollectibleType.name == type_name).first()
    if not collectible_type:
        formatted_type = type_name.replace('-', ' ').title()
        if formatted_type.endswith('es'):
            formatted_type = formatted_type[:-2]
        elif formatted_type.endswith('s'):
            formatted_type = formatted_type[:-1]
        collectible_type = db.query(CollectibleType).filter(CollectibleType.name.ilike(f"%{formatted_type}%")).first()
    
    if not collectible_type:
        raise HTTPException(status_code=404, detail="Type not found")
    
    collectibles = db.query(Collectible).join(
        Collectible.types
    ).filter(
        CollectibleType.id == collectible_type.id
    ).options(
        joinedload(Collectible.types),
        joinedload(Collectible.location).joinedload(Location.level),
        joinedload(Collectible.images)
    ).order_by(Collectible.display_order).all()
    
    if not collectibles:
        raise HTTPException(status_code=404, detail="No collectibles found for this type")
    
    levels_dict = {}
    for c in collectibles:
        level = c.location.level
        location = c.location
        
        if level.id not in levels_dict:
            levels_dict[level.id] = {
                "level_id": level.id,
                "level_name": level.name,
                "level_order": level.display_order,
                "locations": {}
            }
        
        if location.id not in levels_dict[level.id]["locations"]:
            levels_dict[level.id]["locations"][location.id] = {
                "location_id": location.id,
                "location_name": location.name,
                "location_order": location.display_order,
                "collectibles": []
            }
        
        levels_dict[level.id]["locations"][location.id]["collectibles"].append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "display_order": c.display_order,
            "types": [t.name for t in c.types],
            "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
        })
    
    result = []
    for level_data in sorted(levels_dict.values(), key=lambda x: x["level_order"]):
        level_data["locations"] = sorted(level_data["locations"].values(), key=lambda x: x["location_order"])
        result.append(level_data)

    set_cache(cache_key, result, expire=1800)
    return result

@router.get("/{level_name}/{location_name}")
@limiter.limit("100/minute")
def get_collectibles_by_location(level_name: str, location_name: str, request: Request, db: Session = Depends(get_db)):
    """Get collectibles by location - cached for 30 minutes"""
    cache_key = f"collectibles:level:{level_name}:location:{location_name}"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    level = db.query(Level).filter(Level.name == level_name).first()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    
    location = db.query(Location).filter(
        Location.level_id == level.id,
        Location.name == location_name
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    collectibles = db.query(Collectible).filter(Collectible.location_id == location.id).options(
        joinedload(Collectible.types),
        joinedload(Collectible.images)
    ).order_by(Collectible.display_order).all()
    
    if not collectibles:
        raise HTTPException(status_code=404, detail="No collectibles found for this location")
    
    result = [{
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "display_order": c.display_order,
        "types": [t.name for t in c.types],
        "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
    } for c in collectibles]

    set_cache(cache_key, result, expire=3600)
    return result