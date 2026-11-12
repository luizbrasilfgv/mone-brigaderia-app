"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition, type FormEvent } from "react";
import type { Campanha, Categoria, Doce, OndeAparece, Selo } from "@/lib/tipos";
import { useHoje } from "@/lib/hooks";
import { TRACOS, type Traco } from "@/lib/loja";
import {
  campanhasNoAr,
  contagemDeHoje,
  estoqueDoDoce,
  formatarData,
  formatarDiaMes,
  formatarPreco,
  semGluten,
  seloDoDoce,
  situacaoCampanha,
  type SituacaoCampanha,
} from "@/lib/regras";
import { ImagemDoce } from "../ImagemDoce";
import { IconeMais } from "../Icones";
import { CartaoDoce } from "../vitrine/CartaoDoce";
import { COR_ESTOQUE, barraFixa, botaoPrimario, campo, cartao, cx, escolha, rotulo } from "../ui";
import { salvarDoce } from "@/app/painel/acoes";
import {
  AvisoNaoSalvo,
  CabecalhoPainel,
  Chave,
  Contador,
  FaixaDemo,
  avisarNaProximaTela,
  tentar,
  useAlteracoesPendentes,
  useAviso,
  useConfirmacao,
  useErroDeCampo,
  useReiniciarAoSair,
} from "./comum";

const SELOS: { valor: Selo; nome: string }[] = [
  { valor: "nenhum", nome: "Nenhum" },
  { valor: "novo", nome: "Novo" },
  { valor: "mais_vendido", nome: "Mais vendido" },
];

const ROTULO_SITUACAO: Record<SituacaoCampanha, string> = {
  no_ar: "No ar",
  pausada: "Pausada",
  agendada: "Agendada",
  rascunho: "Rascunho",
  encerrada: "Encerrada",
};

// Lê preço escrito de qualquer jeito: "12,50", "12.50", "1.250,00" ou "9". O último
// ponto ou vírgula seguido de 1 ou 2 dígitos são os centavos.
function centavos(texto: string): number {
  const limpo = texto.replace(/[^\d.,]/g, "");
  const partes = limpo.match(/^(.*?)[.,](\d{1,2})$/);
  const reais = (partes ? partes[1] : limpo).replace(/[.,]/g, "") || "0";
  const valor = Number(`${reais}.${partes ? partes[2].padEnd(2, "0") : "00"}`);
  return Number.isFinite(valor) ? Math.round(valor * 100) : 0;
}

function juntar(nomes: string[]): string {
  return nomes.length <= 1 ? (nomes[0] ?? "") : `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}`;
}

// Reduz a foto no celular antes de enviar (lado maior com até 1600 px, em JPEG).
async function reduzirFoto(arquivo: File): Promise<Blob> {
  try {
    const imagem = await createImageBitmap(arquivo);
    const escala = Math.min(1, 1600 / Math.max(imagem.width, imagem.height));
    const tela = document.createElement("canvas");
    tela.width = Math.round(imagem.width * escala);
    tela.height = Math.round(imagem.height * escala);
    tela.getContext("2d")!.drawImage(imagem, 0, 0, tela.width, tela.height);
    const blob = await new Promise<Blob | null>((ok) => tela.toBlob(ok, "image/jpeg", 0.85));
    return blob ?? arquivo;
  } catch {
    return arquivo;
  }
}

