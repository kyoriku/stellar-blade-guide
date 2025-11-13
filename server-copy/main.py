# # # # # # # from fastapi import FastAPI
# # # # # # # from fastapi.middleware.cors import CORSMiddleware
# # # # # # # from routes import collectibles

# # # # # # # app = FastAPI()

# # # # # # # # Enable CORS for your React frontend
# # # # # # # app.add_middleware(
# # # # # # #     CORSMiddleware,
# # # # # # #     allow_origins=["http://localhost:3000"],  # Vite default port
# # # # # # #     allow_credentials=True,
# # # # # # #     allow_methods=["*"],
# # # # # # #     allow_headers=["*"],
# # # # # # # )

# # # # # # # # Include routes
# # # # # # # app.include_router(collectibles.router, prefix="/api")

# # # # # # # @app.get("/")
# # # # # # # def root():
# # # # # # #     return {"message": "Stellar Blade Guide API"}



# # # # # # # 



# # # # # # from fastapi import FastAPI
# # # # # # from fastapi.middleware.cors import CORSMiddleware
# # # # # # from routes import collectibles

# # # # # # app = FastAPI()

# # # # # # app.add_middleware(
# # # # # #     CORSMiddleware,
# # # # # #     allow_origins=["http://localhost:3000"],
# # # # # #     allow_credentials=True,
# # # # # #     allow_methods=["*"],
# # # # # #     allow_headers=["*"],
# # # # # # )

# # # # # # app.include_router(collectibles.router, prefix="/api")

# # # # # # @app.get("/")
# # # # # # def root():
# # # # # #     return {"message": "Stellar Blade Guide API"}




# # # # # # 

# # # # from fastapi import FastAPI
# # # # from fastapi.middleware.cors import CORSMiddleware
# # # # from routes import collectibles
# # # # from redis_config import redis_client

# # # # app = FastAPI()

# # # # app.add_middleware(
# # # #     CORSMiddleware,
# # # #     allow_origins=["http://localhost:3000"],
# # # #     allow_credentials=True,
# # # #     allow_methods=["*"],
# # # #     allow_headers=["*"],
# # # # )

# # # # @app.on_event("startup")
# # # # async def startup_event():
# # # #     """Test Redis connection on startup"""
# # # #     try:
# # # #         redis_client.ping()
# # # #         print("\033[92mRedis connection established\033[0m")
# # # #     except Exception as e:
# # # #         print(f"Redis connection failed: {e}")
# # # #         print("Application will continue without caching")

# # # # @app.on_event("shutdown")
# # # # async def shutdown_event():
# # # #     """Close Redis connection on shutdown"""
# # # #     try:
# # # #         redis_client.close()
# # # #         print("\033[92mRedis connection closed\033[0m")
# # # #     except Exception as e:
# # # #         print(f"\033[91mError closing Redis: {e}\033[0m")

# # # # app.include_router(collectibles.router, prefix="/api")

# # # # @app.get("/")
# # # # def root():
# # # #     return {"message": "Stellar Blade Guide API"}

# # # # @app.get("/health")
# # # # def health_check():
# # # #     """Health check endpoint including Redis status"""
# # # #     redis_status = "connected"
# # # #     try:
# # # #         redis_client.ping()
# # # #     except:
# # # #         redis_status = "disconnected"
    
# # # #     return {
# # # #         "status": "healthy",
# # # #         "redis": redis_status
# # # #     }

# # # # from fastapi import FastAPI
# # # # from fastapi.middleware.cors import CORSMiddleware
# # # # from routes import levels, types, collectibles
# # # # from redis_config import redis_client

# # # # app = FastAPI()

# # # # app.add_middleware(
# # # #     CORSMiddleware,
# # # #     allow_origins=["http://localhost:3000"],
# # # #     allow_credentials=True,
# # # #     allow_methods=["*"],
# # # #     allow_headers=["*"],
# # # # )

# # # # @app.on_event("startup")
# # # # async def startup_event():
# # # #     """Test Redis connection on startup"""
# # # #     try:
# # # #         redis_client.ping()
# # # #         print("Redis connection established")
# # # #     except Exception as e:
# # # #         print(f"Redis connection failed: {e}")
# # # #         print("Application will continue without caching")

# # # # @app.on_event("shutdown")
# # # # async def shutdown_event():
# # # #     """Close Redis connection on shutdown"""
# # # #     try:
# # # #         redis_client.close()
# # # #         print("Redis connection closed")
# # # #     except Exception as e:
# # # #         print(f"Error closing Redis: {e}")

