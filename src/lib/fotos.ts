import "server-only";
import path from "node:path";

// Fotos enviadas pelo painel ficam numa pasta fora do código (UPLOAD_DIR), para
// não sumirem quando o app é publicado de novo.

export function pastaDeFotos(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

export const TIPOS_DE_FOTO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;

export const NOME_DE_FOTO_VALIDO = /^[a-z0-9-]+\.(jpg|png|webp)$/;
