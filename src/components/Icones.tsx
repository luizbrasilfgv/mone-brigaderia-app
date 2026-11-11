import type { SVGProps } from "react";

// Ícones de traço, no mesmo estilo do mockup.
type Props = SVGProps<SVGSVGElement> & { tamanho?: number };

function Base({ tamanho = 22, children, ...resto }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...resto}
    >
      {children}
    </svg>
  );
}

export const IconeCasa = (p: Props) => (
  <Base {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20h14V9.5" />
    <path d="M10 20v-6h4v6" />
  </Base>
);

export const IconeCoracao = (p: Props) => (
  <Base {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </Base>
);

export const IconeConversa = (p: Props) => (
  <Base {...p}>
    <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19l-4 1z" />
  </Base>
);

export const IconeVoltar = (p: Props) => (
  <Base strokeWidth={2} {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Base>
);

export const IconeSeta = (p: Props) => (
  <Base strokeWidth={2} {...p}>
    <path d="m9 5 7 7-7 7" />
  </Base>
);

export const IconeMais = (p: Props) => (
  <Base strokeWidth={2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconeMenos = (p: Props) => (
  <Base strokeWidth={2} {...p}>
    <path d="M5 12h14" />
  </Base>
);

export const IconeEstrela = (p: Props) => (
  <Base {...p}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />
  </Base>
);

export const IconeRelogio = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Base>
);

export const IconeCaixa = (p: Props) => (
  <Base {...p}>
    <path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" />
    <path d="M3 8l9 5 9-5" />
    <path d="M12 13v8" />
  </Base>
);

export const IconeAlerta = (p: Props) => (
  <Base strokeWidth={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6" />
    <path d="M12 16.5v.5" />
  </Base>
);

export const IconeCheck = (p: Props) => (
  <Base strokeWidth={2.2} {...p}>
    <path d="m5 12 5 5 9-10" />
  </Base>
);

export const IconeCalendario = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Base>
);

export const IconeLoja = (p: Props) => (
  <Base {...p}>
    <path d="M4 9h16l-1.5-4h-13L4 9z" />
    <path d="M5 9v11h14V9" />
    <path d="M9.5 20v-5h5v5" />
  </Base>
);
