# Próximos passos

O que já foi feito, o que falta para a loja usar no dia a dia e as ideias para depois. A história completa está em [historico.md](historico.md).

## Feito

- **No ar em monebrigaderia.com.br**, com publicação automática pelo GitHub a cada push no `main` ([publicar.md](publicar.md)).
- **Vitrine** em lista, com abas de categoria fixas, destaque, favoritos, "Aberto agora", "Como funciona", compartilhar doce (com foto no link) e instalação no celular.
- **Estoque honesto**: "Tem hoje / Últimas unidades / Esgotado" sem número; "confirme no WhatsApp" quando a quantidade não é de hoje; sem beco sem saída (esgotado, doce fora de época, encomendas encerradas).
- **Sacola e recibo pelo WhatsApp**: vários doces num pedido só, com número, itens agrupados e total; mudar e cancelar pela conversa; nada gravado no banco.
- **Alergênicos completos** por doce e traços da cozinha; "Sem glúten" só quando é verdade.
- **Campanhas** com datas prontas, prazo de encomenda que vale de verdade e banner igual na vitrine e na prévia.
- **Painel**: O que tem hoje rápido (digitar, Esgotou, Salvar o dia preso embaixo, Está igual a ontem), fichas dos doces com preço por sabor e foto reduzida no celular, "Sair sem salvar?", erros de campo e Dados da loja.
- **Login individual**: senha de cada pessoa, provisória pelo WhatsApp, troca no primeiro acesso, Minha conta, papéis (Administração, Equipe, Estoque), limite de tentativas e chave de emergência.
- **Guia da loja** em [`/guia`](https://monebrigaderia.com.br/guia), com prints reais e as respostas prontas do WhatsApp.
- Duas rodadas de revisão de experiência com 4 especialistas ([revisao-ux.md](revisao-ux.md)).

## Pendências

**Segurança (fazer logo):**

- Trocar a chave de emergência `PAINEL_SENHA` por um valor novo, guardado só com o Luiz.
- Trocar as senhas do cPanel e do MySQL que circularam por mensagem, e atualizar os secrets `FTP_SENHA` e `MYSQL_PASSWORD` ([publicar.md](publicar.md#9-trocar-uma-senha)).

**Equipe:**

- Convidar o Leonardo e o Bruno como colaboradores no GitHub (**Settings › Collaborators**) quando passarem os usuários.
- Ter 2 pessoas na Administração do painel (o Luiz e a dona), para uma gerar senha nova para a outra.

**Loja (com a dona):**

- Preencher **Painel › Dados da loja**: horário de cada dia, retirada, entrega, pagamento e ingredientes da cozinha (a palha leva biscoito: marcar trigo). Conferir o WhatsApp (vem (21) 98063-1673).
- Revisar a ficha da palha italiana (preços, sabores, textos, alergênicos) e cadastrar os outros doces.
- Fotos reais de todos os doces (hoje só a palha tem foto; sem foto, o app usa um desenho provisório).
- Usar o **WhatsApp Business** no número da loja e criar as respostas rápidas e as etiquetas do guia.
- Definir a regra de cancelamento de encomenda (até quando dá para cancelar e o que acontece se já pagou). Até lá, nenhum texto promete devolução ou prazo.

**Testes no mundo real:**

- Testar a instalação no Android e no iPhone (no iPhone, entrar de novo depois de instalar).
- Testar a tela do balcão (`/balcao`) na TV ou no tablet da loja.
- Fazer um pedido de ponta a ponta: sacola, WhatsApp, confirmação e baixa do estoque.

## Ideias para depois

Saíram das duas rodadas de revisão (listas "fazer depois") e de conversas. Nenhuma é urgente.

**Para quem compra:**

- Botão "+" no cartão da vitrine, só para doce sem opções e quando houver 3 ou mais doces (adiciona 1, com Desfazer).
- "Pedir de novo" a partir do último pedido.
- Página pública "Seus dados" (`/privacidade`) e "Apagar deste celular".
- Filtro guardado no endereço (`?ver=natal`), para links de campanha no Instagram, e voltar mantendo o filtro.
- Convite para instalar o app depois do primeiro favorito ou da volta do WhatsApp, além do rodapé.

**Para a loja:**

- Estoque por sabor e "Esgotou só este sabor".
- Lista de pedidos no painel (tabelas `pedidos` e `itens_pedido`), se a loja quiser, com revisão de LGPD.
- "Esqueci a senha" por e-mail, com link de 30 minutos, quando o e-mail da hospedagem estiver configurado com SPF/DKIM.
- Aviso de conflito "alterado por Ana às 10:02" quando duas pessoas mexem no mesmo doce (a coluna `atualizado_por` já existe).
- Galeria de fotos do doce ("Usar como principal", "Apagar").
- Formulário do doce dividido em "O essencial" e "Mais detalhes" (alergênicos no essencial).
- Ordem dos doces (↑/↓), "Apagar doce" só para a Administração e cadastro de categorias.
- "Criar doce para esta campanha" já ligado à campanha.
- "Fazer de novo este ano" nas campanhas encerradas.
- Chave única "Ativa" nas campanhas (no lugar de rascunho e pausa) e "Apagar campanha".
- Balcão: manter a tela do tablet acesa (Wake Lock).
- Página "sem internet" do painel instalado (service worker mínimo, só em `/painel/`, sem guardar dados em cache).
- Backup automático do banco (o cPanel costuma ter em **Backup**).

Descartadas nas revisões (e por quê) estão em [revisao-ux.md](revisao-ux.md#o-que-foi-descartado).