// "9,00" a partir de centavos (campo de preço).
function emReais(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

interface LinhaSabor {
  // Só para a lista do React (não vai para o banco).
  chave: number;
  nome: string;
  // Texto do campo "Preço (opcional)". Vazio = preço do doce.
  preco: string;
}

interface Props {
  doce: Doce | null;
  categorias: Categoria[];
  campanhas: Campanha[];
  hoje: string;
  // Ingredientes da cozinha (Dados da loja), para a prévia do "Sem glúten".
  tracos: Traco[];
  demo: boolean;
}

// O Next guarda a tela escondida ao navegar (Activity). Depois de "Sair sem salvar" ou de
// criar o doce, o formulário volta ao estado inicial com uma key nova.
export function FormularioDoce(props: Props) {
  const [versao, setVersao] = useState(0);
  const reiniciar = useCallback(() => setVersao((v) => v + 1), []);
  return <Formulario key={versao} {...props} reiniciar={reiniciar} />;
}

function Formulario({ doce, categorias, campanhas, hoje: hojeDoServidor, tracos, demo, reiniciar }: Props & { reiniciar: () => void }) {
  const hoje = useHoje(hojeDoServidor);
  const router = useRouter();
  const [aviso, mostrar, mostrarResultado] = useAviso();
  const [confirmacao, perguntar] = useConfirmacao();
  const erroCampo = useErroDeCampo();
  const reiniciarAoSair = useReiniciarAoSair(reiniciar);
  const [salvando, iniciar] = useTransition();
  const [nome, setNome] = useState(doce?.nome ?? "");
  const [categoriaId, setCategoriaId] = useState(doce?.categoriaId ?? categorias[0]?.id ?? "");
  const [preco, setPreco] = useState(doce ? emReais(doce.precoCentavos) : "");
  const [unidade, setUnidade] = useState(doce?.unidade ?? "por unidade");
  const [descricao, setDescricao] = useState(doce?.descricao ?? "");
  const [sabores, setSabores] = useState<LinhaSabor[]>(
    () => doce?.sabores.map((s, i) => ({ chave: i, nome: s.nome, preco: s.precoCentavos != null ? emReais(s.precoCentavos) : "" })) ?? [],
  );
  const [novoSabor, setNovoSabor] = useState("");
  // Doce novo começa "não informado" (null), nunca "sem".
  const [alergenicos, setAlergenicos] = useState<Traco[] | null>(doce?.alergenicos ?? null);
  const [composicao, setComposicao] = useState(doce?.composicao ?? "");
  const [conservacao, setConservacao] = useState(doce?.conservacao ?? "");
  const [selo, setSelo] = useState<Selo>(doce?.selo ?? "nenhum");
  const [onde, setOnde] = useState<OndeAparece>(doce?.ondeAparece ?? "ano_todo");
  const [campanhaIds, setCampanhaIds] = useState<string[]>(doce?.campanhaIds ?? []);
  const [sobEncomenda, setSobEncomenda] = useState(doce?.sobEncomenda ?? false);
  const [prazo, setPrazo] = useState(doce?.prazoDias ?? 2);
  const [quantidade, setQuantidade] = useState(doce?.quantidadeHoje ?? 0);
  // Salvar a ficha só grava a quantidade se a pessoa mexeu nela (ou num doce novo).
  const [mexeuQuantidade, setMexeuQuantidade] = useState(false);
  const [fotoNova, setFotoNova] = useState<{ url: string; blob: Blob } | null>(null);
  const campoFoto = useRef<HTMLInputElement>(null);
  const [ativo, setAtivo] = useState(doce?.ativo ?? true);
  const [preparandoFoto, setPreparandoFoto] = useState(false);

  // Retrato do formulário, para saber se há alterações não salvas.
  const retratoCom = (lista: LinhaSabor[], saborPendente: string) =>
    JSON.stringify([
      nome, categoriaId, preco, unidade, descricao, lista.map((s) => [s.nome, s.preco]), saborPendente, alergenicos,
      composicao, conservacao, selo, onde, [...campanhaIds].sort(), sobEncomenda, prazo, quantidade, ativo,
    ]);
  const retrato = retratoCom(sabores, novoSabor.trim());
  const [retratoSalvo, setRetratoSalvo] = useState(retrato);
  const sujo = retrato !== retratoSalvo || fotoNova !== null;
  const precoCentavos = centavos(preco);
  const temFoto = fotoNova !== null || (doce?.fotos.length ?? 0) > 0;

  const campanhasAtivas = campanhas.filter((c) => situacaoCampanha(c, hoje) !== "encerrada");
  const nomesEscolhidos = campanhas.filter((c) => campanhaIds.includes(c.id)).map((c) => c.nome);
  const semCampanha = onde === "so_campanhas" && nomesEscolhidos.length === 0;
  const resumoCampanhas =
    onde === "ano_todo"
      ? nomesEscolhidos.length
        ? `Fica na vitrine o ano todo e também aparece em: ${juntar(nomesEscolhidos)}.`
        : "Fica na vitrine o ano todo. Não está em nenhuma campanha."
      : semCampanha
        ? "Marque pelo menos uma campanha, senão o doce não aparece na vitrine."
        : `Só aparece na vitrine durante: ${juntar(nomesEscolhidos)}. Fora delas, some sozinho.`;

  const saboresValidos = sabores.filter((s) => s.nome.trim());
  // Rascunho com os valores do formulário, para a prévia usar as mesmas regras da vitrine.
  const rascunho: Doce = {
    id: doce?.id ?? "novo",
    categoriaId,
    nome: nome || "Nome do doce",
    descricao,
    precoCentavos: centavos(preco),
    unidade,
    alergenicos,
    composicao,
    conservacao,
    selo,
    sobEncomenda,
    prazoDias: sobEncomenda ? prazo : null,
    ondeAparece: onde,
    destaque: doce?.destaque ?? false,
    ativo,
    quantidadeHoje: quantidade,
    dataQuantidade: hoje,
    sabores: saboresValidos.map((s) => ({ id: String(s.chave), nome: s.nome.trim(), ...(s.preco.trim() && { precoCentavos: centavos(s.preco) }) })),
    fotos: fotoNova ? [fotoNova.url] : (doce?.fotos ?? []),
    ilustracao: doce?.ilustracao ?? null,
    campanhaIds,
  };
  const estoque = estoqueDoDoce(rascunho, hoje);

  function adicionarSabor() {
    const limpo = novoSabor.trim();
    if (limpo && !sabores.some((s) => s.nome.trim().toLowerCase() === limpo.toLowerCase())) {
      setSabores([...sabores, { chave: Math.max(-1, ...sabores.map((s) => s.chave)) + 1, nome: limpo, preco: "" }]);
    }
    setNovoSabor("");
  }

  function mudarSabor(chave: number, mudanca: Partial<LinhaSabor>) {
    setSabores((lista) => lista.map((s) => (s.chave === chave ? { ...s, ...mudanca } : s)));
  }

  // Marcar um ingrediente sai de "não informado"; desmarcar o último volta para lá.
  function alternarAlergenico(t: Traco) {
    const atual = alergenicos ?? [];
    const novo = atual.includes(t) ? atual.filter((x) => x !== t) : TRACOS.filter((x) => x === t || atual.includes(x));
    setAlergenicos(novo.length > 0 ? novo : null);
  }

  function trocarFoto(nova: { url: string; blob: Blob } | null) {
    if (fotoNova) URL.revokeObjectURL(fotoNova.url);
    setFotoNova(nova);
    // Deixa escolher o mesmo arquivo de novo depois de "Desfazer".
    if (!nova && campoFoto.current) campoFoto.current.value = "";
  }

  function erro(campo: string, texto: string): false {
    erroCampo.marcar(campo, texto);
    mostrar(texto, false);
    return false;
  }

  // O servidor diz o campo pela posição do sabor; na tela, cada linha tem a sua chave.
  function campoNaTela(campo: string, lista: LinhaSabor[]): string {
    const sabor = /^(preco-)?sabor-(\d+)$/.exec(campo);
    if (!sabor) return campo;
    const linha = lista.filter((s) => s.nome.trim())[Number(sabor[2])];
    return linha ? `${sabor[1] ?? ""}sabor-${linha.chave}` : "novo-sabor";
  }

  // Confere, pergunta o que precisa e salva. sair: a pessoa está saindo da tela ("Salvar e
  // sair"); o aviso de salvo aparece na próxima. Devolve true quando salvou.
  async function salvarFicha(sair: boolean): Promise<boolean> {
    erroCampo.limpar();
    // Sabor digitado e não adicionado também vai.
    const pendente = novoSabor.trim();
    const lista =
      pendente && !sabores.some((s) => s.nome.trim().toLowerCase() === pendente.toLowerCase())
        ? [...sabores, { chave: Math.max(-1, ...sabores.map((s) => s.chave)) + 1, nome: pendente, preco: "" }]
        : sabores;
    if (lista !== sabores || pendente) {
      setSabores(lista);
      setNovoSabor("");
    }
    const validos = lista.filter((s) => s.nome.trim());

    if (!nome.trim()) return erro("nome", "Escreva o nome do doce.");
    if (precoCentavos <= 0) return erro("preco", "Coloque o preço do doce.");
    const repetido = validos.find((s, i) => validos.findIndex((x) => x.nome.trim().toLowerCase() === s.nome.trim().toLowerCase()) !== i);
    if (repetido) return erro(`sabor-${repetido.chave}`, `O sabor "${repetido.nome.trim()}" aparece duas vezes.`);
    const precoRuim = validos.find((s) => s.preco.trim() && centavos(s.preco) <= 0);
    if (precoRuim) return erro(`preco-sabor-${precoRuim.chave}`, `Confira o preço de ${precoRuim.nome.trim()}, ou deixe vazio para usar o preço do doce.`);

    if (
      !doce &&
      ativo &&
      !fotoNova &&
      !(await perguntar({
        titulo: "Publicar sem foto?",
        texto: "O doce aparece na vitrine com um desenho no lugar da foto. Dá para pôr a foto depois, em Editar doce.",
        confirmar: "Publicar sem foto",
      }))
    ) {
      return false;
    }
    if (
      onde === "so_campanhas" &&
      campanhaIds.length === 0 &&
      !(await perguntar({
        titulo: "Esse doce não vai aparecer",
        texto: "Ele está em “Só em campanhas”, mas nenhuma campanha está marcada. Salvar mesmo assim?",
        confirmar: "Salvar mesmo assim",
      }))
    ) {
      return false;
    }

    const dados = new FormData();
    dados.set("id", doce?.id ?? "");
    dados.set("nome", nome);
    dados.set("categoriaId", categoriaId);
    dados.set("precoCentavos", String(precoCentavos));
    dados.set("unidade", unidade);
    dados.set("descricao", descricao);
    dados.set(
      "sabores",
      JSON.stringify(validos.map((s) => ({ nome: s.nome.trim(), precoCentavos: s.preco.trim() ? centavos(s.preco) : null }))),
    );
    dados.set("alergenicos", JSON.stringify(alergenicos));
    dados.set("composicao", composicao);
    dados.set("conservacao", conservacao);
    dados.set("selo", selo);
    dados.set("ondeAparece", onde);
    dados.set("campanhaIds", JSON.stringify(campanhaIds));
    dados.set("sobEncomenda", sobEncomenda ? "1" : "0");
    dados.set("prazoDias", String(prazo));
    if (!doce || mexeuQuantidade) dados.set("quantidade", String(quantidade));
    dados.set("ativo", ativo ? "1" : "0");
    if (fotoNova) dados.set("foto", fotoNova.blob, "foto.jpg");
    // O retrato do que foi enviado (com o sabor pendente já na lista).
    const enviado = retratoCom(lista, "");

    return new Promise((pronto) => {
      const enviar = () =>
        iniciar(async () => {
          const resultado = await tentar(() => salvarDoce(dados));
          if (!resultado.ok) {
            mostrarResultado(resultado, enviar);
            if (resultado.campo) erroCampo.marcar(campoNaTela(resultado.campo, lista), resultado.mensagem);
            return pronto(false);
          }
          setRetratoSalvo(enviado);
          setMexeuQuantidade(false);
          trocarFoto(null);
          // Doce novo também troca de tela (vai para a ficha dele): o aviso vai junto.
          if (sair || !doce) avisarNaProximaTela(resultado.mensagem);
          else mostrarResultado(resultado);
          if (!doce) {
            // Da próxima vez, "Cadastrar novo doce" começa em branco.
            reiniciarAoSair();
            if (!sair && resultado.id) router.replace(`/painel/doces/${resultado.id}`);
          }
          pronto(true);
        });
      enviar();
    });
  }

  function salvar(e: FormEvent) {
    e.preventDefault();
    void salvarFicha(false);
  }

  const saida = useAlteracoesPendentes(sujo, { salvar: () => salvarFicha(true), descartar: reiniciarAoSair });

  return (
    <form onSubmit={salvar} noValidate className="pb-[calc(8rem+env(safe-area-inset-bottom))]">
      {aviso}
      {confirmacao}
      {saida}
      <FaixaDemo demo={demo} />
      <CabecalhoPainel
        titulo={doce ? "Editar doce" : "Novo doce"}
        subtitulo="O que você escrever aqui aparece na vitrine"
        voltar="/painel"
      />

      <div className="flex flex-col gap-5 px-5 pt-3.5 pb-7">
        <div className="flex flex-col gap-2.5">
          <span className={rotulo}>Fotos</span>
          <div className="flex gap-2.5">
            <div className="fundo-vitrine relative size-[104px] overflow-hidden rounded-[18px] border-2 border-dourado">
              {fotoNova ? (
                <Image src={fotoNova.url} alt="Foto nova" fill unoptimized className="object-cover" />
              ) : (
                <ImagemDoce doce={rascunho} tamanhos="104px" />
              )}
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-cacau-900 px-2 py-0.5 text-[10px] font-bold text-dourado">
                Principal
              </span>
            </div>
            <label
              className={cx(
                "flex size-[104px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed border-dourado/40 bg-creme/[0.03] px-2 text-center text-xs font-bold text-dourado has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-dourado",
                erroCampo.classe("foto"),
              )}
            >
              <IconeMais />
              {temFoto ? "Trocar foto" : "Adicionar foto"}
              <input
                id="foto"
                ref={campoFoto}
                type="file"
                accept="image/*"
                className="sr-only"
                {...erroCampo.props("foto")}
                onChange={async (e) => {
                  const arquivo = e.target.files?.[0];
                  if (!arquivo) return;
                  erroCampo.limpar("foto");
                  setPreparandoFoto(true);
                  const blob = await reduzirFoto(arquivo);
                  trocarFoto({ url: URL.createObjectURL(blob), blob });
                  setPreparandoFoto(false);
                }}
              />
            </label>
          </div>
          {fotoNova && (
            <div className="flex items-center gap-2">
              <span role="status" className="rounded-full bg-dourado/14 px-3 py-1.5 text-xs font-bold text-dourado">
                Foto nova · toque em Salvar ficha
              </span>
              <button
                type="button"
                onClick={() => trocarFoto(null)}
                className="h-11 px-2 text-[13px] font-semibold text-creme-200 underline underline-offset-4"
              >
                Desfazer
              </button>
            </div>
          )}
          {erroCampo.texto("foto")}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="nome" className={rotulo}>
            Nome do doce
          </label>
          <input
            id="nome"
            required
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              erroCampo.limpar("nome");
            }}
            {...erroCampo.props("nome")}
            className={cx(campo, "h-12", erroCampo.classe("nome"))}
          />
          {erroCampo.texto("nome")}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="preco" className={rotulo}>
              Preço
            </label>
            <div className={cx(campo, "flex h-12 items-center gap-2 focus-within:outline-2 focus-within:outline-dourado", erroCampo.classe("preco"))}>
              <span className="text-creme-400">R$</span>
              <input
                id="preco"
                inputMode="decimal"
                placeholder="0,00"
                required
                value={preco}
                onChange={(e) => {
                  setPreco(e.target.value);
                  erroCampo.limpar("preco");
                }}
                {...erroCampo.props("preco")}
                aria-describedby={erroCampo.erro?.campo === "preco" ? "preco-erro" : "preco-previa"}
                className="h-11 min-w-0 grow bg-transparent outline-none"
              />
            </div>
            {erroCampo.texto("preco") ?? (
              <span id="preco-previa" aria-live="polite" className="text-xs text-creme-200">
                {precoCentavos > 0 ? `Vai aparecer: ${formatarPreco(precoCentavos)}` : "Coloque o preço do doce"}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="unidade" className={rotulo}>
              Vendido
            </label>
            <input id="unidade" value={unidade} onChange={(e) => setUnidade(e.target.value)} className={cx(campo, "h-12")} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="categoria" className={rotulo}>
            Categoria
          </label>
          <select
            id="categoria"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className={cx(campo, "h-12 [color-scheme:dark]")}
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="descricao" className={rotulo}>
            Descrição
          </label>
          <textarea
            id="descricao"
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={cx(campo, "resize-none py-3 leading-normal")}
          />
        </div>

        <div role="group" aria-labelledby="titulo-sabores" className="flex flex-col gap-2.5">
          <span id="titulo-sabores" className={rotulo}>
            Sabores ou tamanhos
          </span>
          <span className="text-xs leading-snug text-creme-200">
            Cada sabor ou tamanho tem seu preço. A quantidade do dia é uma só para todos.
          </span>
          {sabores.length > 0 && (
            <ul className={cx(cartao, "flex flex-col overflow-hidden")}>
              {sabores.map((s, i) => (
                <li key={s.chave} className="flex flex-col gap-1.5 border-b border-dourado/8 p-2.5 last:border-b-0">
                  <div className="flex items-end gap-2">
                    <div className="flex min-w-0 grow flex-col gap-1">
                      <label htmlFor={`sabor-${s.chave}`} className="text-xs font-semibold text-creme-400">
                        Sabor ou tamanho {i + 1}
                      </label>
                      <input
                        id={`sabor-${s.chave}`}
                        value={s.nome}
                        maxLength={80}
                        onChange={(e) => {
                          mudarSabor(s.chave, { nome: e.target.value });
                          erroCampo.limpar(`sabor-${s.chave}`);
                        }}
                        {...erroCampo.props(`sabor-${s.chave}`)}
                        className={cx(campo, "h-11", erroCampo.classe(`sabor-${s.chave}`))}
                      />
                    </div>
                    <div className="flex w-[118px] shrink-0 flex-col gap-1">
                      <label htmlFor={`preco-sabor-${s.chave}`} className="text-xs font-semibold text-creme-400">
                        Preço (opcional)
                      </label>
                      <div
                        className={cx(
                          campo,
                          "flex h-11 items-center gap-1.5 px-2.5 focus-within:outline-2 focus-within:outline-dourado",
                          erroCampo.classe(`preco-sabor-${s.chave}`),
                        )}
                      >
                        <span className="text-sm text-creme-400">R$</span>
                        <input
                          id={`preco-sabor-${s.chave}`}
                          inputMode="decimal"
                          placeholder={preco || "0,00"}
                          value={s.preco}
                          onChange={(e) => {
                            mudarSabor(s.chave, { preco: e.target.value });
                            erroCampo.limpar(`preco-sabor-${s.chave}`);
                          }}
                          {...erroCampo.props(`preco-sabor-${s.chave}`)}
                          className="h-10 min-w-0 grow bg-transparent outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remover ${s.nome || "este sabor"}`}
                      onClick={() => setSabores(sabores.filter((x) => x.chave !== s.chave))}
                      className="flex size-11 shrink-0 items-center justify-center text-lg text-creme-400"
                    >
                      ×
                    </button>
                  </div>
                  {erroCampo.texto(`sabor-${s.chave}`)}
                  {erroCampo.texto(`preco-sabor-${s.chave}`)}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              id="novo-sabor"
              aria-label="Novo sabor ou tamanho"
              placeholder="Ex.: Ninho com Nutella"
              value={novoSabor}
              onChange={(e) => setNovoSabor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  adicionarSabor();
                }
              }}
              className={cx(campo, "h-11")}
            />
            <button
              type="button"
              onClick={adicionarSabor}
              className="h-11 shrink-0 rounded-xl border-[1.5px] border-dashed border-dourado/40 px-3.5 text-sm font-bold text-dourado"
            >
              Adicionar
            </button>
          </div>
          <span className="text-xs leading-snug text-creme-400">
            Preço vazio = mesmo preço do doce. Acabou um sabor hoje? Não apague nem renomeie: quem já pôs na sacola perde esse item.
          </span>
        </div>

        <div role="group" aria-labelledby="titulo-alergenicos" className={cx(cartao, "flex flex-col gap-3 p-4")}>
          <span id="titulo-alergenicos" className="text-[15px] font-semibold">
            Alergênicos: o doce contém
          </span>
          <div className="flex flex-wrap gap-2">
            {TRACOS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={Boolean(alergenicos?.includes(t))}
                onClick={() => alternarAlergenico(t)}
                className={cx("h-11 rounded-full px-4 text-sm", escolha(Boolean(alergenicos?.includes(t))))}
              >
                {t}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={alergenicos !== null && alergenicos.length === 0}
              onClick={() => setAlergenicos(alergenicos !== null && alergenicos.length === 0 ? null : [])}
              className={cx("h-11 rounded-full px-4 text-sm", escolha(alergenicos !== null && alergenicos.length === 0))}
            >
              Nenhum destes
            </button>
          </div>
          <span className={cx("text-xs leading-snug", alergenicos === null ? "text-rosa" : "text-creme-200")}>
            {alergenicos === null
              ? "Não informado: a ficha pede para perguntar no WhatsApp antes de pedir. Marque o que o doce leva ou “Nenhum destes”."
              : alergenicos.length === 0
                ? "A ficha mostra que o doce não leva nenhum destes."
                : `A ficha mostra: “Contém: ${alergenicos.join(", ")}”.`}
            {tracos.length > 0 && ` Os traços da cozinha (${tracos.join(", ")}) aparecem sozinhos em “Pode conter”.`}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="composicao" className={rotulo}>
            Composição
          </label>
          <textarea
            id="composicao"
            rows={3}
            value={composicao}
            onChange={(e) => setComposicao(e.target.value)}
            className={cx(campo, "resize-none py-3 leading-normal")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="conservacao" className={rotulo}>
            Conservação
          </label>
          <textarea
            id="conservacao"
            rows={2}
            value={conservacao}
            onChange={(e) => setConservacao(e.target.value)}
            className={cx(campo, "resize-none py-3 leading-normal")}
          />
        </div>

        <div role="group" aria-label="Selo na vitrine" className="flex flex-col gap-2.5">
          <span className={rotulo}>Selo na vitrine</span>
          <div className="flex flex-wrap gap-2">
            {SELOS.map((s) => (
              <button
                key={s.valor}
                type="button"
                aria-pressed={selo === s.valor}
                onClick={() => setSelo(s.valor)}
                className={cx("h-11 rounded-full px-3.5 text-[13px]", escolha(selo === s.valor))}
              >
                {s.nome}
              </button>
            ))}
          </div>
          <span className="text-xs text-creme-400">&quot;Últimas unidades&quot; aparece sozinho quando restam 3 ou menos.</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={rotulo}>Campanhas</span>
          <div role="group" aria-label="Onde o doce aparece" className="grid grid-cols-2 gap-2">
            {(
              [
                { valor: "ano_todo", nome: "O ano todo", sub: "Fica sempre no cardápio" },
                { valor: "so_campanhas", nome: "Só em campanhas", sub: "Some quando elas acabam" },
              ] as const
            ).map((o) => (
              <button
                key={o.valor}
                type="button"
                aria-pressed={onde === o.valor}
                onClick={() => setOnde(o.valor)}
                className={cx("flex flex-col items-start gap-0.5 rounded-2xl px-3.5 py-3 text-left", escolha(onde === o.valor))}
              >
                <span className="text-sm font-bold text-creme">{o.nome}</span>
                <span className="text-xs font-normal text-creme-400">{o.sub}</span>
              </button>
            ))}
          </div>
          <div className={cx(cartao, "flex flex-col overflow-hidden")}>
            {campanhasAtivas.map((c) => {
              const situacao = situacaoCampanha(c, hoje);
              return (
                <label key={c.id} className="flex min-h-14 cursor-pointer items-center gap-3 border-b border-dourado/8 py-2 pr-3.5">
                  <span className="w-[5px] self-stretch" style={{ background: c.cor }} />
                  <span className="flex min-w-0 grow flex-col gap-0.5">
                    <span className="text-sm font-semibold">{c.nome}</span>
                    <span className={cx("text-[11px]", situacao === "no_ar" ? "text-menta" : "text-creme-400")}>
                      {formatarData(c.inicio)} a {formatarData(c.fim)}
                      {` · ${ROTULO_SITUACAO[situacao]}`}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={campanhaIds.includes(c.id)}
                    onChange={() =>
                      setCampanhaIds((ids) => (ids.includes(c.id) ? ids.filter((x) => x !== c.id) : [...ids, c.id]))
                    }
                    className="size-[22px] shrink-0 accent-dourado"
                  />
                </label>
              );
            })}
          </div>
          <span className={cx("text-xs leading-snug", semCampanha ? "text-rosa" : "text-creme-200")}>{resumoCampanhas}</span>
        </div>

        <div className={cx(cartao, "flex items-center justify-between gap-3 py-3 pr-2 pl-4")}>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[15px] font-semibold">Sob encomenda</span>
            <span className="text-xs text-creme-400">Para doce que só é feito quando alguém pede</span>
          </div>
          <Chave ligada={sobEncomenda} aoMudar={() => setSobEncomenda(!sobEncomenda)} rotulo="Sob encomenda" />
        </div>

        {sobEncomenda ? (
          <div className="flex items-center justify-between gap-3 rounded-[20px] border border-pessego/30 bg-cacau-900 py-3 pr-2.5 pl-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">Prazo de preparo</span>
              <span className="text-xs text-pessego">Sem quantidade: nunca fica esgotado</span>
            </div>
            <Contador
              id="prazo"
              valor={prazo}
              minimo={1}
              maximo={30}
              rotulo="prazo de preparo"
              texto={`${prazo} ${prazo === 1 ? "dia" : "dias"}`}
              aoMudar={setPrazo}
            />
          </div>
        ) : (
          <div className={cx(cartao, "flex items-center justify-between gap-3 py-3 pr-2.5 pl-4", erroCampo.classe("quantidade"))}>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">Quantidade hoje</span>
              <span className={cx("text-xs", COR_ESTOQUE[estoque.tom])}>
                {estoque.disponivel ? "Aparece na vitrine" : "Aparece como esgotado"}
              </span>
              {doce && !mexeuQuantidade && !contagemDeHoje(doce, hoje) && doce.dataQuantidade && (
                <span className="text-xs text-creme-400">Última contagem: {formatarDiaMes(doce.dataQuantidade)}</span>
              )}
            </div>
            <Contador
              id="quantidade"
              valor={quantidade}
              maximo={9999}
              rotulo="Quantidade de hoje"
              aoMudar={(v) => {
                setQuantidade(v);
                setMexeuQuantidade(true);
              }}
            />
          </div>
        )}

        <div className={cx(cartao, "flex items-center justify-between gap-3 py-3 pr-2 pl-4")}>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[15px] font-semibold">Na vitrine</span>
            <span className={cx("text-xs", ativo ? "text-menta" : "text-creme-400")}>
              {ativo ? "Aparece na vitrine" : "Escondido: só aparece aqui no painel"}
            </span>
          </div>
          <Chave ligada={ativo} aoMudar={() => setAtivo(!ativo)} rotulo="Doce na vitrine" />
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={rotulo}>Como aparece na vitrine</span>
          <CartaoDoce
            doce={rascunho}
            estoque={estoque}
            selo={seloDoDoce(rascunho, campanhasNoAr(campanhas, hoje), hoje)}
            semGluten={semGluten(rascunho, tracos)}
            dicaEsgotado="Peça para amanhã"
            previa
          />
        </div>
      </div>

      <div className={cx(barraFixa, "flex-col gap-1.5")}>
        <AvisoNaoSalvo sujo={sujo} />
        <button type="submit" disabled={salvando || preparandoFoto} className={cx(botaoPrimario, "disabled:opacity-60")}>
          {preparandoFoto ? "Preparando a foto…" : salvando ? "Salvando…" : "Salvar ficha"}
        </button>
      </div>
    </form>
  );
}
