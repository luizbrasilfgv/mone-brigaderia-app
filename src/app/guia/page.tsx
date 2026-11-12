import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { IconeAlerta, IconeAjuda, IconeCasa, IconeSeta } from "@/components/Icones";
import { BalaoDoPedido } from "@/components/sacola/comum";
import { cartao, cx } from "@/components/ui";
import { LOJA } from "@/lib/loja";
import { formatarPreco } from "@/lib/regras";
import { BotaoCopiar } from "./BotaoCopiar";

// Guia da loja: como usar o app no dia a dia, para a dona e a equipe. Público (abre sem
// entrar no painel), mas fora do Google. Os prints ficam em public/guia/ e são telas reais
// do app, com nomes de exemplo.
export const metadata: Metadata = {
  title: "Guia da loja",
  description: "Como usar o painel da loja e responder os pedidos que chegam pelo WhatsApp.",
  robots: { index: false, follow: false },
};

const SECOES = [
  { id: "primeiro-acesso", titulo: "Primeiro acesso" },
  { id: "instalar", titulo: "Instalar no celular" },
  { id: "todo-dia", titulo: "Todo dia, de manhã" },
  { id: "doces", titulo: "Doces" },
  { id: "campanhas", titulo: "Campanhas (Natal, Páscoa…)" },
  { id: "pedidos", titulo: "Pedidos pelo WhatsApp" },
  { id: "loja", titulo: "Dados da loja" },
  { id: "acessos", titulo: "Acessos" },
  { id: "conta", titulo: "Minha conta" },
  { id: "ajuda", titulo: "Precisa de ajuda?" },
] as const;

type IdSecao = (typeof SECOES)[number]["id"];

// Tamanho de cada print em pixels de tela (as imagens têm o dobro, para ficarem nítidas).
const PRINTS = {
  "vitrine-topo": [390, 106],
  entrar: [390, 608],
  "criar-senha": [390, 448],
  "como-usar": [390, 493],
  "instalar-android": [390, 391],
  "instalar-iphone": [390, 471],
  "hoje-salvar": [390, 528],
  "hoje-lembrete": [390, 432],
  "hoje-esgotou": [390, 308],
  "vitrine-confirme": [390, 235],
  "vitrine-hoje": [390, 316],
  "doce-foto-preco": [390, 366],
  "doce-sabores": [390, 467],
  "doce-alergenicos": [390, 307],
  "doce-mais": [390, 403],
  "doce-encomenda": [390, 291],
  "doce-sair-sem-salvar": [390, 292],
  "campanhas-modelos": [390, 353],
  "campanha-datas": [390, 428],
  "campanha-doces": [390, 754],
  "campanhas-lista": [390, 265],
  "pedido-ficha": [390, 606],
  "pedido-sacola": [390, 1052],
  "pedido-enviar": [390, 290],
  "loja-whatsapp": [390, 493],
  "loja-textos": [390, 540],
  "acessos-adicionar": [390, 567],
  "acessos-convite": [390, 288],
  "acessos-pessoa": [390, 219],
  "acessos-recomendado": [390, 104],
  conta: [390, 612],
  esqueci: [390, 526],
  "menu-botao": [390, 75],
  menu: [390, 590],
} as const;

// O recibo no formato exato que a sacola manda (src/lib/sacola.ts, mensagemDoPedido).
const RECIBO = [
  `Olá, ${LOJA.nome}! Quero fazer este pedido:`,
  "",
  "*Pedido nº 4821*",
  "Nome: Ana",
  "",
  "• 3x Palha italiana",
  `  – 1x Tradicional: ${formatarPreco(900)}`,
  `  – 1x Ninho: ${formatarPreco(1000)}`,
  `  – 1x Ninho com Nutella: ${formatarPreco(1100)}`,
  `• 1x Bolo de pote Ninho com morango (250 ml): ${formatarPreco(1600)}`,
  `• 2x Brownie: ${formatarPreco(1600)}`,
  "",
  `*Total dos doces: ${formatarPreco(6200)}* (6 itens)`,
  "",
  "Aguardo a confirmação para combinar retirada ou entrega, dia, horário e pagamento.",
].join("\n");

const RESPOSTAS = [
  {
    atalho: "/recebi",
    quando: "Assim que o pedido chega.",
    texto: "Oi! Recebi seu pedido nº ____. Já confiro e te respondo.\nPara fechar, me conta:\n1. Vai retirar ou prefere entrega?\n2. Qual dia e horário?\n3. Pix ou dinheiro?",
  },
  {
    atalho: "/confirmado",
    quando: "Depois de combinar tudo. É o comprovante da loja.",
    texto:
      "Pedido nº ____ confirmado! Total: R$ ____.\n[Retirada / Entrega] em [dia], [horário]. Pagamento: [Pix ou dinheiro].\nSe precisar mudar ou cancelar, é só responder esta mensagem.",
  },
  {
    atalho: "/pix",
    quando: "Quando a pessoa vai pagar por Pix.",
    texto: "Pode fazer o Pix para a chave ____, no nome ____. Depois me manda o comprovante aqui, por favor.",
  },
  {
    atalho: "/cancelado",
    quando: "Quando a pessoa pede para cancelar.",
    texto: "Pronto, o pedido nº ____ foi cancelado. Quando quiser, é só montar outro na vitrine: monebrigaderia.com.br",
  },
];

