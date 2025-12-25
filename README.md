
# Gestão Pecuária 🐄🌱

Sistema de gestão pecuária inteligente com IA integrada para controle zootécnico e financeiro de alta precisão.

## 🚀 Como subir este projeto no GitHub:

1.  **Crie o repositório** no GitHub (ex: `meu-agro-gestao`).
2.  **No seu computador**, abra o terminal na pasta do projeto.
3.  **Execute os comandos**:
    ```bash
    git init
    git add .
    git commit -m "Deploy Inicial: Gestão Pecuária"
    git branch -M main
    git remote add origin https://github.com/SEU_USUARIO/meu-agro-gestao.git
    git push -u origin main
    ```
4.  **Ative o GitHub Pages**:
    *   Vá em **Settings** > **Pages**.
    *   Em **Branch**, selecione `main` e a pasta `/(root)`.
    *   Clique em **Save**.

## 🔧 Resolução de Problemas (Troubleshooting)

### Se você deletou o repositório e precisa criar um novo:
Caso tenha excluído o repositório remoto, seu Git local falhará ao tentar dar push. Corrija com:
```bash
git remote remove origin
git remote add origin https://github.com/SEU_USUARIO/NOVO_REPOSITORIO.git
git push -u origin main
```

### Tela Branca no GitHub Pages:
- Verifique se o arquivo `index.html` está na raiz.
- Verifique se a importação do script está como `./index.tsx` (com o ponto no início).
- O projeto usa `importmaps`, portanto não requer processo de build (npm build).

## 💡 Tecnologias Utilizadas
- **React 19** & **Tailwind CSS**
- **Lucide React** (Ícones)
- **Google Gemini API** (IA Generativa para Consultoria)
- **Recharts** (Gráficos Financeiros e de Desempenho)

---
© 2025 Gestão Pecuária Systems.
