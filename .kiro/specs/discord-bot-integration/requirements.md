# Documento de Requisitos

## Introducción

Este documento describe los requisitos para la integración de un bot de Discord 24/7 con el sitio web existente "La Cueva" (React + TypeScript + Vite, desplegado en GitHub Pages). El sistema se compone de dos partes: el **Bot** (proceso Node.js independiente) y el **Bridge** (servidor intermedio que conecta Discord con la web). La integración incluye módulos de moderación, utilidades, entretenimiento, administración y un canal de chat bidireccional entre la web y Discord.

---

## Glosario

- **Bot**: El proceso Node.js que se conecta a la API de Discord mediante discord.js y ejecuta comandos.
- **Bridge**: Servidor backend (Node.js/Express + WebSocket) que actúa como intermediario entre el Bot y la Web.
- **Web**: El sitio React/TypeScript/Vite existente ("La Cueva"), desplegado en GitHub Pages.
- **Guild**: El servidor de Discord al que pertenece el Bot.
- **Moderator**: Usuario de Discord con permisos de moderación en la Guild.
- **Member**: Usuario de Discord que pertenece a la Guild.
- **Command**: Instrucción enviada al Bot mediante slash commands (`/comando`) o prefijo de texto.
- **Warn**: Advertencia formal registrada contra un Member por infracción de reglas.
- **Ticket**: Canal privado temporal creado para que un Member solicite soporte.
- **Economy**: Sistema de moneda virtual interna de la Guild.
- **AutoRole**: Rol asignado automáticamente a un Member al unirse a la Guild.
- **AuditLog**: Registro cronológico de acciones administrativas y de moderación.
- **Backup**: Copia exportada de la estructura de canales y roles de la Guild.
- **ChatBridge**: Funcionalidad que sincroniza mensajes entre un canal de Discord y la Web en tiempo real.
- **WebSocket**: Protocolo de comunicación bidireccional en tiempo real entre el Bridge y la Web.

---

## Requisitos

### Requisito 1: Moderación — Sanciones manuales y automáticas

**User Story:** Como Moderator, quiero poder banear y expulsar miembros manualmente o de forma automática ante infracciones graves, para mantener el orden en la Guild.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/ban <member> <razón>`, THE Bot SHALL banear al Member de la Guild y registrar la acción en el AuditLog.
2. WHEN un Moderator ejecuta `/kick <member> <razón>`, THE Bot SHALL expulsar al Member de la Guild y registrar la acción en el AuditLog.
3. WHEN un Member acumula 3 Warns activos, THE Bot SHALL expulsar automáticamente al Member de la Guild y notificar al canal de logs configurado.
4. WHEN un Member acumula 5 Warns activos en un período de 30 días, THE Bot SHALL banear automáticamente al Member de la Guild y notificar al canal de logs configurado.
5. IF el Member objetivo tiene un rol con permisos superiores al Moderator que ejecuta el comando, THEN THE Bot SHALL rechazar la acción y responder con un mensaje de error descriptivo.

---

### Requisito 2: Moderación — Filtro de palabras

**User Story:** Como Moderator, quiero configurar una lista de palabras prohibidas, para que el Bot elimine automáticamente mensajes que las contengan.

#### Criterios de Aceptación

1. WHEN un mensaje publicado en la Guild contiene una palabra de la lista de palabras prohibidas, THE Bot SHALL eliminar el mensaje y notificar al Member mediante un mensaje efímero.
2. WHEN un Moderator ejecuta `/filtro add <palabra>`, THE Bot SHALL agregar la palabra a la lista de palabras prohibidas y confirmar la operación.
3. WHEN un Moderator ejecuta `/filtro remove <palabra>`, THE Bot SHALL eliminar la palabra de la lista de palabras prohibidas y confirmar la operación.
4. WHEN un Moderator ejecuta `/filtro list`, THE Bot SHALL responder con la lista completa de palabras prohibidas activas.
5. THE Bot SHALL aplicar el filtro de palabras de forma insensible a mayúsculas/minúsculas y a variaciones con caracteres especiales sustitutos (e.g., "@" por "a").

---

### Requisito 3: Moderación — Anti-spam

**User Story:** Como Moderator, quiero que el Bot detecte y sancione el spam automáticamente, para evitar que miembros inunden los canales con mensajes repetitivos.

#### Criterios de Aceptación

1. WHEN un Member envía 5 o más mensajes en un mismo canal dentro de un intervalo de 5 segundos, THE Bot SHALL eliminar los mensajes excedentes y aplicar un timeout de 60 segundos al Member.
2. WHEN un Member envía el mismo contenido de mensaje 3 o más veces consecutivas en cualquier canal, THE Bot SHALL eliminar los duplicados y notificar al Member.
3. WHEN el sistema anti-spam sanciona a un Member, THE Bot SHALL registrar el evento en el AuditLog con el canal, el Member y la marca de tiempo.
4. WHERE el canal esté marcado como exento de anti-spam por un Moderator, THE Bot SHALL omitir la detección de spam en ese canal.

---

### Requisito 4: Moderación — Sistema de Warns

**User Story:** Como Moderator, quiero gestionar advertencias formales para los miembros, para llevar un historial de infracciones y aplicar sanciones progresivas.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/warn <member> <razón>`, THE Bot SHALL registrar un Warn activo para el Member, notificar al Member por mensaje directo y registrar la acción en el AuditLog.
2. WHEN un Moderator ejecuta `/warns <member>`, THE Bot SHALL responder con la lista de Warns activos del Member, incluyendo razón, Moderator que lo emitió y fecha.
3. WHEN un Moderator ejecuta `/unwarn <member> <id_warn>`, THE Bot SHALL eliminar el Warn especificado del registro del Member y confirmar la operación.
4. THE Bot SHALL persistir los Warns en almacenamiento local (archivo JSON o base de datos SQLite) para que sobrevivan reinicios del proceso.

