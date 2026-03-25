# Plan de Implementación: Discord Bot Integration

## Visión General

Implementación incremental del bot de Discord, el servidor Bridge y el componente ChatBridge.tsx para la web existente. Cada fase construye sobre la anterior y termina con integración funcional. El lenguaje de implementación es **TypeScript**.

## Tareas

- [x] 1. Setup del proyecto
  - Crear `discord-bot/` con estructura de carpetas: `src/modules/`, `src/handlers/`, `src/utils/`, `src/types/`, `bridge/`, `data/`, `logs/`
  - Crear `discord-bot/package.json` con dependencias: `discord.js@14`, `@discordjs/voice`, `@discordjs/rest`, `express`, `ws`, `winston`, `winston-daily-rotate-file`, `uuid`, `dotenv`, `fast-check` (dev), `vitest` (dev), `typescript` (dev), `@types/*`
  - Crear `discord-bot/tsconfig.json` con `target: ES2022`, `module: NodeNext`, `strict: true`
  - Crear `discord-bot/.env.example` con todas las variables documentadas en el diseño
  - Crear `discord-bot/src/types/index.ts` con interfaces `SlashCommand`, `Warn`, `EconomyEntry`, `BridgeMessage`, `GuildConfig`
  - _Requirements: 18.4_


- [x] 2. Utilidades base
  - [x] 2.1 Implementar `src/utils/logger.ts`
    - Configurar Winston con transporte de consola y `DailyRotateFile` (retención 7 días)
    - _Requirements: 18.3_

  - [x] 2.2 Implementar `src/utils/sanitize.ts`
    - Función `sanitize(text: string): string` que elimina tags HTML y atributos de evento
    - _Requirements: 19.1_

  - [ ]* 2.3 Escribir property test para sanitize
    - **Property 30: Sanitización XSS en mensajes del Bridge**
    - **Validates: Requirements 19.1**

  - [x] 2.4 Implementar `src/utils/progressBar.ts`
    - Función `progressBar(value: number, max: number, length?: number): string` que genera barra ASCII de 20 chars
    - _Requirements: 21.2, 21.3, 21.4, 21.13_

  - [ ]* 2.5 Escribir property test para progressBar
    - **Property 37: Barras de progreso ASCII tienen longitud exacta de 20 caracteres**
    - **Validates: Requirements 21.2, 21.3, 21.4, 21.13**

  - [x] 2.6 Implementar `src/utils/personality.ts`
    - Función `getMessage(type: MessageType, params: Record<string, string>, mode: "friki" | "formal"): string`
    - Plantillas para ban, kick, warn, daily, ticketOpen en ambos modos
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

  - [ ]* 2.7 Escribir property tests para personality
    - **Property 34: Mensajes de personalidad contienen información estructural completa**
    - **Property 35: Modo formal omite tono de personalidad**
    - **Validates: Requirements 20.2, 20.3, 20.4, 20.5, 20.8**

  - [x] 2.8 Implementar `src/utils/embeds.ts`
    - Constante `EMBED_COLORS` y helpers `buildEmbed(type, fields)` con colores contextuales
    - _Requirements: 21.1_

  - [ ]* 2.9 Escribir property test para embeds
    - **Property 36: Colores de embed corresponden al tipo de acción**
    - **Validates: Requirements 21.1**

  - [x] 2.10 Implementar `src/config.ts`
    - Leer y validar variables de entorno; `process.exit(1)` si `DISCORD_TOKEN` no está definido
    - _Requirements: 18.4, 18.5_


- [x] 3. Entry point, handlers y cliente
  - [x] 3.1 Implementar `src/client.ts`
    - Instancia de `Client` con intents: `Guilds`, `GuildMembers`, `GuildMessages`, `MessageContent`, `GuildVoiceStates`
    - _Requirements: 18.1_

  - [x] 3.2 Implementar `src/handlers/commandHandler.ts`
    - Cargar archivos de comandos desde `modules/`, registrar en Discord vía REST al iniciar, despachar en `interactionCreate`
    - _Requirements: 1.1, 1.2_

  - [x] 3.3 Implementar `src/handlers/eventHandler.ts`
    - Cargar y registrar listeners: `guildMemberAdd`, `messageCreate`, `interactionCreate`, `channelDelete`
    - _Requirements: 13.1, 14.4_

  - [x] 3.4 Implementar `src/index.ts`
    - Cargar `.env`, inicializar config, registrar comandos, iniciar cliente, conectar al Bridge
    - _Requirements: 18.1, 18.4, 18.5_

- [~] 4. Checkpoint — Verificar que el bot arranca y se conecta a Discord
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.


- [x] 5. Módulo de moderación
  - [x] 5.1 Implementar `src/modules/moderation/warn.ts`
    - Comando `/warn`, `/warns`, `/unwarn`; persistencia en `data/warns.json`; sanciones automáticas (kick a 3 warns, ban a 5 warns en 30 días)
    - _Requirements: 1.3, 1.4, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 5.2 Escribir property tests para warn
    - **Property 2: Auto-sanción progresiva por warns**
    - **Property 8: Round-trip de warns**
    - **Property 9: Persistencia de warns sobrevive reinicios**
    - **Validates: Requirements 1.3, 1.4, 4.1, 4.2, 4.3, 4.4**

  - [x] 5.3 Implementar `src/modules/moderation/ban.ts` y `kick.ts`
    - Comandos `/ban` y `/kick`; verificación de jerarquía de roles; registro en AuditLog
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ]* 5.4 Escribir property test para jerarquía de permisos
    - **Property 1: Jerarquía de permisos impide acciones sobre roles superiores**
    - **Validates: Requirements 1.5**

  - [x] 5.5 Implementar `src/modules/moderation/wordFilter.ts`
    - Comandos `/filtro add|remove|list`; detección insensible a mayúsculas y sustituciones; persistencia en `data/wordFilter.json`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 5.6 Escribir property tests para wordFilter
    - **Property 3: Round-trip del filtro de palabras**
    - **Property 4: Filtro insensible a mayúsculas y sustituciones**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

  - [x] 5.7 Implementar `src/modules/moderation/antiSpam.ts`
    - Detección de 5+ mensajes en 5s (timeout 60s) y 3+ mensajes duplicados consecutivos; registro en AuditLog; canales exentos
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 5.8 Escribir property tests para antiSpam
    - **Property 5: Anti-spam por velocidad elimina excedentes**
    - **Property 6: Anti-spam por duplicados elimina repeticiones**
    - **Validates: Requirements 3.1, 3.2**

