"""User management routes (admin only)."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user, hash_password
from db import db
from models import UserCreate, UserPermissions, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _ensure_admin(current_user):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")


@router.get("")
async def list_users(current_user: dict = Depends(get_current_user)):
    _ensure_admin(current_user)
    return await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)


@router.post("")
async def create_user(data: UserCreate, current_user: dict = Depends(get_current_user)):
    _ensure_admin(current_user)

    if await db.users.find_one({"username": data.username}):
        raise HTTPException(status_code=400, detail="Usuário já existe")

    permissions = data.permissions.model_dump() if data.permissions else {
        "dizimistas_view": False,
        "dizimistas_edit": False,
        "relatorios_view": False,
        "relatorios_edit": False,
    }

    user = {
        "id": str(uuid.uuid4()),
        "username": data.username,
        "password": hash_password(data.password),
        "name": data.name,
        "role": data.role,
        "permissions": permissions,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    user.pop("password", None)
    user.pop("_id", None)
    return user


@router.put("/{user_id}")
async def update_user(user_id: str, data: UserUpdate, current_user: dict = Depends(get_current_user)):
    _ensure_admin(current_user)

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})


@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    _ensure_admin(current_user)

    if user_id == current_user.get("id"):
        raise HTTPException(status_code=400, detail="Não é possível excluir o próprio usuário")

    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"message": "Usuário excluído com sucesso"}


@router.put("/{user_id}/permissions")
async def update_user_permissions(
    user_id: str,
    permissions: UserPermissions,
    current_user: dict = Depends(get_current_user),
):
    _ensure_admin(current_user)

    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"permissions": permissions.model_dump()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
