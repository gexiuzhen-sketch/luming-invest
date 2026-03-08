"""
用户数据同步 API
提供 GET / PUT 接口，用于跨设备同步用户数据（自选、持仓、模拟盘）
无需登录验证（用 username 作为 key，适合个人使用场景）
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.models.database import get_db
from app.models.user_data import UserSyncData
import json

router = APIRouter()


class SyncDataBody(BaseModel):
    data: dict  # 前端传来的 JSON 数据对象


@router.get("/{username}")
async def get_user_data(username: str, db: AsyncSession = Depends(get_db)):
    """拉取用户同步数据"""
    result = await db.execute(
        select(UserSyncData).where(UserSyncData.username == username)
    )
    row = result.scalars().first()
    if not row:
        return {"username": username, "data": {}, "updated_at": None}

    try:
        data = json.loads(row.data)
    except (json.JSONDecodeError, TypeError):
        data = {}

    return {
        "username": username,
        "data": data,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


@router.put("/{username}")
async def put_user_data(username: str, body: SyncDataBody, db: AsyncSession = Depends(get_db)):
    """推送用户同步数据（覆盖式更新）"""
    if len(username) > 100:
        raise HTTPException(status_code=400, detail="用户名过长")

    data_str = json.dumps(body.data, ensure_ascii=False)
    if len(data_str) > 2_000_000:  # 2MB 限制
        raise HTTPException(status_code=413, detail="数据量超过限制")

    result = await db.execute(
        select(UserSyncData).where(UserSyncData.username == username)
    )
    row = result.scalars().first()

    if row:
        row.data = data_str
    else:
        row = UserSyncData(username=username, data=data_str)
        db.add(row)

    await db.commit()
    await db.refresh(row)

    return {
        "success": True,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }
