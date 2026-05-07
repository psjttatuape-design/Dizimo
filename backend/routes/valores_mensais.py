"""Valores mensais routes."""
from fastapi import APIRouter, Depends, HTTPException

from auth import check_permission, get_current_user
from db import db
from models import ValorMensalBase, ValorMensalCreate, ValorMensalUpdate

router = APIRouter(prefix="/valores-mensais", tags=["valores-mensais"])


@router.get("")
async def list_valores_mensais(current_user: dict = Depends(get_current_user)):
    if not check_permission(current_user, "relatorios", "view"):
        raise HTTPException(status_code=403, detail="Sem permissão para visualizar valores mensais")
    return await db.valores_mensais.find({}, {"_id": 0}).to_list(1000)


@router.post("")
async def create_valor_mensal(data: ValorMensalCreate, current_user: dict = Depends(get_current_user)):
    if not check_permission(current_user, "relatorios", "edit"):
        raise HTTPException(status_code=403, detail="Sem permissão para registrar valores mensais")

    existing = await db.valores_mensais.find_one({"mes": data.mes, "ano": data.ano})
    if existing:
        await db.valores_mensais.update_one(
            {"mes": data.mes, "ano": data.ano},
            {"$set": {"valor": data.valor, "observacao": data.observacao}}
        )
        return await db.valores_mensais.find_one({"mes": data.mes, "ano": data.ano}, {"_id": 0})

    valor = ValorMensalBase(**data.model_dump()).model_dump()
    await db.valores_mensais.insert_one(valor)
    valor.pop("_id", None)
    return valor


@router.put("/{valor_id}")
async def update_valor_mensal(valor_id: str, data: ValorMensalUpdate, current_user: dict = Depends(get_current_user)):
    if not check_permission(current_user, "relatorios", "edit"):
        raise HTTPException(status_code=403, detail="Sem permissão para editar valores mensais")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

    result = await db.valores_mensais.update_one({"id": valor_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Valor mensal não encontrado")

    return await db.valores_mensais.find_one({"id": valor_id}, {"_id": 0})


@router.delete("/{valor_id}")
async def delete_valor_mensal(valor_id: str, current_user: dict = Depends(get_current_user)):
    if not check_permission(current_user, "relatorios", "edit"):
        raise HTTPException(status_code=403, detail="Sem permissão para excluir valores mensais")

    result = await db.valores_mensais.delete_one({"id": valor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Valor mensal não encontrado")
    return {"message": "Valor mensal excluído com sucesso"}
