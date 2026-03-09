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
- **Login Page**: Split-screen com logo da Paróquia São Judas Tadeu, cores institucionais (vermelho, dourado, ciano)
- **Dashboard**: Cards com estatísticas (total dizimistas, arrecadado, contribuições)
- **Página Dizimistas**: CRUD completo com permissões
- **Página Relatórios**: 
  - Resumo com cards (total dizimistas, arrecadado, contribuições)
  - Gráfico de barras de contribuições mensais (últimos 12 meses) - cor vermelha institucional
  - Formulário para registrar valores totais de meses anteriores
  - Tabela de valores mensais registrados
  - Histórico de contribuições
- **Aba Configurações**: 
  - Tab Usuários: Criar, editar, excluir usuários
  - Tab Permissões: Configurar permissões granulares por usuário
- **Sidebar**: Gradiente vermelho com logo da paróquia, itens ativos em dourado
- **Permissões**: dizimistas_view, dizimistas_edit, relatorios_view, relatorios_edit
- **Credenciais padrão**: admin / admin123
- **Logo**: https://customer-assets.emergentagent.com/job_permission-manager-8/artifacts/hr97hygf_Logo%20PSJT.jpg

## API Endpoints
- POST /api/auth/login - Login
- GET /api/auth/me - Usuário atual
- GET/POST/PUT/DELETE /api/users - CRUD usuários (admin only)
- PUT /api/users/{id}/permissions - Atualizar permissões
- GET/POST/PUT/DELETE /api/dizimistas - CRUD dizimistas
- GET/POST /api/contribuicoes - Contribuições
- GET /api/relatorios/resumo - Resumo estatístico
- GET /api/relatorios/contribuicoes - Lista de contribuições
- GET/POST/PUT/DELETE /api/valores-mensais - Valores mensais históricos

## Next Tasks / Backlog
- P1: Exportar relatórios em PDF/Excel
- P1: Registrar contribuições individuais por dizimista
- P2: Filtros por período nos relatórios
- P2: Reset de senha por admin
- P3: Notificações por email
- P3: Comparativo ano a ano
