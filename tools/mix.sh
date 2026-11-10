#!/bin/bash
# mix.sh - Mixa voz + SFX + música para arquivo final
# Uso: ./mix.sh voz.wav sfx_dir/ [musica.wav] saida.wav

set -e

VOZ=$1
SFX_DIR=$2
MUSICA=$3
SAIDA=$4

if [ -z "$VOZ" ] || [ -z "$SFX_DIR" ] || [ -z "$SAIDA" ]; then
    echo "Uso: $0 <voz.wav> <sfx_dir/> [musica.wav] <saida.wav>"
    echo "Exemplo: $0 narracao.wav sfx/ musica.wav final.wav"
    exit 1
fi

# Verifica arquivos
for f in "$VOZ"; do
    if [ ! -f "$f" ]; then
        echo "❌ Arquivo não encontrado: $f"
        exit 1
    fi
done

if [ ! -d "$SFX_DIR" ]; then
    echo "❌ Diretório SFX não encontrado: $SFX_DIR"
    exit 1
fi

echo "🎚️  Mixando áudio..."
echo "   Voz: $VOZ"
echo "   SFX: $SFX_DIR"
echo "   Música: ${MUSICA:-'(nenhuma)'}"
echo "   Saída: $SAIDA"

# Cria arquivo temporário para lista de inputs SFX
SFX_LIST=$(mktemp)
find "$SFX_DIR" -name "*.wav" -type f | sort > "$SFX_LIST"

SFX_COUNT=$(wc -l < "$SFX_LIST")
echo "   Encontrados $SFX_COUNT arquivos SFX"

# Volumes padrão por tipo de SFX (ajuste conforme necessário)
declare -A SFX_VOLUME=(
    ["engine"]="-12dB"
    ["hydraulic"]="-6dB"
    ["whoosh"]="-10dB"
    ["impact"]="-3dB"
    ["alert"]="-8dB"
    ["success"]="-6dB"
    ["error"]="-6dB"
    ["sweep"]="-12dB"
    ["noise"]="-15dB"
    ["click"]="-10dB"
    ["pop"]="-8dB"
)

# Constrói filter_complex do FFmpeg
FILTER="[0:a]loudnorm=I=-14:TP=-1:LRA=11[voz_norm]"
INPUTS="-i \"$VOZ\""
MAP_IDX=1

# Adiciona cada SFX com volume apropriado
while IFS= read -r sfx_file; do
    if [ -z "$sfx_file" ]; then continue; fi

    basename=$(basename "$sfx_file" .wav)
    volume="${SFX_VOLUME[$basename]:- -10dB}"  # Default -10dB

    INPUTS="$INPUTS -i \"$sfx_file\""
    FILTER="$FILTER;[$MAP_IDX:a]volume=$volume[sfx$MAP_IDX]"
    MAP_IDX=$((MAP_IDX + 1))
done < "$SFX_LIST"

# Amix: voz + todos SFX
if [ $SFX_COUNT -gt 0 ]; then
    AMIX_INPUTS="[voz_norm]"
    for i in $(seq 1 $SFX_COUNT); do
        AMIX_INPUTS="$AMIX_INPUTS[sfx$i]"
    done
    FILTER="$FILTER;$AMIX_INPUTS amix=inputs=$((SFX_COUNT + 1)):duration=first:dropout_transition=0[voz_sfx]"
    FINAL_MAP="[voz_sfx]"
else
    FINAL_MAP="[voz_norm]"
fi

# Adiciona música se fornecida
if [ -n "$MUSICA" ] && [ -f "$MUSICA" ]; then
    INPUTS="$INPUTS -i \"$MUSICA\""
    MUSIC_IDX=$MAP_IDX
    FILTER="$FILTER;[$MUSIC_IDX:a]volume=-24dB,aloop=loop=-1:size=2e+09[bg_music];$FINAL_MAP[bg_music]amix=inputs=2:duration=first[final_mix]"
    FINAL_MAP="[final_mix]"
fi

# Normalização final
FILTER="$FILTER;$FINAL_MAP loudnorm=I=-14:TP=-1:LRA=11[out]"

# Executa FFmpeg
echo "🔧 Executando FFmpeg..."
eval "ffmpeg -y $INPUTS -filter_complex \"$FILTER\" -map \"[out]\" -c:a pcm_s16le -ar 44100 \"$SAIDA\""

# Limpa
rm -f "$SFX_LIST"

echo "✅ Mix completo: $SAIDA"
echo "   Duração: $(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$SAIDA" | cut -d. -f1)s"
echo "   Nível: $(ffmpeg -i "$SAIDA" -af loudnorm=I=-14:TP=-1:LRA=11 -f null - 2>&1 | grep "Input Integrated" | head -1)"