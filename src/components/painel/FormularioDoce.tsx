"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { Campanha, Categoria, Doce, OndeAparece, Selo } from "@/lib/tipos";
import { useHoje } from "@/lib/hooks";
import { estoqueDoDoce, formatarData, formatarPreco, situacaoCampanha, type SituacaoCampanha } from "@/lib/regras";
import { ImagemDoce } from "../ImagemDoce";
import { IconeMais } from "../Icones";
import { COR_ESTOQUE, COR_SELO, botaoPrimario, campo, cartao, cx, escolha, rotulo } from "../ui";
import { salvarDoce } from "@/app/painel/acoes";
import { CabecalhoPainel, Chave, Contador, FaixaDemo, tentar, useAviso } from "./comum";

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

function SimNao({ valor, aoMudar, rotulo: nome }: { valor: boolean; aoMudar: (v: boolean) => void; rotulo: string }) {
  return (
    <div role="group" aria-label={nome} className="flex items-center justify-between gap-3">
      <span className="text-[15px] font-semibold">{nome}</span>
      <div className="flex gap-1.5">
        {[true, false].map((opcao) => (
          <button
            key={String(opcao)}
            type="button"
            aria-pressed={valor === opcao}
            onClick={() => aoMudar(opcao)}
            className={cx("h-11 w-16 rounded-xl", escolha(valor === opcao))}
          >
            {opcao ? "Sim" : "Não"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FormularioDoce({
  doce,
  categorias,
  campanhas,
  demo,
}: {
  doce: Doce | null;
  categorias: Categoria[];
  campanhas: Campanha[];
  demo: boolean;
}) {
  const hoje = useHoje();
  const router = useRouter();
  const [aviso, , mostrarResultado] = useAviso();
  const [salvando, iniciar] = useTransition();
  const [nome, setNome] = useState(doce?.nome ?? "");
  const [categoriaId, setCategoriaId] = useState(doce?.categoriaId ?? categorias[0]?.id ?? "");
  const [preco, setPreco] = useState(doce ? (doce.precoCentavos / 100).toFixed(2).replace(".", ",") : "");
  const [unidade, setUnidade] = useState(doce?.unidade ?? "por unidade");
  const [descricao, setDescricao] = useState(doce?.descricao ?? "");
  const [sabores, setSabores] = useState<string[]>(doce?.sabores.map((s) => s.nome) ?? []);
  const [novoSabor, setNovoSabor] = useState("");
  const [contemGluten, setContemGluten] = useState(doce?.contemGluten ?? true);
  const [contemLactose, setContemLactose] = useState(doce?.contemLactose ?? true);
  const [composicao, setComposicao] = useState(doce?.composicao ?? "");
  const [conservacao, setConservacao] = useState(doce?.conservacao ?? "");
  const [selo, setSelo] = useState<Selo>(doce?.selo ?? "nenhum");
  const [onde, setOnde] = useState<OndeAparece>(doce?.ondeAparece ?? "ano_todo");
  const [campanhaIds, setCampanhaIds] = useState<string[]>(doce?.campanhaIds ?? []);
  const [sobEncomenda, setSobEncomenda] = useState(doce?.sobEncomenda ?? false);
  const [prazo, setPrazo] = useState(doce?.prazoDias ?? 2);
  const [quantidade, setQuantidade] = useState(doce?.quantidadeHoje ?? 0);
  const [fotoNova, setFotoNova] = useState<{ url: string; blob: Blob } | null>(null);
  const [ativo, setAtivo] = useState(doce?.ativo ?? true);
  const [preparandoFoto, setPreparandoFoto] = useState(false);

  const campanhasAtivas = campanhas.filter((c) => !hoje || situacaoCampanha(c, hoje) !== "encerrada");
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

  // Rascunho com os valores do formulário, para a prévia usar as mesmas regras da vitrine.
  const rascunho: Doce = {
    id: doce?.id ?? "novo",
    categoriaId,
    nome: nome || "Nome do doce",
    descricao,
    precoCentavos: centavos(preco),
    unidade,
    contemGluten,
    contemLactose,
    composicao,
    conservacao,
    selo,
    sobEncomenda,
    prazoDias: sobEncomenda ? prazo : null,
    ondeAparece: onde,
    destaque: doce?.destaque ?? false,
    ativo,
    quantidadeHoje: quantidade,
    sabores: sabores.map((s, i) => ({ id: String(i), nome: s })),
    fotos: fotoNova ? [] : (doce?.fotos ?? []),
    ilustracao: doce?.ilustracao ?? null,
    campanhaIds,
  };
  const estoque = estoqueDoDoce(rascunho);
  const seloTexto = SELOS.find((s) => s.valor === selo && s.valor !== "nenhum")?.nome;

  function adicionarSabor() {
    const limpo = novoSabor.trim();
    if (limpo && !sabores.includes(limpo)) setSabores([...sabores, limpo]);
    setNovoSabor("");
  }

  function salvar(e: FormEvent) {
    e.preventDefault();
    const dados = new FormData();
    dados.set("id", doce?.id ?? "");
    dados.set("nome", nome);
    dados.set("categoriaId", categoriaId);
    dados.set("precoCentavos", String(centavos(preco)));
    dados.set("unidade", unidade);
    dados.set("descricao", descricao);
    dados.set("sabores", JSON.stringify(sabores));
    dados.set("contemGluten", contemGluten ? "1" : "0");
    dados.set("contemLactose", contemLactose ? "1" : "0");
    dados.set("composicao", composicao);
    dados.set("conservacao", conservacao);
    dados.set("selo", selo);
    dados.set("ondeAparece", onde);
    dados.set("campanhaIds", JSON.stringify(campanhaIds));
    dados.set("sobEncomenda", sobEncomenda ? "1" : "0");
    dados.set("prazoDias", String(prazo));
    dados.set("quantidade", String(quantidade));
    dados.set("ativo", ativo ? "1" : "0");
    if (fotoNova) dados.set("foto", fotoNova.blob, "foto.jpg");
    const enviar = () =>
      iniciar(async () => {
        const resultado = await tentar(() => salvarDoce(dados));
        mostrarResultado(resultado, enviar);
        if (resultado.ok && resultado.id && !doce) router.replace(`/painel/doces/${resultado.id}`);
      });
    enviar();
  }

  return (
    <form onSubmit={salvar} className="pb-28">
      {aviso}
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
            <label className="flex size-[104px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed border-dourado/40 bg-creme/[0.03] text-xs font-bold text-dourado">
              <IconeMais />
              Adicionar foto
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const arquivo = e.target.files?.[0];
                  if (!arquivo) return;
                  setPreparandoFoto(true);
                  const blob = await reduzirFoto(arquivo);
                  if (fotoNova) URL.revokeObjectURL(fotoNova.url);
                  setFotoNova({ url: URL.createObjectURL(blob), blob });
                  setPreparandoFoto(false);
                }}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="nome" className={rotulo}>
            Nome do doce
          </label>
          <input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} className={cx(campo, "h-12")} />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="preco" className={rotulo}>
              Preço
            </label>
            <div className={cx(campo, "flex h-12 items-center gap-2")}>
              <span className="text-creme-400">R$</span>
              <input
                id="preco"
                inputMode="decimal"
                placeholder="0,00"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="h-11 min-w-0 grow bg-transparent outline-none"
              />
            </div>
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

        <div className="flex flex-col gap-2.5">
          <span className={rotulo}>Sabores ou tamanhos</span>
          <div className="flex flex-wrap gap-2">
            {sabores.map((s) => (
              <span
                key={s}
                className="inline-flex h-10 items-center gap-0.5 rounded-xl border border-dourado/20 bg-creme/[0.06] pl-3.5 text-sm font-semibold"
              >
                {s}
                <button
                  type="button"
                  aria-label={`Remover ${s}`}
                  onClick={() => setSabores(sabores.filter((x) => x !== s))}
                  className="size-9 text-lg text-creme-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
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
        </div>

        <div className={cx(cartao, "flex flex-col gap-3.5 p-4")}>
          <SimNao rotulo="Contém glúten?" valor={contemGluten} aoMudar={setContemGluten} />
          <div className="h-px bg-dourado/12" />
          <SimNao rotulo="Contém lactose?" valor={contemLactose} aoMudar={setContemLactose} />
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
              const situacao = hoje ? situacaoCampanha(c, hoje) : null;
              return (
                <label key={c.id} className="flex min-h-14 cursor-pointer items-center gap-3 border-b border-dourado/8 py-2 pr-3.5">
                  <span className="w-[5px] self-stretch" style={{ background: c.cor }} />
                  <span className="flex min-w-0 grow flex-col gap-0.5">
                    <span className="text-sm font-semibold">{c.nome}</span>
                    <span className={cx("text-[11px]", situacao === "no_ar" ? "text-menta" : "text-creme-400")}>
                      {formatarData(c.inicio)} a {formatarData(c.fim)}
                      {situacao && ` · ${ROTULO_SITUACAO[situacao]}`}
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
              valor={prazo}
              minimo={1}
              maximo={30}
              rotulo="prazo de preparo"
              texto={`${prazo} ${prazo === 1 ? "dia" : "dias"}`}
              aoMudar={setPrazo}
            />
          </div>
        ) : (
          <div className={cx(cartao, "flex items-center justify-between gap-3 py-3 pr-2.5 pl-4")}>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">Quantidade hoje</span>
              <span className={cx("text-xs", COR_ESTOQUE[estoque.tom])}>
                {estoque.disponivel ? "Aparece na vitrine" : "Aparece como esgotado"}
              </span>
            </div>
            <Contador valor={quantidade} rotulo="quantidade de hoje" aoMudar={setQuantidade} />
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
          <div className={cx(cartao, "flex gap-3 rounded-[22px] p-2.5")}>
            <div className="fundo-vitrine relative size-24 shrink-0 overflow-hidden rounded-2xl">
              {fotoNova ? (
                <Image src={fotoNova.url} alt="" fill unoptimized className="object-cover" />
              ) : (
                <ImagemDoce doce={rascunho} tamanhos="96px" />
              )}
              {seloTexto && (
                <span
                  className={cx(
                    "absolute top-1.5 left-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-cacau-900",
                    COR_SELO[seloTexto],
                  )}
                >
                  {seloTexto}
                </span>
              )}
            </div>
            <div className="flex min-w-0 grow flex-col gap-1">
              <span className="text-[15px] leading-tight font-semibold">{rascunho.nome}</span>
              <span
                className={cx(
                  "self-start rounded-full border px-2 py-0.5 text-[11px] font-bold",
                  contemGluten ? "border-rosa/45 text-rosa" : "border-dourado/40 text-dourado",
                )}
              >
                {contemGluten ? "Contém glúten" : "Sem glúten"}
              </span>
              <span className={cx("text-[11px] font-semibold", COR_ESTOQUE[estoque.tom])}>{estoque.texto}</span>
              <span className="mt-auto font-display text-[19px] font-semibold text-dourado">
                {formatarPreco(rascunho.precoCentavos)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-24 max-w-md items-center border-t border-dourado/14 bg-cacau-950/90 px-5 pt-3.5 pb-6 backdrop-blur-lg">
        <button type="submit" disabled={salvando || preparandoFoto} className={cx(botaoPrimario, "disabled:opacity-60")}>
          {preparandoFoto ? "Preparando a foto…" : salvando ? "Salvando…" : "Salvar ficha"}
        </button>
      </div>
    </form>
  );
}
