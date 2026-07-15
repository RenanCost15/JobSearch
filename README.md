# JobSearch

CRM pessoal de busca de emprego construído em **React + Vite**, voltado para:

- vagas presenciais ou híbridas somente em **Patos-PB**;
- vagas totalmente remotas que aceitem candidatos residentes na Paraíba;
- áreas administrativa, RH, atendimento, suporte técnico, operações, comercial, dados e estágio.

## Base inicial

- 196 empresas, instituições e canais de prospecção;
- 20 vagas mapeadas em fontes públicas;
- mensagens personalizadas, assuntos, fontes, confiabilidade e cargos-alvo;
- acompanhamento de envio, status e follow-up.

As vagas públicas mudam rapidamente. O JobSearch sinaliza que elas devem ser verificadas antes da candidatura.

## Recursos

- dashboard responsivo;
- tema escuro preto/roxo e tema claro de alto contraste;
- empresas e vagas em áreas separadas;
- filtros e pesquisa;
- marcação de envios e follow-up automático em sete dias;
- mensagens personalizadas prontas para copiar;
- snapshots locais automáticos;
- backup automático opcional em arquivo no Chrome/Edge;
- exportação JSON e CSV;
- importação e restauração de backups;
- monitoramento semanal de links por GitHub Actions.

## Desenvolvimento

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

## GitHub Pages

O repositório já contém o workflow `.github/workflows/deploy-pages.yml`.

1. Crie ou atualize o repositório `JobSearch`.
2. Envie os arquivos para a branch `main`.
3. Em **Settings → Pages**, selecione **GitHub Actions**.
4. Aguarde o workflow de publicação.

A configuração do Vite usa a base `/JobSearch/`.

## Privacidade

Não envie currículos, documentos pessoais ou backups JSON para um repositório público. Os dados de acompanhamento ficam no `localStorage` do navegador e nos arquivos de backup autorizados pelo usuário.

## Ambiente recomendado

- Node.js 24.18.0 LTS
- npm 11.16.0
- React 19.2.7
- React DOM 19.2.7
- Vite 8.1.4
- @vitejs/plugin-react 6.0.3
- lucide-react 1.24.0

No Windows com FNM, execute na raiz do projeto:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\setup-windows.ps1
```

Depois use `npm run dev`.
