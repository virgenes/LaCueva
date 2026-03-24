export type MessageType =
  | "ban"
  | "kick"
  | "warn"
  | "daily"
  | "dailyCooldown"
  | "ticketOpen"
  | "ticketClose"
  | "welcome"
  | "autoban"
  | "autokick"
  | "transfer"
  | "balance"
  | "purge"
  | "pollCreate"
  | "pollClose"
  | "eventCreate"
  | "eventCancel"
  | "backupCreate"
  | "backupRestore"
  | "autoRoleSet"
  | "logsSet"
  | "filtroAdd"
  | "filtroRemove"
  | "autoRespuestaAdd"
  | "autoRespuestaRemove";

type Templates = Record<MessageType, string>;

const frikiTemplates: Templates = {
  ban: "☠️ Game Over, {member}. Tu run en este servidor ha terminado.\n📋 Razón: {reason}\n👮 Moderador: {moderator}",
  kick: "🔌 Has sido desconectado del servidor, {member}. Respawn disponible si corriges tu comportamiento.\n📋 Razón: {reason}\n👮 Moderador: {moderator}",
  warn: "⚠️ Ojo, {member} — ya llevas {n} advertencia(s). Esto no es un tutorial, las consecuencias son reales.\n📋 Razón: {reason}\n👮 Moderador: {moderator}",
  daily: "💰 ¡Tu recompensa diaria ha llegado, {member}! +{amount} monedas. Saldo actual: {balance} 🪙",
  dailyCooldown: "⏳ Aún no puedes reclamar tu recompensa diaria, {member}. Tiempo restante: {remaining}. ¡Vuelve cuando el cooldown termine!",
  ticketOpen: "🎫 ¡Nuevo ticket abierto por {member}! Canal: {channel}. Un GM atenderá tu quest en breve. 🗡️",
  ticketClose: "📁 Ticket cerrado por {member}. El resumen de tu aventura ha sido enviado por DM. ¡Hasta la próxima misión!",
  welcome: "🎮 ¡Un nuevo aventurero ha entrado al servidor! Bienvenido/a, {member}. Que tu run aquí sea épica. ✨",
  autoban: "🚫 Ban automático ejecutado sobre {member} — acumuló {n} warns en los últimos 30 días. El sistema de sanciones ha hablado. ⚖️",
  autokick: "👢 Kick automático ejecutado sobre {member} — alcanzó {n} advertencias. Respawn disponible si mejora su comportamiento.",
  transfer: "💸 Transferencia completada: {sender} envió {amount} monedas a {receiver}. Saldo de {sender}: {balance} 🪙",
  balance: "🪙 Saldo de {member}: {balance} monedas. ¡Sigue farmeando para subir en el ranking!",
  purge: "🧹 ¡Limpieza completada! Se eliminaron {count} mensajes del canal. El mapa ha sido reseteado. 🗺️",
  pollCreate: "📊 ¡Nueva encuesta iniciada por {member}! Tema: **{title}**. ¡Que empiece la votación! 🗳️",
  pollClose: "📊 Encuesta **{title}** cerrada. Resultados finales calculados. ¡El pueblo ha hablado! 🏆",
  eventCreate: "🎉 ¡Nuevo evento creado por {member}! **{title}** — {date}. ¡Prepara tu build y únete! ⚔️",
  eventCancel: "❌ El evento **{title}** ha sido cancelado por {member}. Los aventureros inscritos han sido notificados. 😔",
  backupCreate: "💾 Backup del servidor creado exitosamente por {member}. Tus datos están a salvo en la nube. ☁️",
  backupRestore: "🔄 Restauración de backup completada por {member}. El servidor ha vuelto a un estado anterior. ⏪",
  autoRoleSet: "🎭 AutoRole configurado: el rol **{role}** será asignado automáticamente a los nuevos aventureros. ⚙️",
  logsSet: "📋 Canal de logs configurado en {channel} por {member}. Todas las acciones quedarán registradas en el libro de crónicas. 📖",
  filtroAdd: "🚫 Palabra añadida al filtro por {member}: `{word}`. El sistema de censura está actualizado. 🛡️",
  filtroRemove: "✅ Palabra eliminada del filtro por {member}: `{word}`. La palabra ha sido liberada del ban. 🔓",
  autoRespuestaAdd: "🤖 Auto-respuesta añadida por {member}. Trigger: `{trigger}` → Respuesta: `{response}`. ¡El bot ha aprendido un nuevo hechizo! ✨",
  autoRespuestaRemove: "🗑️ Auto-respuesta eliminada por {member}. Trigger: `{trigger}` ha sido olvidado. El hechizo fue borrado del grimorio. 📚",
};