- [ ] 6. Checkpoint — Verificar que todos los tests de moderación pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.


- [x] 7. Módulo de utilidades
  - [x] 7.1 Implementar `src/modules/utilities/purge.ts`
    - Comando `/purge <cantidad> [user:<member>]`; validación rango [1,100]; filtro por usuario
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 7.2 Escribir property tests para purge
    - **Property 10: Purge respeta rango válido**
    - **Property 11: Purge por usuario filtra correctamente**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 7.3 Implementar `src/modules/utilities/poll.ts`
    - Comando `/poll` con 2–5 opciones; reacciones numeradas; `/poll close`; un voto por miembro
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 7.4 Escribir property tests para poll
    - **Property 12: Invariante de un voto por miembro en encuestas**
    - **Property 13: Porcentajes de encuesta suman 100%**
    - **Validates: Requirements 6.2, 6.4**

  - [x] 7.5 Implementar `src/modules/utilities/tickets.ts`
    - Botón "Abrir Ticket"; creación de canal `ticket-<username>`; límite 1 ticket por miembro; `/ticket close` con resumen por DM
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 7.6 Escribir property test para tickets
    - **Property 14: Límite de un ticket abierto por miembro**
    - **Validates: Requirements 7.3, 7.4**

  - [x] 7.7 Implementar `src/modules/utilities/autoReply.ts`
    - Comandos `/autorespuesta add|remove`; evaluación insensible a mayúsculas; persistencia en `data/autoReplies.json`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 7.8 Escribir property tests para autoReply
    - **Property 15: Round-trip de autorespuestas**
    - **Property 16: Persistencia de autorespuestas sobrevive reinicios**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 8. Checkpoint — Verificar que todos los tests de utilidades pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.


- [x] 9. Módulo de entretenimiento
  - [x] 9.1 Implementar `src/modules/entertainment/music.ts`
    - Comandos `/play`, `/skip`, `/queue`, `/stop`, `/pause`, `/resume`; cola FIFO; barra de progreso en `/queue`; abandono tras 5 min de inactividad
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 21.2, 21.14_

  - [ ]* 9.2 Escribir property tests para music
    - **Property 17: Cola de música mantiene orden FIFO**
    - **Property 40: Duración restante en cola es calculada correctamente**
    - **Validates: Requirements 9.2, 9.3, 9.4, 21.14**

  - [x] 9.3 Implementar `src/modules/entertainment/memes.ts`
    - Comandos `/meme` (Reddit API) y `/gif` (Tenor API); manejo graceful de APIs caídas
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 9.4 Escribir property test para manejo de APIs externas
    - **Property 18: Manejo graceful de APIs externas caídas**
    - **Validates: Requirements 10.3**

  - [x] 9.5 Implementar `src/modules/entertainment/games.ts`
    - Comandos `/trivia` (botones interactivos, una partida por miembro), `/ruleta` (p=1/6), `/8ball`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 9.6 Escribir property tests para games
    - **Property 19: Respuestas de /8ball pertenecen al conjunto válido**
    - **Property 20: Ruleta tiene distribución aproximada 1/6**
    - **Validates: Requirements 11.2, 11.3**

- [x] 10. Módulo de economía
  - [x] 10.1 Implementar `src/modules/economy/economy.ts`
    - Comandos `/daily` (100–200 monedas, cooldown 24h), `/balance`, `/transfer`; persistencia en `data/economy.json`; barra de progreso en ranking
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 21.3, 21.13_

  - [ ]* 10.2 Escribir property tests para economy
    - **Property 21: /daily otorga monto en rango [100, 200]**
    - **Property 22: Conservación de saldo en transferencias**
    - **Property 23: Persistencia de economía sobrevive reinicios**
    - **Validates: Requirements 12.1, 12.4, 12.5, 12.6**

- [ ] 11. Checkpoint — Verificar que todos los tests de entretenimiento y economía pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.


- [x] 12. Módulo de administración
  - [x] 12.1 Implementar `src/modules/admin/autoRole.ts`
    - Listener `guildMemberAdd`; asignación de rol en <5s; comandos `/autorole set|disable`; notificación al canal de logs si sin permisos
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 12.2 Implementar `src/modules/admin/auditLog.ts`
    - Función `logAction(type, affected, moderator, timestamp)` que publica en el canal de logs configurado; comando `/logs set`; listener `channelDelete` para desactivar si se elimina el canal
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 12.3 Escribir property test para auditLog
    - **Property 7: AuditLog registra toda acción administrativa**
    - **Validates: Requirements 1.1, 1.2, 3.3, 4.1, 14.1, 14.3**

  - [x] 12.4 Implementar `src/modules/admin/backup.ts`
    - Comandos `/backup create` (exporta canales+roles a JSON, barra de progreso por etapas, envía por DM) y `/backup restore` (valida schema, recrea sin eliminar existentes)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 21.4_

  - [ ]* 12.5 Escribir property tests para backup
    - **Property 24: Backup contiene todos los campos requeridos**
    - **Property 25: Restore no elimina canales/roles existentes**
    - **Property 26: Backup inválido es rechazado**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4**

  - [x] 12.6 Implementar `src/modules/admin/events.ts`
    - Comando `/evento create|cancel`; validación de fecha futura; recordatorio 1h antes con cuenta regresiva `Xh Ym`; notificación a asistentes al cancelar
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 21.12_

  - [ ]* 12.7 Escribir property tests para events
    - **Property 27: Validación de fecha futura en eventos**
    - **Property 39: Cuenta regresiva de eventos es matemáticamente correcta**
    - **Validates: Requirements 16.4, 21.12**

