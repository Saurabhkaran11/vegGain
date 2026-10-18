#!/bin/zsh
# Double-click to (re)start VegGain 8 on http://localhost:3456.
# It stops any older VegGain server on that port, rebuilds the latest code, and opens the browser.
# Close this window or press Ctrl+C to stop the site.
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.homebrew/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
PORT=3456

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org, then double-click this file again."
  open "https://nodejs.org/en/download"; read -k1 "?Press any key to close..."; exit 1
fi
echo "Node $(node -v) found."

OLD=$(lsof -ti tcp:$PORT -sTCP:LISTEN 2>/dev/null)
if [ -n "$OLD" ]; then
  echo "Stopping the older VegGain server on port $PORT (PID $OLD)..."
  kill $OLD 2>/dev/null; sleep 2
  lsof -ti tcp:$PORT -sTCP:LISTEN >/dev/null 2>&1 && kill -9 $OLD 2>/dev/null
fi

echo "Installing/updating packages..."
npm install --no-audit --no-fund || { echo "npm install failed."; read -k1 "?Press any key to close..."; exit 1; }

echo "Building the latest version (about 30 seconds)..."
npm run build || { echo "Build failed — see the messages above."; read -k1 "?Press any key to close..."; exit 1; }

echo "Starting VegGain 8 at http://localhost:$PORT ..."
( for i in {1..60}; do curl -s -o /dev/null "http://localhost:$PORT" && open "http://localhost:$PORT" && break; sleep 1; done ) &
npx next start -p $PORT
