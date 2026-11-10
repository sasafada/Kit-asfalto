#!/usr/bin/env python3
# sons.py - Gera efeitos sonoros procedurais (SFX) via síntese
# Uso: python sons.py <tipo> saida.wav [--duracao 1.0] [--freq 440] [--sample-rate 44100]
# Tipos: beep, sweep, noise, click, pop, engine, hydraulic, alert, success, error, whoosh, impact

import sys
import argparse
import wave
import struct
import math
import random
from pathlib import Path

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

SAMPLE_RATE = 44100

def write_wav(path: str, samples: list, sample_rate: int = SAMPLE_RATE):
    """Escreve arquivo WAV 16-bit mono"""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with wave.open(path, "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        data = struct.pack(f"<{len(samples)}h", *[int(max(-32768, min(32767, s * 32767))) for s in samples])
        f.writeframes(data)

def envelope(samples: list, attack: float = 0.01, decay: float = 0.1, sustain: float = 0.7, release: float = 0.1, sr: int = SAMPLE_RATE) -> list:
    """Aplica envelope ADSR"""
    n = len(samples)
    a = int(attack * sr)
    d = int(decay * sr)
    r = int(release * sr)
    s = n - a - d - r

    env = []
    for i in range(n):
        if i < a:
            env.append(i / a)
        elif i < a + d:
            env.append(1 - (1 - sustain) * (i - a) / d)
        elif i < a + d + s:
            env.append(sustain)
        else:
            env.append(sustain * (1 - (i - a - d - s) / r))

    return [samples[i] * env[i] for i in range(n)]

# ===== GERADORES =====

def gen_beep(duracao=0.2, freq=880, volume=0.5, wave_type="sine"):
    n = int(duracao * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        if wave_type == "sine":
            s = math.sin(2 * math.pi * freq * t)
        elif wave_type == "square":
            s = 1 if math.sin(2 * math.pi * freq * t) > 0 else -1
        elif wave_type == "saw":
            s = 2 * (t * freq - math.floor(t * freq + 0.5))
        else:
            s = math.sin(2 * math.pi * freq * t)
        samples.append(s * volume)
    return envelope(samples, attack=0.005, decay=0.05, sustain=0.3, release=0.05)

def gen_sweep(duracao=1.0, freq_ini=200, freq_fim=2000, volume=0.3):
    n = int(duracao * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Log sweep
        freq = freq_ini * (freq_fim / freq_ini) ** (t / duracao)
        s = math.sin(2 * math.pi * freq * t)
        # Amplitude envelope
        amp = 1 - t / duracao
        samples.append(s * volume * amp)
    return envelope(samples, attack=0.01, release=0.1)

def gen_noise(duracao=0.5, volume=0.3, color="white"):
    n = int(duracao * SAMPLE_RATE)
    samples = []
    last = 0
    for i in range(n):
        if color == "white":
            s = random.uniform(-1, 1)
        elif color == "pink":
            # Pink noise approximation
            s = last + random.uniform(-1, 1)
            last = s * 0.99
            s *= 0.1
        elif color == "brown":
            s = last + random.uniform(-0.1, 0.1)
            last = s * 0.999
        else:
            s = random.uniform(-1, 1)
        samples.append(s * volume)
    return envelope(samples, attack=0.001, release=0.05)

def gen_click(duracao=0.01, volume=0.8):
    n = int(duracao * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Impulso curto com harmônicos
        s = math.exp(-t * 5000) * math.sin(2 * math.pi * 2000 * t)
        samples.append(s * volume)
    return envelope(samples, attack=0.0001, release=0.005)

def gen_pop(duracao=0.1, freq=200, volume=0.6):
    n = int(duracao * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Bolha estourando
        freq_t = freq * (1 + 2 * t)
        s = math.sin(2 * math.pi * freq_t * t) * math.exp(-t * 30)
        samples.append(s * volume)
    return envelope(samples, attack=0.001, release=0.02)

def gen_engine(duracao=2.0, rpm_base=800, volume=0.4):
    """Som de motor diesel/elétrico"""
    n = int(duracao * SAMPLE_RATE)
    samples = []
    phase = 0
    for i in range(n):
        t = i / SAMPLE_RATE
        # RPM varia levemente
        rpm = rpm_base + 50 * math.sin(2 * math.pi * 0.5 * t)
        freq = rpm / 60  # Hz
        phase += 2 * math.pi * freq / SAMPLE_RATE

        # Harmônicos de motor
        s = 0
        for h in [1, 2, 3, 4, 5, 6]:
            s += math.sin(phase * h) / h

        # Ruído de combustão
        s += random.uniform(-0.1, 0.1) * 0.3

        samples.append(s * volume * 0.3)
    return envelope(samples, attack=0.5, release=0.5)

def gen_hydraulic(duracao=1.0, freq=120, volume=0.5):
    """Som de cilindro hidráulico"""
    n = int(duracao * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Som de óleo pressurizado + mecânico
        s = math.sin(2 * math.pi * freq * t) * 0.5
        s += math.sin(2 * math.pi * freq * 3 * t) * 0.2
        s += random.uniform(-0.05, 0.05) * (1 + math.sin(2 * math.pi * 2 * t)) * 0.5
        samples.append(s * volume)
    return envelope(samples, attack=0.1, release=0.2)

def gen_alert(duracao=0.5, freq=1000, volume=0.6, pattern="beep"):
    n = int(duracao * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        if pattern == "beep":
            # Beep intermitente
            beep = 1 if (t * 4) % 1 < 0.5 else 0
            s = math.sin(2 * math.pi * freq * t) * beep
        elif pattern == "siren":
            # Sirene
            mod = math.sin(2 * math.pi * 2 * t)
            s = math.sin(2 * math.pi * (freq + 300 * mod) * t)
        elif pattern == "pulse":
            # Pulso rápido
            pulse = 1 if (t * 10) % 1 < 0.1 else 0
            s = math.sin(2 * math.pi * freq * t) * pulse
        else:
            s = math.sin(2 * math.pi * freq * t)
        samples.append(s * volume)
    return envelope(samples, attack=0.01, release=0.05)

def gen_success(duracao=0.8, volume=0.5):
    """Som de sucesso (acordes maiores)"""
    n = int(duracao * SAMPLE_RATE)
    samples = []
    notas = [523.25, 659.25, 783.99, 1046.50]  # C5, E5, G5, C6
    for i in range(n):
        t = i / SAMPLE_RATE
        s = 0
        for j, freq in enumerate(notas):
            delay = j * 0.1
            if t >= delay:
                s += math.sin(2 * math.pi * freq * (t - delay)) * math.exp(-(t - delay) * 3) * 0.25
        samples.append(s * volume)
    return envelope(samples, attack=0.01, release=0.3)

def gen_error(duracao=0.6, volume=0.5):
    """Som de erro (trítono)"""
    n = int(duracao * SAMPLE_RATE)
    samples = []
    notas = [523.25, 466.16, 415.30]  # C5, Bb4, G#4 (descendo)
    for i in range(n):
        t = i / SAMPLE_RATE
        s = 0
        for j, freq in enumerate(notas):
            delay = j * 0.15
            if t >= delay:
                s += math.sin(2 * math.pi * freq * (t - delay)) * math.exp(-(t - delay) * 4) * 0.3
        samples.append(s * volume)
    return envelope(samples, attack=0.01, release=0.2)

def gen_whoosh(duracao=1.0, volume=0.4):
    """Som de transição/corte rápido"""
    n = int(duracao * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Ruído filtrado varrendo frequência
        freq = 200 + 3000 * (t / duracao) ** 2
        # Filtro passa-banda simples via seno modulado
        noise = random.uniform(-1, 1)
        s = noise * math.sin(2 * math.pi * freq * t) * (1 - t / duracao)
        samples.append(s * volume)
    return envelope(samples, attack=0.02, release=0.2)

def gen_impact(duracao=0.3, volume=0.7, material="metal"):
    """Som de impacto"""
    n = int(duracao * SAMPLE_RATE)
    samples = []

    freq_map = {
        "metal": [800, 1200, 1600, 2400],
        "madeira": [200, 300, 450, 600],
        "pedra": [100, 150, 220, 300],
        "terra": [50, 80, 120, 180],
        "vidro": [1500, 2200, 3000, 4500],
        "agua": [100, 200, 400, 800],
    }
    freqs = freq_map.get(material, freq_map["metal"])

    for i in range(n):
        t = i / SAMPLE_RATE
        s = 0
        for freq in freqs:
            s += math.sin(2 * math.pi * freq * t) * math.exp(-t * 50) * (1 / len(freqs))
        # Ruído inicial
        s += random.uniform(-1, 1) * math.exp(-t * 200) * 0.5
        samples.append(s * volume)
    return envelope(samples, attack=0.0001, release=0.05)

# ===== MAIN =====

GERADORES = {
    "beep": gen_beep,
    "sweep": gen_sweep,
    "noise": gen_noise,
    "click": gen_click,
    "pop": gen_pop,
    "engine": gen_engine,
    "hydraulic": gen_hydraulic,
    "alert": gen_alert,
    "success": gen_success,
    "error": gen_error,
    "whoosh": gen_whoosh,
    "impact": gen_impact,
}

def main():
    parser = argparse.ArgumentParser(description="Gera SFX procedurais")
    parser.add_argument("tipo", choices=list(GERADORES.keys()), help="Tipo de som")
    parser.add_argument("saida", help="Arquivo .wav de saída")
    parser.add_argument("--duracao", "-d", type=float, default=1.0, help="Duração em segundos")
    parser.add_argument("--freq", "-f", type=float, default=440, help="Frequência base (Hz)")
    parser.add_argument("--freq-fim", type=float, default=2000, help="Frequência final (sweep)")
    parser.add_argument("--volume", "-v", type=float, default=0.5, help="Volume 0-1")
    parser.add_argument("--sample-rate", "-r", type=int, default=SAMPLE_RATE, help="Sample rate")
    parser.add_argument("--wave", choices=["sine", "square", "saw"], default="sine", help="Forma de onda (beep)")
    parser.add_argument("--color", choices=["white", "pink", "brown"], default="white", help="Cor do ruído")
    parser.add_argument("--pattern", choices=["beep", "siren", "pulse"], default="beep", help="Padrão alerta")
    parser.add_argument("--material", choices=["metal", "madeira", "pedra", "terra", "vidro", "agua"], default="metal", help="Material do impacto")
    parser.add_argument("--rpm", type=int, default=800, help="RPM base (engine)")

    args = parser.parse_args()

    gen = GERADORES[args.tipo]

    # Chama gerador com parâmetros apropriados
    if args.tipo == "beep":
        samples = gen(args.duracao, args.freq, args.volume, args.wave)
    elif args.tipo == "sweep":
        samples = gen(args.duracao, args.freq, args.freq_fim, args.volume)
    elif args.tipo == "noise":
        samples = gen(args.duracao, args.volume, args.color)
    elif args.tipo == "click":
        samples = gen(args.duracao, args.volume)
    elif args.tipo == "pop":
        samples = gen(args.duracao, args.freq, args.volume)
    elif args.tipo == "engine":
        samples = gen(args.duracao, args.rpm, args.volume)
    elif args.tipo == "hydraulic":
        samples = gen(args.duracao, args.freq, args.volume)
    elif args.tipo == "alert":
        samples = gen(args.duracao, args.freq, args.volume, args.pattern)
    elif args.tipo == "success":
        samples = gen(args.duracao, args.volume)
    elif args.tipo == "error":
        samples = gen(args.duracao, args.volume)
    elif args.tipo == "whoosh":
        samples = gen(args.duracao, args.volume)
    elif args.tipo == "impact":
        samples = gen(args.duracao, args.volume, args.material)
    else:
        samples = gen(args.duracao, args.volume)

    write_wav(args.saida, samples, args.sample_rate)
    print(f"✅ {args.tipo} → {args.saida} ({len(samples)/args.sample_rate:.2f}s, {args.sample_rate}Hz)")

if __name__ == "__main__":
    main()