- [ ] 13. Checkpoint — Verificar que todos los tests de administración pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.


- [-] 14. Módulo ChatBridge (bot side)
  - [x] 14.1 Implementar `src/modules/chatbridge/chatbridge.ts`
    - Listener `messageCreate` en el canal configurado; llama a `bridge.broadcast()` con `BridgeMessage`; ignora mensajes de bots no confiables
    - _Requirements: 17.1, 19.3_

  - [ ]* 14.2 Escribir property tests para chatbridge bot side
    - **Property 32: Bot ignora mensajes de bots no confiables**
    - **Validates: Requirements 19.3**

- [-] 15. Bridge — servidor Express + WebSocket
  - [x] 15.1 Implementar `bridge/messageStore.ts`
    - Buffer en memoria de últimos 50 mensajes tipo `BridgeMessage`

  - [x] 15.2 Implementar `bridge/rateLimiter.ts`
    - Rate limiting por IP: máximo 10 mensajes por ventana de 60 segundos; responde HTTP 429 al exceder
    - _Requirements: 19.2_

  - [ ]* 15.3 Escribir property test para rateLimiter
    - **Property 31: Rate limiting del Bridge por IP**
    - **Validates: Requirements 19.2**

  - [x] 15.4 Implementar `bridge/server.ts`
    - `GET /api/messages?limit=50`; `POST /api/messages` (sanitiza, valida ≤2000 chars, aplica rate limit, publica en Discord); WebSocket server con broadcast; modo solo-lectura (HTTP 403); CORS configurado desde env
    - _Requirements: 17.1, 17.2, 17.5, 17.6, 18.2, 19.1, 19.4_

  - [ ]* 15.5 Escribir property tests para bridge server
    - **Property 28: Formato de mensajes del Bridge incluye prefijo [Web]**
    - **Property 29: Bridge rechaza mensajes que superan 2000 caracteres**
    - **Property 33: Modo solo-lectura rechaza mensajes con HTTP 403**
    - **Property 38: GIF inaccesible no lanza excepción**
    - **Validates: Requirements 17.2, 17.5, 19.4, 21.10**

- [ ] 16. Checkpoint — Verificar que todos los tests del Bridge pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.


- [x] 17. Componente ChatBridge.tsx (web existente)
  - [x] 17.1 Crear `src/components/ChatBridge.tsx`
    - Al montar: `GET /api/messages` para historial inicial
    - Conexión WebSocket al Bridge; reconexión cada 5s con indicador "desconectado"
    - Renderizado de mensajes diferenciando `source: "discord"` vs `source: "web"` visualmente
    - Scroll automático al mensaje más reciente
    - Input con validación de longitud máxima 2000 chars; error inline si se supera
    - _Requirements: 17.3, 17.4, 17.5_

  - [x] 17.2 Integrar `ChatBridge.tsx` en la web
    - Añadir ruta `/discord` en `src/App.tsx` o sección embebida en la página principal
    - _Requirements: 17.3_

- [x] 18. Configuración PM2 y despliegue
  - [x] 18.1 Crear `discord-bot/ecosystem.config.js`
    - Configurar dos apps PM2: `discord-bot` (entry: `dist/index.js`) y `discord-bridge` (entry: `dist/bridge/server.js`), ambas con `restart_delay`, `max_restarts` y `watch: false`
    - _Requirements: 18.2_

  - [x] 18.2 Añadir scripts de build y start en `discord-bot/package.json`
    - Scripts: `build` (`tsc`), `start:bot`, `start:bridge`, `start:all` (pm2 start ecosystem.config.js), `test` (vitest --run)

- [ ] 19. Checkpoint — Todos los tests existentes pasan
  - Ejecutar suite completa de tests unitarios y de propiedades. Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.


- [x] 20. Migración a SQLite
  - [x] 20.1 Implementar `src/utils/database.ts`
    - Crear abstracción sobre `better-sqlite3` con función `getDb(): Database`
    - Ejecutar migraciones DDL al iniciar (tablas: warns, mod_logs, economy, giveaways, giveaway_participants, levels, reminders, suggestions, temp_roles, server_config, word_filter, auto_replies, trivia_scores, playlists, playlist_tracks)
    - Migrar datos existentes de `data/*.json` a SQLite en primera ejecución
    - _Requirements: 2.8, 8.5, 9.3, 14.13, 19.5, 20.6, 23.4, 26.6, 27.6_

  - [ ]* 20.2 Escribir property test para persistencia SQLite
    - **Property 9: Persistencia de datos sobrevive reinicios**
    - **Validates: Requirements 2.8, 8.5, 9.3, 14.13, 19.5, 20.6, 23.4, 26.6**