const botaoTopo = "flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-dourado/30 px-3.5 text-[13px] font-bold text-dourado";

const ETIQUETAS = ["Novo pedido", "Confirmado", "Pago", "Entregue", "Cancelado"];

const PAPEIS = [
  { nome: "Administração", faz: "Tudo, inclusive Dados da loja e Acessos" },
  { nome: "Equipe", faz: "Doces, fotos, campanhas, destaque e quantidades do dia" },
  { nome: "Estoque", faz: "Só as quantidades do dia" },
];

export default function PaginaGuia() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-9 px-5 pt-[calc(18px+env(safe-area-inset-top))] pb-[calc(40px+env(safe-area-inset-bottom))] break-words">
      <header className="flex flex-col gap-4">
        {/* No app instalado não há barra de endereço: daqui se volta à vitrine e ao painel. */}
        <nav aria-label="Vitrine e painel" className="flex items-center justify-between gap-3">
          <Link href="/" className={botaoTopo}>
            <IconeCasa tamanho={18} />
            Vitrine
          </Link>
          <Link href="/painel" className={botaoTopo}>
            Painel
            <IconeSeta tamanho={16} />
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={44} height={44} className="rounded-full" />
          <div className="flex min-w-0 grow flex-col gap-0.5">
            <span className="text-xs text-creme-400">{LOJA.nome}</span>
            <h1 className="font-display text-[26px] leading-tight font-semibold">Guia da loja</h1>
          </div>
        </div>
        <p className="text-[15px] leading-relaxed text-creme-200">
          Como usar o app da loja no dia a dia: o painel, os doces, as campanhas e os pedidos que chegam pelo WhatsApp. As telas são
          do app de verdade, com nomes de exemplo.
        </p>
        <nav id="indice" aria-labelledby="titulo-indice" className={cx(cartao, "scroll-mt-4 flex flex-col p-2")}>
          <h2 id="titulo-indice" className="px-3 pt-2 pb-1 text-xs font-bold tracking-[0.12em] text-creme-400 uppercase">
            Índice
          </h2>
          <ol className="flex flex-col">
            {SECOES.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold active:bg-creme/[0.06]">
                  <Numero>{i + 1}</Numero>
                  {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <Secao id="primeiro-acesso" quem="Para todos">
        <P>
          Quem cuida da administração cadastra você no painel e manda um <strong>convite pelo WhatsApp</strong>. Nele vêm o
          link para entrar, o seu e-mail e uma <strong>senha provisória</strong> (por exemplo, cacau-4821). Ela vale 7 dias.
        </P>
        <Passos
          itens={[
            <>
              Toque no <strong>link do convite</strong>. Nas outras vezes, abra o app e toque no <strong>ícone de pessoa</strong>,
              no alto da vitrine, à direita.
              <Print nome="vitrine-topo" alt="Alto da vitrine, com o ícone de pessoa em destaque, à direita." />
            </>,
            <>
              Digite o seu e-mail e a senha provisória e toque em <strong>Entrar</strong>.
              <Print nome="entrar" alt="Tela Painel da loja, com e-mail, senha, botão Entrar e o link Esqueci a senha." />
            </>,
            <>
              O app pede para você <strong>criar a sua senha</strong>: pelo menos 8 letras ou números. Não precisa de maiúscula nem de
              símbolo. Toque em <strong>Mostrar</strong> para conferir o que digitou e depois em <strong>Salvar senha e entrar</strong>.
              <Print nome="criar-senha" alt="Tela Crie sua senha, com o campo Senha nova e o botão Salvar senha e entrar." />
            </>,
            <>
              Pronto: abre o guia <strong>Como usar</strong>, em passos, só com o que você pode fazer. Para rever depois, toque em{" "}
              <strong>Menu › Como usar</strong>.
              <Print nome="como-usar" alt="Primeiro passo do guia Como usar: Boas-vindas ao painel." />
            </>,
          ]}
        />
        <Dica>
          Quando o celular oferecer, deixe ele guardar a senha. Quem usa o painel pelo menos uma vez por mês continua conectado e
          não precisa digitar a senha de novo.
        </Dica>
        <Dica>A senha provisória venceu ou não funciona? Peça uma nova para a administração.</Dica>
        <Subtitulo>O Menu do painel</Subtitulo>
        <P>
          Em qualquer tela do painel, toque em <strong>Menu</strong>, no alto, à direita. Ali estão todas as partes, só com o que
          você pode usar. Não precisa digitar endereço nenhum.
        </P>
        <Print nome="menu-botao" alt="Alto da tela inicial do painel, com o botão Menu em destaque, à direita." />
        <Print nome="menu" alt="Menu do painel aberto, com os grupos Dia a dia, Loja, Ajuda e Conta." estreito />
        <Lista
          itens={[
            <>
              <strong>Dia a dia</strong>: O que tem hoje, Cadastrar novo doce e Campanhas.
            </>,
            <>
              <strong>Loja</strong>: Dados da loja, Acessos e Tela do balcão (os doces em sequência, para a TV ou o tablet da loja; para
              voltar, toque em <strong>Painel</strong>, no canto de cima).
            </>,
            <>
              <strong>Ajuda</strong>: Como usar, Guia da loja (esta página) e Instalar no celular.
            </>,
            <>
              <strong>Conta</strong>: Minha conta, Ver vitrine e Sair.
            </>,
          ]}
        />
        <P pequeno>Neste guia, “Menu › Acessos” quer dizer: toque em Menu e depois em Acessos.</P>
      </Secao>

      <Secao id="instalar" quem="Para todos">
        <P>
          Instalado, o painel ganha um ícone na tela inicial e abre como um app, sem a barra do navegador. Para ir de uma parte a
          outra, use o <strong>Menu</strong>.
        </P>
        <Subtitulo>Android (Chrome)</Subtitulo>
        <Passos
          itens={[
            "Entre no painel pelo Chrome.",
            <>
              Toque em <strong>Menu › Instalar no celular</strong> (também fica no fim da tela inicial do painel). Se o Chrome abrir
              a janela dele, toque em <strong>Instalar</strong>.
            </>,
            <>
              Se não abrir, toque nos <strong>três pontinhos ⋮</strong> do Chrome, depois em <strong>Instalar app</strong> (ou{" "}
              <strong>Adicionar à tela inicial</strong>) e confirme.
              <Print nome="instalar-android" alt="Janela Instalar no celular com os passos do Android." />
            </>,
          ]}
        />
        <Subtitulo>iPhone (Safari)</Subtitulo>
        <Passos
          itens={[
            <>
              Abra o painel no <strong>Safari</strong>. Em outro navegador não dá. <strong>Menu › Instalar no celular</strong> mostra
              estes mesmos passos.
            </>,
            <>
              Toque em <strong>Compartilhar</strong> (o quadrado com uma seta para cima).
            </>,
            <>
              Role e toque em <strong>Adicionar à Tela de Início</strong>. Depois, em <strong>Adicionar</strong>.
            </>,
            <>
              Abra o app pelo ícone novo e <strong>entre de novo</strong> com o seu e-mail e a sua senha. No iPhone, o app instalado
              não aproveita a entrada feita no Safari.
              <Print nome="instalar-iphone" alt="Janela Instalar no celular com os passos do iPhone." />
            </>,
          ]}
        />
      </Secao>

      <Secao id="todo-dia" quem="Para todos">
        <P>
          A vitrine mostra o que tem para pronta entrega hoje. Ela só sabe disso se alguém da loja <strong>salvar as quantidades do
          dia</strong>. Leva um minuto.
        </P>
        <Passos
          itens={[
            <>
              Abra o app do painel. A primeira tela é <strong>O que tem hoje</strong>. Se estiver em outra tela, toque em{" "}
              <strong>Menu › O que tem hoje</strong>.
            </>,
            <>
              Confira cada doce. Para mudar, toque no número e digite a quantidade. Para ajustes pequenos, use <strong>−</strong> e{" "}
              <strong>+</strong>.
            </>,
            <>
              Toque em <strong>Salvar o dia</strong>, embaixo. O botão diz quantos doces mudaram, e eles ficam com a borda dourada.
              Depois de salvar, ele fica cinza: “Tudo salvo · hoje 9:12”.
              <Print nome="hoje-salvar" alt="Lista O que tem hoje com dois doces de borda dourada e o botão Salvar o dia (2 doces mudaram)." />
            </>,
            <>
              Está tudo igual a ontem? Na faixa “Você ainda não salvou hoje”, toque em <strong>Está igual a ontem</strong>. Salva as
              mesmas quantidades num toque.
              <Print nome="hoje-lembrete" alt="Faixa Você ainda não salvou hoje, com o botão Está igual a ontem, e o resumo do dia." />
            </>,
          ]}
        />
        <Subtitulo>Acabou um doce durante o dia</Subtitulo>
        <Lista
          itens={[
            <>
              Toque em <strong>Esgotou</strong> no doce. A vitrine mostra “Esgotado” na hora, sem precisar de Salvar o dia. Tocou sem
              querer? Toque em <strong>Desfazer</strong>.
            </>,
            <>
              Vendeu algumas unidades? Diminua o número e toque em Salvar o dia. <strong>A quantidade não baixa sozinha</strong> com os
              pedidos.
            </>,
          ]}
        />
        <Print nome="hoje-esgotou" alt="Aviso Brigadeiro tradicional: esgotado. A vitrine já mostra, com o botão Desfazer." />
        <Subtitulo>O que a vitrine mostra</Subtitulo>
        <Lista
          itens={[
            <>
              <strong>Se ninguém salvou hoje</strong>, a vitrine não inventa: mostra “Pronta entrega · confirme no WhatsApp”, sem
              número. Quem compra ainda pode pedir, e você confirma na conversa.
            </>,
            <>
              <strong>Depois de salvar</strong>: “Tem hoje” (mais de 3), “Últimas unidades” (de 1 a 3) ou “Esgotado · Peça para
              amanhã” (zero). O número exato só aparece no painel.
            </>,
          ]}
        />
        <Print nome="vitrine-confirme" alt="Doce na vitrine com Pronta entrega · confirme no WhatsApp." />
        <Print nome="vitrine-hoje" alt="Doces na vitrine com Esgotado · Peça para amanhã e Tem hoje." />
        <Dica>
          Mexeu e não salvou? O painel guarda o que você mudou neste celular até você salvar. Se tentar sair, ele pergunta antes.
        </Dica>
      </Secao>

      <Secao id="doces" quem="Equipe e Administração">
        <P>
          Para um doce novo, toque em <strong>Menu › Cadastrar novo doce</strong> (ou no botão embaixo da lista do painel). Para
          mudar um doce, toque nele em O que tem hoje. A ficha tem estas partes:
        </P>
        <Passos
          itens={[
            <>
              <strong>Foto</strong>: toque em Adicionar foto (ou Trocar foto) e escolha da galeria ou tire na hora. A foto nova só vale
              depois de Salvar ficha. Antes disso, dá para desfazer.
            </>,
            <>
              <strong>Nome e preço</strong>: embaixo do preço aparece “Vai aparecer: R$ 9,00”. Confira. Preço vazio ou zero não salva.
              <Print nome="doce-foto-preco" alt="Ficha do doce: foto, nome, preço e a linha Vai aparecer: R$ 9,00." />
            </>,
            <>
              <strong>Sabores ou tamanhos</strong>: escreva o nome (Ninho, 350 ml…) e toque em Adicionar. Cada um pode ter o próprio
              preço. Vazio = preço do doce. Com preços diferentes, a vitrine mostra “a partir de”.
              <Print nome="doce-sabores" alt="Sabores Tradicional, Ninho (R$ 10,00) e Ninho com Nutella (R$ 11,00)." />
            </>,
            <>
              <strong>Alergênicos</strong>: toque no que o doce contém (leite, trigo, ovo, castanhas, amendoim, soja) ou em{" "}
              <strong>Nenhum destes</strong>. Sem marcar nada, a ficha pede para quem compra perguntar no WhatsApp. Os ingredientes da
              cozinha (em Dados da loja) aparecem sozinhos como “Pode conter”.
              <Print nome="doce-alergenicos" alt="Alergênicos com leite e trigo marcados." />
            </>,
            <>
              <strong>Composição, conservação e selo</strong>: o que vai no doce, como guardar e o selo Novo ou Mais vendido.
              “Últimas unidades” aparece sozinho.
              <Print nome="doce-mais" alt="Campos Composição e Conservação e o selo na vitrine." />
            </>,
            <>
              <strong>Sob encomenda</strong>: ligue para doce feito só quando alguém pede e escolha o prazo de preparo, em dias. A
              vitrine mostra “pronto a partir de”, pulando os dias em que a loja não abre. Doce sob encomenda não tem quantidade e
              nunca esgota.
            </>,
            <>
              <strong>Na vitrine</strong>: desligue para esconder o doce sem apagar. Ele vai para “Fora da vitrine”, no fim da lista
              do painel.
              <Print nome="doce-encomenda" alt="Chaves Sob encomenda e Na vitrine ligadas, com Prazo de preparo de 3 dias." />
            </>,
            <>
              Toque em <strong>Salvar ficha</strong>. O aviso diz se o doce já aparece na vitrine e, se não aparece, por quê.
            </>,
          ]}
        />
        <Atencao>
          Acabou um sabor hoje? <strong>Não apague nem mude o nome do sabor</strong>: quem já pôs na sacola perde esse item. A
          quantidade do dia é uma só para o doce todo.
        </Atencao>
        <Subtitulo>Destaque da vitrine</Subtitulo>
        <P>
          A <strong>estrela</strong> ao lado do doce, em O que tem hoje, escolhe o doce em destaque no alto da vitrine. Salva na
          hora. O destaque só aparece quando há 3 doces ou mais na vitrine.
        </P>
        <Subtitulo>Sair sem salvar?</Subtitulo>
        <P>
          Mudou alguma coisa e tocou em Voltar ou em outra parte do Menu? O app pergunta antes. <strong>Salvar e sair</strong> guarda tudo.{" "}
          <strong>Sair sem salvar</strong> joga fora o que mudou. O <strong>X</strong> volta para a ficha. Vale também para as
          campanhas e para O que tem hoje.
        </P>
        <Print nome="doce-sair-sem-salvar" alt="Janela Sair sem salvar? com os botões Salvar e sair e Sair sem salvar." />
      </Secao>

      <Secao id="campanhas" quem="Equipe e Administração">
        <P>
          A campanha põe um banner no alto da vitrine e um filtro com os doces dela. Ela entra e sai da vitrine sozinha, nas datas
          escolhidas.
        </P>
        <Passos
          itens={[
            <>
              Toque em <strong>Menu › Campanhas</strong>. Em Criar campanha, toque na data (Natal, Páscoa…) ou em{" "}
              <strong>Outra data</strong>. Se a campanha já existe, o botão diz “Já criada · abrir”.
              <Print nome="campanhas-modelos" alt="Datas prontas: Natal, Páscoa, Dia das Mães, Dia dos Namorados, Dia do Chocolate, Dia dos Pais e Outra data." />
            </>,
            <>
              Confira o nome e as datas: <strong>Começa em</strong>, <strong>Termina em</strong> e{" "}
              <strong>Último dia para encomendar</strong>. A frase do banner tem até 60 letras. O prazo (“Encomende até 20/12”,
              “Faltam 3 dias…”) aparece sozinho embaixo dela.
              <Print nome="campanha-datas" alt="Campanha Natal Mone com início, fim, último dia para encomendar e frase do banner." />
            </>,
            <>
              Em <strong>Doces da campanha</strong>, marque os doces. Doce feito só para a campanha: na ficha dele, escolha “Só em
              campanhas” e marque a campanha. Ele só aparece enquanto a campanha estiver no ar.
            </>,
            <>
              Veja a prévia em “Como aparece na vitrine” e toque em <strong>Salvar campanha</strong>.
              <Print nome="campanha-doces" alt="Lista de doces da campanha com três marcados e a prévia do banner de Natal." estreito />
            </>,
            <>
              Para tirar do ar antes do fim, desligue a chave do cartão da campanha. O app pergunta antes. Para voltar, ligue de novo.
              <Print nome="campanhas-lista" alt="Cartão da campanha Natal Mone no ar, com a chave ligada e o botão Editar campanha." />
            </>,
          ]}
        />
        <Dica>
          Depois do último dia para encomendar, os doces sob encomenda só da campanha não entram mais na sacola. Quem compra vê
          “Encomendas encerradas” e pode perguntar no WhatsApp.
        </Dica>
      </Secao>

      <Secao id="pedidos" quem="Equipe e Administração">
        <P>
          Os pedidos não ficam no app: chegam no WhatsApp da loja, com o recibo pronto. <strong>Enviar a mensagem é fazer o
          pedido</strong>, e ele só vale depois que a loja responde confirmando.
        </P>
        <Subtitulo>Como quem compra faz o pedido</Subtitulo>
        <Passos
          itens={[
            <>
              Na vitrine, abre o doce, escolhe quantos de cada sabor e toca em <strong>Adicionar</strong>.
              <Print nome="pedido-ficha" alt="Ficha da palha italiana com 1 de cada sabor e o botão Adicionar 3 · R$ 30,00." />
            </>,
            <>
              Abre a <strong>Sacola</strong>, confere os doces e o total e escreve o nome, se quiser.
              <Print nome="pedido-sacola" alt="Sacola com palha italiana, bolo de pote e brownie, e o total de R$ 62,00." estreito />
            </>,
            <>
              Toca em <strong>Enviar pedido no WhatsApp</strong>. O WhatsApp abre com o recibo escrito, e a pessoa toca em enviar.
              <Print nome="pedido-enviar" alt="Botão verde Enviar pedido no WhatsApp, embaixo da sacola." />
            </>,
          ]}
        />
        <Subtitulo>Como o recibo chega</Subtitulo>
        <div className="flex flex-col gap-2 rounded-[20px] bg-[#0b141a] p-3.5">
          <span className="text-xs text-creme-400">Exemplo de mensagem no WhatsApp da loja</span>
          <BalaoDoPedido mensagem={RECIBO} recebido className="mr-6" />
        </div>
        <P>
          O <strong>número do pedido</strong> (4 números) é o que vocês usam na conversa. O total é só dos doces: a entrega, se
          tiver, é combinada à parte.
        </P>
        <Subtitulo>Quando chega um pedido</Subtitulo>
        <Passos
          itens={[
            <>
              Responda <strong>em cima da mensagem do pedido</strong> (deslize a mensagem para a direita) com a resposta{" "}
              <strong>/recebi</strong>.
            </>,
            "Combine na conversa: retirada ou entrega, dia, horário e pagamento.",
            <>
              Confirme com <strong>/confirmado</strong>, repetindo o número e o total. Essa resposta é o comprovante da loja.
            </>,
            <>
              Vai pagar por Pix? Mande <strong>/pix</strong>.
            </>,
            <>
              Depois de confirmar, baixe a quantidade em <strong>O que tem hoje</strong> (ou toque em Esgotou). A quantidade não
              baixa sozinha.
            </>,
          ]}
        />
        <Subtitulo>Mudar ou cancelar</Subtitulo>
        <Lista
          itens={[
            "Quem compra pede na mesma conversa. O app tem botões com a mensagem pronta, por exemplo “Quero cancelar o pedido nº 4821”.",
            "Mudou alguma coisa? Confirme de novo, com o total novo.",
            <>
              Cancelou? Responda com <strong>/cancelado</strong>. Se você já tinha baixado a quantidade, aumente de novo em O que tem
              hoje.
            </>,
            "Apagar a mensagem no WhatsApp não cancela o pedido: vale o que foi combinado na conversa.",
          ]}
        />
        <Subtitulo>Dicas</Subtitulo>
        <Lista
          itens={[
            <>
              Para ver todos os pedidos do app, busque <strong>Pedido nº</strong> na lupa do WhatsApp.
            </>,
            "Para responder, deslize a mensagem do pedido para a direita: sua resposta fica presa ao pedido.",
            "Se o mesmo número de pedido chegar duas vezes, vale a última mensagem.",
            "Loja fechada? A vitrine avisa “Fechado no momento”, mas o pedido pode chegar. Responda quando abrir.",
          ]}
        />

        <section id="respostas" aria-labelledby="titulo-respostas" className="flex scroll-mt-4 flex-col gap-3">
          <Subtitulo id="titulo-respostas">Respostas prontas</Subtitulo>
          <P>
            Toque em <strong>Copiar</strong> e cole na conversa, ou guarde como resposta rápida (veja abaixo). Antes de enviar, troque
            o <strong>____</strong> e o que está entre [colchetes] pelo número do pedido, o total, o dia ou a chave Pix.
          </P>
          {RESPOSTAS.map((r) => (
            <div key={r.atalho} className={cx(cartao, "flex flex-col gap-2.5 p-4")}>
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-base font-bold text-dourado">{r.atalho}</span>
                <span className="text-[13px] text-creme-400">{r.quando}</span>
              </div>
              <p className="rounded-xl bg-creme/[0.05] px-3.5 py-3 text-[15px] leading-relaxed whitespace-pre-line select-all">{r.texto}</p>
              <BotaoCopiar texto={r.texto} nome={r.atalho} />
            </div>
          ))}
        </section>

        <Subtitulo>Etiquetas sugeridas</Subtitulo>
        <ul className="flex flex-wrap gap-2" aria-label="Etiquetas sugeridas">
          {ETIQUETAS.map((e) => (
            <li key={e} className="rounded-full border border-dourado/25 bg-creme/[0.04] px-3.5 py-1.5 text-sm font-semibold text-creme-200">
              {e}
            </li>
          ))}
        </ul>
        <P>
          Ponha a etiqueta na conversa de cada pedido. Depois, filtre as conversas pela etiqueta para ver, por exemplo, o que já
          foi confirmado e ainda não foi entregue.
        </P>

        <Subtitulo>Respostas rápidas no WhatsApp Business</Subtitulo>
        <Passos
          itens={[
            <>
              Use o <strong>WhatsApp Business</strong> no número da loja. É grátis e mantém o número e as conversas.
            </>,
            <>
              Abra <strong>Ferramentas comerciais › Respostas rápidas</strong>. No Android, fica no menu <strong>⋮</strong>; no
              iPhone, em <strong>Configurações</strong>.
            </>,
            <>
              Toque em <strong>+</strong>. Cole o texto (use o botão Copiar acima) e escreva o atalho, por exemplo{" "}
              <strong>recebi</strong>. Salve.
            </>,
            <>
              Na conversa, digite <strong>/</strong> e escolha a resposta. Troque os ____ antes de enviar.
            </>,
            <>
              As etiquetas ficam em <strong>Ferramentas comerciais › Etiquetas</strong>. Para etiquetar, toque e segure a conversa.
            </>,
          ]}
        />
        <P pequeno>O nome dos menus pode mudar um pouco com a versão do WhatsApp.</P>
      </Secao>

      <Secao id="loja" quem="Só Administração">
        <P>O que você muda aqui aparece na hora na vitrine.</P>
        <Passos
          itens={[
            <>
              Toque em <strong>Menu › Dados da loja</strong>.
            </>,
            <>
              <strong>WhatsApp da loja</strong>: o número que recebe os pedidos e as conversas do app. Escreva com DDD. Toque em{" "}
              <strong>Testar</strong> para abrir a conversa e conferir.
            </>,
            <>
              <strong>Horário de atendimento</strong>: em cada dia, ligue (Aberto) e escolha a hora de abrir e de fechar, ou desligue
              (Fechado). A vitrine mostra “Aberto agora · até 18h” ou “Fechado · abre amanhã às 9h”, e as encomendas pulam os dias
              fechados. Com todos os dias desligados, a vitrine não mostra horário.
              <Print nome="loja-whatsapp" alt="Dados da loja: WhatsApp da loja e horário de segunda e terça, das 09:00 às 18:00." />
            </>,
            <>
              <strong>Retirada, entrega e pagamento</strong>: textos curtos que só informam (por exemplo, “Pix ou dinheiro”). Vazio =
              não aparece. O combinado de verdade é no WhatsApp.
            </>,
            <>
              <strong>Ingredientes usados na cozinha</strong>: marque tudo o que entra em alguma receita. As fichas mostram “Pode conter
              traços de…”. Com <strong>trigo</strong> marcado (a palha leva biscoito), nenhum doce aparece como “Sem glúten”.
              <Print nome="loja-textos" alt="Retirada, Entrega, Pagamento e os ingredientes da cozinha com leite e trigo marcados." />
            </>,
            <>
              Toque em <strong>Salvar dados da loja</strong>.
            </>,
          ]}
        />
        <Dica>Férias ou feriado? Desligue os dias em que a loja não abre e ligue de novo na volta.</Dica>
      </Secao>

      <Secao id="acessos" quem="Só Administração">
        <Subtitulo>Dar acesso a alguém</Subtitulo>
        <Passos
          itens={[
            <>
              Toque em <strong>Menu › Acessos</strong>.
            </>,
            "Em Adicionar pessoa, escreva o nome e o e-mail. Qualquer e-mail serve: Gmail, Hotmail, iCloud…",
            <>
              Escolha o que a pessoa pode fazer e toque em <strong>Dar acesso</strong>.
              <Print nome="acessos-adicionar" alt="Adicionar pessoa: nome Duda, e-mail duda@exemplo.com, Estoque escolhido e o botão Dar acesso." />
            </>,
            <>
              O app mostra a <strong>senha provisória</strong>, que vale 7 dias. Ela só aparece agora: toque em{" "}
              <strong>Mandar convite pelo WhatsApp</strong> e escolha a pessoa. O convite já vai com o link para entrar, o e-mail e a senha.
              <Print nome="acessos-convite" alt="Cartão Senha provisória de Duda, com os botões Mandar convite pelo WhatsApp e Copiar." />
            </>,
            <>
              No primeiro acesso, a pessoa cria a própria senha (veja{" "}
              <a href="#primeiro-acesso" className="font-bold text-dourado underline underline-offset-4">
                Primeiro acesso
              </a>
              ). Até lá, o cartão dela diz que ainda não entrou.
            </>,
          ]}
        />
        <div className={cx(cartao, "flex flex-col p-1.5")}>
          {PAPEIS.map((p) => (
            <div key={p.nome} className="flex flex-col gap-0.5 border-b border-dourado/8 px-3 py-2.5 last:border-b-0">
              <span className="text-[15px] font-bold">{p.nome}</span>
              <span className="text-[13px] text-creme-400">{p.faz}</span>
            </div>
          ))}
        </div>
        <Subtitulo>Alguém esqueceu a senha</Subtitulo>
        <Passos
          itens={[
            "A pessoa pede pelo WhatsApp (na tela de entrar tem o botão Esqueci a senha).",
            <>
              Em <strong>Menu › Acessos</strong>, no cartão dela, toque em <strong>Gerar senha nova</strong> e confirme. Mande a senha provisória pelo WhatsApp.
              A senha antiga para de valer e a pessoa sai dos outros aparelhos.
              <Print nome="acessos-pessoa" alt="Cartão da Bia, da Equipe, com os botões Administração, Equipe, Estoque, Gerar senha nova e a lixeira." />
            </>,
          ]}
        />
        <Subtitulo>Mudar ou tirar o acesso</Subtitulo>
        <Lista
          itens={[
            "Para mudar o que a pessoa pode fazer, toque em Administração, Equipe ou Estoque no cartão dela. Dar Administração pede confirmação.",
            "Para tirar o acesso, toque na lixeira do cartão e confirme. Vale na hora: a pessoa não entra mais.",
          ]}
        />
        <Subtitulo>Tenha 2 pessoas na Administração</Subtitulo>
        <P>Assim, se uma esquecer a senha, a outra gera uma senha nova. O painel nunca fica sem Administração.</P>
        <Print nome="acessos-recomendado" alt="Aviso: Recomendado ter 2 pessoas na Administração." />
      </Secao>

      <Secao id="conta" quem="Para todos">
        <P>
          Toque em <strong>Menu › Minha conta</strong> (ou no seu nome, no alto da tela inicial do painel).
        </P>
        <Lista
          itens={[
            <>
              <strong>Trocar senha</strong>: digite a senha atual e a nova (pelo menos 8 letras ou números). Os outros aparelhos saem
              e pedem a senha nova.
            </>,
            <>
              <strong>Sair deste celular</strong>: sai só daqui. Também fica em <strong>Menu › Sair</strong>.
            </>,
            <>
              <strong>Sair de todos os aparelhos</strong>: use se perdeu o celular ou entrou no aparelho de outra pessoa.
            </>,
            <>
              <strong>Seu nome</strong>: aparece no alto do painel e mostra quem salvou o dia (“por Ana”).
            </>,
          ]}
        />
        <Print nome="conta" alt="Minha conta: Trocar senha, Sair deste celular e Sair de todos os aparelhos." />
        <Subtitulo>Esqueci a senha</Subtitulo>
        <Passos
          itens={[
            <>
              Na tela de entrar (abra o app e toque no ícone de pessoa, no alto da vitrine), toque em <strong>Esqueci a senha</strong>.
            </>,
            <>
              Escreva o seu e-mail e toque em <strong>Pedir pelo WhatsApp</strong>. Abre a conversa com a loja, com a mensagem pronta.
            </>,
            "A administração gera uma senha nova e manda para você. Entre com ela e crie a sua senha de novo.",
          ]}
        />
        <Print nome="esqueci" alt="Tela Esqueci a senha, com o campo de e-mail e o botão Pedir pelo WhatsApp." />
      </Secao>

      <Secao id="ajuda" quem="Para todos">
        <P>
          Alguma coisa não funcionou ou ficou uma dúvida? <strong>Fale com a administração da loja</strong> pelo WhatsApp. Conte o
          que você tentou fazer e, se puder, mande um print da tela.
        </P>
        <P>Se for problema do site (fora do ar, erro estranho), a administração avisa quem cuida do site.</P>
        <div className="flex flex-col gap-2.5">
          <Link
            href="/painel"
            className="flex h-12 items-center justify-center rounded-full border border-dourado/40 text-[15px] font-bold text-dourado active:scale-[0.98]"
          >
            Abrir o painel
          </Link>
          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-full border border-dourado/25 text-[15px] font-bold text-creme-200 active:scale-[0.98]"
          >
            Ver a vitrine
          </Link>
        </div>
      </Secao>
    </main>
  );
}

