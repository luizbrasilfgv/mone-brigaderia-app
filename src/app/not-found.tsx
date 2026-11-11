import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="font-display text-3xl font-semibold">Esse doce não está aqui</h1>
      <p className="text-creme-200">O endereço pode ter mudado ou o doce saiu da vitrine.</p>
      <Link href="/" className="flex h-12 items-center rounded-full bg-dourado px-6 font-bold text-cacau-900">
        Ver a vitrine
      </Link>
    </main>
  );
}
