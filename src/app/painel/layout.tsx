// O acesso ao painel é barrado pelo src/proxy.ts e conferido de novo em cada ação de salvar.
export default function LayoutPainel({ children }: LayoutProps<"/painel">) {
  return <div className="mx-auto min-h-dvh max-w-md">{children}</div>;
}
