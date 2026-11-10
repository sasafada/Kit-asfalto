#!/usr/bin/env python3
# palavras.py - Extrai timestamps palavra-por-palavra via faster-whisper
# Uso: python palavras.py audio.wav saida.json [--model base|small|medium|large] [--language pt] [--device cpu|cuda]

import sys
import argparse
import json
from pathlib import Path

try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None

def extrair_palavras(
    audio_path: str,
    saida_path: str,
    model_size: str = "base",
    language: str = "pt",
    device: str = "cpu",
    compute_type: str = "int8",
    vad_filter: bool = True,
) -> bool:
    """Extrai timestamps de cada palavra do áudio"""

    if WhisperModel is None:
        print("❌ faster-whisper não instalado: pip install faster-whisper")
        return False

    print(f"🎧 Carregando modelo: {model_size} ({device}, {compute_type})")

    try:
        model = WhisperModel(model_size, device=device, compute_type=compute_type)
    except Exception as e:
        print(f"❌ Erro ao carregar modelo: {e}")
        return False

    print(f"🔍 Transcrevendo: {audio_path}")

    try:
        segments, info = model.transcribe(
            audio_path,
            language=language,
            word_timestamps=True,
            vad_filter=vad_filter,
            vad_parameters=dict(min_silence_duration_ms=500),
        )

        palavras = []
        for segment in segments:
            if segment.words:
                for word in segment.words:
                    palavras.append({
                        "texto": word.word.strip(),
                        "inicio": round(word.start, 3),
                        "fim": round(word.end, 3),
                        "probabilidade": round(word.probability, 3) if word.probability else 1.0,
                    })
            else:
                # Fallback: divide segmento em palavras estimadas
                texto = segment.text.strip()
                if texto:
                    words = texto.split()
                    duracao = segment.end - segment.start
                    if words:
                        por_palavra = duracao / len(words)
                        for i, w in enumerate(words):
                            palavras.append({
                                "texto": w,
                                "inicio": round(segment.start + i * por_palavra, 3),
                                "fim": round(segment.start + (i + 1) * por_palavra, 3),
                                "probabilidade": 0.5,
                            })

        # Filtra palavras muito curtas/ruído
        palavras_filtradas = [
            p for p in palavras
            if len(p["texto"]) > 0 and p["fim"] - p["inicio"] > 0.05
        ]

        resultado = {
            "idioma": info.language,
            "probabilidade_idioma": round(info.language_probability, 3),
            "duracao_total": round(info.duration, 3),
            "palavras": palavras_filtradas,
        }

        Path(saida_path).parent.mkdir(parents=True, exist_ok=True)
        with open(saida_path, "w", encoding="utf-8") as f:
            json.dump(resultado, f, ensure_ascii=False, indent=2)

        print(f"✅ {len(palavras_filtradas)} palavras extraídas → {saida_path}")
        print(f"   Duração: {resultado['duracao_total']}s | Idioma: {resultado['idioma']} ({resultado['probabilidade_idioma']})")
        return True

    except Exception as e:
        print(f"❌ Erro na transcrição: {e}")
        return False

def gerar_legenda_karaoke(palavras_json: str, saida_json: str, max_palavras_linha: int = 8) -> bool:
    """Converte palavras.json em formato karaoke (linhas com tempo)"""
    try:
        with open(palavras_json, "r", encoding="utf-8") as f:
            data = json.load(f)

        palavras = data["palavras"]
        linhas = []
        linha_atual = []
        inicio_linha = None

        for p in palavras:
            if inicio_linha is None:
                inicio_linha = p["inicio"]
            linha_atual.append(p)

            if len(linha_atual) >= max_palavras_linha or p["texto"].endswith((".", "!", "?", "...")):
                fim_linha = p["fim"]
                texto = " ".join(w["texto"] for w in linha_atual)
                linhas.append({
                    "texto": texto,
                    "inicio": inicio_linha,
                    "fim": fim_linha,
                    "palavras": linha_atual,
                })
                linha_atual = []
                inicio_linha = None

        if linha_atual:
            fim_linha = linha_atual[-1]["fim"]
            texto = " ".join(w["texto"] for w in linha_atual)
            linhas.append({
                "texto": texto,
                "inicio": inicio_linha,
                "fim": fim_linha,
                "palavras": linha_atual,
            })

        resultado = {
            "tipo": "karaoke",
            "linhas": linhas,
            "palavras_originais": palavras,
        }

        with open(saida_json, "w", encoding="utf-8") as f:
            json.dump(resultado, f, ensure_ascii=False, indent=2)

        print(f"✅ Legenda karaoke: {len(linhas)} linhas → {saida_json}")
        return True

    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Extrai timestamps palavra-por-palavra")
    parser.add_argument("audio", help="Arquivo de áudio (.wav, .mp3, etc)")
    parser.add_argument("saida", nargs="?", help="Arquivo JSON de saída (opcional se --karaoke)")
    parser.add_argument("--model", "-m", choices=["tiny", "base", "small", "medium", "large"],
                        default="base", help="Modelo Whisper (padrão: base)")
    parser.add_argument("--language", "-l", default="pt", help="Idioma (padrão: pt)")
    parser.add_argument("--device", choices=["cpu", "cuda"], default="cpu", help="Dispositivo (padrão: cpu)")
    parser.add_argument("--compute", choices=["int8", "int16", "float16", "float32"],
                        default="int8", help="Precisão (padrão: int8)")
    parser.add_argument("--no-vad", action="store_true", help="Desativa VAD filter")
    parser.add_argument("--karaoke", help="Gera também arquivo karaoke JSON")

    args = parser.parse_args()

    if not args.saida and not args.karaoke:
        parser.error("Forneça 'saida' ou use --karaoke")

    ok = extrair_palavras(
        args.audio,
        args.saida or (args.karaoke.replace(".json", "_palavras.json")),
        args.model,
        args.language,
        args.device,
        args.compute,
        not args.no_vad,
    )

    if ok and args.karaoke:
        gerar_legenda_karaoke(args.saida or args.karaoke.replace(".json", "_palavras.json"), args.karaoke)

    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()