---

### Requisito 5: Utilidades — Limpieza de mensajes

**User Story:** Como Moderator, quiero poder eliminar mensajes en masa de un canal, para limpiar contenido inapropiado o spam rápidamente.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/purge <cantidad>` con un valor entre 1 y 100, THE Bot SHALL eliminar esa cantidad de mensajes recientes del canal y confirmar la operación con el número real de mensajes eliminados.
2. IF la cantidad proporcionada en `/purge` es menor que 1 o mayor que 100, THEN THE Bot SHALL responder con un mensaje de error indicando el rango válido.
3. WHEN un Moderator ejecuta `/purge <cantidad> user:<member>`, THE Bot SHALL eliminar únicamente los mensajes del Member especificado dentro de los últimos 100 mensajes del canal.

---

### Requisito 6: Utilidades — Encuestas y votaciones

**User Story:** Como Member, quiero crear encuestas en Discord, para recopilar opiniones de la comunidad de forma estructurada.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/poll <pregunta> <opción1> <opción2> [opción3..opción5]`, THE Bot SHALL publicar un embed con la pregunta y las opciones, añadiendo reacciones de emoji numeradas para votar.
2. WHEN un Member ejecuta `/poll close <id_mensaje>`, THE Bot SHALL editar el embed de la encuesta para mostrar los resultados finales con porcentajes y deshabilitar nuevas reacciones.
3. THE Bot SHALL aceptar entre 2 y 5 opciones por encuesta.
4. IF un Member intenta votar más de una vez en la misma encuesta, THEN THE Bot SHALL eliminar la reacción duplicada y mantener únicamente el voto más reciente.

---

### Requisito 7: Utilidades — Sistema de Tickets

**User Story:** Como Member, quiero abrir un ticket de soporte privado, para comunicarme con los Moderators sin exponer la conversación al resto de la Guild.

#### Criterios de Aceptación

1. WHEN un Member hace clic en el botón "Abrir Ticket" publicado por el Bot, THE Bot SHALL crear un canal de texto privado visible únicamente para el Member y los Moderators, con el nombre `ticket-<username>`.
2. WHEN un Moderator ejecuta `/ticket close` dentro de un canal de Ticket, THE Bot SHALL enviar un resumen de la conversación al Member por mensaje directo, eliminar el canal y registrar el cierre en el AuditLog.
3. THE Bot SHALL limitar a 1 el número de Tickets abiertos simultáneamente por Member.
4. IF un Member intenta abrir un segundo Ticket mientras ya tiene uno abierto, THEN THE Bot SHALL responder con un mensaje efímero indicando el canal del Ticket existente.

---

### Requisito 8: Utilidades — Respuestas automáticas

**User Story:** Como Moderator, quiero configurar respuestas automáticas a palabras clave, para responder preguntas frecuentes sin intervención manual.

#### Criterios de Aceptación

