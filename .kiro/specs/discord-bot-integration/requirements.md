# Documento de Requisitos

## Introducción

Este documento describe los requisitos para el bot de Discord "todo-en-uno" de La Cueva (React + TypeScript + Vite, desplegado en GitHub Pages). El sistema incluye: moderación avanzada, utilidades, entretenimiento, economía, administración, giveaways, niveles/XP, personalización visual, utilidades avanzadas, sugerencias/reportes, integraciones externas, herramientas dev, configuración por servidor y un ChatBridge bidireccional web↔Discord.

---

## Glosario

- **Bot**: Proceso Node.js conectado a la API de Discord mediante discord.js v14.
- **Bridge**: Servidor Node.js/Express + WebSocket intermediario entre el Bot y la Web.
- **Web**: Sitio React/TypeScript/Vite ("La Cueva"), desplegado en GitHub Pages.
- **Guild**: Servidor de Discord al que pertenece el Bot.
- **Moderator**: Usuario con permisos de moderación en la Guild.
- **Member**: Usuario de Discord que pertenece a la Guild.
- **Command**: Instrucción enviada al Bot mediante slash commands (`/comando`).
- **Warn**: Advertencia formal registrada contra un Member.
- **Ticket**: Canal privado temporal para soporte.
- **Economy**: Sistema de moneda virtual interna de la Guild.
- **AutoRole**: Rol asignado automáticamente al unirse a la Guild.
- **AuditLog**: Registro cronológico de acciones administrativas.
- **Backup**: Copia exportada de la estructura de canales y roles.
- **ChatBridge**: Sincronización de mensajes entre Discord y la Web en tiempo real.
- **WebSocket**: Protocolo de comunicación bidireccional en tiempo real.
- **XP**: Puntos de experiencia acumulados por actividad en la Guild.
- **Level**: Nivel calculado a partir del XP acumulado de un Member.
- **Giveaway**: Sorteo con participación mediante botón interactivo.
- **TempRole**: Rol temporal asignado a un Member con duración definida.
- **Suggestion**: Propuesta enviada por un Member al canal de sugerencias.

---

## Requisitos

### Requisito 1: Moderación — Sanciones manuales y automáticas

**User Story:** Como Moderator, quiero banear, expulsar y silenciar miembros manualmente o de forma automática, para mantener el orden en la Guild.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/ban <member> <razón>`, THE Bot SHALL banear al Member de la Guild y registrar la acción en el AuditLog.
2. WHEN un Moderator ejecuta `/kick <member> <razón>`, THE Bot SHALL expulsar al Member de la Guild y registrar la acción en el AuditLog.
3. WHEN un Member acumula 3 Warns activos, THE Bot SHALL expulsar automáticamente al Member y notificar al canal de logs configurado.
4. WHEN un Member acumula 5 Warns activos en un período de 30 días, THE Bot SHALL banear automáticamente al Member y notificar al canal de logs configurado.
5. IF el Member objetivo tiene un rol con posición superior al Moderator que ejecuta el comando, THEN THE Bot SHALL rechazar la acción y responder con un mensaje de error descriptivo.
6. WHEN un Moderator ejecuta `/timeout @user <duración> [razón]`, THE Bot SHALL aplicar un timeout nativo de Discord al Member por la duración especificada (días, horas o minutos) y registrar la acción en el AuditLog.
7. WHEN un Moderator ejecuta `/slowmode <segundos>`, THE Bot SHALL configurar el modo lento del canal actual con el intervalo especificado en segundos.
8. WHEN un Moderator ejecuta `/lockdown canal`, THE Bot SHALL bloquear el canal actual impidiendo que los Members envíen mensajes, y registrar la acción en el AuditLog.
9. WHEN un Moderator ejecuta `/lockdown servidor`, THE Bot SHALL bloquear todos los canales de texto de la Guild simultáneamente y registrar la acción en el AuditLog.
10. WHEN un Moderator ejecuta `/lockdown unlock`, THE Bot SHALL restaurar los permisos de envío de mensajes en el canal o servidor previamente bloqueado.

---

### Requisito 2: Moderación — Sistema de Warns con niveles

**User Story:** Como Moderator, quiero gestionar advertencias con niveles y acciones automáticas configurables, para aplicar sanciones progresivas de forma consistente.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/warn add <member> <razón>`, THE Bot SHALL registrar un Warn activo para el Member, notificar al Member por DM y registrar la acción en el AuditLog.
2. WHEN un Member alcanza el nivel 1 de warns (1 warn), THE Bot SHALL enviar un mensaje de advertencia al Member por DM.
3. WHEN un Member alcanza el nivel 3 de warns, THE Bot SHALL aplicar automáticamente un mute de 1 hora al Member.
4. WHEN un Member alcanza el nivel 5 de warns, THE Bot SHALL expulsar automáticamente al Member de la Guild.
5. WHEN un Moderator ejecuta `/warn list <member>`, THE Bot SHALL responder con la lista de Warns activos del Member incluyendo razón, Moderator emisor y fecha.
6. WHEN un Moderator ejecuta `/warn remove <member> <id_warn>`, THE Bot SHALL eliminar el Warn especificado y confirmar la operación.
7. WHEN un Moderator ejecuta `/modlogs <member>`, THE Bot SHALL mostrar el registro completo de acciones de moderación (ban, kick, warn, timeout) del Member con opción de exportar a JSON o CSV.
8. THE Bot SHALL persistir los Warns en almacenamiento de base de datos para que sobrevivan reinicios del proceso.