function Numero({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-dourado/15 text-sm font-bold text-dourado">
      {children}
    </span>
  );
}

function Secao({ id, quem, children }: { id: IdSecao; quem: string; children: ReactNode }) {
  const numero = SECOES.findIndex((s) => s.id === id) + 1;
  const { titulo } = SECOES[numero - 1];
  return (
    <section id={id} aria-labelledby={`titulo-${id}`} className="flex scroll-mt-4 flex-col gap-4 border-t border-dourado/12 pt-7">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold tracking-[0.12em] text-creme-400 uppercase">
          Parte {numero} · {quem}
        </span>
        <h2 id={`titulo-${id}`} className="font-display text-[26px] leading-tight font-semibold">
          {titulo}
        </h2>
      </div>
      {children}
      <a href="#indice" className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-creme-400 underline underline-offset-4">
        Voltar ao índice
      </a>
    </section>
  );
}

function Subtitulo({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="pt-2 text-lg leading-snug font-bold text-creme">
      {children}
    </h3>
  );
}

function P({ pequeno, children }: { pequeno?: boolean; children: ReactNode }) {
  return <p className={cx("leading-relaxed text-creme-200", pequeno ? "text-[13px] text-creme-400" : "text-[15px]")}>{children}</p>;
}

// Passo a passo numerado. O print de um passo vai dentro dele, embaixo do texto.
function Passos({ itens }: { itens: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-creme-200">
          <Numero>{i + 1}</Numero>
          <div className="min-w-0 grow pt-0.5 [&_img]:mt-3 [&_strong]:text-creme">{item}</div>
        </li>
      ))}
    </ol>
  );
}

