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

export const IconePessoas = (p: Props) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
    <path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
  </Base>
);

export const IconeAjuda = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
    <path d="M12 17h.01" />
  </Base>
);

export const IconeLixo = (p: Props) => (
  <Base {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
  </Base>
);

export const IconeCelular = (p: Props) => (
  <Base {...p}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
    <path d="M10.5 18.5h3" />
  </Base>
);

export const IconeCompartilhar = (p: Props) => (
  <Base {...p}>
    <path d="M12 15V3" />
    <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
    <path d="M7 11H5.5v10h13V11H17" />
  </Base>
);

export const IconeFechar = (p: Props) => (
  <Base strokeWidth={2} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);

export const IconePessoa = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
  </Base>
);

export const IconeChave = (p: Props) => (
  <Base {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 9-9" />
    <path d="m16 7 3 3" />
  </Base>
);

export const IconeCopiar = (p: Props) => (
  <Base {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
  </Base>
);