---

### Requisito 3: Moderación — Filtro de palabras

**User Story:** Como Moderator, quiero configurar una lista de palabras prohibidas para que el Bot elimine automáticamente mensajes que las contengan.

#### Criterios de Aceptación

1. WHEN un mensaje publicado en la Guild contiene una palabra de la lista de palabras prohibidas, THE Bot SHALL eliminar el mensaje y notificar al Member mediante un mensaje efímero.
2. WHEN un Moderator ejecuta `/filtro add <palabra>`, THE Bot SHALL agregar la palabra a la lista y confirmar la operación.
3. WHEN un Moderator ejecuta `/filtro remove <palabra>`, THE Bot SHALL eliminar la palabra de la lista y confirmar la operación.
4. WHEN un Moderator ejecuta `/filtro list`, THE Bot SHALL responder con la lista completa de palabras prohibidas activas.
5. THE Bot SHALL aplicar el filtro de forma insensible a mayúsculas/minúsculas y a variaciones con caracteres especiales sustitutos (e.g., "@" por "a").

---

### Requisito 4: Moderación — Anti-spam

**User Story:** Como Moderator, quiero que el Bot detecte y sancione el spam automáticamente para evitar que miembros inunden los canales.

#### Criterios de Aceptación

1. WHEN un Member envía 5 o más mensajes en un mismo canal dentro de un intervalo de 5 segundos, THE Bot SHALL eliminar los mensajes excedentes y aplicar un timeout de 60 segundos al Member.
2. WHEN un Member envía el mismo contenido de mensaje 3 o más veces consecutivas en cualquier canal, THE Bot SHALL eliminar los duplicados y notificar al Member.
3. WHEN el sistema anti-spam sanciona a un Member, THE Bot SHALL registrar el evento en el AuditLog con el canal, el Member y la marca de tiempo.
4. WHERE el canal esté marcado como exento de anti-spam por un Moderator, THE Bot SHALL omitir la detección de spam en ese canal.

---

### Requisito 5: Utilidades — Limpieza de mensajes

**User Story:** Como Moderator, quiero poder eliminar mensajes en masa de un canal para limpiar contenido inapropiado rápidamente.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/purge <cantidad>` con un valor entre 1 y 100, THE Bot SHALL eliminar esa cantidad de mensajes recientes del canal y confirmar con el número real eliminado.
2. IF la cantidad proporcionada en `/purge` es menor que 1 o mayor que 100, THEN THE Bot SHALL responder con un mensaje de error indicando el rango válido.
3. WHEN un Moderator ejecuta `/purge <cantidad> user:<member>`, THE Bot SHALL eliminar únicamente los mensajes del Member especificado dentro de los últimos 100 mensajes del canal.

---

### Requisito 6: Utilidades — Encuestas y votaciones

**User Story:** Como Member, quiero crear encuestas con cierre automático y resultados en tiempo real para recopilar opiniones de la comunidad.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/poll <pregunta> <opción1> <opción2> [opción3..opción5]`, THE Bot SHALL publicar un embed con la pregunta y las opciones, añadiendo reacciones de emoji numeradas para votar.
2. WHEN un Member ejecuta `/poll close <id_mensaje>`, THE Bot SHALL editar el embed para mostrar los resultados finales con porcentajes y deshabilitar nuevas reacciones.
3. THE Bot SHALL aceptar entre 2 y 5 opciones por encuesta.
4. IF un Member intenta votar más de una vez en la misma encuesta, THEN THE Bot SHALL eliminar la reacción duplicada y mantener únicamente el voto más reciente.
5. WHEN un Member crea una encuesta con temporizador mediante `/poll <pregunta> <opciones> --tiempo <duración>`, THE Bot SHALL cerrar automáticamente la encuesta al expirar el temporizador y publicar los resultados finales.

---

### Requisito 7: Utilidades — Sistema de Tickets

**User Story:** Como Member, quiero abrir un ticket de soporte privado con categorías y transcripción automática para comunicarme con los Moderators.

#### Criterios de Aceptación

1. WHEN un Member hace clic en el botón "Abrir Ticket" del panel publicado por el Bot, THE Bot SHALL crear un canal de texto privado visible únicamente para el Member y los Moderators, con el nombre `ticket-<username>`.
2. WHEN un Moderator ejecuta `/ticket close` dentro de un canal de Ticket, THE Bot SHALL enviar la transcripción completa de la conversación al staff por DM, eliminar el canal y registrar el cierre en el AuditLog.
3. THE Bot SHALL limitar a 1 el número de Tickets abiertos simultáneamente por Member.
4. IF un Member intenta abrir un segundo Ticket mientras ya tiene uno abierto, THEN THE Bot SHALL responder con un mensaje efímero indicando el canal del Ticket existente.
5. WHEN un Member abre un Ticket, THE Bot SHALL presentar un menú de selección de categoría (soporte, reportes, sugerencias) antes de crear el canal.
6. WHEN un Moderator hace clic en el botón "Reclamar" dentro de un canal de Ticket, THE Bot SHALL asignar el ticket al Moderator y notificar al Member.
7. WHEN un Moderator ejecuta `/ticket close` dentro de un canal de Ticket, THE Bot SHALL generar y enviar la transcripción automáticamente al canal de staff configurado.

