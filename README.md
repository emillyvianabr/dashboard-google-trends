# Dashboard Google Trends — Bondinho / Pão de Açúcar

Dashboard estático preparado para GitHub Pages.

## Arquivos
- `index.html` — página principal
- `style.css` — identidade visual laranja e layout responsivo
- `app.js` — filtros, KPIs, cálculos e gráficos
- `data.js` — dados consolidados dos CSVs enviados

## Como publicar no GitHub Pages
1. Copie os quatro arquivos para a raiz do repositório (ou para uma pasta `/docs`).
2. No GitHub, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch e a pasta onde os arquivos foram colocados.
5. Salve.

## Filtros
- Mercado: global.
- Ano: global.
- Data inicial/final: exclusiva do gráfico “Interesse ao longo do tempo”. Quando usada, a janela de datas controla apenas esse gráfico.

## Indicadores incluídos
- Interesse médio
- Variação YoY
- Momentum (3 meses mais recentes vs. 3 anteriores)
- Pico do período
- Volatilidade
- Tendência temporal
- Comparação ano selecionado × ano anterior
- Sazonalidade
- Ranking de mercados
- Crescimento anual por mercado
- Momentum por mercado
- Volatilidade por mercado
- Maiores picos
- Ranking geográfico 2026
- Leitura automática

## Nota metodológica
Os CSVs enviados usam o termo **“Pão de Açúcar”**. O Google Trends usa índice relativo normalizado de 0 a 100, não volume absoluto de buscas.


## Metodologia no dashboard
O dashboard inclui uma seção própria explicando:
- a escolha do **tema “Pão de Açúcar”** para representar o atrativo;
- a diferença entre **tema** e **termo de pesquisa** no Google Trends;
- a normalização do índice de **0 a 100**;
- como interpretar interesse médio, YoY, momentum, sazonalidade e volatilidade;
- limitações da base e recomendação de cruzamento com PAX, vendas e outras fontes.


## Atualização por planilha
O dashboard agora pode ser atualizado diretamente pela interface, sem editar os arquivos do site.

1. Abra o dashboard.
2. Clique em **Carregar planilha**.
3. Escolha um arquivo `.xlsx`, `.xls` ou `.csv`.
4. O dashboard recalcula filtros, KPIs e gráficos automaticamente no navegador.

### Formato mínimo
A planilha deve conter:
- `data`
- `mercado_codigo`
- `mercado`
- `indice_trends`

A aba `serie_mensal` da planilha `base_google_trends_bondinho.xlsx` já está no formato correto.

Em arquivos Excel, o dashboard procura primeiro uma aba chamada `serie_mensal`; se ela não existir, lê a primeira aba disponível.

**Importante:** o arquivo é processado localmente no navegador. Para a nova base ficar permanente no GitHub Pages para todos os visitantes, ainda é necessário substituir o arquivo-base no repositório ou implementar armazenamento externo.
