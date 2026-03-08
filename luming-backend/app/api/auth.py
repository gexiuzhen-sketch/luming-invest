"""
用户认证 API
提供注册和登录接口，支持跨设备认证
密码使用 PBKDF2-SHA256 哈希（无需额外依赖）
"""
import hashlib
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.models.database import get_db
from app.models.user import User

router = APIRouter()


def hash_password(password: str) -> str:
    """使用 PBKDF2-SHA256 哈希密码，返回 salt:hash 格式"""
    salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}:{dk.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """验证密码是否匹配"""
    try:
        salt, dk_hex = hashed.split(':', 1)
        dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return dk.hex() == dk_hex
    except Exception:
        return False


class AuthBody(BaseModel):
    username: str
    password: str


@router.post("/register")
async def register(body: AuthBody, db: AsyncSession = Depends(get_db)):
    """注册新用户（用户名区分大小写）"""
    if not body.username or len(body.username) > 100:
        raise HTTPException(status_code=400, detail="用户名无效")
    if not body.password or len(body.password) < 3:
        raise HTTPException(status_code=400, detail="密码至少3位")

    # 检查用户名是否已存在（区分大小写）
    result = await db.execute(select(User).where(User.username == body.username))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="用户名已存在")

    user = User(
        username=body.username,
        password_hash=hash_password(body.password)
    )
    db.add(user)
    await db.commit()

    return {
        "success": True,
        "user": {
            "id": f"server_{body.username}",
            "phone": body.username,
            "membershipLevel": "free"
        }
    }


@router.post("/login")
async def auth_login(body: AuthBody, db: AsyncSession = Depends(get_db)):
    """验证用户登录（用户名和密码均区分大小写）"""
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="用户名不存在，请先注册")

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="密码错误")

    return {
        "success": True,
        "user": {
            "id": f"server_{body.username}",
            "phone": body.username,
            "membershipLevel": "free"
        }
    }