function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2.5 pl-5 text-[15px] leading-relaxed text-creme-200 marker:text-dourado [&_strong]:text-creme">
      {itens.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Dica({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-pessego/30 bg-pessego/[0.08] p-4 text-[15px] leading-relaxed text-pessego [&_strong]:text-creme">
      <IconeAjuda tamanho={20} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

// Print de uma tela do app (public/guia/<nome>.jpg). estreito: para os prints muito altos.
function Print({ nome, alt, estreito }: { nome: keyof typeof PRINTS; alt: string; estreito?: boolean }) {
  const [largura, altura] = PRINTS[nome];
  return (
    <Image
      src={`/guia/${nome}.jpg`}
      alt={alt}
      width={largura}
      height={altura}
      className={cx(
        "mx-auto block h-auto w-full rounded-2xl border border-dourado/15 bg-cacau-950 shadow-[0_8px_24px_rgb(0_0_0/0.35)]",
        estreito ? "max-w-[260px]" : "max-w-[340px]",
      )}
    />
  );
}

// Aviso de cuidado (algo que dá problema se for feito).
function Atencao({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-rosa/40 bg-rosa/[0.08] p-4 text-[15px] leading-relaxed text-rosa [&_strong]:text-creme">
      <IconeAlerta tamanho={20} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
