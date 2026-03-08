"""
鹿鸣智投后端服务
提供股票数据API和实时行情聚合
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行
    print("🚀 鹿鸣智投后端服务启动中...")
    # 启动定时数据刷新任务
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from app.tasks.data_refresh import setup_scheduler
    scheduler = AsyncIOScheduler()
    setup_scheduler(scheduler)
    scheduler.start()
    print("⏰ 定时数据刷新任务已启动")
    yield
    # 关闭时执行
    scheduler.shutdown()
    print("👋 鹿鸣智投后端服务关闭")

app = FastAPI(
    title="鹿鸣智投API",
    description="股票数据聚合服务",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境请修改为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 导入路由
from app.api import stocks
from app.api import market
from app.api import user_data
from app.api import auth
from app.api import financial

app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
app.include_router(market.router, prefix="/api/market", tags=["market"])
app.include_router(user_data.router, prefix="/api/user-data", tags=["user-data"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(financial.router, prefix="/api/financial", tags=["financial"])

@app.get("/")
async def root():
    return {
        "name": "鹿鸣智投API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "stocks": "/api/stocks",
            "market": "/api/market",
            "user-data": "/api/user-data"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