- [x] 21. Utilidades nuevas: cooldown y paginación
  - [x] 21.1 Implementar `src/utils/cooldown.ts`
    - Clase `CooldownManager` con métodos `set(userId, command, durationMs)` y `check(userId, command): number`
    - Almacenamiento en memoria con `Map<string, number>` (timestamp de expiración)
    - _Requirements: 27.2_

  - [ ]* 21.2 Escribir property test para CooldownManager
    - **Property 16: Cooldown de autorespuesta por usuario**
    - **Validates: Requirements 8.7, 27.2**

  - [ ] 21.3 Implementar `src/utils/pagination.ts`
    - Función `buildPaginationRow(currentPage, totalPages): ActionRowBuilder<ButtonBuilder>` con botones ◀️ ▶️
    - _Requirements: 27.4_

  - [ ]* 21.4 Escribir property test para paginación
    - **Property 48: Paginación cubre todos los items**
    - **Validates: Requirements 27.4**

- [x] 22. Moderación extendida — timeout, slowmode, lockdown
  - [ ] 22.1 Implementar `src/modules/moderation/timeout.ts`
    - Comando `/timeout @user <duración> [razón]` — timeout nativo de Discord, duración en formato `1d`, `2h`, `30m`; registro en AuditLog
    - Comando `/slowmode <segundos>` — configura slowmode del canal actual (0 para desactivar)
    - Comando `/lockdown canal|servidor|unlock` — deniega/restaura `SEND_MESSAGES` a `@everyone`; guarda permisos previos para restauración
    - _Requirements: 1.6, 1.7, 1.8, 1.9, 1.10_

  - [ ]* 22.2 Escribir property test para lockdown
    - **Property 49: Lockdown/unlock es un round-trip de permisos**
    - **Validates: Requirements 1.8, 1.10**

- [x] 23. Warn extendido — modlogs con exportación y niveles configurables
  - [ ] 23.1 Actualizar `src/modules/moderation/warn.ts`
    - Añadir comando `/modlogs <member>` con historial completo de acciones (ban, kick, warn, timeout)
    - Botones de exportación a JSON y CSV en el embed de `/modlogs`
    - Niveles de warn configurables: nivel 1 → DM; nivel 3 → mute 1h; nivel 5 → kick
    - _Requirements: 2.2, 2.3, 2.4, 2.7_

  - [ ]* 23.2 Escribir property test para modlogs export
    - **Property 50: Modlogs export contiene todos los campos requeridos**
    - **Validates: Requirements 2.7**

- [x] 24. Recordatorios — `modules/utilities/reminders.ts`
  - [ ] 24.1 Implementar `src/modules/utilities/reminders.ts`
    - Comando `/remindme <tiempo> <mensaje>` — programa recordatorio con `node-cron`
    - Soporte de repetición `daily` y `weekly` — el recordatorio se reactiva automáticamente tras cada disparo
    - Persistencia en SQLite; el scheduler se recarga al reiniciar el bot
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 24.2 Escribir property test para recordatorios
    - **Property 9: Persistencia de datos sobrevive reinicios (recordatorios)**
    - **Validates: Requirements 9.3**

- [x] 25. Información de usuarios y servidor — `modules/utilities/userInfo.ts`
  - [ ] 25.1 Implementar `src/modules/utilities/userInfo.ts`
    - Comando `/userinfo [@member]` — embed con fecha de ingreso, fecha de creación de cuenta, roles, warns activos y nivel XP
    - Comando `/serverinfo` — embed con nombre, ID, fecha de creación, número de miembros, canales, roles y propietario
    - _Requirements: 10.1, 10.2_

- [x] 26. Sugerencias y reportes — `modules/utilities/suggestions.ts`
  - [ ] 26.1 Implementar `src/modules/utilities/suggestions.ts`
    - Comando `/suggest <texto>` — publica en canal de sugerencias configurado con reacciones 👍/👎
    - Comando `/suggest approve|deny <id>` — actualiza estado del embed y notifica al autor
    - Comando `/report <usuario> <razón>` — reporte anónimo al canal de staff sin revelar identidad del reportador
    - Persistencia de sugerencias en SQLite
    - _Requirements: 23.1, 23.2, 23.3, 23.4_

  - [ ]* 26.2 Escribir property test para reportes anónimos
    - **Property 46: Reporte anónimo no revela identidad del reportador**
    - **Validates: Requirements 23.3**

- [x] 27. Utilidades avanzadas — `modules/utilities/advancedUtils.ts`
  - [ ] 27.1 Implementar `src/modules/utilities/advancedUtils.ts`
    - Comando `/translate <texto> [idioma]` — LibreTranslate o DeepL API
    - Comando `/weather <ciudad>` — OpenWeatherMap API
    - Comando `/urban <término>` — Urban Dictionary API
    - Comando `/qr <texto>` — genera QR con librería `qrcode` y lo envía como imagen
    - Comando `/shorten <url>` — acortador de URLs (TinyURL API)
    - Manejo graceful de APIs caídas en todos los comandos
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_

  - [ ]* 27.2 Escribir property test para QR round-trip
    - **Property 45: QR round-trip**
    - **Validates: Requirements 22.4**

  - [ ]* 27.3 Escribir property test para APIs externas caídas
    - **Property 18: Manejo graceful de APIs externas caídas**
    - **Validates: Requirements 22.6**

- [ ] 28. Checkpoint — Verificar que todos los tests de nuevas utilidades pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