# # # # # Include all routers with /api prefix
# # # # app.include_router(levels.router, prefix="/api")
# # # # app.include_router(types.router, prefix="/api")
# # # # app.include_router(collectibles.router, prefix="/api")

# # # # @app.get("/")
# # # # def root():
# # # #     return {"message": "Stellar Blade Guide API"}

# # # # @app.get("/health")
# # # # def health_check():
# # # #     """Health check endpoint including Redis status"""
# # # #     redis_status = "connected"
# # # #     try:
# # # #         redis_client.ping()
# # # #     except:
# # # #         redis_status = "disconnected"
    
# # # #     return {
# # # #         "status": "healthy",
# # # #         "redis": redis_status
# # # #     }











# # from fastapi import FastAPI
# # from fastapi.middleware.cors import CORSMiddleware
# # from routes import levels, types, collectibles
# # from redis_config import redis_client

# # app = FastAPI()

# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=["http://localhost:3000"],
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )

# # @app.on_event("startup")
# # async def startup_event():
# #     try:
# #         redis_client.ping()
# #         print("\033[92mRedis connection established\033[0m")

# #     except Exception as e:
# #         print(f"\033[91mRedis connection failed: {e}\033[0m")

# # @app.on_event("shutdown")
# # async def shutdown_event():
# #     try:
# #         redis_client.close()
# #         print("\033[92mRedis connection closed\033[0m")
# #     except Exception as e:
# #         print(f"\033[91mError closing Redis: {e}\033[0m")

# # # Current routers
# # app.include_router(levels.router, prefix="/api")
# # # app.include_router(types.router, prefix="/api")
# # app.include_router(collectibles.router, prefix="/api")

# # # Future routers (commented out for now)
# # # from routes import users, comments
# # # app.include_router(users.router, prefix="/api")
# # # app.include_router(comments.router, prefix="/api")

# # @app.get("/")
# # def root():
# #     return {"message": "Stellar Blade Guide API"}

# # @app.get("/health")
# # def health_check():
# #     redis_status = "connected"
# #     try:
# #         redis_client.ping()
# #     except:
# #         redis_status = "disconnected"
    
# #     return {
# #         "status": "healthy",
# #         "redis": redis_status
# #     }

# from contextlib import asynccontextmanager
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from routes import levels, collectibles
# from redis_config import redis_client

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # === Startup ===
#     try:
#         redis_client.ping()
#         print("\033[92mRedis connection established\033[0m")
#     except Exception as e:
#         print(f"\033[91mRedis connection failed: {e}\033[0m")

#     # Yield to let FastAPI handle requests
#     try:
#         yield
#     finally:
#         # === Shutdown ===
#         try:
#             redis_client.close()
#             print("\033[92mRedis connection closed\033[0m")
#         except Exception as e:
#             print(f"\033[91mError closing Redis: {e}\033[0m")

# # Pass lifespan to FastAPI instance
# app = FastAPI(lifespan=lifespan)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Routers
# app.include_router(levels.router, prefix="/api")
# app.include_router(collectibles.router, prefix="/api")

# @app.get("/")
# def root():
#     return {"message": "Stellar Blade Guide API"}

# @app.get("/health")
# def health_check():
#     redis_status = "connected"
#     try:
#         redis_client.ping()
#     except:
#         redis_status = "disconnected"
#     return {"status": "healthy", "redis": redis_status}

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routes import levels, collectibles
from redis_config import redis_client, REDIS_URL
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=REDIS_URL
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # === Startup ===
    try:
        redis_client.ping()
        print("\033[92mRedis connection established\033[0m")
    except Exception as e:
        print(f"\033[91mRedis connection failed: {e}\033[0m")

    try:
        yield
    finally:
        # === Shutdown ===
        try:
            redis_client.close()
            print("\033[92mRedis connection closed\033[0m")
        except Exception as e:
            print(f"\033[91mError closing Redis: {e}\033[0m")

app = FastAPI(lifespan=lifespan)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://stellarbladeguide.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(levels.router, prefix="/api")
app.include_router(collectibles.router, prefix="/api")

@app.get("/")
@limiter.limit("100/minute")
def root(request: Request):
    return {"message": "Stellar Blade Guide API"}

@app.get("/health")
def health_check(request: Request):
    redis_status = "connected"
    try:
        redis_client.ping()
    except:
        redis_status = "disconnected"
    return {"status": "healthy", "redis": redis_status}