"""Relatorios (reports) routes."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from auth import check_permission, get_current_user
from db import db

router = APIRouter(prefix="/relatorios", tags=["relatorios"])


@router.get("/resumo")
async def get_resumo(
    mes_inicio: Optional[str] = None,
    ano_inicio: Optional[str] = None,
    mes_fim: Optional[str] = None,
    ano_fim: Optional[str] = None,
    status: Optional[str] = None,
    nota: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    if not check_permission(current_user, "relatorios", "view"):
        raise HTTPException(status_code=403, detail="Sem permissão para visualizar relatórios")

    diz_query = {}
    if status and status != "todos":
        diz_query["status"] = status
    if nota and nota != "todos":
        diz_query["nota"] = nota

    dizimistas = await db.dizimistas.find(diz_query, {"_id": 0}).to_list(10000)
    dizimistas_ids = set(d["id"] for d in dizimistas)

    all_dizimistas = await db.dizimistas.find({}, {"_id": 0}).to_list(10000)
    dizimistas_ativos = len([d for d in all_dizimistas if d.get("status") == "Ativo"])
    dizimistas_pendentes = len([d for d in all_dizimistas if d.get("status") == "Pendente"])
    dizimistas_inativos = len([d for d in all_dizimistas if d.get("status") == "Inativo"])
    total_geral = len(all_dizimistas)

    total_valor_dizimo = sum(d.get("valor_dizimo", 0) for d in all_dizimistas if d.get("status") == "Ativo")

    contribuicoes = await db.contribuicoes.find({}, {"_id": 0}).to_list(10000)
    valores_mensais = await db.valores_mensais.find({}, {"_id": 0}).to_list(10000)

    if status or nota:
        contribuicoes = [c for c in contribuicoes if c.get("dizimista_id") in dizimistas_ids]

    if ano_inicio and mes_inicio:
        data_inicio = f"{ano_inicio}-{mes_inicio.zfill(2)}"
        contribuicoes = [c for c in contribuicoes if c.get("data", "")[:7] >= data_inicio]
        valores_mensais = [v for v in valores_mensais if f"{v.get('ano')}-{str(v.get('mes')).zfill(2)}" >= data_inicio]

    if ano_fim and mes_fim:
        data_fim = f"{ano_fim}-{mes_fim.zfill(2)}"
        contribuicoes = [c for c in contribuicoes if c.get("data", "")[:7] <= data_fim]
        valores_mensais = [v for v in valores_mensais if f"{v.get('ano')}-{str(v.get('mes')).zfill(2)}" <= data_fim]

    total_contribuicoes = sum(c.get("valor", 0) for c in contribuicoes)
    total_valores_mensais = sum(v.get("valor", 0) for v in valores_mensais)
    total_arrecadado = total_valor_dizimo + total_contribuicoes + total_valores_mensais

    monthly = {}
    for c in contribuicoes:
        data = c.get("data", "")[:7]
        if data:
            monthly[data] = monthly.get(data, 0) + c.get("valor", 0)
    for v in valores_mensais:
        key = f"{v.get('ano')}-{str(v.get('mes')).zfill(2)}"
        monthly[key] = monthly.get(key, 0) + v.get("valor", 0)

    return {
        "total_dizimistas": total_geral,
        "dizimistas_ativos": dizimistas_ativos,
        "dizimistas_pendentes": dizimistas_pendentes,
        "dizimistas_inativos": dizimistas_inativos,
        "total_arrecadado": total_arrecadado,
        "total_valor_dizimo": total_valor_dizimo,
        "total_contribuicoes": len(contribuicoes),
        "por_mes": monthly,
    }


@router.get("/contribuicoes")
async def get_relatorio_contribuicoes(
    mes_inicio: Optional[str] = None,
    ano_inicio: Optional[str] = None,
    mes_fim: Optional[str] = None,
    ano_fim: Optional[str] = None,
    status: Optional[str] = None,
    nota: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    if not check_permission(current_user, "relatorios", "view"):
        raise HTTPException(status_code=403, detail="Sem permissão para visualizar relatórios")

    contribuicoes = await db.contribuicoes.find({}, {"_id": 0}).to_list(10000)
    dizimistas = await db.dizimistas.find({}, {"_id": 0}).to_list(10000)
    dizimistas_map = {d["id"]: d for d in dizimistas}

    if ano_inicio and mes_inicio:
        data_inicio = f"{ano_inicio}-{mes_inicio.zfill(2)}"
        contribuicoes = [c for c in contribuicoes if c.get("data", "")[:7] >= data_inicio]
    if ano_fim and mes_fim:
        data_fim = f"{ano_fim}-{mes_fim.zfill(2)}"
        contribuicoes = [c for c in contribuicoes if c.get("data", "")[:7] <= data_fim]

    if status or nota:
        filtered = []
        for c in contribuicoes:
            diz = dizimistas_map.get(c.get("dizimista_id"), {})
            if status and diz.get("status") != status:
                continue
            if nota and diz.get("nota") != nota:
                continue
            filtered.append(c)
        contribuicoes = filtered

    for c in contribuicoes:
        diz = dizimistas_map.get(c.get("dizimista_id"), {})
        c["dizimista_nome"] = diz.get("nome", "Desconhecido")
        c["dizimista_status"] = diz.get("status", "")
        c["dizimista_nota"] = diz.get("nota", "")

    return contribuicoes
