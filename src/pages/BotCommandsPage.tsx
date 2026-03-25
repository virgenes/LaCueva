import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Terminal, Search } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { StarBackground } from "@/components/StarBackground";

// ─── Command data ─────────────────────────────────────────────────────────────

interface Command {
  name: string;
  description: string;
  usage: string;
  category: string;
}

const COMMANDS: Command[] = [
  // Moderación
  { category: "Moderación", name: "/warn", description: "Advierte a un miembro. A los 3 warns recibe kick, a los 5 en 30 días recibe ban.", usage: "/warn @usuario [razón]" },
  { category: "Moderación", name: "/warns", description: "Muestra el historial de advertencias de un miembro.", usage: "/warns @usuario" },
  { category: "Moderación", name: "/unwarn", description: "Elimina una advertencia específica de un miembro.", usage: "/unwarn @usuario [id]" },
  { category: "Moderación", name: "/ban", description: "Banea a un miembro del servidor con razón opcional.", usage: "/ban @usuario [razón]" },
  { category: "Moderación", name: "/kick", description: "Expulsa a un miembro del servidor.", usage: "/kick @usuario [razón]" },
  { category: "Moderación", name: "/filtro", description: "Gestiona el filtro de palabras prohibidas del servidor.", usage: "/filtro add|remove|list [palabra]" },
  { category: "Moderación", name: "/timeout user", description: "Aplica timeout nativo de Discord a un miembro.", usage: "/timeout user @member <duración> [razón]" },
  { category: "Moderación", name: "/timeout slowmode", description: "Configura el modo lento del canal (0–21600 segundos).", usage: "/timeout slowmode <segundos>" },
  { category: "Moderación", name: "/timeout lockdown", description: "Bloquea o desbloquea canales del servidor.", usage: "/timeout lockdown canal|servidor|unlock" },
  { category: "Moderación", name: "/warn modlogs", description: "Historial completo de moderación de un miembro con exportación.", usage: "/warn modlogs <member> [export json|csv]" },
  // Utilidades
  { category: "Utilidades", name: "/purge", description: "Elimina entre 1 y 100 mensajes del canal. Puede filtrar por usuario.", usage: "/purge <cantidad> [user:@usuario]" },
  { category: "Utilidades", name: "/poll", description: "Crea una encuesta con 2–5 opciones. Un voto por miembro.", usage: "/poll <pregunta> <op1> <op2> [op3] [op4] [op5]" },
  { category: "Utilidades", name: "/ticket", description: "Abre o cierra un ticket de soporte. Límite de 1 ticket por miembro.", usage: "/ticket open|close" },
  { category: "Utilidades", name: "/autorespuesta", description: "Gestiona respuestas automáticas a palabras clave.", usage: "/autorespuesta add|remove [trigger] [respuesta]" },
  { category: "Utilidades", name: "/remindme", description: "Crea un recordatorio personal con opción de repetición diaria o semanal.", usage: "/remindme <tiempo> <mensaje> [repetir]" },
  { category: "Utilidades", name: "/userinfo user", description: "Muestra información detallada de un miembro del servidor.", usage: "/userinfo user [@member]" },
  { category: "Utilidades", name: "/userinfo server", description: "Muestra información general del servidor.", usage: "/userinfo server" },
  { category: "Utilidades", name: "/suggest new", description: "Envía una sugerencia al canal de sugerencias del servidor.", usage: "/suggest new <texto>" },
  { category: "Utilidades", name: "/suggest approve|deny", description: "Aprueba o deniega una sugerencia (solo moderadores).", usage: "/suggest approve|deny <id>" },
  { category: "Utilidades", name: "/report", description: "Envía un reporte anónimo al staff del servidor.", usage: "/report <usuario> <razón>" },
  // Utilidades Avanzadas
  { category: "Utilidades Avanzadas", name: "/translate", description: "Traduce texto a otro idioma usando LibreTranslate.", usage: "/translate <texto> [idioma]" },
  { category: "Utilidades Avanzadas", name: "/weather", description: "Muestra el clima actual de una ciudad.", usage: "/weather <ciudad>" },
  { category: "Utilidades Avanzadas", name: "/urban", description: "Busca la definición de un término en Urban Dictionary.", usage: "/urban <término>" },
  { category: "Utilidades Avanzadas", name: "/qr", description: "Genera un código QR a partir de un texto o URL.", usage: "/qr <texto>" },
  { category: "Utilidades Avanzadas", name: "/shorten", description: "Acorta una URL larga.", usage: "/shorten <url>" },
  // Entretenimiento
  { category: "Entretenimiento", name: "/play", description: "Reproduce una canción de YouTube en el canal de voz.", usage: "/play <búsqueda o URL>" },
  { category: "Entretenimiento", name: "/skip", description: "Salta la canción actual en la cola.", usage: "/skip" },
  { category: "Entretenimiento", name: "/queue", description: "Muestra la cola de reproducción con barra de progreso.", usage: "/queue" },
  { category: "Entretenimiento", name: "/stop", description: "Detiene la música y desconecta al bot del canal de voz.", usage: "/stop" },
  { category: "Entretenimiento", name: "/pause", description: "Pausa la reproducción actual.", usage: "/pause" },
  { category: "Entretenimiento", name: "/resume", description: "Reanuda la reproducción pausada.", usage: "/resume" },
  { category: "Entretenimiento", name: "/filter", description: "Aplica un filtro de audio a la música en reproducción.", usage: "/filter <bassboost|nightcore>" },
  { category: "Entretenimiento", name: "/lyrics", description: "Muestra la letra de la canción que se está reproduciendo.", usage: "/lyrics" },
  { category: "Entretenimiento", name: "/playlist create", description: "Crea una lista de reproducción personalizada.", usage: "/playlist create <nombre>" },
  { category: "Entretenimiento", name: "/playlist load", description: "Carga una lista de reproducción guardada.", usage: "/playlist load <nombre>" },
  { category: "Entretenimiento", name: "/meme", description: "Obtiene un meme aleatorio de Reddit.", usage: "/meme" },
  { category: "Entretenimiento", name: "/gif", description: "Busca un GIF en Tenor.", usage: "/gif <búsqueda>" },
  { category: "Entretenimiento", name: "/trivia", description: "Inicia una partida de trivia con botones interactivos.", usage: "/trivia" },
  { category: "Entretenimiento", name: "/ruleta", description: "Juega a la ruleta rusa (probabilidad 1/6).", usage: "/ruleta" },
  { category: "Entretenimiento", name: "/8ball", description: "La bola mágica responde tus preguntas del destino.", usage: "/8ball <pregunta>" },
  { category: "Entretenimiento", name: "/blackjack", description: "Juega al blackjack apostando monedas del servidor.", usage: "/blackjack <apuesta>" },
  { category: "Entretenimiento", name: "/tictactoe", description: "Reta a otro miembro a una partida de tres en raya.", usage: "/tictactoe @rival" },
  { category: "Entretenimiento", name: "/hangman", description: "Inicia una partida del juego del ahorcado.", usage: "/hangman" },
  // Economía
  { category: "Economía", name: "/daily", description: "Reclama entre 100–200 monedas diarias. Cooldown de 24 horas.", usage: "/daily" },
  { category: "Economía", name: "/balance", description: "Consulta tu saldo o el de otro miembro.", usage: "/balance [@usuario]" },
  { category: "Economía", name: "/transfer", description: "Transfiere monedas a otro miembro.", usage: "/transfer @usuario <cantidad>" },
  { category: "Economía", name: "/shop", description: "Muestra la tienda del servidor con artículos disponibles.", usage: "/shop" },
  { category: "Economía", name: "/work", description: "Trabaja para ganar monedas del servidor.", usage: "/work" },
  { category: "Economía", name: "/rob", description: "Intenta robar monedas a otro miembro (con riesgo).", usage: "/rob @user" },
  { category: "Economía", name: "/bet", description: "Apuesta monedas en un juego de 50/50.", usage: "/bet <cantidad>" },
  { category: "Economía", name: "/top", description: "Muestra el ranking de miembros con más monedas.", usage: "/top" },
  { category: "Economía", name: "/richest", description: "Alias de /top — ranking de los más ricos del servidor.", usage: "/richest" },
  // Administración
  { category: "Administración", name: "/autorole", description: "Configura el rol que se asigna automáticamente a nuevos miembros.", usage: "/autorole set|disable [@rol]" },
  { category: "Administración", name: "/logs", description: "Establece el canal donde se registran las acciones administrativas.", usage: "/logs set #canal" },
  { category: "Administración", name: "/backup", description: "Crea o restaura una copia de seguridad de canales y roles del servidor.", usage: "/backup create|restore [archivo.json]" },
  { category: "Administración", name: "/evento", description: "Crea, cancela o lista eventos del servidor con recordatorio 1h antes.", usage: "/evento create|cancel|list" },
  { category: "Administración", name: "/temprole", description: "Asigna un rol temporal a un miembro durante un tiempo determinado.", usage: "/temprole @user <rol> <duración>" },
  { category: "Administración", name: "/g start", description: "Crea un giveaway con duración, premio y número de ganadores.", usage: "/g start <duración> <premio> [ganadores]" },
  { category: "Administración", name: "/g end", description: "Finaliza un giveaway activo antes de tiempo.", usage: "/g end <id>" },
  { category: "Administración", name: "/g list", description: "Lista todos los giveaways activos del servidor.", usage: "/g list" },
  { category: "Administración", name: "/level ver", description: "Muestra tu nivel actual y puntos de experiencia.", usage: "/level ver" },
  { category: "Administración", name: "/level leaderboard", description: "Muestra el ranking de niveles del servidor.", usage: "/level leaderboard" },
  { category: "Administración", name: "/embed", description: "Crea un embed personalizado con el constructor interactivo.", usage: "/embed" },
  { category: "Administración", name: "/say", description: "El bot publica un mensaje en el canal, con opción de embed.", usage: "/say <mensaje> [embed]" },
  { category: "Administración", name: "/reddit", description: "Muestra posts recientes de un subreddit.", usage: "/reddit <subreddit>" },
  { category: "Administración", name: "/config", description: "Configura opciones del servidor: prefix, roles, canales de logs y más.", usage: "/config prefix|modrole|adminrole|logchannel|mute_role|show" },
  // Herramientas Dev
  { category: "Herramientas Dev", name: "/eval", description: "Ejecuta código JavaScript arbitrario (solo owner del bot).", usage: "/eval <código>" },
  { category: "Herramientas Dev", name: "/ping", description: "Muestra la latencia actual del bot.", usage: "/ping" },
  { category: "Herramientas Dev", name: "/invite", description: "Genera el enlace de invitación del bot al servidor.", usage: "/invite" },
];