1. WHEN un mensaje en la Guild contiene una palabra clave configurada, THE Bot SHALL responder en el mismo canal con el texto asociado a esa palabra clave.
2. WHEN un Moderator ejecuta `/autorespuesta add <trigger> <respuesta>`, THE Bot SHALL registrar la asociación trigger→respuesta y confirmar la operación.
3. WHEN un Moderator ejecuta `/autorespuesta remove <trigger>`, THE Bot SHALL eliminar la asociación y confirmar la operación.
4. THE Bot SHALL evaluar los triggers de respuestas automáticas de forma insensible a mayúsculas/minúsculas.
5. THE Bot SHALL persistir las respuestas automáticas en almacenamiento local para que sobrevivan reinicios del proceso.

---

### Requisito 9: Entretenimiento — Reproductor de música

**User Story:** Como Member, quiero que el Bot reproduzca música en un canal de voz, para amenizar las sesiones en la Guild.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/play <url_o_búsqueda>` estando en un canal de voz, THE Bot SHALL unirse al canal de voz del Member y comenzar a reproducir el audio de la URL o del primer resultado de búsqueda en YouTube.
2. WHEN un Member ejecuta `/skip`, THE Bot SHALL detener la pista actual y reproducir la siguiente en la cola.
3. WHEN un Member ejecuta `/queue`, THE Bot SHALL responder con la lista de pistas en cola, incluyendo título y duración.
4. WHEN un Member ejecuta `/stop`, THE Bot SHALL detener la reproducción, vaciar la cola y abandonar el canal de voz.
5. WHEN un Member ejecuta `/pause` o `/resume`, THE Bot SHALL pausar o reanudar la reproducción respectivamente.
6. IF la cola está vacía al terminar una pista, THEN THE Bot SHALL abandonar el canal de voz automáticamente tras 5 minutos de inactividad.

---

### Requisito 10: Entretenimiento — Memes y GIFs

**User Story:** Como Member, quiero obtener memes y GIFs desde el Bot, para compartir contenido de entretenimiento en la Guild.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/meme`, THE Bot SHALL obtener un meme aleatorio de una fuente pública (Reddit API o similar) y publicarlo como embed en el canal.
2. WHEN un Member ejecuta `/gif <búsqueda>`, THE Bot SHALL obtener un GIF relevante de la API de Tenor o Giphy y publicarlo en el canal.
3. IF la fuente externa de memes o GIFs no está disponible, THEN THE Bot SHALL responder con un mensaje de error descriptivo sin lanzar una excepción no controlada.

---

### Requisito 11: Entretenimiento — Juegos simples

