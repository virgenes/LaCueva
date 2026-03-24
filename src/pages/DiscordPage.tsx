import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Users, Terminal } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { StarBackground } from "@/components/StarBackground";

const GUILD_ID = "1082764297106636820";
const CHANNEL_ID = "1083137376072765521";
const INVITE_URL = "https://discord.gg/lacueva";

const DiscordPage = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen relative" style={{ background: "#0a0a14" }}>
        <StarBackground />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
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
          <div className="text-center mb-8">
            <h1
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: "14px",
                color: "#7289da",
                textShadow: "0 0 20px rgba(114,137,218,0.6)",
                letterSpacing: "0.1em",
              }}
            >
              🎮 LA CUEVA — DISCORD
            </h1>
            <p
              style={{
                fontFamily: '"VT323", monospace',
                fontSize: "20px",
                color: "#72767d",
                marginTop: "8px",
              }}
            >
              Únete a la comunidad de vírgenes más épica del internet
            </p>
          </div>

          {/* Main layout */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Discord Widget — miembros online */}
            <div
              className="flex-shrink-0"
              style={{
                border: "2px solid #7289da",
                borderRadius: "4px",
                overflow: "hidden",
                boxShadow: "0 0 20px rgba(114,137,218,0.2)",
              }}
            >
              <div
                style={{
                  background: "#1a1a2e",
                  borderBottom: "2px solid #7289da",
                  padding: "8px 12px",
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: "8px",
                  color: "#7289da",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Users size={12} />
                MIEMBROS ONLINE
              </div>
              <iframe
                src={`https://discord.com/widget?id=${GUILD_ID}&theme=dark`}
                width="350"
                height="500"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                style={{ display: "block", border: "none" }}
                title="Discord Widget"
              />
            </div>

            {/* Right column */}
            <div className="flex-1 flex flex-col gap-6">

              {/* Server info card */}
              <div
                style={{
                  background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                  border: "2px solid #7289da",
                  borderRadius: "4px",
                  padding: "24px",
                  boxShadow: "0 0 20px rgba(114,137,218,0.15)",
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "4px",
                      background: "linear-gradient(135deg, #7289da, #5b6eae)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      flexShrink: 0,
                    }}
                  >
                    🕹️
                  </div>
                  <div>
                    <h2
                      style={{
                        fontFamily: '"Press Start 2P", monospace',
                        fontSize: "10px",
                        color: "#fff",
                        marginBottom: "4px",
                      }}
                    >
                      La Cueva de los Vírgenes
                    </h2>
                    <p
                      style={{
                        fontFamily: '"VT323", monospace',
                        fontSize: "16px",
                        color: "#72767d",
                      }}
                    >
                      Comunidad friki · gamer · anime
                    </p>
                  </div>
                </div>

                <p
                  style={{
                    fontFamily: '"VT323", monospace',
                    fontSize: "18px",
                    color: "#dcddde",
                    lineHeight: 1.5,
                    marginBottom: "20px",
                  }}
                >
                  Hola, soy un gordito tímido que no sale de su casa, ni los suscriptores saben que existo.
                  Pero aquí ando, construyendo la comunidad más auténtica del internet.
                  Únete si eres de los nuestros. 🎮
                </p>

                <a
                  href={`https://discord.com/invite/${GUILD_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 transition-all hover:opacity-80 hover:scale-105"
                  style={{
                    background: "#7289da",
                    color: "#fff",
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: "9px",
                    padding: "12px 24px",
                    borderRadius: "2px",
                    textDecoration: "none",
                    border: "2px solid #5b6eae",
                    boxShadow: "0 0 15px rgba(114,137,218,0.4)",
                  }}
                >
                  <ExternalLink size={12} />
                  UNIRSE AL SERVIDOR
                </a>
              </div>

              {/* Canales destacados */}
              <div
                style={{
                  background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                  border: "2px solid #2c2f33",
                  borderRadius: "4px",
                  padding: "20px",
                }}
              >
                <h3
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: "8px",
                    color: "#7289da",
                    marginBottom: "16px",
                  }}
                >
                  📋 CANALES DESTACADOS
                </h3>
                {[
                  { emoji: "👋", name: "𝑪𝒉𝒂𝒕", desc: "Chat general de la comunidad", id: CHANNEL_ID },
                  { emoji: "🎮", name: "juegos", desc: "Habla de videojuegos" },
                  { emoji: "🎵", name: "música", desc: "Comparte lo que escuchas" },
                  { emoji: "📢", name: "anuncios", desc: "Novedades del servidor" },
                ].map((ch) => (
                  <div
                    key={ch.name}
                    className="flex items-center gap-3 mb-3 group"
                    style={{
                      padding: "8px 10px",
                      borderRadius: "2px",
                      background: "rgba(114,137,218,0.05)",
                      borderLeft: "2px solid #7289da33",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>{ch.emoji}</span>
                    <div>
                      <span
                        style={{
                          fontFamily: '"VT323", monospace',
                          fontSize: "18px",
                          color: "#7289da",
                        }}
                      >
                        #{ch.name}
                      </span>
                      <p
                        style={{
                          fontFamily: '"VT323", monospace',
                          fontSize: "14px",
                          color: "#72767d",
                          margin: 0,
                        }}
                      >
                        {ch.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Footer note */}
          <p
            className="text-center mt-6"
            style={{
              fontFamily: '"VT323", monospace',
              fontSize: "14px",
              color: "#333",
            }}
          >
            El chat en tiempo real bidireccional estará disponible próximamente · ChatBridge v1.0
          </p>

          {/* Commands link */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => navigate("/bot-commands")}
              className="flex items-center gap-2 transition-all hover:opacity-80"
              style={{
                background: "transparent",
                border: "2px solid #7289da44",
                borderRadius: "2px",
                padding: "8px 16px",
                color: "#7289da",
                fontFamily: '"Press Start 2P", monospace',
                fontSize: "7px",
                cursor: "pointer",
              }}
            >
              <Terminal size={11} />
              VER COMANDOS DEL BOT
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default DiscordPage;
