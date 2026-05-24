#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"

echo "=== Sentiment Analysis Microservice Setup ==="
echo ""

# 1. Create virtual environment
if [ -d "$VENV_DIR" ]; then
    echo "[*] Virtual environment already exists at $VENV_DIR"
else
    echo "[+] Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# 2. Activate and install
echo "[+] Installing requirements..."
source "$VENV_DIR/bin/activate"
pip install --upgrade pip --quiet
pip install -r "$SCRIPT_DIR/requirements.txt" --quiet

# 3. Download spaCy model
echo "[+] Downloading spaCy en_core_web_sm model..."
python -m spacy download en_core_web_sm --quiet

# 4. Download TextBlob corpora
echo "[+] Downloading TextBlob corpora..."
python -m textblob.download_corpora

echo ""
echo "=== Setup complete ==="
echo ""
echo "To start the service:"
echo "  cd $SCRIPT_DIR"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo "The API will be available at http://localhost:5001"
echo "  POST /analyze        - Analyze single text"
echo "  POST /analyze-batch  - Analyze multiple texts"
echo "  GET  /health         - Health check"
echo "  GET  /docs           - Interactive API docs (Swagger)"
