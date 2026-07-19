import { useEffect } from "react";

/**
 * Bascule la balise <meta name="robots"> en "noindex, nofollow" tant que la page
 * est affichée, puis restaure la valeur d'origine.
 *
 * À utiliser sur toute page privée ou contenant des données client (factures
 * partagées, connexion, administration) : robots.txt empêche l'exploration,
 * ceci empêche l'indexation même si l'URL fuite via un lien externe.
 */
export function useNoIndex() {
  useEffect(() => {
    const tag = document.querySelector('meta[name="robots"]');
    if (!tag) return;
    const previous = tag.getAttribute("content");
    tag.setAttribute("content", "noindex, nofollow");
    return () => {
      if (previous !== null) tag.setAttribute("content", previous);
    };
  }, []);
}
