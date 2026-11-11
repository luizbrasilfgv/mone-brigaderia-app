# Modelo de dados (proposta)

Ponto de partida para o banco, tirado das telas do mockup. Ajustem à vontade quando escolherem a stack. Valores em dinheiro ficam em centavos para evitar erro de arredondamento.

```mermaid
erDiagram
    categorias ||--o{ doces : agrupa
    doces ||--o{ sabores : tem
    doces ||--o{ fotos : tem
    doces ||--o{ estoque_dia : "quantidade por dia"
    doces ||--o{ campanha_doces : participa
    campanhas ||--o{ campanha_doces : inclui
```

## Tabelas

### categorias

| Coluna | Tipo | Observação |
| --- | --- | --- |
| id | uuid | |
| nome | texto | Brigadeiros, Palhas, Bolos de pote, Caixas e kits |
| ordem | inteiro | ordem dos chips na vitrine |

### doces

| Coluna | Tipo | Observação |
| --- | --- | --- |
| id | uuid | |
| categoria_id | uuid | |
| nome | texto | |
| descricao | texto | |
| preco_centavos | inteiro | preço por unidade ou por caixa |
| contem_gluten | booleano | |
| contem_lactose | booleano | |
| composicao | texto | |
| conservacao | texto | |
| selo | enum | nenhum, novo, mais_vendido. "Últimas unidades" é calculado pelo estoque |
| sob_encomenda | booleano | se verdadeiro, ignora estoque |
| prazo_dias | inteiro | só para sob encomenda |
| onde_aparece | enum | ano_todo, so_campanhas |
| destaque | booleano | só um doce em destaque por vez |
| ativo | booleano | esconder sem apagar |
| criado_em, atualizado_em | data e hora | |

### sabores

| Coluna | Tipo | Observação |
| --- | --- | --- |
| id | uuid | |
| doce_id | uuid | |
| nome | texto | Tradicional, Ninho... |
| preco_centavos | inteiro, opcional | vazio = mesmo preço do doce |
| ordem | inteiro | |

### fotos

| Coluna | Tipo | Observação |
| --- | --- | --- |
| id | uuid | |
| doce_id | uuid | |
| url | texto | arquivo no storage |
| principal | booleano | |
| ordem | inteiro | |

### estoque_dia

Uma linha por doce e por dia guarda o histórico do que foi produzido.

| Coluna | Tipo | Observação |
| --- | --- | --- |
| doce_id | uuid | chave junto com `data` |
| data | data | |
| quantidade | inteiro | 0 = esgotado |

### campanhas

| Coluna | Tipo | Observação |
| --- | --- | --- |
| id | uuid | |
| tipo | enum | natal, pascoa, dia_das_maes, dia_dos_namorados, dia_do_chocolate, dia_dos_pais, outra |
| nome | texto | "Natal Mone" |
| inicio, fim | data | período no ar |
| limite_encomenda | data, opcional | último dia para encomendar |
| frase_banner | texto | |
| cor | texto | hexadecimal |
| pausada | booleano | "no ar" = hoje entre início e fim e não pausada |
| rascunho | booleano | |

### campanha_doces

Liga doces e campanhas (um doce pode estar em várias campanhas).

| Coluna | Tipo |
| --- | --- |
| campanha_id | uuid |
| doce_id | uuid |

## Consultas principais

- **Vitrine de hoje:** doces ativos com `onde_aparece = ano_todo`, mais os doces `so_campanhas` que estão em alguma campanha no ar. Junta o `estoque_dia` de hoje.
- **Doces da campanha:** `campanha_doces` da campanha no ar.

## Fase 2

Tabelas `pedidos` e `itens_pedido` quando a encomenda passar a ser feita dentro do app. Ao guardar dados de clientes, revisar a LGPD.