**User Story:** Como Member, quiero jugar juegos de texto simples con el Bot, para entretenimiento dentro de la Guild.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/trivia`, THE Bot SHALL publicar una pregunta de trivia con 4 opciones como botones interactivos y registrar la respuesta del Member al hacer clic.
2. WHEN un Member ejecuta `/ruleta`, THE Bot SHALL simular una ruleta rusa con probabilidad de 1/6 y responder con el resultado (click o disparo).
3. WHEN un Member ejecuta `/8ball <pregunta>`, THE Bot SHALL responder con una de las 20 respuestas estándar del 8-Ball mágico.
4. THE Bot SHALL impedir que un Member inicie una nueva partida de trivia mientras tiene una en curso.

---

### Requisito 12: Entretenimiento — Economía virtual

**User Story:** Como Member, quiero participar en un sistema de economía virtual, para acumular moneda y gastarla en recompensas dentro de la Guild.

#### Criterios de Aceptación

1. WHEN un Member ejecuta `/daily`, THE Bot SHALL otorgar entre 100 y 200 monedas al Member y registrar la fecha del cobro, permitiendo un único cobro por período de 24 horas.
2. IF un Member ejecuta `/daily` antes de que transcurran 24 horas desde el último cobro, THEN THE Bot SHALL responder con el tiempo restante hasta el próximo cobro disponible.
3. WHEN un Member ejecuta `/balance`, THE Bot SHALL responder con el saldo actual de monedas del Member.
4. WHEN un Member ejecuta `/transfer <member> <cantidad>`, THE Bot SHALL deducir la cantidad del saldo del Member emisor y acreditarla al Member receptor, siempre que el emisor tenga saldo suficiente.
5. IF el Member emisor no tiene saldo suficiente para la transferencia, THEN THE Bot SHALL rechazar la operación y responder con el saldo actual disponible.
6. THE Bot SHALL persistir los saldos de economía en almacenamiento local para que sobrevivan reinicios del proceso.

---

### Requisito 13: Administración — Auto-rol al unirse

**User Story:** Como Moderator, quiero que el Bot asigne automáticamente un rol a los nuevos miembros, para que tengan acceso inmediato a los canales básicos de la Guild.

#### Criterios de Aceptación

1. WHEN un nuevo Member se une a la Guild, THE Bot SHALL asignar el rol configurado como AutoRole al Member dentro de los 5 segundos siguientes a su ingreso.
2. WHEN un Moderator ejecuta `/autorole set <rol>`, THE Bot SHALL registrar el rol especificado como AutoRole activo y confirmar la operación.
3. WHEN un Moderator ejecuta `/autorole disable`, THE Bot SHALL desactivar el AutoRole y confirmar la operación.
4. IF el Bot no tiene permisos para asignar el rol configurado como AutoRole, THEN THE Bot SHALL notificar al canal de logs configurado con un mensaje de error descriptivo.

---

### Requisito 14: Administración — Registro de auditoría (AuditLog)

**User Story:** Como Moderator, quiero que todas las acciones administrativas queden registradas en un canal dedicado, para tener trazabilidad completa de los eventos de la Guild.

#### Criterios de Aceptación

1. THE Bot SHALL registrar en el canal de logs configurado cada una de las siguientes acciones: ban, kick, warn, unwarn, purge, apertura y cierre de tickets, cambios de configuración del Bot.
2. WHEN un Moderator ejecuta `/logs set <canal>`, THE Bot SHALL configurar el canal especificado como destino del AuditLog y confirmar la operación.
3. THE Bot SHALL incluir en cada entrada del AuditLog: tipo de acción, Member afectado, Moderator responsable y marca de tiempo en formato ISO 8601.
4. IF el canal de logs configurado es eliminado, THEN THE Bot SHALL desactivar el AuditLog y notificar a los Moderators mediante un mensaje directo al propietario de la Guild.

---

### Requisito 15: Administración — Backup de canales

**User Story:** Como Moderator, quiero exportar la estructura de canales y roles de la Guild, para poder restaurarla en caso de pérdida accidental.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/backup create`, THE Bot SHALL exportar la estructura de canales (nombres, categorías, permisos) y roles de la Guild a un archivo JSON y enviarlo al Moderator por mensaje directo.
2. WHEN un Moderator ejecuta `/backup restore <archivo>`, THE Bot SHALL recrear los canales y roles descritos en el archivo JSON adjunto, sin eliminar los existentes.
3. THE Backup_System SHALL incluir en el archivo exportado: nombre del canal, tipo (texto/voz/categoría), posición, permisos por rol y tema del canal.
4. IF el archivo proporcionado en `/backup restore` no es un JSON válido generado por el Bot, THEN THE Bot SHALL rechazar la operación y responder con un mensaje de error descriptivo.

---

### Requisito 16: Administración — Gestión de eventos

**User Story:** Como Moderator, quiero crear y gestionar eventos programados en la Guild, para organizar actividades comunitarias con recordatorios automáticos.

#### Criterios de Aceptación

1. WHEN un Moderator ejecuta `/evento create <nombre> <fecha_ISO> <descripción>`, THE Bot SHALL crear un evento en la Guild de Discord y publicar un embed de anuncio en el canal configurado.
2. WHEN faltan 1 hora para el inicio de un evento programado, THE Bot SHALL publicar un recordatorio en el canal de anuncios configurado mencionando a los Members que marcaron asistencia.
3. WHEN un Moderator ejecuta `/evento cancel <id>`, THE Bot SHALL cancelar el evento, notificar a los Members que marcaron asistencia y eliminar el embed de anuncio.
4. THE Bot SHALL verificar que la fecha proporcionada en `/evento create` sea posterior al momento actual antes de crear el evento.

---

### Requisito 17: ChatBridge — Sincronización bidireccional Web ↔ Discord

**User Story:** Como visitante de la Web, quiero ver y enviar mensajes al canal de Discord en tiempo real desde la página, para participar en la comunidad sin necesidad de abrir Discord.

#### Criterios de Aceptación

