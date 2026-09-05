import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Wifi, WifiOff, MessageSquare } from "lucide-react";
import { getBridgeUrl, getWsUrl, invalidateBridgeUrl } from "@/lib/bridgeConfig";

interface BridgeMessage {
  id: string;
  author: string;
  content: string;
  source: "discord" | "web";
  timestamp: string;
  avatarUrl?: string;
}

const MAX_LENGTH = 2000;
const RECONNECT_DELAY = 4000;

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function ChatBridge() {
  const [messages, setMessages] = useState<BridgeMessage[]>([]);
  const [input, setInput] = useState("");
  const [author, setAuthor] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch message history on mount
  useEffect(() => {
    getBridgeUrl().then((url) => fetch(`${url}/api/messages?limit=50`))
      .then((r) => r.json())
      .then((data: BridgeMessage[]) => setMessages(data))
      .catch(() => {/* bridge might not be running yet */});
  }, []);

  // WebSocket connection with auto-reconnect using dynamic tunnel URL
  const connect = useCallback(async () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const bridgeUrl = await getBridgeUrl();
      const wsUrl = getWsUrl(bridgeUrl);
      const ws = new WebSocket(`${wsUrl}/api/messages`);
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
            return [...prev, msg];
          });
        } catch {/* ignore malformed */}
      };

      ws.onclose = () => {
        setConnected(false);
        invalidateBridgeUrl();
        reconnectTimer.current = setTimeout(() => { void connect(); }, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setConnected(false);
      invalidateBridgeUrl();
      reconnectTimer.current = setTimeout(() => { void connect(); }, RECONNECT_DELAY);
    }
  }, []);

  useEffect(() => {
    void connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmedContent = input.trim();
    const trimmedAuthor = author.trim() || "Anónimo";

    if (!trimmedContent) return;
    if (trimmedContent.length > MAX_LENGTH) {
      setError(`El mensaje no puede superar ${MAX_LENGTH} caracteres.`);
      return;
    }

    setError(null);
    setSending(true);

    try {
      const bridgeUrl = await getBridgeUrl();
      const res = await fetch(`${bridgeUrl}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: trimmedAuthor, content: trimmedContent }),
      });

      if (res.status === 429) {
        setError("Demasiados mensajes. Espera un momento, aventurero.");
      } else if (res.status === 403) {
        setError("El chat está en modo solo lectura ahora mismo.");
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Error al enviar el mensaje.");
      } else {
        setInput("");
      }
    } catch {
      setError("No se pudo conectar con el bridge. ¿Está el bot activo?");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div
      className="flex flex-col h-[520px] w-full"
      style={{
        background: "#0d0d1a",
        border: "2px solid #7289da",
        borderRadius: "4px",
        fontFamily: '"VT323", monospace',
        boxShadow: "0 0 20px rgba(114,137,218,0.2)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          background: "linear-gradient(90deg, #1a1a2e, #16213e)",
          borderBottom: "2px solid #7289da",
        }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[#7289da]" />
          <span
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "9px",
              color: "#7289da",
              letterSpacing: "0.1em",
            }}
          >
            DISCORD BRIDGE
          </span>
        </div>
        <div className="flex items-center gap-1">
          {connected ? (
            <>
              <Wifi size={12} className="text-green-400" />
              <span style={{ fontSize: "14px", color: "#43b581" }}>conectado</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-red-400" />
              <span style={{ fontSize: "14px", color: "#f04747" }}>desconectado</span>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#7289da #0d0d1a" }}
      >
        {messages.length === 0 && (
          <div
            className="text-center py-8 opacity-40"
            style={{ fontSize: "16px", color: "#7289da" }}
          >
            [ sin mensajes aún - sé el primero, héroe ]
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="flex items-start gap-2 group"
            style={{
              padding: "4px 6px",
              borderRadius: "2px",
              background:
                msg.source === "discord"
                  ? "rgba(114,137,218,0.05)"
                  : "rgba(67,181,129,0.05)",
              borderLeft: `2px solid ${msg.source === "discord" ? "#7289da" : "#43b581"}`,
            }}
          >
            {/* Avatar / source icon */}
            {msg.avatarUrl ? (
              <img
                src={msg.avatarUrl}
                alt={msg.author}
                width={24}
                height={24}
                style={{ borderRadius: "2px", imageRendering: "pixelated", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  background: msg.source === "discord" ? "#7289da22" : "#43b58122",
                  borderRadius: "2px",
                }}
              >
                {msg.source === "discord" ? "💬" : "🌐"}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  style={{
                    fontSize: "16px",
                    color: msg.source === "discord" ? "#7289da" : "#43b581",
                    fontWeight: "bold",
                  }}
                >
                  {msg.author}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#555",
                    fontFamily: '"Press Start 2P", monospace',
                  }}
                >
                  {formatTime(msg.timestamp)}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: msg.source === "discord" ? "#7289da66" : "#43b58166",
                    fontFamily: '"Press Start 2P", monospace',
                  }}
                >
                  [{msg.source}]
                </span>
              </div>
              <p
                style={{
                  fontSize: "18px",
                  color: "#dcddde",
                  wordBreak: "break-word",
                  lineHeight: 1.3,
                }}
              >
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          borderTop: "2px solid #2c2f33",
          padding: "8px",
          background: "#0d0d1a",
        }}
      >
        {/* Author name */}
        <input
          type="text"
          placeholder="Tu nombre (opcional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={32}
          style={{
            width: "100%",
            background: "#1e2124",
            border: "1px solid #2c2f33",
            color: "#b9bbbe",
            fontFamily: '"VT323", monospace',
            fontSize: "16px",
            padding: "4px 8px",
            marginBottom: "6px",
            outline: "none",
            borderRadius: "2px",
          }}
        />

        {/* Message + send */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Escribe un mensaje... (Enter para enviar)"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (e.target.value.length <= MAX_LENGTH) setError(null);
              }}
              onKeyDown={handleKeyDown}
              maxLength={MAX_LENGTH + 1}
              style={{
                width: "100%",
                background: "#1e2124",
                border: `1px solid ${input.length > MAX_LENGTH ? "#f04747" : "#2c2f33"}`,
                color: "#dcddde",
                fontFamily: '"VT323", monospace',
                fontSize: "18px",
                padding: "4px 8px",
                outline: "none",
                borderRadius: "2px",
              }}
            />
            {input.length > MAX_LENGTH * 0.9 && (
              <span
                style={{
                  position: "absolute",
                  right: 6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "12px",
                  fontFamily: '"Press Start 2P", monospace',
                  color: input.length > MAX_LENGTH ? "#f04747" : "#faa61a",
                }}
              >
                {MAX_LENGTH - input.length}
              </span>
            )}
          </div>
          <button
            onClick={() => void handleSend()}
            disabled={sending || !input.trim() || input.length > MAX_LENGTH}
            style={{
              background: sending ? "#4e5d94" : "#7289da",
              border: "2px solid #5b6eae",
              color: "#fff",
              padding: "4px 12px",
              cursor: sending ? "not-allowed" : "pointer",
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "9px",
              borderRadius: "2px",
              opacity: sending || !input.trim() || input.length > MAX_LENGTH ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <Send size={14} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p
            style={{
              marginTop: "4px",
              fontSize: "14px",
              color: "#f04747",
              fontFamily: '"VT323", monospace',
            }}
          >
            ⚠️ {error}
          </p>
        )}
      </div>
    </div>
  );
}
