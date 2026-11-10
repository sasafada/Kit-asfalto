#!/usr/bin/env python3
# voz.py - Gera narração via Piper (local) ou ElevenLabs (cloud)
# Uso: python voz.py "texto para falar" saida.wav [--engine piper|elevenlabs] [--voice VOZ] [--model MODELO]

import sys
import argparse
import subprocess
import os
import json
from pathlib import Path

try:
    import requests
except ImportError:
    requests = None

# Configuração padrão
PIPER_BIN = os.environ.get("PIPER_BIN", "piper")
PIPER_MODEL_DIR = os.environ.get("PIPER_MODEL_DIR", str(Path.home() / ".local/share/piper/voices"))
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")

# Vozes Piper recomendadas (pt-BR)
PIPER_VOICES_PT = {
    "fabio": "pt_BR-fabio-medium",
    "lais": "pt_BR-lais-medium",
    "cicero": "pt_BR-cicero-medium",
}

# Vozes ElevenLabs recomendadas
ELEVENLABS_VOICES = {
    "willian": "21m00Tcm4TlvDq8ikWAM",  # Willian (estilo narrador)
    "rachel": "21m00Tcm4TlvDq8ikWAM",
    "adam": "pNInz6obpgDQGcFmaJgB",
    "antoni": "ErXwobaYiN019PkySvjV",
}

def falar_piper(texto: str, saida: str, voz: str = "fabio", modelo_dir: str = None) -> bool:
    """Gera áudio via Piper TTS (local, gratuito)"""
    modelo_dir = modelo_dir or PIPER_MODEL_DIR
    modelo_nome = PIPER_VOICES_PT.get(voz, voz)
    modelo_path = Path(modelo_dir) / f"{modelo_nome}.onnx"
    config_path = Path(modelo_dir) / f"{modelo_nome}.onnx.json"

    if not modelo_path.exists():
        print(f"❌ Modelo Piper não encontrado: {modelo_path}")
        print(f"   Baixe em: https://huggingface.co/rhasspy/piper-voices/tree/main/pt_BR")
        print(f"   Coloque em: {modelo_dir}")
        return False

    cmd = [
        PIPER_BIN,
        "--model", str(modelo_path),
        "--config", str(config_path),
        "--output_file", saida,
    ]

    try:
        print(f"🎙️  Piper: '{texto[:50]}...' → {saida}")
        result = subprocess.run(cmd, input=texto.encode(), capture_output=True, timeout=60)
        if result.returncode == 0:
            print(f"✅ Gerado: {saida} ({Path(saida).stat().st_size} bytes)")
            return True
        else:
            print(f"❌ Erro Piper: {result.stderr.decode()}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Timeout (60s)")
        return False
    except FileNotFoundError:
        print(f"❌ Piper não encontrado. Instale: pip install piper-tts")
        print(f"   Ou defina PIPER_BIN no ambiente")
        return False

def falar_elevenlabs(texto: str, saida: str, voz: str = "willian", model_id: str = "eleven_multilingual_v2") -> bool:
    """Gera áudio via ElevenLabs API (pago, alta qualidade)"""
    if not requests:
        print("❌ requests não instalado: pip install requests")
        return False

    if not ELEVENLABS_API_KEY:
        print("❌ ELEVENLABS_API_KEY não definida no ambiente")
        return False

    voice_id = ELEVENLABS_VOICES.get(voz, voz)
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }

    data = {
        "text": texto,
        "model_id": model_id,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.3,
            "use_speaker_boost": True,
        },
    }

    try:
        print(f"🎙️  ElevenLabs: '{texto[:50]}...' → {saida}")
        response = requests.post(url, headers=headers, json=data, timeout=60)

        if response.status_code == 200:
            with open(saida, "wb") as f:
                f.write(response.content)
            print(f"✅ Gerado: {saida} ({len(response.content)} bytes)")
            return True
        else:
            print(f"❌ Erro ElevenLabs ({response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Gera narração TTS")
    parser.add_argument("texto", help="Texto para falar")
    parser.add_argument("saida", help="Arquivo de saída (.wav ou .mp3)")
    parser.add_argument("--engine", choices=["piper", "elevenlabs"], default="piper",
                        help="Engine TTS (padrão: piper)")
    parser.add_argument("--voice", "-v", default="fabio",
                        help="Voz (padrão: fabio para Piper, willian para ElevenLabs)")
    parser.add_argument("--model", "-m", default="eleven_multilingual_v2",
                        help="Modelo ElevenLabs (padrão: eleven_multilingual_v2)")
    parser.add_argument("--piper-bin", default=PIPER_BIN, help="Caminho do binário Piper")
    parser.add_argument("--piper-dir", default=PIPER_MODEL_DIR, help="Diretório modelos Piper")

    args = parser.parse_args()

    global PIPER_BIN, PIPER_MODEL_DIR
    PIPER_BIN = args.piper_bin
    PIPER_MODEL_DIR = args.piper_dir

    # Cria diretório de saída
    Path(args.saida).parent.mkdir(parents=True, exist_ok=True)

    if args.engine == "piper":
        ok = falar_piper(args.texto, args.saida, args.voice, args.piper_dir)
    else:
        ok = falar_elevenlabs(args.texto, args.saida, args.voice, args.model)

    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()