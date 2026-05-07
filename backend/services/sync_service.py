"""Service: keep `valores_mensais` in sync with `contribuicoes`."""
import uuid
from datetime import datetime, timezone

from db import db


async def atualizar_valor_mensal(mes: int, ano: int):
    """Recalculate monthly total based on contributions for given month/year."""
    contribuicoes = await db.contribuicoes.find({}, {"_id": 0}).to_list(10000)

    total = 0
    for c in contribuicoes:
        mes_ref = c.get("mes_referencia", "")
        data = c.get("data", "")
        if mes_ref and data:
            try:
                if int(mes_ref) == mes and int(data[:4]) == ano:
                    total += c.get("valor", 0)
            except (ValueError, TypeError):
                pass

    existing = await db.valores_mensais.find_one({"mes": mes, "ano": ano})
    if total > 0:
        if existing:
            await db.valores_mensais.update_one(
                {"mes": mes, "ano": ano},
                {"$set": {"valor": total}}
            )
        else:
            novo = {
                "id": str(uuid.uuid4()),
                "mes": mes,
                "ano": ano,
                "valor": total,
                "observacao": "Auto-calculado",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.valores_mensais.insert_one(novo)
    elif existing and existing.get("observacao") == "Auto-calculado":
        await db.valores_mensais.delete_one({"mes": mes, "ano": ano})


async def update_all_dizimistas_status():
    """Update each dizimista status based on last contribution date."""
    now = datetime.now(timezone.utc)
    dizimistas = await db.dizimistas.find({}, {"_id": 0}).to_list(10000)

    for d in dizimistas:
        ultima = d.get("ultima_contribuicao", "")
        if not ultima:
            last_contrib = await db.contribuicoes.find_one(
                {"dizimista_id": d["id"]},
                sort=[("data", -1)]
            )
            if last_contrib:
                ultima = last_contrib.get("data", "")

        if ultima:
            try:
                last_date = datetime.fromisoformat(ultima.replace("Z", "+00:00"))
                months_diff = (now.year - last_date.year) * 12 + (now.month - last_date.month)
                if months_diff >= 6:
                    new_status = "Inativo"
                elif months_diff >= 2:
                    new_status = "Pendente"
                else:
                    new_status = "Ativo"
                if d.get("status") != new_status:
                    await db.dizimistas.update_one(
                        {"id": d["id"]},
                        {"$set": {"status": new_status, "ultima_contribuicao": ultima}}
                    )
            except Exception:
                pass
