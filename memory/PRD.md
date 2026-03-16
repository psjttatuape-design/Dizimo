# PRD - Sistema de Gestão de Dízimos PSJT

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

## What's Been Implemented

### Março 2026 - Sessão Atual (Últimas Alterações)
- **Campo Comunicação** adicionado em Dizimistas com opções: WhatsApp, Correio, E-mail
- **Filtro por Nome** na página de Dizimistas (busca parcial, case insensitive)
- **Relatório Atualizado** - calcula automaticamente o total arrecadado baseado nos valores de dízimo dos dizimistas ativos
- **Limpeza do banco** de dizimistas realizada (lista pronta para nova importação)

### Janeiro 2026 - MVP Inicial
- Login Page com logo da Paróquia São Judas Tadeu, cores institucionais
- Dashboard com cards de estatísticas
- Página Dizimistas com CRUD completo
- Página Relatórios com gráficos e histórico
- Aba Configurações para gerenciar usuários e permissões
- Sistema de permissões granular

### Janeiro 2026 - Melhorias
- Excel import/export para dizimistas
- Campo "Nota" editável (Novo, Atualizar, OK)
- Campo "Status" editável com automação (Ativo, Pendente, Inativo)
- Filtros avançados na página de Dizimistas (Status, Nota, Aniversário)
- Refatoração dos campos de endereço (Logradouro, Número, Complemento, CEP)
- Campo telefone residencial
- Gráfico de 15 meses com linha de média

### Dezembro 2025 - P0 Features
- **Dashboard Filters**: Filtros de Status, Nota e Mês de Contribuição com contagem de dizimistas
- **Novos Campos Dizimista**: modo_contribuicao (PIX, Envelope, Depósito) e mes_contribuicao
- **Exportação com Filtros**: Diálogo mostra filtros ativos, exporta usando mesmos filtros da listagem

## API Endpoints
- POST /api/auth/login - Login
- GET /api/auth/me - Usuário atual
- GET/POST/PUT/DELETE /api/users - CRUD usuários (admin only)
- PUT /api/users/{id}/permissions - Atualizar permissões
- GET/POST/PUT/DELETE /api/dizimistas - CRUD dizimistas (com filtro por nome)
- GET /api/dizimistas/template/excel - Template para importação
- POST /api/dizimistas/import/excel - Importar dizimistas via Excel
- GET /api/dizimistas/export/excel - Exportar dizimistas (com filtros)
- GET/POST /api/contribuicoes - Contribuições
- GET /api/relatorios/resumo - Resumo estatístico (inclui total_valor_dizimo)
- GET /api/relatorios/contribuicoes - Lista de contribuições
- GET/POST/PUT/DELETE /api/valores-mensais - Valores mensais históricos

## Database Schema
- **users**: id, username, password, name, role, permissions, active, created_at
- **dizimistas**: id, nome, telefone, telefone_residencial, email, logradouro, numero, complemento, cep, data_nascimento, nota, status, modo_contribuicao, mes_contribuicao, **comunicacao**, valor_dizimo, data_cadastro, ultima_contribuicao
- **contribuicoes**: id, dizimista_id, valor, data, observacao
- **valores_mensais**: id, mes, ano, valor, observacao, created_at

## Credenciais Padrão
- **Usuário**: admin
- **Senha**: admin123

## URL do Sistema
- **Preview**: https://psjt-dizimo.preview.emergentagent.com

## Logo da Paróquia
https://customer-assets.emergentagent.com/job_permission-manager-8/artifacts/hr97hygf_Logo%20PSJT.jpg

## Next Tasks / Backlog

### P1 - Alta Prioridade
- Exportar relatórios em PDF
- Registrar contribuições individuais por dizimista
- Cron job para atualização automática de status

### P2 - Média Prioridade  
- ~~Barra de pesquisa por nome na lista de dizimistas~~ ✅ FEITO
- Reset de senha por admin
- Comparativo ano a ano nos relatórios

### P3 - Baixa Prioridade
- Notificações por email
- Relatórios customizados

## Refactoring Needed
- **Crítico**: frontend/src/App.js tem mais de 2000 linhas - precisa ser dividido em componentes
- **Alta**: backend/server.py precisa ser modularizado em routers separados
