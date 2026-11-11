import { readFile } from "node:fs/promises";
import path from "node:path";
import { NOME_DE_FOTO_VALIDO, pastaDeFotos } from "@/lib/fotos";

const TIPO: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

// Entrega as fotos enviadas pelo painel (pasta UPLOAD_DIR).
export async function GET(_pedido: Request, contexto: RouteContext<"/fotos/[arquivo]">) {
  const { arquivo } = await contexto.params;
  if (!NOME_DE_FOTO_VALIDO.test(arquivo)) return new Response("Foto não encontrada", { status: 404 });
  try {
    const conteudo = await readFile(path.join(pastaDeFotos(), arquivo));
    return new Response(new Uint8Array(conteudo), {
      headers: {
        "Content-Type": TIPO[arquivo.split(".").pop()!],
        // O nome muda a cada envio, então a foto pode ficar guardada no navegador.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Foto não encontrada", { status: 404 });
  }
}
