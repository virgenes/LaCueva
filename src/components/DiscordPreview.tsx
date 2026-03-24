import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Wifi, WifiOff, ExternalLink } from "lucide-react";
import { GameCard } from "./GameCard";
import { PixelEmoji } from "./PixelEmoji";

interface BridgeMessage {
  id: string;
  author: string;
  content: string;
  source: "discord" | "web";
  timestamp: string;
}

const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL ?? "http://localhost:3001";
const WS_URL = BRIDGE_URL.replace(/^http/, "ws");
const RECONNECT_DELAY = 5000;

// Demo messages shown when bridge is offline
const DEMO_MESSAGES: BridgeMessage[] = [
  { id: "d1", author: "Virgen Supremo", content: "¡Bienvenido a La Cueva! 🎮", source: "discord", timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: "d2", author: "Anónimo", content: "Hola desde la web 👋", source: "web", timestamp: new Date(Date.now() - 60000).toISOString() },
  { id: "d3", author: "CaveBot", content: "El chat está activo cuando el bot está online.", source: "discord", timestamp: new Date(Date.now() - 10000).toISOString() },
];

export function DiscordPreview() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<BridgeMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch history
  useEffect(() => {
    fetch(`${BRIDGE_URL}/api/messages?limit=10`)
      .then((r) => r.json())
      .then((data: BridgeMessage[]) => {
        if (Array.isArray(data) && data.length > 0) setMessages(data.slice(-5));
      })
      .catch(() => setMessages(DEMO_MESSAGES));
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(`${WS_URL}/api/messages`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    ws.onmessage = (event) => {
      try {
        const msg: BridgeMessage = JSON.parse(event.data as string);
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg].slice(-5); // keep last 5
        });
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  const displayMessages = messages.length > 0 ? messages : DEMO_MESSAGES;

  return (
    <GameCard hoverable={false} className="mt-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-dashed border-border">
        <h2 className="font-pixel text-sm text-primary flex items-center gap-2">
          <PixelEmoji type="chat" size="md" animate />
          DISCORD LIVE
        </h2>
        <div className="flex items-center gap-1">
          {connected ? (
            <><Wifi size={10} className="text-green-400" /><span className="font-retro text-xs text-green-400">online</span></>
          ) : (
            <><WifiOff size={10} className="text-red-400" /><span className="font-retro text-xs text-red-400">offline</span></>
          )}
        </div>
      </div>

      {/* Messages — read only, last 5 */}
      <div className="space-y-1 mb-3 max-h-[160px] overflow-hidden relative">
        {displayMessages.map((msg) => (
          <div
            key={msg.id}
            className="flex items-start gap-2"
            style={{
              padding: "3px 6px",
              borderRadius: "2px",
              background: msg.source === "discord" ? "rgba(114,137,218,0.07)" : "rgba(67,181,129,0.07)",
              borderLeft: `2px solid ${msg.source === "discord" ? "#7289da" : "#43b581"}`,
            }}
          >
            <span style={{ fontSize: "12px", flexShrink: 0 }}>
              {msg.source === "discord" ? "🎮" : "🌐"}
            </span>
            <div className="min-w-0 flex-1">
              <span
                className="font-retro text-sm mr-1"
                style={{ color: msg.source === "discord" ? "#7289da" : "#43b581" }}
              >
                {msg.author}
              </span>
              <span className="font-retro text-xs text-muted-foreground mr-1">
                {formatTime(msg.timestamp)}
              </span>
              <p className="font-retro text-sm text-foreground truncate">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />

        {/* Fade overlay at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{ background: "linear-gradient(transparent, var(--background))" }}
        />
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate("/discord")}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 transition-all duration-200
          border-2 border-dashed border-[#7289da] hover:bg-[#7289da22] hover:-translate-y-0.5 rounded-sm group"
      >
        <ExternalLink size={11} className="text-[#7289da] group-hover:animate-wiggle" />
        <span className="font-pixel text-[8px] text-[#7289da]">
          ¿Quieres escribir? ¡Dale click!
        </span>
      </button>
    </GameCard>
  );
}