---

### Requisito 8: Utilidades — Respuestas automáticas

**User Story:** Como Moderator, quiero configurar respuestas automáticas con soporte de regex, imágenes y cooldown para responder preguntas frecuentes sin intervención manual.

#### Criterios de Aceptación

1. WHEN un mensaje en la Guild contiene una palabra clave configurada, THE Bot SHALL responder en el mismo canal con el texto o embed asociado a esa palabra clave.
2. WHEN un Moderator ejecuta `/autorespuesta add <trigger> <respuesta>`, THE Bot SHALL registrar la asociación trigger→respuesta y confirmar la operación.
3. WHEN un Moderator ejecuta `/autorespuesta remove <trigger>`, THE Bot SHALL eliminar la asociación y confirmar la operación.
4. THE Bot SHALL evaluar los triggers de respuestas automáticas de forma insensible a mayúsculas/minúsculas.
5. THE Bot SHALL persistir las respuestas automáticas en base de datos para que sobrevivan reinicios del proceso.
6. WHERE un trigger esté configurado como expresión regular, THE Bot SHALL evaluar el mensaje contra el patrón regex en lugar de una coincidencia exacta.
7. WHEN un Member activa una autorespuesta, THE Bot SHALL aplicar un cooldown por usuario para evitar respuestas repetidas al mismo Member dentro del período configurado.
8. WHERE una autorespuesta tenga una imagen o embed configurado, THE Bot SHALL incluir dicho contenido visual en la respuesta.

---

### Requisito 9: Utilidades — Recordatorios personales

**User Story:** Como Member, quiero configurar recordatorios personales con repetición para no olvidar eventos o tareas importantes.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/remindme <tiempo> <mensaje>`, THE Bot SHALL programar un recordatorio y mencionar al Member en el canal original cuando expire el tiempo.
2. WHEN un Member configura un recordatorio con repetición diaria o semanal, THE Bot SHALL reactivar automáticamente el recordatorio tras cada disparo.
3. THE Bot SHALL persistir los recordatorios en base de datos para que sobrevivan reinicios del proceso.

---

### Requisito 10: Utilidades — Información de usuarios y servidor

**User Story:** Como Member, quiero consultar información detallada de miembros y del servidor para conocer el estado de la comunidad.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/userinfo [@member]`, THE Bot SHALL responder con un embed que incluya: fecha de ingreso al servidor, fecha de creación de la cuenta, roles asignados, número de warns activos y nivel de XP.
2. WHEN un Member ejecuta `/serverinfo`, THE Bot SHALL responder con un panel completo del servidor que incluya: nombre, ID, fecha de creación, número de miembros, canales, roles y el propietario.

---

### Requisito 11: Entretenimiento — Reproductor de música

**User Story:** Como Member, quiero que el Bot reproduzca música con filtros de audio, letras y listas de reproducción personalizadas para amenizar las sesiones.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/play <url_o_búsqueda>` estando en un canal de voz, THE Bot SHALL unirse al canal de voz y comenzar a reproducir el audio.
2. WHEN un Member ejecuta `/skip`, THE Bot SHALL detener la pista actual y reproducir la siguiente en la cola.
3. WHEN un Member ejecuta `/queue`, THE Bot SHALL responder con la lista de pistas en cola incluyendo título, duración y duración restante estimada por posición.
4. WHEN un Member ejecuta `/stop`, THE Bot SHALL detener la reproducción, vaciar la cola y abandonar el canal de voz.
5. WHEN un Member ejecuta `/pause` o `/resume`, THE Bot SHALL pausar o reanudar la reproducción respectivamente.
6. IF la cola está vacía al terminar una pista, THEN THE Bot SHALL abandonar el canal de voz automáticamente tras 5 minutos de inactividad.
7. WHEN un Member ejecuta `/filter <nombre>` con un filtro válido (bassboost, nightcore), THE Bot SHALL aplicar el efecto de audio a la reproducción actual.
8. WHEN un Member ejecuta `/lyrics`, THE Bot SHALL buscar y mostrar la letra de la canción en reproducción actual.
9. WHEN un Member ejecuta `/playlist create <nombre>`, THE Bot SHALL crear una lista de reproducción personalizada asociada al Member.
10. WHEN un Member ejecuta `/playlist load <nombre>`, THE Bot SHALL cargar todas las pistas de la lista de reproducción especificada en la cola.
11. THE Bot SHALL mostrar controles de reproducción (pausa, skip, parar) como botones interactivos en el embed del reproductor.

---

### Requisito 12: Entretenimiento — Memes y GIFs

**User Story:** Como Member, quiero obtener memes y GIFs desde el Bot para compartir contenido de entretenimiento en la Guild.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/meme`, THE Bot SHALL obtener un meme aleatorio de Reddit y publicarlo como embed en el canal.
2. WHEN un Member ejecuta `/gif <búsqueda>`, THE Bot SHALL obtener un GIF relevante de la API de Tenor o Giphy y publicarlo en el canal.
3. IF la fuente externa de memes o GIFs no está disponible, THEN THE Bot SHALL responder con un mensaje de error descriptivo sin lanzar una excepción no controlada.

