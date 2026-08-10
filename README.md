# Dashboard Google Trends — Bondinho / Pão de Açúcar

Dashboard estático preparado para GitHub Pages, com atualização automática por planilha do próprio repositório.

## Estrutura do repositório

```text
/
├─ index.html
├─ style.css
├─ app.js
├─ data.js              # fallback
├─ README.md
└─ data/
   └─ dados.xlsx        # planilha que alimenta o dashboard
```

## Como atualizar os dados

Você **não precisa editar HTML, JavaScript ou gráficos**.

1. Atualize a planilha no seu computador.
2. Garanta que a aba principal se chame `serie_mensal`.
3. No GitHub, abra a pasta `data`.
4. Substitua o arquivo `dados.xlsx` pelo novo arquivo.
5. Mantenha exatamente o nome `dados.xlsx`.
6. Depois que o GitHub Pages publicar a alteração, recarregue o dashboard.

O navegador lê automaticamente `data/dados.xlsx` sempre que a página é aberta.

## Formato mínimo da aba `serie_mensal`

A planilha deve conter estas colunas:

- `data`
- `mercado_codigo`
- `mercado`
- `indice_trends`

A planilha entregue junto com este pacote já está no formato correto.

Também podem existir:
- `ano`
- `mes_num`
- `mes`
- `termo_google_trends`

## Fluxo recomendado

Use sempre a mesma planilha como base. Quando trouxer novos dados do Google Trends:
- acrescente as novas linhas na aba `serie_mensal`;
- ou substitua as linhas anteriores pela série atualizada;
- salve;
- envie o novo `dados.xlsx` para a pasta `data` do repositório.

Os filtros de mercado e ano são montados automaticamente com base no conteúdo do arquivo.

## Upload manual

O botão **Carregar planilha manualmente** continua disponível apenas para teste. Ele permite visualizar uma base no navegador antes de publicá-la no GitHub.

Esse upload manual não altera o arquivo do repositório.

## GitHub Pages

Em **Settings → Pages**:
1. escolha **Deploy from a branch**;
2. selecione a branch usada pelo site;
3. selecione a pasta raiz `/`;
4. salve.

## Observação importante sobre cache

O código solicita `data/dados.xlsx` com cache desativado e um parâmetro de atualização na URL. Isso reduz o risco de o navegador continuar exibindo uma versão antiga da planilha depois de você substituí-la no GitHub.

## Metodologia

O dashboard usa o tema associado a **Pão de Açúcar** no Google Trends para representar o interesse pelo atrativo. Os valores do Trends são índices relativos normalizados de 0 a 100 e não correspondem a volume absoluto de buscas.

O dashboard inclui:
- interesse médio;
- YoY;
- momentum;
- sazonalidade;
- volatilidade;
- picos;
- comparação anual;
- ranking de mercados;
- ranking geográfico;
- leitura automática.
