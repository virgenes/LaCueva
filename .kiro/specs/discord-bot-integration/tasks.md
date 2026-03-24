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

- [ ] 4. Checkpoint — Verificar que el bot arranca y se conecta a Discord
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
  - [ ] 12.1 Implementar `src/modules/admin/autoRole.ts`
    - Listener `guildMemberAdd`; asignación de rol en <5s; comandos `/autorole set|disable`; notificación al canal de logs si sin permisos
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 12.2 Implementar `src/modules/admin/auditLog.ts`
    - Función `logAction(type, affected, moderator, timestamp)` que publica en el canal de logs configurado; comando `/logs set`; listener `channelDelete` para desactivar si se elimina el canal
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 12.3 Escribir property test para auditLog
    - **Property 7: AuditLog registra toda acción administrativa**
    - **Validates: Requirements 1.1, 1.2, 3.3, 4.1, 14.1, 14.3**

  - [ ] 12.4 Implementar `src/modules/admin/backup.ts`
    - Comandos `/backup create` (exporta canales+roles a JSON, barra de progreso por etapas, envía por DM) y `/backup restore` (valida schema, recrea sin eliminar existentes)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 21.4_

  - [ ]* 12.5 Escribir property tests para backup
    - **Property 24: Backup contiene todos los campos requeridos**
    - **Property 25: Restore no elimina canales/roles existentes**
    - **Property 26: Backup inválido es rechazado**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4**

  - [ ] 12.6 Implementar `src/modules/admin/events.ts`
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

- [ ] 19. Checkpoint final — Todos los tests pasan
  - Ejecutar suite completa de tests unitarios y de propiedades. Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los tests de propiedades usan `fast-check` con mínimo 100 iteraciones (`numRuns: 100`)
- Cada test de propiedad debe incluir el comentario: `// Feature: discord-bot-integration, Property N: <texto>`
- Los checkpoints validan el progreso incremental antes de continuar con la siguiente fase