const CATEGORIES = ["Todos", "Moderación", "Utilidades", "Utilidades Avanzadas", "Entretenimiento", "Economía", "Administración", "Herramientas Dev"];

const CATEGORY_COLORS: Record<string, string> = {
  "Moderación":          "#ed4245",
  "Utilidades":          "#5865f2",
  "Utilidades Avanzadas":"#00b0f4",
  "Entretenimiento":     "#57f287",
  "Economía":            "#fee75c",
  "Administración":      "#eb459e",
  "Herramientas Dev":    "#f47fff",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Moderación":          "🛡️",
  "Utilidades":          "🔧",
  "Utilidades Avanzadas":"🌐",
  "Entretenimiento":     "🎮",
  "Economía":            "💰",
  "Administración":      "⚙️",
  "Herramientas Dev":    "🖥️",
};

// ─── Component ────────────────────────────────────────────────────────────────

const BotCommandsPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered = COMMANDS.filter((cmd) => {
    const matchCat = activeCategory === "Todos" || cmd.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || cmd.name.includes(q) || cmd.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <PageTransition>
      <div className="min-h-screen relative" style={{ background: "#0a0a14" }}>
        <StarBackground />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
          {/* Back */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-70"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "9px", color: "#7289da" }}
          >
            <ArrowLeft size={14} />
            VOLVER
          </button>

          {/* Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Terminal size={20} color="#7289da" />
              <h1 style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "13px", color: "#7289da", textShadow: "0 0 20px rgba(114,137,218,0.6)" }}>
                COMANDOS DEL BOT
              </h1>
              <Terminal size={20} color="#7289da" />
            </div>
            <p style={{ fontFamily: '"VT323", monospace', fontSize: "20px", color: "#72767d" }}>
              Virgen Supremo · {COMMANDS.length} comandos disponibles
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search size={14} color="#72767d" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Buscar comando..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "#1a1a2e",
                border: "2px solid #2c2f33",
                borderRadius: "4px",
                padding: "10px 12px 10px 36px",
                color: "#dcddde",
                fontFamily: '"VT323", monospace',
                fontSize: "18px",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#7289da")}
              onBlur={(e) => (e.target.style.borderColor = "#2c2f33")}
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              const color = cat === "Todos" ? "#7289da" : CATEGORY_COLORS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: "7px",
                    padding: "6px 10px",
                    borderRadius: "2px",
                    border: `2px solid ${isActive ? color : "#2c2f33"}`,
                    background: isActive ? `${color}22` : "transparent",
                    color: isActive ? color : "#72767d",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {cat !== "Todos" && CATEGORY_ICONS[cat]} {cat.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Commands grid */}
          {filtered.length === 0 ? (
            <p style={{ fontFamily: '"VT323", monospace', fontSize: "20px", color: "#72767d", textAlign: "center", marginTop: "40px" }}>
              No se encontraron comandos.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {filtered.map((cmd) => {
                const color = CATEGORY_COLORS[cmd.category];
                return (
                  <div
                    key={cmd.name}
                    style={{
                      background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                      border: `2px solid ${color}33`,
                      borderLeft: `3px solid ${color}`,
                      borderRadius: "4px",
                      padding: "14px 16px",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = color;
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 12px ${color}33`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = `${color}33`;
                      (e.currentTarget as HTMLDivElement).style.borderLeftColor = color;
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    }}
                  >
                    {/* Command name + category badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "8px", color: "#fff" }}>
                        {cmd.name}
                      </span>
                      <span style={{
                        fontFamily: '"VT323", monospace',
                        fontSize: "13px",
                        color,
                        background: `${color}22`,
                        border: `1px solid ${color}44`,
                        borderRadius: "2px",
                        padding: "1px 6px",
                      }}>
                        {CATEGORY_ICONS[cmd.category]} {cmd.category}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{ fontFamily: '"VT323", monospace', fontSize: "16px", color: "#dcddde", marginBottom: "10px", lineHeight: 1.4 }}>
                      {cmd.description}
                    </p>

                    {/* Usage */}
                    <div style={{
                      background: "#0d0d1a",
                      border: "1px solid #2c2f33",
                      borderRadius: "2px",
                      padding: "5px 8px",
                      fontFamily: '"Courier New", monospace',
                      fontSize: "11px",
                      color: "#7289da",
                    }}>
                      {cmd.usage}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <p className="text-center mt-8" style={{ fontFamily: '"VT323", monospace', fontSize: "14px", color: "#333" }}>
            Virgen Supremo Bot · La Cueva de los Vírgenes · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default BotCommandsPage;
