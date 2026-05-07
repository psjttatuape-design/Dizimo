"""Auth routes: login + me."""
from fastapi import APIRouter, Depends, HTTPException

from auth import create_access_token, get_current_user, verify_password
from db import db
from models import TokenResponse, UserLogin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"username": data.username}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    if not user.get("active", True):
        raise HTTPException(status_code=401, detail="Usuário desativado")

    token = create_access_token({"sub": user["id"]})
    user_data = {k: v for k, v in user.items() if k != "password"}
    return TokenResponse(access_token=token, user=user_data)


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
