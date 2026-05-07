# PRD - Sistema de Gestão de Dízimos (Paróquia São Judas Tadeu)

## Original Problem Statement
Clonar repositório `goncalezromeo-tech/Dizimo-PSJT`, corrigir bugs iniciais e
iterativamente adicionar features (import/export Excel, layouts, validações,
auto-sync de contribuições para o relatório mensal).

## Stack
- Frontend: React + Tailwind + shadcn/ui + Recharts + axios + Sonner
- Backend: FastAPI + Motor (MongoDB) + Pydantic + openpyxl + JWT (passlib/bcrypt)
- DB: MongoDB

## Code Architecture (post Feb-2026 refactor)
```
/app/
├── backend/
│   ├── server.py            # Slim entrypoint (CORS + router includes + admin seed)
│   ├── db.py                # Motor client
│   ├── auth.py              # JWT, hash, get_current_user, check_permission
│   ├── models.py            # Pydantic models
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── users.py
│   │   ├── dizimistas.py
│   │   ├── contribuicoes.py
│   │   ├── valores_mensais.py
│   │   └── relatorios.py
│   ├── services/
│   │   ├── excel_service.py # template/parse/export workbooks
│   │   └── sync_service.py  # atualizar_valor_mensal + status updates
│   └── tests/
│       └── test_refactor_backend.py
└── frontend/src/
    ├── App.js               # Slim router (33 lines)
    ├── lib/
    │   ├── api.js           # BACKEND_URL + axios re-export
    │   └── tokenStorage.js  # in-memory + sessionStorage (XSS-hardening)
    ├── contexts/AuthContext.jsx
    ├── components/
    │   ├── ProtectedRoute.jsx
    │   └── layout/{Sidebar,Layout}.jsx
    ├── constants/meses.js
    └── pages/
        ├── Login.jsx
        ├── PainelGeral.jsx
        ├── Dizimistas.jsx
        ├── Contribuicoes.jsx
        ├── Relatorios.jsx
        └── Configuracoes.jsx
```

## Core Modules
- **Auth**: JWT (24h), passlib bcrypt. Admin seed em startup (`admin/admin123`).
- **Dizimistas**: CRUD + import/export Excel (15+ campos: nome, contatos,
  endereço, co-dizimista, status, nota, comunicação, valor_dizimo).
- **Contribuições**: CRUD + auto-sync (`atualizar_valor_mensal` recalcula
  `valores_mensais` em cada POST/DELETE).
- **Relatórios**: resumo agregado, gráfico 15 meses, histórico filtrável.
- **Configurações**: admin gerencia usuários e permissões granulares.

## DB Schemas
- `users`: id, username, password (hash), name, role, permissions, active, created_at
- `dizimistas`: id, nome, telefone, telefone_residencial, email, logradouro, numero,
  complemento, cep, data_nascimento, estado_civil, nome_conjuge, co_dizimista,
  co_dizimista_aniversario, nota, status, comunicacao, valor_dizimo, ultima_contribuicao
- `contribuicoes`: id, dizimista_id, dizimista_nome, valor, data, mes_referencia, meio
- `valores_mensais`: id, mes, ano, valor, observacao, created_at

## Key Endpoints (`/api/*`)
- `POST /auth/login` · `GET /auth/me`
- `GET|POST|PUT|DELETE /users` (admin)
- `GET|POST|PUT|DELETE /dizimistas` + `template/excel` + `import/excel` + `export/excel`
- `GET|POST|PUT|DELETE /contribuicoes` + `resumo-por-mes` + `sincronizar-valores-mensais`
- `GET|POST|PUT|DELETE /valores-mensais`
- `GET /relatorios/resumo` · `GET /relatorios/contribuicoes`

## Implemented (Changelog summary)
- 2026-02 — **Refactor P1**: server.py 1256→83 lines · App.js 2917→33 lines
- 2026-02 — **Security**: tokens migrados de `localStorage` → in-memory + `sessionStorage`
  (chave `psjt.auth.token`). Limpa legacy localStorage automaticamente.
- 2026-02 — **Auto-sync** Contribuições ↔ Valores Mensais
- 2026-02 — Co-dizimista (UI + Excel) · Pydantic validations (gt=0, le=1M)
- 2026-02 — Painel Geral restrito ao ano vigente · Versão 1.0.1 no login

## Pending / Backlog
- **P2 backlog**:
  - Garantir que `JWT_SECRET` falhe rápido em produção se ausente (remover fallback default)
  - `import/excel` rollback/transactional behavior em caso de erros parciais
  - Migrar `@app.on_event` deprecated → `lifespan` handlers
- **Open user-side**: validar produção via "Deploy" no Emergent

## Testing
- Backend smoke + regression: `/app/backend/tests/test_refactor_backend.py` (17/17 passing)
- Frontend regression: validado via screenshot (login → painel → dizimistas → contribuições → relatórios)

## Credentials
Veja `/app/memory/test_credentials.md`.
