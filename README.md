# Dashboard Google Trends — GitHub Pages

Dashboard estático em HTML, CSS e JavaScript. Não precisa de Python nem servidor.

## Publicação
1. Crie um repositório no GitHub.
2. Envie todo o conteúdo desta pasta para a raiz do repositório.
3. Acesse **Settings → Pages**.
4. Em **Source**, escolha **Deploy from a branch**.
5. Selecione **main** e **/(root)** e salve.

O endereço será `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Arquivos
- `index.html`: estrutura do painel
- `style.css`: identidade visual
- `app.js`: filtros, indicadores e gráficos
- `data/dashboard-data.js`: base consolidada

## Observações metodológicas
- Os KPIs de 2025 e 2026 usam os valores consolidados informados.
- Picos, séries e sazonalidade usam os CSVs mensais.
- Os mapas enviados são apenas de 2026, então não medem crescimento geográfico.
- A área de pesquisas relacionadas contém termos iniciais e deve ser substituída pelas exportações específicas do Google Trends quando disponíveis.
