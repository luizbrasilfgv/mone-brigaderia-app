import type { CSSProperties } from "react";
import type { Ilustracao, SaborIlustracao } from "@/lib/tipos";

// Desenhos provisórios dos doces, feitos só com CSS, usados até chegarem as fotos.
// Todas as medidas são em % para o desenho acompanhar o tamanho do quadro.

const bolo = (cor: string, miolo: string) =>
  `radial-gradient(circle, ${miolo} 0 14%, rgba(0,0,0,0) 18%) 0 0 / 14% 34%, ${cor}`;
const fruta = (cor: string, ponto: string) =>
  `radial-gradient(circle, ${ponto} 0 16%, rgba(0,0,0,0) 20%) 0 0 / 20% 70%, ${cor}`;

const baunilha = bolo("#E8C68E", "rgba(160,100,45,0.35)");
const cacau = bolo("#5B2E1C", "rgba(20,8,4,0.4)");

type Camada = [altura: string, fundo: string];

const CAMADAS: Partial<Record<SaborIlustracao, Camada[]>> = {
  morango: [
    ["22%", baunilha],
    ["17%", "#FFF6EA"],
    ["11%", fruta("#D3413A", "#F5A89F")],
    ["20%", baunilha],
    ["19%", "#FFF6EA"],
    ["11%", fruta("#D3413A", "#F5A89F")],
  ],
  prestigio: [
    ["22%", cacau],
    ["18%", fruta("#F8F1E7", "#FFFFFF")],
    ["20%", cacau],
    ["18%", fruta("#F8F1E7", "#FFFFFF")],
    ["12%", "#3A190F"],
    ["10%", fruta("#FBF7F0", "#E9DCC8")],
  ],
  maracuja: [
    ["22%", baunilha],
    ["18%", "#F5D06A"],
    ["20%", baunilha],
    ["18%", "#F5D06A"],
    ["22%", fruta("#E3A82F", "#3A2410")],
  ],
  natal: [
    ["22%", baunilha],
    ["16%", "#C98B4A"],
    ["20%", baunilha],
    ["18%", "#FFF6EA"],
    ["12%", "#C98B4A"],
    ["12%", fruta("#8A5A33", "#C9A27A")],
  ],
};

const CHOCOLATE = {
  background:
    "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.28), rgba(255,255,255,0) 38%), radial-gradient(circle, #1A0904 0 22%, rgba(0,0,0,0) 28%) 0 0 / 11% 11%, radial-gradient(circle, #2E150B 0 20%, rgba(0,0,0,0) 26%) 5% 6% / 13% 13%, #4A2416",
  boxShadow: "inset -5px -7px 12px rgba(0,0,0,0.45)",
} satisfies CSSProperties;

const NINHO = {
  background:
    "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.6), rgba(255,255,255,0) 40%), radial-gradient(circle, #FFFFFF 0 24%, rgba(255,255,255,0) 30%) 0 0 / 12% 12%, #E8D6BD",
  boxShadow: "inset -5px -7px 12px rgba(140,95,50,0.35)",
} satisfies CSSProperties;

const abs = (estilo: CSSProperties): CSSProperties => ({ position: "absolute", ...estilo });

function Pote({ sabor }: { sabor: SaborIlustracao }) {
  const camadas = CAMADAS[sabor] ?? CAMADAS.morango!;
  return (
    <>
      <div
        style={abs({
          left: "21%",
          top: "13%",
          width: "58%",
          height: "11%",
          borderRadius: "18% / 40%",
          background: "linear-gradient(180deg, #EBCB96 0%, #C59B5F 55%, #9C7340 100%)",
          boxShadow: "0 3px 0 rgba(0,0,0,0.18)",
        })}
      />
      <div
        style={abs({
          left: "24%",
          top: "23%",
          width: "52%",
          height: "67%",
          borderRadius: "12% / 8%",
          overflow: "hidden",
          background: "rgba(255,255,255,0.35)",
          boxShadow:
            "inset 0 0 0 2px rgba(255,255,255,0.85), 0 0 0 1px rgba(70,40,25,0.18), inset -8px 0 14px rgba(0,0,0,0.12)",
        })}
      >
        <div style={abs({ left: 0, right: 0, bottom: 0, height: "86%", display: "flex", flexDirection: "column-reverse" })}>
          {camadas.map(([altura, fundo], i) => (
            <div key={i} style={{ flexShrink: 0, height: altura, background: fundo }} />
          ))}
        </div>
        <div
          style={abs({
            left: "9%",
            top: "6%",
            width: "9%",
            height: "82%",
            borderRadius: 999,
            background: "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.08))",
          })}
        />
      </div>
    </>
  );
}

function Brigadeiros({ sabor }: { sabor: SaborIlustracao }) {
  const trio =
    sabor === "ninho" ? [NINHO, NINHO, NINHO] : sabor === "chocolate" ? [CHOCOLATE, CHOCOLATE, CHOCOLATE] : [NINHO, CHOCOLATE, CHOCOLATE];
  const posicoes = [
    { left: "33%", top: "14%" },
    { left: "13%", top: "40%" },
    { left: "53%", top: "40%" },
  ];
  return (
    <>
      {posicoes.map((pos, i) => (
        <div key={i} style={abs({ ...pos, width: "34%", height: "40%" })}>
          <div style={abs({ left: "8%", top: 0, width: "84%", aspectRatio: "1 / 1", borderRadius: "50%", ...trio[i] })} />
          <div
            style={abs({
              left: 0,
              bottom: 0,
              width: "100%",
              height: "40%",
              clipPath: "polygon(0 0, 100% 0, 86% 100%, 14% 100%)",
              background: "repeating-linear-gradient(90deg, #C9A46A 0 7%, #A57D49 7% 14%)",
            })}
          />
        </div>
      ))}
    </>
  );
}

function Caixa({ sabor }: { sabor: SaborIlustracao }) {
  const natal = sabor === "natal";
  return (
    <div
      style={abs({
        left: "17%",
        top: "15%",
        width: "66%",
        height: "66%",
        boxSizing: "border-box",
        padding: "9%",
        borderRadius: "8%",
        background: natal ? "#8E2424" : "#3B1A12",
        boxShadow: "0 10px 20px rgba(40,18,10,0.35), inset 0 0 0 3px #C9A46A",
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "8%",
      })}
    >
      {natal && (
        <>
          <span style={abs({ left: "47.5%", top: 0, width: "5%", height: "100%", background: "#D9B26F" })} />
          <span style={abs({ top: "47.5%", left: 0, height: "5%", width: "100%", background: "#D9B26F" })} />
        </>
      )}
      {[CHOCOLATE, NINHO, NINHO, CHOCOLATE].map((bola, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            background: "repeating-conic-gradient(#C9A46A 0 9deg, #A57D49 9deg 18deg)",
          }}
        >
          <div style={abs({ inset: "13%", borderRadius: "50%", ...bola })} />
        </div>
      ))}
    </div>
  );
}

export function IlustracaoDoce({ ilustracao }: { ilustracao: Ilustracao }) {
  return (
    <div aria-hidden="true" style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", overflow: "hidden" }}>
      <div
        style={abs({
          left: "14%",
          bottom: "7%",
          width: "72%",
          height: "10%",
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(60,30,18,0.38), rgba(60,30,18,0))",
        })}
      />
      {ilustracao.tipo === "pote" && <Pote sabor={ilustracao.sabor} />}
      {ilustracao.tipo === "brigadeiro" && <Brigadeiros sabor={ilustracao.sabor} />}
      {ilustracao.tipo === "caixa" && <Caixa sabor={ilustracao.sabor} />}
    </div>
  );
}
