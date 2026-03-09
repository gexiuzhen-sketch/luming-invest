"""
用户认证 API
提供注册和登录接口，支持跨设备认证
密码使用 PBKDF2-SHA256 哈希，登录返回 JWT token
"""
import hashlib
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.models.database import get_db
from app.models.user import User

router = APIRouter()

# JWT 配置
JWT_SECRET = os.getenv("JWT_SECRET", "luming-invest-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30  # token 有效期 30 天


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


def create_token(username: str) -> str:
    """为用户签发 JWT token"""
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(authorization: str = Header(None)) -> str:
    """从 Authorization header 解析并验证 JWT，返回 username"""
    if not authorization:
        raise HTTPException(status_code=401, detail="未提供认证信息")

    # 支持 "Bearer <token>" 格式
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="token 为空")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="无效的 token")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="token 已过期，请重新登录")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的 token")


class AuthBody(BaseModel):
    username: str
    password: str


@router.post("/register")
async def register(body: AuthBody, db: AsyncSession = Depends(get_db)):
    """注册新用户（用户名区分大小写），注册成功后返回 token"""
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
        "token": create_token(body.username),
        "user": {
            "id": f"server_{body.username}",
            "phone": body.username,
            "membershipLevel": "free"
        }
    }


@router.post("/login")
async def auth_login(body: AuthBody, db: AsyncSession = Depends(get_db)):
    """验证用户登录（用户名和密码均区分大小写），返回 JWT token"""
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="用户名不存在，请先注册")

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="密码错误")

    return {
        "success": True,
        "token": create_token(body.username),
        "user": {
            "id": f"server_{body.username}",
            "phone": body.username,
            "membershipLevel": "free"
        }
    }
