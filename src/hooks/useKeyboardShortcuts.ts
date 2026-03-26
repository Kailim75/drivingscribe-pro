import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;
      // Skip if any modifier key is held (except for specific combos)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "n": navigate("/planning"); break;
        case "s": navigate("/eleves"); break;
        case "f": navigate("/facturation"); break;
        case "p": navigate("/paiements"); break;
        case "d": navigate("/tableau-de-bord"); break;
        case "v": navigate("/vehicules"); break;
        case "i": navigate("/formateurs"); break;
        case "r": navigate("/rentabilite"); break;
        default: return;
      }
      e.preventDefault();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}