- [x] 29. Música extendida — filtros, lyrics, playlist, botones
  - [ ] 29.1 Actualizar `src/modules/entertainment/music.ts`
    - Comando `/filter <bassboost|nightcore>` — aplica filtros de audio via FFmpeg args en `@discordjs/voice`
    - Comando `/lyrics` — busca letra de la canción actual via Genius API
    - Comandos `/playlist create <nombre>` y `/playlist load <nombre>` — playlists persistidas en SQLite
    - Botones interactivos de control (pausa, skip, parar) en el embed del reproductor
    - _Requirements: 11.7, 11.8, 11.9, 11.10, 11.11_

  - [ ]* 29.2 Escribir property test para playlist round-trip
    - **Property 44: Playlist round-trip**
    - **Validates: Requirements 11.9, 11.10**

- [x] 30. Juegos extendidos — blackjack, tictactoe, hangman, leaderboard trivia
  - [ ] 30.1 Actualizar `src/modules/entertainment/games.ts`
    - Comando `/blackjack <apuesta>` — partida con botones (pedir/plantarse), apuesta en monedas virtuales
    - Comando `/tictactoe @rival` — tres en raya con tablero de botones 3×3
    - Comando `/hangman` — ahorcado con palabra aleatoria, embed actualizable con progreso
    - Tabla de clasificación de trivia persistida en SQLite
    - _Requirements: 13.5, 13.6, 13.7, 13.8_

  - [ ]* 30.2 Escribir property test para conservación de saldo en apuestas
    - **Property 22: Conservación de saldo en juegos de apuesta**
    - **Validates: Requirements 13.6, 14.10, 14.11**

- [x] 31. Economía extendida — shop, work, rob, bet, top, rachas
  - [x] 31.1 Actualizar `src/modules/economy/economy.ts`
    - Comando `/shop` — tienda con roles e items configurados por moderadores (tabla `shop_items` en SQLite)
    - Comando `/work` — trabajo aleatorio con cooldown configurable via `CooldownManager`
    - Comando `/rob @user` — intento de robo con probabilidad configurable
    - Comando `/bet <cantidad>` — apuesta 50/50
    - Comando `/top` / `/richest` — ranking global con barras de progreso ASCII y paginación
    - Rachas en `/daily` — bonus proporcional a días consecutivos (`dailyStreak`)
    - _Requirements: 14.3, 14.8, 14.9, 14.10, 14.11, 14.12_

  - [ ]* 31.2 Escribir property test para /daily con rachas
    - **Property 21: /daily otorga monto en rango [100, 200] con bonus de racha**
    - **Validates: Requirements 14.1, 14.3**

- [x] 32. Admin — Giveaways — `modules/admin/giveaways.ts`
  - [x] 32.1 Implementar `src/modules/admin/giveaways.ts`
    - Comando `/gstart <duración> <premio> [ganadores]` — embed con botón "Participar" y contador de participantes
    - Comando `/gend <id>` — finaliza inmediatamente y selecciona ganadores
    - Comando `/glist` — lista de giveaways activos con ID, premio y tiempo restante
    - Selección aleatoria de ganadores al expirar; notificación por mención; persistencia en SQLite
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [ ]* 32.2 Escribir property test para selección de ganadores
    - **Property 42: Giveaway selecciona exactamente N ganadores únicos**
    - **Validates: Requirements 19.2, 19.3**

- [x] 33. Admin — Niveles/XP — `modules/admin/levels.ts`
  - [ ] 33.1 Implementar `src/modules/admin/levels.ts`
    - XP por mensaje con cooldown anti-spam de 60s; fórmula `level = floor(sqrt(xp / 100))`
    - Comando `/level` — nivel actual, XP, barra de progreso ASCII
    - Comando `/leaderboard` — top 10 con paginación via `buildPaginationRow`
    - Asignación automática de roles de recompensa al alcanzar niveles configurados
    - Persistencia en SQLite (tabla `levels`)
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [ ]* 33.2 Escribir property test para monotonía de XP
    - **Property 43: XP de nivel es monotónico**
    - **Validates: Requirements 20.2, 20.3**

- [x] 34. Admin — Embed Builder — `modules/admin/embedBuilder.ts`
  - [x] 34.1 Implementar `src/modules/admin/embedBuilder.ts`
    - Comando `/embed` — formulario modal interactivo para configurar título, descripción, color, imagen y campos
    - Comando `/say <mensaje> [--embed]` — publica como el bot, elimina el mensaje original del moderador
    - _Requirements: 21.1, 21.2, 21.3_

- [x] 35. Admin — Integraciones externas — `modules/admin/integrations.ts`
  - [x] 35.1 Implementar `src/modules/admin/integrations.ts`
    - Polling de Twitch API cada 5 min para detectar streams en vivo; notificación en canal configurado
    - Polling de YouTube RSS feed para detectar nuevos videos; notificación en canal configurado
    - Comando `/reddit <subreddit>` — posts recientes con paginación via `buildPaginationRow`
    - Manejo graceful de APIs caídas (log de error sin interrumpir el bot)
    - _Requirements: 24.1, 24.2, 24.3, 24.4_

  - [ ]* 35.2 Escribir property test para APIs externas caídas (integraciones)
    - **Property 18: Manejo graceful de APIs externas caídas**
    - **Validates: Requirements 24.4**

- [x] 36. Admin — Dev Tools — `modules/admin/devTools.ts`
  - [x] 36.1 Implementar `src/modules/admin/devTools.ts`
    - Comando `/eval <código>` — solo para `OWNER_ID`; ejecuta en contexto restringido; respuesta efímera de error si no es el owner
    - Comando `/ping` — latencia del bot y de la API de Discord en ms
    - Comando `/invite` — enlace de invitación con permisos configurados
    - _Requirements: 25.1, 25.2, 25.3_