---

### Requisito 13: Entretenimiento — Juegos simples

**User Story:** Como Member, quiero jugar juegos de texto simples con el Bot para entretenimiento dentro de la Guild.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/trivia [categoría] [dificultad]`, THE Bot SHALL publicar una pregunta de trivia con 4 opciones como botones interactivos y registrar la respuesta del Member al hacer clic.
2. WHEN un Member ejecuta `/ruleta`, THE Bot SHALL simular una ruleta rusa con probabilidad de 1/6 y responder con el resultado mediante botones interactivos, mostrando estadísticas del usuario.
3. WHEN un Member ejecuta `/8ball <pregunta>`, THE Bot SHALL responder con una de las 20 respuestas estándar del 8-Ball mágico.
4. THE Bot SHALL impedir que un Member inicie una nueva partida de trivia mientras tiene una en curso.
5. THE Bot SHALL mantener una tabla de clasificación de trivia con los Members con más respuestas correctas.
6. WHEN un Member ejecuta `/blackjack <apuesta>`, THE Bot SHALL iniciar una partida de blackjack con apuesta en monedas virtuales, mostrando las cartas mediante botones interactivos (pedir, plantarse).
7. WHEN un Member ejecuta `/tictactoe @rival`, THE Bot SHALL iniciar una partida de tres en raya entre el Member y el rival especificado, con el tablero mostrado mediante botones interactivos.
8. WHEN un Member ejecuta `/hangman`, THE Bot SHALL iniciar una partida del ahorcado con una palabra aleatoria, mostrando el progreso mediante embed actualizable.

---

### Requisito 14: Economía — Sistema completo

**User Story:** Como Member, quiero participar en un sistema de economía virtual con rachas, tienda, trabajos y apuestas para acumular moneda y gastarla en recompensas.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/daily`, THE Bot SHALL otorgar entre 100 y 200 monedas al Member y registrar la fecha del cobro, permitiendo un único cobro por período de 24 horas.
2. IF un Member ejecuta `/daily` antes de que transcurran 24 horas desde el último cobro, THEN THE Bot SHALL responder con el tiempo restante hasta el próximo cobro disponible.
3. WHEN un Member mantiene una racha de cobros diarios consecutivos, THE Bot SHALL otorgar monedas adicionales proporcionales a la longitud de la racha.
4. WHEN un Member ejecuta `/balance`, THE Bot SHALL responder con el saldo actual de monedas del Member.
5. WHEN un Member ejecuta `/transfer <member> <cantidad>`, THE Bot SHALL mostrar un embed de confirmación con botones "Confirmar" y "Cancelar" antes de ejecutar la transferencia.
6. WHEN un Member confirma la transferencia, THE Bot SHALL deducir la cantidad del saldo del emisor y acreditarla al receptor, siempre que el emisor tenga saldo suficiente.
7. IF el Member emisor no tiene saldo suficiente para la transferencia, THEN THE Bot SHALL rechazar la operación y responder con el saldo actual disponible.
8. WHEN un Member ejecuta `/shop`, THE Bot SHALL mostrar la tienda del servidor con roles comprables e items personalizados configurados por el Moderator.
9. WHEN un Member ejecuta `/work`, THE Bot SHALL asignar un trabajo aleatorio al Member y otorgar una recompensa variable en monedas con un cooldown configurable.
10. WHEN un Member ejecuta `/rob @user`, THE Bot SHALL simular un intento de robo con probabilidad de éxito y riesgo de perder monedas propias si falla.
11. WHEN un Member ejecuta `/bet <cantidad>`, THE Bot SHALL iniciar una apuesta con probabilidad 50/50 de ganar o perder la cantidad especificada.
12. WHEN un Member ejecuta `/top` o `/richest`, THE Bot SHALL mostrar el ranking global de Members con más monedas, con barras de progreso ASCII.
13. THE Bot SHALL persistir los saldos de economía en base de datos para que sobrevivan reinicios del proceso.

---

### Requisito 15: Administración — Auto-rol y roles temporales

**User Story:** Como Moderator, quiero que el Bot asigne roles automáticamente al unirse y gestione roles temporales que se revocan solos.

#### Criterios de Aceptación

1. WHEN un nuevo Member se une a la Guild, THE Bot SHALL asignar el rol configurado como AutoRole al Member dentro de los 5 segundos siguientes a su ingreso.
2. WHEN un Moderator ejecuta `/autorole set <rol>`, THE Bot SHALL registrar el rol especificado como AutoRole activo y confirmar la operación.
3. WHEN un Moderator ejecuta `/autorole disable`, THE Bot SHALL desactivar el AutoRole y confirmar la operación.
4. IF el Bot no tiene permisos para asignar el rol configurado como AutoRole, THEN THE Bot SHALL notificar al canal de logs con un mensaje de error descriptivo.
5. WHEN un Moderator ejecuta `/temprole @user <rol> <duración>`, THE Bot SHALL asignar el rol especificado al Member y programar su revocación automática al expirar la duración.
6. WHEN expira la duración de un TempRole, THE Bot SHALL revocar el rol del Member automáticamente y registrar la acción en el AuditLog.

---

### Requisito 16: Administración — Registro de auditoría (AuditLog)

**User Story:** Como Moderator, quiero que todas las acciones administrativas queden registradas con más eventos para tener trazabilidad completa.

