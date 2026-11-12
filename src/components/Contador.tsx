import { IconeLixo, IconeMais, IconeMenos } from "./Icones";
import { cx } from "./ui";

// Contador − n + de quem compra (ficha e sacola): botões de 44 × 44 com 8 px entre eles.
// No limite, o + fica com aria-disabled (continua focável; quem chama explica o motivo).
// lixeira: com 1 unidade, o − vira "tirar da sacola".
export function Contador({
  nome,
  valor,
  aoMudar,
  minimo = 0,
  noLimite,
  lixeira,
  idMais,
  rotulos,
  naBarra,
}: {
  // "Ninho": vira "Menos Ninho", "Mais Ninho" e "Ninho: 2" para o leitor de tela.
  nome: string;
  valor: number;
  aoMudar: (valor: number) => void;
  minimo?: number;
  noLimite: boolean;
  lixeira?: { rotulo: string; aoTirar: () => void };
  idMais?: string;
  // No lugar de "Menos …" e "Mais …" (ex.: contador da barra da ficha).
  rotulos?: { menos: string; mais: string };
  // Dentro da pílula da barra da ficha: sem contorno nos botões.
  naBarra?: boolean;
}) {
  const tirar = lixeira && valor <= 1;
  const contorno = !naBarra;
  return (
    <div className={cx("flex shrink-0 items-center", naBarra ? "gap-0" : "gap-2")}>
      <button
        type="button"
        aria-label={tirar ? lixeira.rotulo : (rotulos?.menos ?? `Menos ${nome}`)}
        aria-disabled={!tirar && valor <= minimo}
        onClick={() => (tirar ? lixeira.aoTirar() : valor > minimo && aoMudar(valor - 1))}
        className={cx(
          "flex size-11 items-center justify-center rounded-full active:scale-95",
          contorno && "border border-dourado/22",
          !tirar && valor <= minimo && "opacity-40",
        )}
      >
        {tirar ? <IconeLixo tamanho={18} /> : <IconeMenos tamanho={18} />}
      </button>
      <span className={cx("min-w-6 text-center text-base font-bold", valor === 0 && "text-creme-400")}>
        <span aria-hidden="true">{valor}</span>
        <span className="sr-only">
          {nome}: {valor}
        </span>
      </span>
      <button
        type="button"
        id={idMais}
        aria-label={rotulos?.mais ?? `Mais ${nome}`}
        aria-disabled={noLimite}
        onClick={() => !noLimite && aoMudar(valor + 1)}
        className={cx(
          "flex size-11 items-center justify-center rounded-full active:scale-95",
          contorno && "border border-dourado/40 text-dourado",
          noLimite && "opacity-40",
        )}
      >
        <IconeMais tamanho={18} />
      </button>
    </div>
  );
}