- [x] 37. Admin — Config por servidor — `modules/admin/config.ts`
  - [x] 37.1 Implementar `src/modules/admin/config.ts`
    - Comando `/config prefix|modrole|adminrole|logchannel|mute_role` con subcomandos
    - Configuración almacenada en SQLite (tabla `server_config`), independiente por guild
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7_

  - [ ]* 37.2 Escribir property test para aislamiento de configuración por guild
    - **Property 47: Configuración de servidor es independiente por guild**
    - **Validates: Requirements 26.7**

- [x] 38. Admin — AutoRole extendido — múltiples autoroles y temprole
  - [x] 38.1 Actualizar `src/modules/admin/autoRole.ts`
    - Soporte de múltiples autoroles configurables (lista de IDs en `ServerConfig.autoRoleIds`)
    - Comando `/temprole @user <rol> <duración>` — rol temporal con revocación automática via `node-cron`
    - Persistencia de TempRoles en SQLite (tabla `temp_roles`); scheduler recargado al reiniciar
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [x] 39. AuditLog extendido — nuevos eventos
  - [x] 39.1 Actualizar `src/modules/admin/auditLog.ts`
    - Añadir listeners para: `messageUpdate` (edición), `messageDelete` (eliminación), `guildMemberUpdate` (cambio de roles), `guildMemberAdd` / `guildMemberRemove` (entrada/salida), `channelCreate` / `channelDelete`
    - Soporte de canales excluidos del AuditLog para eventos de edición/eliminación
    - _Requirements: 16.1, 16.5_

  - [ ]* 39.2 Escribir property test para AuditLog extendido
    - **Property 7: AuditLog registra toda acción administrativa**
    - **Validates: Requirements 16.1, 16.3**

- [x] 40. Backup extendido — automático y restauración selectiva
  - [x] 40.1 Actualizar `src/modules/admin/backup.ts`
    - Backup automático programado via `node-cron` con intervalo configurable; guarda en canal privado configurado
    - Comando `/backup restore <archivo> --selectivo` — muestra lista de canales/roles para selección antes de restaurar
    - _Requirements: 17.5, 17.6_

- [x] 41. Eventos extendidos — repetición y notificación a rol
  - [x] 41.1 Actualizar `src/modules/admin/events.ts`
    - Repetición semanal/mensual — el evento se recrea automáticamente via `node-cron` tras cada ocurrencia
    - Notificación a rol específico configurado en el evento (mención en anuncio y recordatorio)
    - _Requirements: 18.5, 18.6_

- [ ] 42. Actualizar `package.json` con nuevas dependencias
  - [ ] 42.1 Añadir dependencias en `discord-bot/package.json`
    - `better-sqlite3: ^9.0.0`, `node-cron: ^3.0.0`, `qrcode: ^1.5.0`, `genius-lyrics: ^4.4.0`
    - `@types/better-sqlite3: ^7.6.0`, `@types/qrcode: ^1.5.0` (devDependencies)
    - _Requirements: 27.6_

- [x] 43. Actualizar `BotCommandsPage.tsx` con todos los nuevos comandos
  - [x] 43.1 Actualizar `src/pages/BotCommandsPage.tsx`
    - Añadir secciones para todos los comandos nuevos organizados por categoría: Moderación extendida, Utilidades avanzadas, Entretenimiento extendido, Economía extendida, Giveaways, Niveles/XP, Embed Builder, Integraciones, Dev Tools, Config
    - Para cada comando nuevo: nombre, descripción, sintaxis y permisos requeridos
    - _Requirements: 33.1, 33.2, 33.3_

- [ ] 44. Checkpoint final — Todos los tests pasan
  - Ejecutar suite completa de tests unitarios y de propiedades. Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los tests de propiedades usan `fast-check` con mínimo 100 iteraciones (`numRuns: 100`)
- Cada test de propiedad debe incluir el comentario: `// Feature: discord-bot-integration, Property N: <texto>`
- Los checkpoints validan el progreso incremental antes de continuar con la siguiente fase

- [-] 20. Migración a SQLite y utilidades nuevas
  - [x] 20.1 Actualizar `discord-bot/package.json` con nuevas dependencias
    - Añadir: `better-sqlite3`, `node-cron`, `qrcode`, `genius-lyrics`
    - Añadir devDeps: `@types/better-sqlite3`, `@types/qrcode`, `@types/node-cron`
    - Añadir nuevas env vars a `.env.example`: `OWNER_ID`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `WEATHER_API_KEY`, `TRANSLATE_API_KEY`, `GENIUS_API_KEY`, `URL_SHORTENER_API_KEY`
    - _Requirements: 27.6_

  - [x] 20.2 Implementar `src/utils/database.ts`
    - Abstracción SQLite con `better-sqlite3`; crear todas las tablas del diseño al iniciar
    - Tablas: warns, mod_logs, economy, giveaways, giveaway_participants, levels, reminders, suggestions, temp_roles, server_config, word_filter, auto_replies, trivia_scores, playlists, playlist_tracks
    - _Requirements: 27.6_

  - [x] 20.3 Implementar `src/utils/cooldown.ts`
    - Clase `CooldownManager` con métodos `set(userId, command, durationMs)` y `check(userId, command): number`
    - _Requirements: 27.2_

  - [x] 20.4 Implementar `src/utils/pagination.ts`
    - Función `buildPaginationRow(currentPage, totalPages)` que genera ActionRow con botones ◀️ ▶️
    - _Requirements: 27.4_

  - [ ]* 20.5 Escribir property test para paginación
    - **Property 48: Paginación cubre todos los items**
    - **Validates: Requirements 27.4**

