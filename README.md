<<<<<<< HEAD
# ⚡ DENSUL MT/MS — Dashboard de Vendas

Dashboard de metas e bonificações dos vendedores DENSUL MT/MS.

React + TypeScript + Vite + Tailwind + Zustand + Zod

## Pré-requisitos

- Node.js 18+
- npm ou pnpm

## Instalação

```bash
git clone https://github.com/SEU-USUARIO/meta-vendedores.git
cd meta-vendedores
npm install
cp .env.example .env   # opcional: configure R2
npm run dev
```

Acesse `http://localhost:5173`

## Google Sheets

O dashboard se conecta ao Google Sheets via Apps Script.
Cole a URL do `/exec` no painel de conexão do dashboard.

O Apps Script (`Código.gs`) **não muda** — continua o mesmo que você já usa.

### Fluxo de dados

```
Google Sheets (você edita meta/venda/markup)
    ↓ Apps Script (action=get)
Dashboard React (visualiza + exporta PDF/PNG)
    ↓ Apps Script (action=set)
Google Sheets (atualiza se editar pelo dashboard)
```

## Fotos — R2 ou Google Drive

### Opção 1: Google Drive (padrão, sem configuração)

Fotos são servidas pelo Apps Script via pasta `fotos-vendedores` no Drive.
Funciona imediatamente se você já usa o sistema atual.

### Opção 2: Cloudflare R2 (mais rápido, sem CORS)

1. Crie um bucket R2 no Cloudflare Dashboard
2. Ative **Public access** (ou configure custom domain)
3. Faça upload das fotos:

```
seu-bucket/
  vendedores/
    7400.jpg        ← código do vendedor
    41671.png
  filiais/
    17838.jpg       ← código da filial
    27549.webp
```

4. Configure a variável:

```bash
# .env (local)
VITE_R2_PUBLIC_URL=https://fotos.seu-dominio.com

# Cloudflare Pages → Settings → Environment Variables
VITE_R2_PUBLIC_URL=https://fotos.seu-dominio.com
```

**Prioridade de resolução:** R2 vendedor → R2 filial → Drive vendedor → Drive filial → iniciais coloridas

Se `VITE_R2_PUBLIC_URL` não estiver configurado, usa apenas Drive.

## Funcionalidades

- **KPIs**: total vendido, meta geral, filiais ativas, vendedores, markup médio
- **Pódio**: top 3 com badges de elegibilidade e prêmios
- **Ranking**: tabela completa com barras de progresso e status
- **Bonificações**: cards top 3 + bônus markup + melhor filial
- **Gráfico**: desempenho por filial (markup médio ou % meta)
- **Filtro por filial**: tabs dinâmicos
- **Edição em massa**: edita meta/venda/markup de todos de uma vez
- **Regras da campanha**: markup mínimo, % meta, prêmios, bônus
- **Auto-sync**: 60s polling + sync ao voltar na aba
- **PDF export**: ranking geral, pódio, por filial, todas as filiais
- **PNG export**: imagem para compartilhar no WhatsApp
- **Ordenação**: por markup, % meta, ou valor vendido (em todos os lugares)

## Deploy — Cloudflare Pages

1. Suba o código para o GitHub
2. No Cloudflare Dashboard → Pages → Create a project
3. Conecte o repositório
4. Configure:
   - **Build command**: `npm run build`
   - **Build output**: `dist`
   - **Environment variable**: `VITE_R2_PUBLIC_URL` (se usar R2)
5. Deploy

## Estrutura do projeto

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Layout principal + modais
├── components/
│   ├── Avatar.tsx              # Avatar com foto R2/Drive/iniciais
│   ├── BonusSection.tsx        # Bonificações & elegibilidade
│   ├── ConnectionPanel.tsx     # Painel de conexão Sheets
│   ├── FilialChart.tsx         # Gráfico barras por filial
│   ├── FilialTabs.tsx          # Tabs de filtro por filial
│   ├── Header.tsx              # Header com botões
│   ├── KPIRow.tsx              # Cards de KPI
│   ├── MassEditModal.tsx       # Edição em massa
│   ├── Modal.tsx               # Wrapper de modal
│   ├── PdfExport.tsx           # Overlay de exportação PDF/PNG
│   ├── Podium.tsx              # Pódio top 3
│   ├── RankingTable.tsx        # Tabela de ranking
│   ├── RegrasModal.tsx         # Modal de regras da campanha
│   ├── Toast.tsx               # Notificações
│   └── VendedorModal.tsx       # Adicionar/editar vendedor
├── hooks/
│   ├── useAutoSync.ts          # Polling + visibility sync
│   └── useToast.ts             # Store de notificações
├── lib/
│   ├── formatters.ts           # fmt(), pct(), ini(), sorting
│   ├── pdfGenerator.ts         # Geração de HTML para PDFs
│   ├── r2Photos.ts             # Resolução de fotos R2 + Drive
│   └── sheetsApi.ts            # JSONP fetch/push Apps Script
├── schemas/
│   └── vendedor.ts             # Zod schemas + tipos
├── stores/
│   └── useAppStore.ts          # Zustand store global
└── styles/
    └── globals.css             # Tailwind + animações
```

## Stack

| Tech | Uso |
|------|-----|
| React 18 | UI components |
| TypeScript | Type safety |
| Vite 6 | Build tool |
| Tailwind CSS 3 | Styling |
| Zustand | State management |
| Zod | Validação de dados |
| html2canvas | Exportação PNG |
=======
# MetasVendedores
>>>>>>> 1e96a29cf91bcb0f1b508c103484b28b5639b299
