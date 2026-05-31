#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/ubuntu/lectureai"
VENV="$REPO_DIR/venv"

if [[ -z "${ANTHROPIC_API_KEY:-}" || -z "${JWT_SECRET:-}" ]]; then
  echo "ERROR: Set ANTHROPIC_API_KEY and JWT_SECRET before running."
  exit 1
fi

echo ">>> Installing system packages..."
sudo apt-get update -q
sudo apt-get install -y -q python3 python3-venv python3-pip nginx nodejs npm

echo ">>> Setting up Python venv..."
python3 -m venv "$VENV"
"$VENV/bin/pip" install --quiet -r "$REPO_DIR/backend/requirements.txt"

echo ">>> Configuring systemd service..."
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo "localhost")
sed \
  -e "s|REPLACE_ME|$ANTHROPIC_API_KEY|" \
  -e "s|REPLACE_WITH_RANDOM_SECRET|$JWT_SECRET|" \
  -e "s|YOUR_EC2_PUBLIC_IP|$PUBLIC_IP|" \
  "$REPO_DIR/lectureai.service" \
  | sudo tee /etc/systemd/system/lectureai.service > /dev/null
sudo systemctl daemon-reload
sudo systemctl enable lectureai
sudo systemctl restart lectureai

echo ">>> Building React frontend..."
cd "$REPO_DIR/frontend"
npm install --silent
npm run build

echo ">>> Configuring nginx..."
sudo cp "$REPO_DIR/nginx.conf" /etc/nginx/sites-available/lectureai
sudo ln -sf /etc/nginx/sites-available/lectureai /etc/nginx/sites-enabled/lectureai
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "✅  LectureAI deployed at http://$PUBLIC_IP"