#### Criterios de Aceptación

1. THE Bot SHALL registrar en el canal de logs configurado cada una de las siguientes acciones: ban, kick, warn, unwarn, timeout, purge, apertura y cierre de tickets, cambios de configuración, edición y eliminación de mensajes, cambios de roles de Members, entrada y salida de Members, creación y eliminación de canales.
2. WHEN un Moderator ejecuta `/logs set <canal>`, THE Bot SHALL configurar el canal especificado como destino del AuditLog y confirmar la operación.
3. THE Bot SHALL incluir en cada entrada del AuditLog: tipo de acción, Member afectado, Moderator responsable y marca de tiempo en formato ISO 8601.
4. IF el canal de logs configurado es eliminado, THEN THE Bot SHALL desactivar el AuditLog y notificar al propietario de la Guild por DM.
5. WHERE un canal esté configurado como excluido del AuditLog, THE Bot SHALL omitir el registro de eventos de edición y eliminación de mensajes en ese canal.

---

### Requisito 17: Administración — Backup de canales

**User Story:** Como Moderator, quiero exportar y restaurar la estructura de la Guild con backups automáticos programados y restauración selectiva.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/backup create`, THE Bot SHALL exportar la estructura de canales y roles de la Guild a un archivo JSON y enviarlo al Moderator por DM.
2. WHEN un Moderator ejecuta `/backup restore <archivo>`, THE Bot SHALL recrear los canales y roles descritos en el archivo JSON adjunto, sin eliminar los existentes.
3. THE Backup_System SHALL incluir en el archivo exportado: nombre del canal, tipo (texto/voz/categoría), posición, permisos por rol y tema del canal.
4. IF el archivo proporcionado en `/backup restore` no es un JSON válido generado por el Bot, THEN THE Bot SHALL rechazar la operación y responder con un mensaje de error descriptivo.
5. WHERE el Moderator configure backups automáticos programados, THE Bot SHALL ejecutar el backup en el intervalo configurado y guardar el archivo en el canal privado especificado.
6. WHEN un Moderator ejecuta `/backup restore <archivo> --selectivo`, THE Bot SHALL mostrar una lista de canales y roles del backup para que el Moderator seleccione cuáles restaurar.

---

### Requisito 18: Administración — Gestión de eventos

**User Story:** Como Moderator, quiero crear y gestionar eventos programados con repetición y notificaciones a roles específicos.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/evento create <nombre> <fecha_ISO> <descripción>`, THE Bot SHALL crear un evento en la Guild y publicar un embed de anuncio en el canal configurado.
2. WHEN faltan 1 hora para el inicio de un evento programado, THE Bot SHALL publicar un recordatorio en el canal de anuncios mencionando a los Members que marcaron asistencia.
3. WHEN un Moderator ejecuta `/evento cancel <id>`, THE Bot SHALL cancelar el evento, notificar a los Members que marcaron asistencia y eliminar el embed de anuncio.
4. THE Bot SHALL verificar que la fecha proporcionada en `/evento create` sea posterior al momento actual antes de crear el evento.
5. WHERE un evento esté configurado con repetición semanal o mensual, THE Bot SHALL recrear automáticamente el evento tras cada ocurrencia.
6. WHERE un evento tenga un rol de notificación configurado, THE Bot SHALL mencionar a ese rol en el anuncio y en el recordatorio.

---

### Requisito 19: Giveaways

**User Story:** Como Moderator, quiero crear sorteos con participación mediante botón interactivo y notificación automática a los ganadores.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/gstart <duración> <premio> [cantidad_ganadores]`, THE Bot SHALL publicar un embed de giveaway con un botón "Participar" y un contador de participantes.
2. WHEN expira la duración del giveaway, THE Bot SHALL seleccionar aleatoriamente el número de ganadores configurado entre los participantes y notificarlos por mención en el canal.
3. WHEN un Moderator ejecuta `/gend <id>`, THE Bot SHALL finalizar el giveaway inmediatamente y seleccionar los ganadores.
4. WHEN un Moderator ejecuta `/glist`, THE Bot SHALL mostrar la lista de giveaways activos en la Guild con su ID, premio y tiempo restante.
5. THE Bot SHALL persistir los participantes de giveaways en base de datos para que sobrevivan reinicios del proceso.

---

### Requisito 20: Niveles y XP

**User Story:** Como Member, quiero acumular XP por actividad en el servidor y subir de nivel para obtener roles automáticos como recompensa.

#### Criterios de Aceptación

1. WHEN un Member envía un mensaje en la Guild, THE Bot SHALL otorgar XP al Member con un cooldown anti-spam de 60 segundos entre mensajes que otorgan XP.
2. WHEN un Member acumula suficiente XP para subir de nivel, THE Bot SHALL notificar al Member en el canal donde ocurrió el mensaje.
3. WHEN un Member ejecuta `/level`, THE Bot SHALL responder con el nivel actual, XP acumulado y XP necesario para el siguiente nivel, con una barra de progreso ASCII.
4. WHEN un Member ejecuta `/leaderboard`, THE Bot SHALL mostrar el ranking de los 10 Members con más XP en la Guild.
5. WHERE un nivel tenga un rol de recompensa configurado, THE Bot SHALL asignar automáticamente ese rol al Member al alcanzar dicho nivel.
6. THE Bot SHALL persistir los datos de XP y nivel en base de datos para que sobrevivan reinicios del proceso.

---

### Requisito 21: Personalización visual — Embeds y mensajes del Bot

**User Story:** Como Moderator, quiero crear embeds personalizados y hacer que el Bot repita mensajes para comunicaciones visuales en la Guild.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/embed`, THE Bot SHALL presentar un formulario interactivo para configurar título, descripción, color, imagen y campos del embed, y publicarlo en el canal actual.
2. WHEN un Moderator ejecuta `/say <mensaje>`, THE Bot SHALL publicar el mensaje en el canal actual como si fuera el Bot, eliminando el mensaje original del Moderator.
3. WHERE el Moderator especifique la opción `--embed` en `/say`, THE Bot SHALL publicar el mensaje dentro de un embed en lugar de texto plano.

