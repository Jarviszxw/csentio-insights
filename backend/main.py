import os
from dotenv import load_dotenv

# Load environment variables from .env file in the backend directory
# Make sure .env is in the same directory as this script or specify path
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
    print(f".env file loaded from {dotenv_path}")
else:
    print(f".env file not found at {dotenv_path}, relying on system environment variables.")

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from routers import metrics, info, inventory, settlement
from routers import auth
from supabase import Client
from db.database import get_supabase
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CSENTIO API")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://csentio-insights-frontend.vercel.app",  # 添加生产环境前端域名
        "https://csentio-insights-frontend-*.vercel.app"  # 包含所有Vercel预览部署
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router)
app.include_router(info.router)
app.include_router(inventory.router)
app.include_router(settlement.router)
app.include_router(auth.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to CSENTIŌ Insights",
        "status": "API is running"
    }

@app.get("/api/test-supabase")
async def test_supabase(supabase: Client = Depends(get_supabase)):
    try:
        result = supabase.table("settlements").select("count", count="exact").execute()
        count = result.count if hasattr(result, 'count') else 0
        return {"status": "success", "connection": "ok", "settlements_count": count}
    except Exception as e:
        logger.error(f"Supabase connection failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Supabase connection failed: {str(e)}")

if __name__ == "__main__":
    logger.info("FastAPI is running...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)