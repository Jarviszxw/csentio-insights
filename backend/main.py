from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from routers import metrics 
from supabase import Client
from db.database import get_supabase
import os
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CSENTIO API")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router)

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