---

### Requisito 22: Utilidades avanzadas

**User Story:** Como Member, quiero acceder a herramientas de utilidad como traducción, clima, Urban Dictionary, códigos QR y acortador de URLs directamente desde Discord.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/translate <texto> [idioma_destino]`, THE Bot SHALL traducir el texto al idioma especificado (por defecto español) usando una API de traducción y mostrar el resultado en un embed.
2. WHEN un Member ejecuta `/weather <ciudad>`, THE Bot SHALL obtener el clima actual y el pronóstico de la ciudad especificada y mostrarlo en un embed.
3. WHEN un Member ejecuta `/urban <término>`, THE Bot SHALL obtener la primera definición del término en Urban Dictionary y mostrarla en un embed.
4. WHEN un Member ejecuta `/qr <texto>`, THE Bot SHALL generar un código QR a partir del texto proporcionado y enviarlo como imagen en el canal.
5. WHEN un Member ejecuta `/shorten <url>`, THE Bot SHALL acortar la URL proporcionada usando un servicio de acortamiento y mostrar el resultado.
6. IF alguna API externa utilizada por las utilidades avanzadas no está disponible, THEN THE Bot SHALL responder con un mensaje de error descriptivo sin lanzar una excepción no controlada.

---

### Requisito 23: Sugerencias y reportes

**User Story:** Como Member, quiero enviar sugerencias con sistema de votos y reportes anónimos al staff para contribuir a la mejora del servidor.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/suggest <texto>`, THE Bot SHALL publicar la sugerencia en el canal de sugerencias configurado con reacciones 👍 y 👎 para votar.
2. WHEN un Moderator ejecuta `/suggest approve <id>` o `/suggest deny <id>`, THE Bot SHALL actualizar el embed de la sugerencia con el estado correspondiente y notificar al Member que la envió.
3. WHEN un Member ejecuta `/report <usuario> <razón>`, THE Bot SHALL enviar el reporte de forma anónima al canal de staff configurado, sin revelar la identidad del Member que reporta.
4. THE Bot SHALL persistir las sugerencias en base de datos para que sobrevivan reinicios del proceso.

---

### Requisito 24: Integraciones externas

**User Story:** Como Moderator, quiero recibir notificaciones automáticas de Twitch y YouTube y consultar posts de Reddit directamente desde Discord.

#### Criterios de Aceptación

1. WHEN un streamer configurado inicia una transmisión en Twitch, THE Bot SHALL publicar una notificación en el canal configurado con el título del stream y un enlace directo.
2. WHEN un canal de YouTube configurado publica un nuevo video, THE Bot SHALL publicar una notificación en el canal configurado con el título del video y un enlace directo.
3. WHEN un Member ejecuta `/reddit <subreddit>`, THE Bot SHALL obtener los posts más recientes del subreddit especificado y mostrarlos en un embed con paginación.
4. IF la API de Twitch o YouTube no está disponible, THEN THE Bot SHALL registrar el error en los logs sin interrumpir el funcionamiento del resto del Bot.

---

### Requisito 25: Herramientas de desarrollo

**User Story:** Como propietario del Bot, quiero herramientas de diagnóstico y utilidad para monitorear y gestionar el Bot directamente desde Discord.

#### Criterios de Aceptación

1. WHEN el propietario del Bot ejecuta `/eval <código>`, THE Bot SHALL ejecutar el código JavaScript en un entorno restringido y mostrar el resultado, limitando el acceso únicamente al propietario configurado.
2. WHEN un Member ejecuta `/ping`, THE Bot SHALL responder con la latencia del Bot y la latencia de la API de Discord en milisegundos.
3. WHEN un Member ejecuta `/invite`, THE Bot SHALL responder con el enlace de invitación del Bot con los permisos necesarios configurados.

---

### Requisito 26: Configuración por servidor

