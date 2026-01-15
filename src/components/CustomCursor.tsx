import { useEffect, useMemo, useRef, useState } from "react";

// IMPORTACIÓN DE IMÁGENES
// Esto asegura que Vite encuentre la ruta real, sin importar configuraciones del servidor
import pointerImg from "@/assets/cursors/pointer.gif";
import linkImg from "@/assets/cursors/link.gif";
// Si alguna de estas no existe en tu carpeta, comenta la línea y usa pointerImg abajo
import textImg from "@/assets/cursors/text.gif";
import helpImg from "@/assets/cursors/help.gif";
import workingImg from "@/assets/cursors/working.gif";
import unavailableImg from "@/assets/cursors/unavailable.gif";
import likeImg from "@/assets/cursors/like.gif";
import negativeImg from "@/assets/cursors/negative.gif";
import alternateImg from "@/assets/cursors/alternate.gif";

type CursorKind =
  | "pointer"
  | "link"
  | "text"
  | "help"
  | "working"
  | "unavailable"
  | "like"
  | "negative"
  | "alternate";

function getCursorKindFromTarget(target: EventTarget | null): CursorKind {
  const el = target instanceof Element ? target : null;
  if (!el) return "pointer";

  const root = el.closest("[data-cursor]");
  const explicit = root?.getAttribute("data-cursor");
  if (explicit) {
    const allowed: CursorKind[] = [
      "pointer", "link", "text", "help", "working", 
      "unavailable", "like", "negative", "alternate"
    ];
    if (allowed.includes(explicit as CursorKind)) return explicit as CursorKind;
  }

  if (el.closest(".cursor-not-allowed")) return "negative";
  
  if (el.closest("[disabled], button:disabled, input:disabled, select:disabled, textarea:disabled, [aria-disabled='true'], .disabled")) {
    return "unavailable";
  }

  if (el.closest("[aria-busy='true'], .loading, .cursor-wait")) return "working";
  if (el.closest("input, textarea, [contenteditable='true']")) return "text";
  if (el.closest("[title], [data-tooltip], abbr[title], .help-cursor")) return "help";
  if (el.closest(".like-button, .heart-button, .favorite-button")) return "like";
  if (el.closest("[draggable='true'], .cursor-grab")) return "alternate";
  
  if (el.closest("a[href], button, [role='button'], .cursor-pointer, input[type='submit'], input[type='button'], label[for], select, .retro-btn, .retro-btn-pink")) {
    return "link";
  }

  return "pointer";
}

export function CustomCursor() {
  const [kind, setKind] = useState<CursorKind>("pointer");
  const [visible, setVisible] = useState(false);
  const elRef = useRef<HTMLDivElement | null>(null);

  // Mapeo directo de los imports. 
  // Si alguna imagen falla al importar, Vite te avisará ANTES de abrir la página.
  const cursorSrc = useMemo(() => {
    const map: Record<CursorKind, string> = {
      pointer: pointerImg,
      link: linkImg,
      text: textImg,
      help: helpImg,
      working: workingImg,
      unavailable: unavailableImg,
      like: likeImg,
      negative: negativeImg,
      alternate: alternateImg,
    };
    return map[kind];
  }, [kind]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const pos = { x: 0, y: 0 };
    let raf = 0;

    const commit = () => {
      raf = 0;
      el.style.setProperty("--cursor-x", `${pos.x}px`);
      el.style.setProperty("--cursor-y", `${pos.y}px`);
    };

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      setVisible(true);
      if (!raf) raf = window.requestAnimationFrame(commit);
    };

    const onOver = (e: Event) => setKind(getCursorKindFromTarget(e.target));
    const onFocus = (e: Event) => setKind(getCursorKindFromTarget(e.target));
    const onLeaveWindow = () => setVisible(false);
    const onEnterWindow = () => setVisible(true);

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("mouseenter", onEnterWindow);
    window.addEventListener("mouseleave", onLeaveWindow);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("focusin", onFocus, true);
      document.removeEventListener("mouseenter", onEnterWindow);
      window.removeEventListener("mouseleave", onLeaveWindow);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div 
      ref={elRef} 
      className="custom-cursor" 
      data-visible={visible ? "true" : "false"}
    >
      <img 
        src={cursorSrc} 
        alt="" 
        aria-hidden="true" 
        draggable={false}
        // Fallback de seguridad definitivo
        onError={(e) => {
          const img = e.currentTarget;
          if (img.src !== pointerImg) {
            img.src = pointerImg;
          }
        }}
      />
    </div>
  );
}