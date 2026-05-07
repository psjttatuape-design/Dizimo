"""Dizimistas routes: CRUD + Excel import/export + status update."""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from auth import check_permission, get_current_user
from db import db
from models import DizimistaBase, DizimistaCreate, DizimistaUpdate
from services.excel_service import build_export_workbook, build_template_workbook, parse_workbook
from services.sync_service import update_all_dizimistas_status

router = APIRouter(prefix="/dizimistas", tags=["dizimistas"])

EXCEL_MEDIA = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


# Excel routes first (before dynamic ones)
@router.get("/template/excel")
async def download_template(current_user: dict = Depends(get_current_user)):
    if not check_permission(current_user, "dizimistas", "view"):
        raise HTTPException(status_code=403, detail="Sem permissão")
    output = build_template_workbook()
    return StreamingResponse(
        output,
        media_type=EXCEL_MEDIA,
        headers={"Content-Disposition": "attachment; filename=template_dizimistas.xlsx"},
    )


@router.post("/import/excel")
async def import_dizimistas_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if not check_permission(current_user, "dizimistas", "edit"):
        raise HTTPException(status_code=403, detail="Sem permissão para importar dizimistas")
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Arquivo deve ser Excel (.xlsx ou .xls)")

    content = await file.read()
    dizimistas, errors = parse_workbook(content)

    imported = 0
    for d in dizimistas:
        await db.dizimistas.insert_one(d)
        imported += 1
    return {"imported": imported, "errors": errors}


@router.get("/export/excel")
async def export_dizimistas_excel(
    status: Optional[str] = None,
    nota: Optional[str] = None,
    mes_aniversario: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    if not check_permission(current_user, "dizimistas", "view"):
        raise HTTPException(status_code=403, detail="Sem permissão")

    query = {}
    if status and status != "todos":
        query["status"] = status
    if nota and nota != "todos":
        query["nota"] = nota

    dizimistas = await db.dizimistas.find(query, {"_id": 0}).to_list(10000)

    if mes_aniversario:
        filtered = []
        for d in dizimistas:
            data_nasc = d.get("data_nascimento") or ""
            try:
                parts = data_nasc.split("-")
                if len(parts) >= 2 and int(parts[1]) == mes_aniversario:
                    filtered.append(d)
            except Exception:
                pass
        dizimistas = filtered

    output = build_export_workbook(dizimistas)
    filename = "lista_dizimistas"
    if status and status != "todos":
        filename += f"_{status}"
    if nota and nota != "todos":
        filename += f"_{nota}"
    if mes_aniversario:
        meses = ["", "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
                 "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
        filename += f"_aniversario_{meses[mes_aniversario]}"

    return StreamingResponse(
        output,
        media_type=EXCEL_MEDIA,
        headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"},
    )


@router.get("")
async def list_dizimistas(
    nota: Optional[str] = None,
    status: Optional[str] = None,
    mes_aniversario: Optional[int] = None,
    nome: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    if not check_permission(current_user, "dizimistas", "view"):
        raise HTTPException(status_code=403, detail="Sem permissão para visualizar dizimistas")

    query = {}
    if nota and nota != "todos":
        query["nota"] = nota
    if status and status != "todos":
        query["status"] = status
    if nome:
        query["nome"] = {"$regex": nome, "$options": "i"}

    dizimistas = await db.dizimistas.find(query, {"_id": 0}).sort("nome", 1).to_list(10000)

    if mes_aniversario:
        filtered = []
        for d in dizimistas:
            data_nasc = d.get("data_nascimento") or ""
            try:
                parts = data_nasc.split("-")
                if len(parts) >= 2 and int(parts[1]) == mes_aniversario:
                    d["_sort_day"] = int(parts[2]) if len(parts) >= 3 else 0
                    filtered.append(d)
            except Exception:
                pass
        filtered.sort(key=lambda x: x.get("_sort_day", 0))
        for d in filtered:
            d.pop("_sort_day", None)
        dizimistas = filtered

    return dizimistas


@router.post("")
async def create_dizimista(data: DizimistaCreate, current_user: dict = Depends(get_current_user)):
    if not check_permission(current_user, "dizimistas", "edit"):
        raise HTTPException(status_code=403, detail="Sem permissão para criar dizimistas")

    existing = await db.dizimistas.find_one(
        {"nome": {"$regex": f"^{data.nome}$", "$options": "i"}},
        {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"Já existe um dizimista com o nome '{data.nome}'")

    dizimista = DizimistaBase(**data.model_dump()).model_dump()
    await db.dizimistas.insert_one(dizimista)
    dizimista.pop("_id", None)
    return dizimista


@router.put("/{dizimista_id}")
async def update_dizimista(
    dizimista_id: str,
    data: DizimistaUpdate,
    current_user: dict = Depends(get_current_user),
):
    if not check_permission(current_user, "dizimistas", "edit"):
        raise HTTPException(status_code=403, detail="Sem permissão para editar dizimistas")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

    result = await db.dizimistas.update_one({"id": dizimista_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Dizimista não encontrado")

    return await db.dizimistas.find_one({"id": dizimista_id}, {"_id": 0})


@router.delete("/{dizimista_id}")
async def delete_dizimista(dizimista_id: str, current_user: dict = Depends(get_current_user)):
    if not check_permission(current_user, "dizimistas", "edit"):
        raise HTTPException(status_code=403, detail="Sem permissão para excluir dizimistas")

    result = await db.dizimistas.delete_one({"id": dizimista_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dizimista não encontrado")
    return {"message": "Dizimista excluído com sucesso"}


@router.post("/atualizar-status")
async def trigger_status_update(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem atualizar status")
    await update_all_dizimistas_status()
    return {"message": "Status dos dizimistas atualizado com sucesso"}
