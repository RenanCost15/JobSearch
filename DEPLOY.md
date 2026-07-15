# Publicação no GitHub Pages

## Atualização do repositório existente

1. Faça backup dos dados dentro do aplicativo.
2. Extraia o ZIP do projeto.
3. Substitua o conteúdo do repositório `JobSearch` pelos arquivos extraídos.
4. Execute, opcionalmente:

```bash
npm install
npm run build
```

5. Faça commit e push para `main`.
6. Confirme em **Settings → Pages** que a fonte é **GitHub Actions**.

## Endereço esperado

```text
https://SEU-USUARIO.github.io/JobSearch/
```

## Cache

Esta versão não usa service worker. Após a publicação, uma atualização normal da página deve carregar o novo build. Se o navegador mantiver arquivos antigos, use `Ctrl + F5` uma vez.