- [~] 21. Moderación extendida
  - [ ] 21.1 Implementar `src/modules/moderation/timeout.ts`
    - Comandos `/timeout @user <duración> [razón]`, `/slowmode <segundos>`, `/lockdown canal|servidor|unlock`
    - Duración en formato `1d`, `2h`, `30m`; registro en AuditLog
    - _Requirements: 1.6, 1.7, 1.8, 1.9, 1.10_

  - [ ]* 21.2 Escribir property test para lockdown round-trip
    - **Property 49: Lockdown/unlock es un round-trip de permisos**
    - **Validates: Requirements 1.8, 1.10**

  - [ ] 21.3 Extender `src/modules/moderation/warn.ts`
    - Añadir `/modlogs <member>` con exportación JSON/CSV
    - Niveles de warn: 1→DM, 3→mute 1h, 5→kick automático
    - Migrar persistencia de JSON a SQLite
    - _Requirements: 2.2, 2.3, 2.4, 2.7, 2.8_

  - [ ]* 21.4 Escribir property test para modlogs export
    - **Property 50: Modlogs export contiene todos los campos requeridos**
    - **Validates: Requirements 2.7**

- [ ] 22. Checkpoint — Verificar moderación extendida
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

- [~] 23. Utilidades nuevas
  - [ ] 23.1 Implementar `src/modules/utilities/reminders.ts`
    - Comando `/remindme <tiempo> <mensaje> [--repeat daily|weekly]`
    - Scheduler con `node-cron`; persistencia en SQLite; recarga al reiniciar
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 23.2 Implementar `src/modules/utilities/userInfo.ts`
    - Comandos `/userinfo [@member]` y `/serverinfo`
    - `/userinfo`: fecha ingreso, creación cuenta, roles, warns activos, nivel XP
    - `/serverinfo`: nombre, ID, fecha creación, miembros, canales, roles, propietario
    - _Requirements: 10.1, 10.2_

  - [ ] 23.3 Implementar `src/modules/utilities/suggestions.ts`
    - Comandos `/suggest <texto>`, `/suggest approve|deny <id>`, `/report <usuario> <razón>`
    - Reporte anónimo sin revelar identidad del reportador; persistencia en SQLite
    - _Requirements: 23.1, 23.2, 23.3, 23.4_

  - [ ]* 23.4 Escribir property test para anonimato de reportes
    - **Property 46: Reporte anónimo no revela identidad del reportador**
    - **Validates: Requirements 23.3**

  - [ ] 23.5 Implementar `src/modules/utilities/advancedUtils.ts`
    - Comandos `/translate`, `/weather`, `/urban`, `/qr`, `/shorten`
    - APIs: LibreTranslate/DeepL, OpenWeatherMap, Urban Dictionary, `qrcode` lib, TinyURL
    - Manejo graceful de APIs caídas
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_

  - [ ]* 23.6 Escribir property test para QR round-trip
    - **Property 45: QR round-trip**
    - **Validates: Requirements 22.4**

  - [ ] 23.7 Extender `src/modules/utilities/poll.ts`
    - Añadir temporizador automático con `--tiempo <duración>`
    - Cierre automático con `node-cron` o `setTimeout`
    - _Requirements: 6.5_

  - [ ] 23.8 Extender `src/modules/utilities/tickets.ts`
    - Añadir menú de selección de categoría (soporte, reportes, sugerencias)
    - Botón "Reclamar" que asigna ticket a moderador
    - Transcripción automática al canal de staff configurado
    - _Requirements: 7.5, 7.6, 7.7_

  - [ ] 23.9 Extender `src/modules/utilities/autoReply.ts`
    - Añadir soporte de regex en triggers
    - Cooldown por usuario configurable
    - Respuestas con imagen o embed
    - Migrar persistencia a SQLite
    - _Requirements: 8.6, 8.7, 8.8_

- [ ] 24. Checkpoint — Verificar utilidades nuevas
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

- [~] 25. Entretenimiento extendido
  - [ ] 25.1 Extender `src/modules/entertainment/music.ts`
    - Añadir `/filter <bassboost|nightcore>` via FFmpeg args
    - Añadir `/lyrics` con Genius API
    - Añadir `/playlist create <nombre>` y `/playlist load <nombre>` con persistencia SQLite
    - Añadir botones interactivos de control (pausa, skip, parar) en embed del reproductor
    - _Requirements: 11.7, 11.8, 11.9, 11.10, 11.11_

  - [ ]* 25.2 Escribir property test para playlist round-trip
    - **Property 44: Playlist round-trip**
    - **Validates: Requirements 11.9, 11.10**

  - [ ] 25.3 Extender `src/modules/entertainment/games.ts`
    - Añadir `/blackjack <apuesta>` con botones pedir/plantarse y apuesta en monedas
    - Añadir `/tictactoe @rival` con tablero de botones 3×3
    - Añadir `/hangman` con embed actualizable
    - Añadir tabla de clasificación de trivia persistida en SQLite
    - _Requirements: 13.5, 13.6, 13.7, 13.8_

  - [ ]* 25.4 Escribir property test para conservación de saldo en juegos
    - **Property 22: Conservación de saldo en juegos de apuesta**
    - **Validates: Requirements 13.6, 14.10, 14.11**

- [~] 26. Economía extendida
  - [ ] 26.1 Extender `src/modules/economy/economy.ts`
    - Añadir rachas en `/daily` con bonus proporcional
    - Añadir `/shop` con roles e items configurados por moderadores
    - Añadir `/work` con cooldown configurable y recompensa variable
    - Añadir `/rob @user` con probabilidad configurable
    - Añadir `/bet <cantidad>` 50/50
    - Añadir `/top`/`/richest` con ranking y barras de progreso ASCII
    - Migrar persistencia a SQLite
    - _Requirements: 14.3, 14.8, 14.9, 14.10, 14.11, 14.12, 14.13_

  - [ ]* 26.2 Escribir property test para /daily con rachas
    - **Property 21: /daily otorga monto en rango [100, 200] con bonus de racha**
    - **Validates: Requirements 14.1, 14.3**