1. WHEN un mensaje es publicado en el canal de Discord configurado como ChatBridge, THE Bridge SHALL retransmitirlo a todos los clientes Web conectados vía WebSocket en menos de 2 segundos.
2. WHEN un visitante de la Web envía un mensaje a través del componente de chat, THE Bridge SHALL publicar el mensaje en el canal de Discord configurado como ChatBridge, identificando al autor con el formato `[Web] <nombre_usuario>`.
3. THE Web SHALL mostrar los mensajes del ChatBridge en un componente de chat con scroll automático al mensaje más reciente, diferenciando visualmente los mensajes de Discord y los mensajes de la Web.
4. WHILE la conexión WebSocket entre la Web y el Bridge está interrumpida, THE Web SHALL mostrar un indicador de estado "desconectado" y reintentar la conexión cada 5 segundos.
5. IF un mensaje enviado desde la Web supera los 2000 caracteres, THEN THE Bridge SHALL rechazar el mensaje y notificar al visitante con un mensaje de error en el componente de chat.
6. THE Bridge SHALL exponer un endpoint REST `GET /api/messages?limit=50` que devuelva los últimos 50 mensajes del canal ChatBridge para la carga inicial del componente.

---

### Requisito 18: Bridge — Disponibilidad y persistencia

**User Story:** Como administrador del sistema, quiero que el Bot y el Bridge funcionen de forma continua (24/7), para garantizar disponibilidad permanente del servicio.

#### Criterios de Aceptación

1. THE Bot SHALL reconectarse automáticamente a la API de Discord en caso de desconexión, con un intervalo de reintento de entre 5 y 30 segundos con backoff exponencial.
2. THE Bridge SHALL reiniciarse automáticamente ante fallos no controlados mediante un gestor de procesos (PM2 o equivalente).
3. THE Bridge SHALL registrar en archivos de log rotativos todos los errores y eventos relevantes del sistema, con retención mínima de 7 días.
4. THE Bot SHALL cargar toda la configuración (tokens, IDs de canales, prefijos) desde variables de entorno, sin valores sensibles en el código fuente.
5. IF la variable de entorno `DISCORD_TOKEN` no está definida al iniciar el Bot, THEN THE Bot SHALL terminar el proceso con un mensaje de error descriptivo y código de salida 1.

---

### Requisito 19: Seguridad y validación de entradas

**User Story:** Como administrador del sistema, quiero que el Bot y el Bridge validen todas las entradas externas, para prevenir abusos y vulnerabilidades de seguridad.

#### Criterios de Aceptación

1. THE Bridge SHALL validar que los mensajes recibidos desde la Web no contengan scripts o HTML antes de retransmitirlos a Discord (sanitización XSS).
2. THE Bridge SHALL implementar rate limiting de máximo 10 mensajes por minuto por dirección IP en el endpoint de envío de mensajes desde la Web.
3. THE Bot SHALL ignorar todos los mensajes y comandos enviados por otros bots, a menos que estén explícitamente en una lista de bots de confianza configurada.
4. WHERE el modo de solo-lectura esté activado en el ChatBridge, THE Bridge SHALL rechazar los mensajes entrantes desde la Web y responder con código HTTP 403.

---

### Requisito 20: Personalidad y tono del Bot

**User Story:** Como Member de la Guild, quiero que el Bot se comunique con un estilo friki y auténtico con referencias a videojuegos, anime y cultura otaku, para que los mensajes se sientan parte de la comunidad y no como respuestas genéricas de un bot.

#### Criterios de Aceptación

1. THE Bot SHALL redactar todos los mensajes dirigidos a Members (notificaciones de sanciones, advertencias, confirmaciones de comandos) con un tono personal y cercano que incluya referencias sutiles a videojuegos, anime o cultura otaku, sin comprometer la claridad del mensaje.
2. WHEN el Bot notifica a un Member sobre un ban, THE Bot SHALL utilizar una estructura de mensaje con temática de "Game Over", por ejemplo: `Game Over, <member>. Tu run en este servidor ha terminado.`, seguido de la razón formal de la sanción.
3. WHEN el Bot notifica a un Member sobre un warn, THE Bot SHALL incluir una referencia al número de advertencias acumuladas con tono de alerta progresiva, por ejemplo: `Ojo, <member> — ya llevas <n> advertencias. Esto no es un tutorial, las consecuencias son reales.`
4. WHEN el Bot notifica a un Member sobre un kick, THE Bot SHALL utilizar una estructura de mensaje con temática de "expulsión de partida", por ejemplo: `Has sido desconectado del servidor, <member>. Respawn disponible si corriges tu comportamiento.`
5. THE Bot SHALL mantener en todos los mensajes de personalidad la información estructural completa (razón, Member afectado, Moderator responsable cuando aplique), de forma que el tono friki sea un envoltorio del contenido formal, no un sustituto.
6. THE Bot SHALL aplicar el tono de personalidad de forma consistente en todos los módulos (moderación, economía, tickets, entretenimiento), adaptando las referencias al contexto de cada acción sin forzar referencias que no encajen.
7. THE Bot SHALL evitar referencias que puedan resultar ofensivas, discriminatorias o que trivialicen sanciones graves; el tono friki SHALL ser sutil y comunitario, no burlesco.
8. WHERE un Moderator configure el modo de mensajes en `formal`, THE Bot SHALL omitir el tono de personalidad y utilizar mensajes estrictamente formales en todos los módulos.

