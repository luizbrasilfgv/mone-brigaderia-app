// Copia um texto (pedido, link do doce). Em endereço sem HTTPS o navigator.clipboard não
// existe: cai no jeito antigo, com um campo escondido. false = não deu para copiar.
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Segue para o jeito antigo.
  }
  try {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    const deu = document.execCommand("copy");
    campo.remove();
    return deu;
  } catch {
    return false;
  }
}
