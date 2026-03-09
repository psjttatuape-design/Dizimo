# PRD - Sistema de Gestão de Dízimos

## Problem Statement Original
Adicionar uma aba de configuração para definir administrador e usuários e suas respectivas permissões de que campos podem acessar ou alterar.

## User Choices
- Controle de campos e páginas
- Níveis de permissão: apenas visualizar, visualizar e editar, acesso total
- Criar sistema de login (administrador cria usuário e login)
- Apenas Admin e Usuário
- Permissões específicas: editar Dizimistas e abrir Relatórios

## Architecture
- **Frontend**: React.js + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + MongoDB
- **Auth**: JWT tokens com bcrypt para hash de senhas

## User Personas
1. **Administrador**: Acesso total ao sistema, gerencia usuários e permissões
2. **Usuário Comum**: Acesso controlado baseado em permissões configuradas pelo admin

## Core Requirements (Static)
- [x] Sistema de autenticação (login/logout)
- [x] CRUD de usuários (apenas admin)
- [x] Sistema de permissões granular
- [x] CRUD de dizimistas (baseado em permissões)
- [x] Visualização de relatórios (baseado em permissões)
- [x] Aba de configurações para gerenciar usuários e permissões

## What's Been Implemented (Jan 2026)
- **Login Page**: Split-screen com imagem de vitral, formulário de login
- **Dashboard**: Cards com estatísticas (total dizimistas, arrecadado, contribuições)
- **Página Dizimistas**: CRUD completo com permissões
- **Página Relatórios**: Resumo e histórico de contribuições
- **Aba Configurações**: 
  - Tab Usuários: Criar, editar, excluir usuários
  - Tab Permissões: Configurar permissões granulares por usuário
- **Permissões**: dizimistas_view, dizimistas_edit, relatorios_view, relatorios_edit
- **Credenciais padrão**: admin / admin123

## API Endpoints
- POST /api/auth/login - Login
- GET /api/auth/me - Usuário atual
- GET/POST/PUT/DELETE /api/users - CRUD usuários (admin only)
- PUT /api/users/{id}/permissions - Atualizar permissões
- GET/POST/PUT/DELETE /api/dizimistas - CRUD dizimistas
- GET/POST /api/contribuicoes - Contribuições
- GET /api/relatorios/resumo - Resumo estatístico
- GET /api/relatorios/contribuicoes - Lista de contribuições

## Next Tasks / Backlog
- P1: Exportar relatórios em PDF/Excel
- P1: Registrar contribuições individuais por dizimista
- P2: Filtros por período nos relatórios
- P2: Reset de senha por admin
- P3: Notificações por email
- P3: Dashboard com gráficos de tendência
