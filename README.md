# JobSearch

Aplicação web estática para organizar candidaturas de **Renan Costa**.

## Estratégia

- Presencial ou híbrido: somente **Patos-PB**.
- Remoto: qualquer localidade, desde que a vaga aceite residência na Paraíba.
- Áreas: Administrativo, RH, atendimento, suporte técnico, operações, comercial, dados, bancos, cooperativas e estágio.

## Base inicial

- **171** empresas, instituições e canais.
- **122** alvos presenciais em Patos-PB.
- **49** alvos remotos/nacionais.

A base usa níveis de confiança para não confundir SAC, contato comercial e canal de recrutamento.

## Recursos

- Pipeline com status, prioridade, compatibilidade, data de envio e follow-up.
- Mensagem personalizada por empresa.
- Filtros para Patos, remoto, segmento, prioridade, status e confiabilidade.
- Snapshots automáticos locais, com até 40 versões restauráveis.
- Backup automático em arquivo JSON no Chrome/Edge, após autorização.
- Exportação JSON e CSV.
- PWA instalável e uso offline.
- Deploy automático no GitHub Pages.
- Verificação semanal dos links de carreira por GitHub Actions.

## Publicar no GitHub Pages

1. Crie um repositório chamado `JobSearch`.
2. Extraia o ZIP e envie **todo o conteúdo da pasta JobSearch** para a raiz do repositório.
3. Confirme que a branch principal se chama `main`.
4. No GitHub, abra **Settings → Pages**.
5. Em **Build and deployment**, escolha **GitHub Actions**.
6. Abra a aba **Actions** e aguarde o workflow `Deploy JobSearch to GitHub Pages`.
7. O endereço será semelhante a `https://SEU-USUARIO.github.io/JobSearch/`.

O workflow oficial está em `.github/workflows/deploy-pages.yml`.

## Backup automático

Snapshots locais são criados após alterações e a cada 15 minutos. Para manter também um arquivo no computador:

1. Hospede o site no GitHub Pages e abra no Chrome ou Edge.
2. Clique em **Ativar arquivo automático**.
3. Escolha onde salvar `JobSearch-backup-auto.json`.
4. Autorize o navegador.

O arquivo será regravado automaticamente após alterações. A autorização depende das regras de segurança do navegador.

## Monitoramento semanal

O workflow `weekly-link-check.yml` roda às segundas-feiras e testa os links da base. Ele não identifica novas vagas; serve para detectar canais quebrados. O monitoramento de novas oportunidades deve ser feito por pesquisa externa/automação.

## Desenvolvimento local

```bash
python -m http.server 8000
```

Abra `http://localhost:8000`.

## Dados

- `data/companies.json`: base legível por scripts e integrações.
- `data/companies.js`: cópia usada pelo navegador sem etapa de build.
- `src/app.js`: lógica da aplicação.
- `src/styles.css`: interface.

## Segurança

O site não envia dados para servidor. As candidaturas ficam no navegador e nos backups que o usuário escolher criar. Não publique currículos, documentos pessoais ou backups dentro do repositório público.
