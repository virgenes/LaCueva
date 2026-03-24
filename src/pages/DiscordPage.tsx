import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { StarBackground } from "@/components/StarBackground";
import { ChatBridge } from "@/components/ChatBridge";

const DiscordPage = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen relative" style={{ background: "#0a0a14" }}>
        <StarBackground />

        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
          {/* Back button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-70"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "9px",
              color: "#7289da",
            }}
          >
            <ArrowLeft size={14} />
            VOLVER
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <h1
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: "14px",
                color: "#7289da",
                textShadow: "0 0 10px rgba(114,137,218,0.5)",
                letterSpacing: "0.1em",
              }}
            >
              💬 DISCORD BRIDGE
            </h1>
            <p
              style={{
                fontFamily: '"VT323", monospace',
                fontSize: "18px",
                color: "#72767d",
                marginTop: "8px",
              }}
            >
              Chat en tiempo real entre la web y el servidor de Discord
            </p>
          </div>

          {/* Chat component */}
          <ChatBridge />

          {/* Info footer */}
          <p
            className="text-center mt-4"
            style={{
              fontFamily: '"VT323", monospace',
              fontSize: "14px",
              color: "#444",
            }}
          >
            Los mensajes enviados aquí aparecen en el canal #bridge del servidor de Discord, y viceversa.
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default DiscordPage;
