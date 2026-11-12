import Image from "next/image";
import type { Doce } from "@/lib/tipos";
import { IlustracaoDoce } from "./IlustracaoDoce";

// Foto do doce quando existe; senão, o desenho provisório. Ocupa um quadrado.
// decorativa: dentro de um link que já diz o nome do doce (alt vazio).
export function ImagemDoce({
  doce,
  tamanhos = "50vw",
  prioridade = false,
  decorativa = false,
}: {
  doce: Pick<Doce, "nome" | "fotos" | "ilustracao">;
  tamanhos?: string;
  prioridade?: boolean;
  decorativa?: boolean;
}) {
  const foto = doce.fotos[0];
  if (foto) {
    return (
      <div className="relative aspect-square w-full">
        <Image src={foto} alt={decorativa ? "" : doce.nome} fill sizes={tamanhos} priority={prioridade} className="object-cover" />
      </div>
    );
  }
  if (doce.ilustracao) return <IlustracaoDoce ilustracao={doce.ilustracao} />;
  return <div className="aspect-square w-full" aria-hidden="true" />;
}
