"""Pydantic data models for the Tithe Management System."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# ===== Users =====
class UserPermissions(BaseModel):
    dashboard_view: bool = True
    dizimistas_view: bool = False
    dizimistas_edit: bool = False
    contribuicoes_view: bool = False
    contribuicoes_edit: bool = False
    relatorios_view: bool = False
    relatorios_edit: bool = False


class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    name: str
    role: str = "user"
    permissions: UserPermissions = Field(default_factory=UserPermissions)
    active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    role: str = "user"
    permissions: Optional[UserPermissions] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[UserPermissions] = None
    active: Optional[bool] = None


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ===== Dizimistas =====
class DizimistaBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    telefone: str = ""
    telefone_residencial: str = ""
    email: str = ""
    logradouro: str = ""
    numero: str = ""
    complemento: str = ""
    cep: str = ""
    data_nascimento: str = ""
    estado_civil: str = ""
    nome_conjuge: str = ""
    co_dizimista: str = ""
    co_dizimista_aniversario: str = ""
    nota: str = "Novo"
    status: str = "Ativo"
    modo_contribuicao: str = ""
    mes_contribuicao: str = ""
    comunicacao: str = ""
    valor_dizimo: float = Field(default=0.0, ge=0, le=1000000)
    data_cadastro: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    ultima_contribuicao: str = ""


class DizimistaCreate(BaseModel):
    nome: str
    telefone: str = ""
    telefone_residencial: str = ""
    email: str = ""
    logradouro: str = ""
    numero: str = ""
    complemento: str = ""
    cep: str = ""
    data_nascimento: str = ""
    estado_civil: str = ""
    nome_conjuge: str = ""
    co_dizimista: str = ""
    co_dizimista_aniversario: str = ""
    nota: str = "Novo"
    status: str = "Ativo"
    modo_contribuicao: str = ""
    mes_contribuicao: str = ""
    comunicacao: str = ""
    valor_dizimo: float = Field(default=0.0, ge=0, le=1000000)


class DizimistaUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    telefone_residencial: Optional[str] = None
    email: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    cep: Optional[str] = None
    data_nascimento: Optional[str] = None
    estado_civil: Optional[str] = None
    nome_conjuge: Optional[str] = None
    co_dizimista: Optional[str] = None
    co_dizimista_aniversario: Optional[str] = None
    nota: Optional[str] = None
    status: Optional[str] = None
    modo_contribuicao: Optional[str] = None
    mes_contribuicao: Optional[str] = None
    comunicacao: Optional[str] = None
    valor_dizimo: Optional[float] = Field(default=None, ge=0, le=1000000)


# ===== Contribuicoes =====
class ContribuicaoBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dizimista_id: str
    dizimista_nome: str = ""
    valor: float = Field(gt=0, le=1000000)
    data: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    mes_referencia: str = ""
    meio: str = ""


class ContribuicaoCreate(BaseModel):
    dizimista_id: str
    valor: float = Field(gt=0, le=1000000)
    data: Optional[str] = None
    mes_referencia: str = ""
    meio: str = ""


class ContribuicaoUpdate(BaseModel):
    valor: Optional[float] = Field(default=None, gt=0, le=1000000)
    data: Optional[str] = None
    mes_referencia: Optional[str] = None
    meio: Optional[str] = None


# ===== Valores Mensais =====
class ValorMensalBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mes: int = Field(ge=1, le=12)
    ano: int = Field(ge=2000, le=2100)
    valor: float = Field(gt=0, le=1000000)
    observacao: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ValorMensalCreate(BaseModel):
    mes: int = Field(ge=1, le=12)
    ano: int = Field(ge=2000, le=2100)
    valor: float = Field(gt=0, le=1000000)
    observacao: str = ""


class ValorMensalUpdate(BaseModel):
    valor: Optional[float] = Field(default=None, gt=0, le=1000000)
    observacao: Optional[str] = None