---

### Requisito 21: Experiencia Visual — Efectos y presentación dinámica

**User Story:** Como Member de la Guild, quiero que el Bot utilice colores, barras de progreso, indicadores de escritura, GIFs y emojis animados de forma coherente, para que la experiencia visual sea inmersiva y contextualmente significativa dentro de las limitaciones de Discord.

#### Criterios de Aceptación

1. THE Bot SHALL asignar el color del embed según el contexto de la acción: `#FF4444` para ban y kick, `#FFD700` para warns, `#44FF88` para confirmaciones y acciones exitosas, `#4488FF` para mensajes informativos y `#9B59B6` para comandos de entretenimiento y economía.

2. WHEN el Bot muestra el estado del reproductor de música mediante `/queue` o `/play`, THE Bot SHALL incluir una barra de progreso en ASCII de 20 caracteres que represente el porcentaje de reproducción de la pista actual y el nivel de volumen configurado.

3. WHEN el Bot muestra el ranking de economía, THE Bot SHALL incluir una barra de progreso en ASCII de 20 caracteres que represente el saldo del Member en relación al saldo máximo registrado en la Guild.

4. WHEN el Bot ejecuta `/backup create`, THE Bot SHALL incluir una barra de progreso en ASCII de 20 caracteres en el mensaje de estado que se actualice por etapas (canales, roles, permisos) hasta completar la exportación.

5. WHEN el Bot procesa una operación que requiere tiempo de cómputo perceptible — incluyendo búsquedas de música, generación de preguntas de trivia y creación de backup — THE Bot SHALL invocar `channel.sendTyping()` antes de enviar la respuesta, para indicar actividad al Member.

6. WHEN un nuevo Member se une a la Guild, THE Bot SHALL incluir en el embed de bienvenida un GIF temático de anime o videojuegos obtenido de una URL configurada por el Moderator.

7. WHEN el Bot ejecuta un ban, THE Bot SHALL incluir en el embed de notificación un GIF temático de "game over" o "eliminación" obtenido de una URL configurada por el Moderator.

8. WHEN el Bot crea un nuevo Ticket, THE Bot SHALL incluir en el embed de apertura un GIF temático de "soporte" o "bienvenida" obtenido de una URL configurada por el Moderator.

9. WHEN el Bot anuncia el inicio de un evento programado, THE Bot SHALL incluir en el embed de anuncio un GIF temático de "evento" o "celebración" obtenido de una URL configurada por el Moderator.

10. IF una URL de GIF configurada no es accesible en el momento de enviar el embed, THEN THE Bot SHALL omitir el campo de imagen del embed y continuar el envío sin lanzar una excepción no controlada.

11. THE Bot SHALL integrar emojis animados del servidor en los mensajes de moderación, economía y entretenimiento como parte del tono visual, utilizando únicamente emojis disponibles en la Guild para evitar que se muestren como texto plano.

12. WHEN el Bot publica un recordatorio de evento, THE Bot SHALL incluir en el embed una cuenta regresiva visual en formato `Xh Ym` calculada desde el momento del envío hasta la hora de inicio del evento.

13. WHEN un Member ejecuta `/daily` y el cobro no está disponible, THE Bot SHALL mostrar el tiempo restante en formato visual `Xh Ym Zs` dentro de una barra de progreso en ASCII de 20 caracteres que represente el porcentaje de tiempo transcurrido del período de 24 horas.

14. WHEN el Bot muestra la cola de reproducción mediante `/queue`, THE Bot SHALL incluir para cada pista la duración restante estimada en formato `Xm Ys`, calculada en función de la posición en la cola y la duración de las pistas precedentes.

15. WHERE un Moderator configure el modo de mensajes en `formal`, THE Bot SHALL omitir los GIFs y emojis animados en todos los embeds, manteniendo únicamente los colores contextuales y las barras de progreso en ASCII.
