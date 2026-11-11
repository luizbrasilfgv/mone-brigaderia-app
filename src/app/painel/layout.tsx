// O painel ainda não tem login. Antes de publicar, proteja /painel (ex.: Supabase Auth
// + proxy.ts) para que só a dona e a equipe entrem. Veja docs/proximos-passos.md.
export default function LayoutPainel({ children }: LayoutProps<"/painel">) {
  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <p className="bg-pessego px-5 py-2 text-center text-xs font-semibold text-cacau-900">
        Painel em modo demonstração: as alterações ainda não ficam salvas.
      </p>
      {children}
    </div>
  );
}
