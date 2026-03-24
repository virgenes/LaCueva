#!/bin/sh
# start.sh — arranca el bot + Cloudflare Tunnel en paralelo
# Requiere: TUNNEL_TOKEN en variables de entorno (desde el panel de bot-hosting.net)

set -e

# Instalar cloudflared si no esta disponible
if ! command -v cloudflared > /dev/null 2>&1; then
  echo "[start] Descargando cloudflared..."
  curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
    -o /tmp/cloudflared
  chmod +x /tmp/cloudflared
  CLOUDFLARED=/tmp/cloudflared
else
  CLOUDFLARED=cloudflared
fi

# Arrancar el tunnel en background (usa TUNNEL_TOKEN si esta definido)
if [ -n "$TUNNEL_TOKEN" ]; then
  echo "[start] Iniciando Cloudflare Tunnel con token..."
  $CLOUDFLARED tunnel --no-autoupdate run --token "$TUNNEL_TOKEN" &
else
  echo "[start] TUNNEL_TOKEN no definido - el bridge no tendra URL publica HTTPS"
fi

# Arrancar el bot (proceso principal)
echo "[start] Iniciando bot..."
exec node dist/index.js