const formalTemplates: Templates = {
  ban: "El usuario {member} ha sido expulsado permanentemente del servidor.\nMotivo: {reason}\nModerador responsable: {moderator}",
  kick: "El usuario {member} ha sido expulsado del servidor.\nMotivo: {reason}\nModerador responsable: {moderator}",
  warn: "El usuario {member} ha recibido una advertencia formal ({n} en total).\nMotivo: {reason}\nModerador responsable: {moderator}",
  daily: "Recompensa diaria reclamada por {member}. Cantidad: +{amount} monedas. Saldo actual: {balance} monedas.",
  dailyCooldown: "No es posible reclamar la recompensa diaria todavía, {member}. Tiempo restante: {remaining}.",
  ticketOpen: "Se ha abierto un nuevo ticket de soporte por {member}. Canal asignado: {channel}.",
  ticketClose: "El ticket ha sido cerrado por {member}. Se ha enviado un resumen al usuario por mensaje directo.",
  welcome: "Bienvenido/a al servidor, {member}. Por favor, lee las normas del servidor antes de participar.",
  autoban: "Sanción automática aplicada: {member} ha sido expulsado permanentemente tras acumular {n} advertencias en los últimos 30 días.",
  autokick: "Sanción automática aplicada: {member} ha sido expulsado del servidor tras acumular {n} advertencias.",
  transfer: "Transferencia completada: {sender} ha enviado {amount} monedas a {receiver}. Saldo de {sender}: {balance} monedas.",
  balance: "Saldo de {member}: {balance} monedas.",
  purge: "Se han eliminado {count} mensajes del canal correctamente.",
  pollCreate: "Nueva encuesta creada por {member}. Título: {title}.",
  pollClose: "La encuesta {title} ha sido cerrada. Los resultados han sido calculados.",
  eventCreate: "Nuevo evento creado por {member}. Título: {title}. Fecha: {date}.",
  eventCancel: "El evento {title} ha sido cancelado por {member}. Los participantes han sido notificados.",
  backupCreate: "Copia de seguridad del servidor creada correctamente por {member}.",
  backupRestore: "Restauración de copia de seguridad completada por {member}.",
  autoRoleSet: "El rol automático ha sido configurado: {role} será asignado a los nuevos miembros.",
  logsSet: "El canal de registros ha sido configurado en {channel} por {member}.",
  filtroAdd: "La palabra {word} ha sido añadida al filtro de contenido por {member}.",
  filtroRemove: "La palabra {word} ha sido eliminada del filtro de contenido por {member}.",
  autoRespuestaAdd: "Auto-respuesta añadida por {member}. Activador: {trigger}. Respuesta: {response}.",
  autoRespuestaRemove: "Auto-respuesta eliminada por {member}. Activador: {trigger}.",
};

/**
 * Returns a formatted message for the given type, substituting {param} placeholders.
 *
 * @param type    The message type
 * @param params  Key-value pairs for placeholder substitution
 * @param mode    "friki" for gaming/anime tone, "formal" for neutral tone
 */
export function getMessage(
  type: MessageType,
  params: Record<string, string>,
  mode: "friki" | "formal"
): string {
  const templates = mode === "friki" ? frikiTemplates : formalTemplates;
  let template = templates[type];

  for (const [key, value] of Object.entries(params)) {
    template = template.replaceAll(`{${key}}`, value);
  }

  return template;
}