**User Story:** Como Moderator, quiero configurar todos los aspectos del Bot por servidor mediante un comando unificado para adaptar el comportamiento a las necesidades de la Guild.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/config prefix <prefijo>`, THE Bot SHALL actualizar el prefijo de comandos de texto para la Guild y confirmar la operación.
2. WHEN un Moderator ejecuta `/config modrole <rol>`, THE Bot SHALL registrar el rol especificado como rol de moderación y confirmar la operación.
3. WHEN un Moderator ejecuta `/config adminrole <rol>`, THE Bot SHALL registrar el rol especificado como rol de administración y confirmar la operación.
4. WHEN un Moderator ejecuta `/config logchannel <canal>`, THE Bot SHALL configurar el canal especificado como destino del AuditLog y confirmar la operación.
5. WHEN un Moderator ejecuta `/config mute_role <rol>`, THE Bot SHALL registrar el rol especificado como rol de mute y confirmar la operación.
6. THE Bot SHALL almacenar toda la configuración por servidor en base de datos (SQLite o PostgreSQL) para que sobreviva reinicios del proceso.
7. THE Bot SHALL aplicar la configuración específica de cada Guild de forma independiente, sin que los cambios en una Guild afecten a otras.

---

### Requisito 27: Optimizaciones técnicas — UX y rendimiento

**User Story:** Como Member, quiero que el Bot responda de forma robusta con mensajes de error amigables, cooldowns y paginación para una experiencia fluida.

#### Criterios de Aceptación

1. IF un comando falla por cualquier razón, THEN THE Bot SHALL responder con un mensaje de error amigable que describa el problema sin exponer detalles técnicos internos.
2. THE Bot SHALL aplicar cooldowns globales y por comando para evitar el abuso de comandos costosos.
3. THE Bot SHALL verificar los permisos del Member antes de ejecutar cualquier comando y responder con un mensaje de error descriptivo si los permisos son insuficientes.
4. WHEN el Bot muestra listas largas (cola de música, ranking, modlogs, etc.), THE Bot SHALL implementar paginación con botones ◀️ ▶️ para navegar entre páginas.
5. THE Bot SHALL utilizar botones y menús desplegables de Discord en lugar de reacciones o comandos de texto para todas las interacciones que lo permitan.
6. THE Bot SHALL migrar el almacenamiento de datos de archivos JSON a base de datos relacional (SQLite) o documental (MongoDB) para mejorar la consistencia y el rendimiento.
7. WHEN el sistema de warns notifica 3 warns acumulados, THE Bot SHALL enviar automáticamente una notificación al canal de logs configurado.

---

### Requisito 28: ChatBridge — Sincronización bidireccional Web ↔ Discord

**User Story:** Como visitante de la Web, quiero ver y enviar mensajes al canal de Discord en tiempo real desde la página para participar en la comunidad sin abrir Discord.

#### Criterios de Aceptación

1. WHEN un mensaje es publicado en el canal de Discord configurado como ChatBridge, THE Bridge SHALL retransmitirlo a todos los clientes Web conectados vía WebSocket en menos de 2 segundos.
2. WHEN un visitante de la Web envía un mensaje a través del componente de chat, THE Bridge SHALL publicar el mensaje en el canal de Discord con el formato `[Web] <nombre_usuario>`.
3. THE Web SHALL mostrar los mensajes del ChatBridge con scroll automático al mensaje más reciente, diferenciando visualmente los mensajes de Discord y los de la Web.
4. WHILE la conexión WebSocket entre la Web y el Bridge está interrumpida, THE Web SHALL mostrar un indicador de estado "desconectado" y reintentar la conexión cada 5 segundos.
5. IF un mensaje enviado desde la Web supera los 2000 caracteres, THEN THE Bridge SHALL rechazar el mensaje y notificar al visitante con un mensaje de error en el componente de chat.
6. THE Bridge SHALL exponer un endpoint REST `GET /api/messages?limit=50` que devuelva los últimos 50 mensajes del canal ChatBridge para la carga inicial del componente.

---

### Requisito 29: Bridge — Disponibilidad y persistencia

**User Story:** Como administrador del sistema, quiero que el Bot y el Bridge funcionen de forma continua (24/7) con reconexión automática y logs rotativos.

#### Criterios de Aceptación

1. THE Bot SHALL reconectarse automáticamente a la API de Discord en caso de desconexión, con un intervalo de reintento de entre 5 y 30 segundos con backoff exponencial.
2. THE Bridge SHALL reiniciarse automáticamente ante fallos no controlados mediante un gestor de procesos (PM2 o equivalente).
3. THE Bridge SHALL registrar en archivos de log rotativos todos los errores y eventos relevantes, con retención mínima de 7 días.
4. THE Bot SHALL cargar toda la configuración desde variables de entorno, sin valores sensibles en el código fuente.
5. IF la variable de entorno `DISCORD_TOKEN` no está definida al iniciar el Bot, THEN THE Bot SHALL terminar el proceso con un mensaje de error descriptivo y código de salida 1.

---

### Requisito 30: Seguridad y validación de entradas

**User Story:** Como administrador del sistema, quiero que el Bot y el Bridge validen todas las entradas externas para prevenir abusos y vulnerabilidades.

#### Criterios de Aceptación

1. THE Bridge SHALL validar que los mensajes recibidos desde la Web no contengan scripts o HTML antes de retransmitirlos a Discord (sanitización XSS).
2. THE Bridge SHALL implementar rate limiting de máximo 10 mensajes por minuto por dirección IP en el endpoint de envío de mensajes.
3. THE Bot SHALL ignorar todos los mensajes y comandos enviados por otros bots, a menos que estén explícitamente en una lista de bots de confianza configurada.
4. WHERE el modo de solo-lectura esté activado en el ChatBridge, THE Bridge SHALL rechazar los mensajes entrantes desde la Web y responder con código HTTP 403.

---

### Requisito 31: Personalidad y tono del Bot

**User Story:** Como Member de la Guild, quiero que el Bot se comunique con un estilo friki y auténtico con referencias a videojuegos, anime y cultura otaku para que los mensajes se sientan parte de la comunidad.

#### Criterios de Aceptación

1. THE Bot SHALL redactar todos los mensajes dirigidos a Members con un tono personal y cercano que incluya referencias sutiles a videojuegos, anime o cultura otaku, sin comprometer la claridad del mensaje.
2. WHEN el Bot notifica a un Member sobre un ban, THE Bot SHALL utilizar una estructura de mensaje con temática de "Game Over", seguido de la razón formal de la sanción.
3. WHEN el Bot notifica a un Member sobre un warn, THE Bot SHALL incluir una referencia al número de advertencias acumuladas con tono de alerta progresiva.
4. WHEN el Bot notifica a un Member sobre un kick, THE Bot SHALL utilizar una estructura de mensaje con temática de "expulsión de partida".
5. THE Bot SHALL mantener en todos los mensajes de personalidad la información estructural completa (razón, Member afectado, Moderator responsable cuando aplique).
6. THE Bot SHALL aplicar el tono de personalidad de forma consistente en todos los módulos, adaptando las referencias al contexto de cada acción.
7. THE Bot SHALL evitar referencias que puedan resultar ofensivas, discriminatorias o que trivialicen sanciones graves.
8. WHERE un Moderator configure el modo de mensajes en `formal`, THE Bot SHALL omitir el tono de personalidad y utilizar mensajes estrictamente formales en todos los módulos.

---

### Requisito 32: Experiencia Visual — Efectos y presentación dinámica

**User Story:** Como Member de la Guild, quiero que el Bot utilice colores, barras de progreso, GIFs y emojis de forma coherente para una experiencia visual inmersiva.

#### Criterios de Aceptación

1. THE Bot SHALL asignar el color del embed según el contexto: `#FF4444` para ban y kick, `#FFD700` para warns, `#44FF88` para confirmaciones exitosas, `#4488FF` para mensajes informativos y `#9B59B6` para entretenimiento y economía.
2. WHEN el Bot muestra el estado del reproductor de música, THE Bot SHALL incluir una barra de progreso ASCII de 20 caracteres que represente el porcentaje de reproducción y el nivel de volumen.
3. WHEN el Bot muestra el ranking de economía, THE Bot SHALL incluir una barra de progreso ASCII de 20 caracteres que represente el saldo del Member en relación al saldo máximo registrado.
4. WHEN el Bot ejecuta `/backup create`, THE Bot SHALL incluir una barra de progreso ASCII de 20 caracteres que se actualice por etapas hasta completar la exportación.
5. WHEN el Bot procesa una operación que requiere tiempo de cómputo perceptible, THE Bot SHALL invocar `channel.sendTyping()` antes de enviar la respuesta.
6. WHEN un nuevo Member se une a la Guild, THE Bot SHALL incluir en el embed de bienvenida un GIF temático obtenido de una URL configurada por el Moderator.
7. WHEN el Bot ejecuta un ban, THE Bot SHALL incluir en el embed un GIF temático de "game over" obtenido de una URL configurada por el Moderator.
8. WHEN el Bot crea un nuevo Ticket, THE Bot SHALL incluir en el embed de apertura un GIF temático de "soporte" obtenido de una URL configurada por el Moderator.
9. WHEN el Bot anuncia el inicio de un evento programado, THE Bot SHALL incluir en el embed un GIF temático de "evento" obtenido de una URL configurada por el Moderator.
10. IF una URL de GIF configurada no es accesible, THEN THE Bot SHALL omitir el campo de imagen del embed y continuar el envío sin lanzar una excepción no controlada.
11. WHEN el Bot publica un recordatorio de evento, THE Bot SHALL incluir en el embed una cuenta regresiva visual en formato `Xh Ym` calculada desde el momento del envío hasta la hora de inicio del evento.
12. WHEN un Member ejecuta `/daily` y el cobro no está disponible, THE Bot SHALL mostrar el tiempo restante en formato `Xh Ym Zs` dentro de una barra de progreso ASCII de 20 caracteres.
13. WHEN el Bot muestra la cola de reproducción, THE Bot SHALL incluir para cada pista la duración restante estimada en formato `Xm Ys`, calculada en función de la posición en la cola.
14. WHERE un Moderator configure el modo de mensajes en `formal`, THE Bot SHALL omitir los GIFs y emojis animados en todos los embeds, manteniendo únicamente los colores contextuales y las barras de progreso ASCII.

---

### Requisito 33: Página web — Actualización de comandos

**User Story:** Como visitante de la Web, quiero ver todos los comandos del Bot actualizados en la página web para conocer las funcionalidades disponibles.

#### Criterios de Aceptación

1. THE Web SHALL mostrar en la página de comandos todos los comandos nuevos añadidos al Bot, organizados por categoría (moderación, utilidades, entretenimiento, economía, administración, giveaways, niveles, utilidades avanzadas, herramientas dev).
2. THE Web SHALL incluir para cada comando: nombre, descripción, sintaxis de uso y permisos requeridos.
3. THE Web SHALL mantener la página de comandos sincronizada con los comandos realmente disponibles en el Bot.
