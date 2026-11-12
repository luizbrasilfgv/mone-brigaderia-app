# Mockup

Código-fonte das telas do protótipo feito no canvas de design do Claude.

Para ver e testar as telas, use o link do mockup no README principal. Estes arquivos não abrem direto no navegador: eles usam o motor do canvas (`support.js` e as tags `<x-dc>`), e as imagens apontam para endereços internos (`/_blob/...`). As mesmas imagens estão em `imagens/`.

Servem de referência para o app de verdade: estrutura das telas, cores, fontes, textos e regras (o JavaScript de cada tela mostra os estados, como estoque, sob encomenda e campanhas).

| Arquivo | O que é |
| --- | --- |
| `canvas.json` | Posição e nome de cada tela no canvas |
| `telas/Doce.dc.html` | Componente das ilustrações dos doces (provisório até chegarem as fotos) |
| `telas/*.dc.html` | Uma tela por arquivo; a lista está em [../docs/funcionalidades.md](../docs/funcionalidades.md) |
| `imagens/mone-logo.png` | Logo recortado da etiqueta |
| `imagens/palha-italiana.jpg` | Foto real da palha italiana |

## O que o app mudou em relação ao mockup

- `telas/Carrinho.dc.html` (sacola): continuam valendo a lista com contador, o total e a prévia da mensagem. Saíram "Como você quer receber?", "Para quando?", "Observação" e a linha "Entrega" (retirada ou entrega, dia e pagamento são combinados no WhatsApp), e "Pedido pronto!" virou "Pedido nº 4821 no WhatsApp".
- Vitrine: os doces aparecem em lista (um por linha), não em grade de 2 colunas.
