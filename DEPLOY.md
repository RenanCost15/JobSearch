# Publicação rápida

## Pelo site do GitHub

1. Entre no GitHub e crie um repositório **público** chamado `JobSearch`.
2. Clique em **uploading an existing file**.
3. Arraste todos os arquivos e pastas deste projeto. A pasta `.github` também precisa ser enviada.
4. Faça o commit na branch `main`.
5. Vá em **Settings → Pages → Source: GitHub Actions**.
6. Vá em **Actions**, abra o workflow de deploy e aguarde a conclusão.

## Pelo Git

```bash
git init
git add .
git commit -m "Publica JobSearch"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/JobSearch.git
git push -u origin main
```

Depois habilite **Settings → Pages → GitHub Actions**.
