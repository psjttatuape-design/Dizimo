"""Entry point: FastAPI application bootstrap."""
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from auth import hash_password  # noqa: E402
from db import client, db  # noqa: E402
from routes.auth_routes import router as auth_router  # noqa: E402
from routes.contribuicoes import router as contribuicoes_router  # noqa: E402
from routes.dizimistas import router as dizimistas_router  # noqa: E402
from routes.relatorios import router as relatorios_router  # noqa: E402
from routes.users import router as users_router  # noqa: E402
from routes.valores_mensais import router as valores_mensais_router  # noqa: E402

app = FastAPI(title="Sistema de Gestão de Dízimos - PSJT")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}


api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(dizimistas_router)
api_router.include_router(contribuicoes_router)
api_router.include_router(valores_mensais_router)
api_router.include_router(relatorios_router)

app.include_router(api_router)


@app.on_event("startup")
async def startup_db():
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password": hash_password("admin123"),
            "name": "Administrador",
            "role": "admin",
            "permissions": {
                "dizimistas_view": True,
                "dizimistas_edit": True,
                "relatorios_view": True,
                "relatorios_edit": True,
            },
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(admin_user)
        logging.info("Admin user created: admin/admin123")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)
