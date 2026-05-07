"""Contribuicoes routes."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from auth import check_permission, get_current_user
from db import db
from models import ContribuicaoBase, ContribuicaoCreate, ContribuicaoUpdate
from services.sync_service import atualizar_valor_mensal

router = APIRouter(prefix="/contribuicoes", tags=["contribuicoes"])


@router.get("")
async def list_contribuicoes(
    dizimista_id: Optional[str] = None,
    mes_referencia: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    if not check_permission(current_user, "dizimistas", "view"):
        raise HTTPException(status_code=403, detail="Sem permissão para visualizar contribuições")

    query = {}
    if dizimista_id:
        query["dizimista_id"] = dizimista_id
    if mes_referencia and mes_referencia != "todos":
        query["mes_referencia"] = mes_referencia

    contribuicoes = await db.contribuicoes.find(query, {"_id": 0}).sort("data", -1).to_list(10000)

    if data_inicio:
        contribuicoes = [c for c in contribuicoes if c.get("data", "")[:10] >= data_inicio]
    if data_fim:
        contribuicoes = [c for c in contribuicoes if c.get("data", "")[:10] <= data_fim]

    dizimistas = await db.dizimistas.find({}, {"_id": 0, "id": 1, "nome": 1}).to_list(10000)
    diz_map = {d["id"]: d["nome"] for d in dizimistas}

    for c in contribuicoes:
        c["dizimista_nome"] = diz_map.get(c.get("dizimista_id"), "Desconhecido")

    return contribuicoes


@router.post("")
async def create_contribuicao(data: ContribuicaoCreate, current_user: dict = Depends(get_current_user)):
    if not check_permission(current_user, "dizimistas", "edit"):
        raise HTTPException(status_code=403, detail="Sem permissão para registrar contribuições")

    dizimista = await db.dizimistas.find_one({"id": data.dizimista_id}, {"_id": 0})
    if not dizimista:
        raise HTTPException(status_code=404, detail="Dizimista não encontrado")

    contribuicao_data = data.model_dump()
    contribuicao_data["dizimista_nome"] = dizimista.get("nome", "")
    if not contribuicao_data.get("data"):
        contribuicao_data["data"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    contribuicao = ContribuicaoBase(**contribuicao_data).model_dump()
    await db.contribuicoes.insert_one(contribuicao)
    contribuicao.pop("_id", None)

    await db.dizimistas.update_one(
        {"id": data.dizimista_id},
        {"$set": {"status": "Ativo", "ultima_contribuicao": contribuicao_data["data"]}}
    )

    if data.mes_referencia and contribuicao_data.get("data"):
        try:
            await atualizar_valor_mensal(int(data.mes_referencia), int(contribuicao_data["data"][:4]))
        except (ValueError, TypeError):
            pass

    return contribuicao


@router.put("/{contribuicao_id}")
async def update_contribuicao(
    contribuicao_id: str,
    data: ContribuicaoUpdate,
    current_user: dict = Depends(get_current_user),
):
    if not check_permission(current_user, "dizimistas", "edit"):
        raise HTTPException(status_code=403, detail="Sem permissão para editar contribuições")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

    result = await db.contribuicoes.update_one({"id": contribuicao_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contribuição não encontrada")

    return await db.contribuicoes.find_one({"id": contribuicao_id}, {"_id": 0})


@router.delete("/{contribuicao_id}")
async def delete_contribuicao(contribuicao_id: str, current_user: dict = Depends(get_current_user)):
    if not check_permission(current_user, "dizimistas", "edit"):
        raise HTTPException(status_code=403, detail="Sem permissão para excluir contribuições")

    contrib = await db.contribuicoes.find_one({"id": contribuicao_id})
    result = await db.contribuicoes.delete_one({"id": contribuicao_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contribuição não encontrada")

    if contrib and contrib.get("mes_referencia") and contrib.get("data"):
        try:
            await atualizar_valor_mensal(int(contrib["mes_referencia"]), int(contrib["data"][:4]))
        except (ValueError, TypeError):
            pass

    return {"message": "Contribuição excluída"}


@router.get("/resumo-por-mes")
async def get_contribuicoes_resumo_por_mes(current_user: dict = Depends(get_current_user)):
    if not check_permission(current_user, "dizimistas", "view"):
        raise HTTPException(status_code=403, detail="Sem permissão")

    contribuicoes = await db.contribuicoes.find({}, {"_id": 0}).to_list(10000)
    resumo = {}
    for contrib in contribuicoes:
        mes_ref = contrib.get("mes_referencia", "")
        if mes_ref:
            if mes_ref not in resumo:
                resumo[mes_ref] = {"total": 0, "quantidade": 0}
            resumo[mes_ref]["total"] += contrib.get("valor", 0)
            resumo[mes_ref]["quantidade"] += 1
    return resumo


@router.post("/sincronizar-valores-mensais")
async def sincronizar_contribuicoes_valores_mensais(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem sincronizar")

    contribuicoes = await db.contribuicoes.find({}, {"_id": 0}).to_list(10000)
    totais = {}
    for contrib in contribuicoes:
        mes_ref = contrib.get("mes_referencia", "")
        data = contrib.get("data", "")
        if mes_ref:
            mes = int(mes_ref)
            ano = int(data[:4]) if data else datetime.now().year
        elif data:
            mes = int(data[5:7])
            ano = int(data[:4])
        else:
            continue
        key = (mes, ano)
        totais[key] = totais.get(key, 0) + contrib.get("valor", 0)

    atualizados = 0
    for (mes, ano), valor in totais.items():
        existing = await db.valores_mensais.find_one({"mes": mes, "ano": ano})
        if existing:
            await db.valores_mensais.update_one(
                {"mes": mes, "ano": ano},
                {"$set": {"valor": valor, "observacao": "Atualizado via contribuições"}}
            )
        else:
            await db.valores_mensais.insert_one({
                "id": str(uuid.uuid4()),
                "mes": mes,
                "ano": ano,
                "valor": valor,
                "observacao": "Criado via contribuições",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        atualizados += 1

    return {
        "message": f"{atualizados} meses atualizados com sucesso",
        "totais": {f"{m}/{a}": v for (m, a), v in totais.items()},
    }