- [ ] 27. Checkpoint — Verificar entretenimiento y economía extendidos
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

- [~] 28. Administración — nuevos módulos
  - [ ] 28.1 Implementar `src/modules/admin/giveaways.ts`
    - Comandos `/gstart <duración> <premio> [ganadores]`, `/gend <id>`, `/glist`
    - Embed con botón "Participar" y contador; selección aleatoria de ganadores al expirar
    - Persistencia en SQLite; scheduler con `node-cron`
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [ ]* 28.2 Escribir property test para giveaway ganadores únicos
    - **Property 42: Giveaway selecciona exactamente N ganadores únicos**
    - **Validates: Requirements 19.2, 19.3**

  - [ ] 28.3 Implementar `src/modules/admin/levels.ts`
    - XP por mensaje con cooldown anti-spam 60s
    - Fórmula: `level = floor(sqrt(xp / 100))`
    - Comandos `/level` y `/leaderboard` con paginación
    - Roles de recompensa automáticos al alcanzar niveles configurados
    - Persistencia en SQLite
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [ ]* 28.4 Escribir property test para XP monotónico
    - **Property 43: XP de nivel es monotónico**
    - **Validates: Requirements 20.2, 20.3**

  - [ ] 28.5 Implementar `src/modules/admin/embedBuilder.ts`
    - Comando `/embed` con formulario modal interactivo (título, descripción, color, imagen, campos)
    - Comando `/say <mensaje> [--embed]`; elimina mensaje original del moderador
    - _Requirements: 21.1, 21.2, 21.3_

  - [ ] 28.6 Implementar `src/modules/admin/integrations.ts`
    - Polling Twitch API cada 5 min para detectar streams en vivo
    - Polling YouTube RSS feed para detectar nuevos videos
    - Comando `/reddit <subreddit>` con paginación
    - Manejo graceful de APIs caídas
    - _Requirements: 24.1, 24.2, 24.3, 24.4_

  - [ ] 28.7 Implementar `src/modules/admin/devTools.ts`
    - Comando `/eval <código>` solo para `OWNER_ID`; entorno restringido
    - Comando `/ping` con latencia bot y API
    - Comando `/invite` con enlace de invitación
    - _Requirements: 25.1, 25.2, 25.3_

  - [ ] 28.8 Implementar `src/modules/admin/config.ts`
    - Comando `/config` con subcomandos: `prefix`, `modrole`, `adminrole`, `logchannel`, `mute_role`
    - Configuración almacenada en SQLite, independiente por guild
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7_

  - [ ]* 28.9 Escribir property test para aislamiento de config por guild
    - **Property 47: Configuración de servidor es independiente por guild**
    - **Validates: Requirements 26.7**

- [~] 29. Administración — módulos existentes extendidos
  - [ ] 29.1 Extender `src/modules/admin/autoRole.ts`
    - Soporte para múltiples autoroles (lista de IDs)
    - Añadir `/temprole @user <rol> <duración>` con revocación automática via `node-cron`
    - Persistencia de TempRoles en SQLite
    - _Requirements: 15.2, 15.5, 15.6_

  - [ ] 29.2 Extender `src/modules/admin/auditLog.ts`
    - Añadir listeners: `messageUpdate`, `messageDelete`, `guildMemberUpdate`, `channelCreate`, `channelDelete`, `guildMemberAdd`, `guildMemberRemove`
    - Soporte para excluir canales específicos del AuditLog
    - _Requirements: 16.1, 16.5_

  - [ ] 29.3 Extender `src/modules/admin/backup.ts`
    - Añadir backup automático programado via `node-cron`
    - Añadir `/backup restore <archivo> --selectivo` con lista de selección
    - _Requirements: 17.5, 17.6_

  - [ ] 29.4 Extender `src/modules/admin/events.ts`
    - Añadir repetición semanal/mensual con recreación automática
    - Añadir notificación a rol específico configurado en el evento
    - _Requirements: 18.5, 18.6_

- [ ] 30. Checkpoint — Verificar administración completa
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

- [x] 31. Actualizar eventHandler para nuevos eventos
  - Extender `src/handlers/eventHandler.ts` para registrar los nuevos listeners:
    - `messageUpdate`, `messageDelete`, `guildMemberUpdate`, `channelCreate`, `guildMemberRemove`
    - Integrar XP grant en `messageCreate`
    - Integrar TempRole expiry checker al iniciar
    - _Requirements: 16.1, 20.1_

- [x] 32. Actualizar types/index.ts con nuevas interfaces
  - Añadir interfaces: `ModLog`, `Giveaway`, `LevelEntry`, `LevelReward`, `Reminder`, `Suggestion`, `TempRole`, `ServerConfig`, `ShopItem`, `AutoReplyConfig`
  - _Requirements: 27.6_

- [~] 33. Actualizar página web con nuevos comandos
  - Actualizar `src/pages/BotCommandsPage.tsx` con todos los nuevos comandos organizados por categoría
  - Categorías: Moderación, Utilidades, Entretenimiento, Economía, Administración, Giveaways, Niveles, Utilidades Avanzadas, Herramientas Dev
  - Para cada comando: nombre, descripción, sintaxis y permisos requeridos
  - _Requirements: 33.1, 33.2, 33.3_

- [x] 34. Checkpoint final completo — Todos los tests pasan
  - Ejecutar suite completa de tests unitarios y de propiedades
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.
