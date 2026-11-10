# Exemplo: Pavimentação Asfáltica Completa

Projeto demonstrativo do **Kit Unificado** - Remotion + Three.js para animação 3D viral.

## 🎬 O que este vídeo mostra

Processo completo de pavimentação em 10 segundos:
1. **Usina de asfalto** - Silos de brita/areia → Misturador → Tanque asfalto quente
2. **Transporte** - Caminhões levam asfalto à paver (máquina de pavimentar)
3. **Pavimentação** - Paver espalha → Rolo compacta
4. **Escavação paralela** - Escavadeira carrega caminhões com brita
5. **Resultado** - Rua pronta, drone pull-out final

## 🚀 Início Rápido

```bash
# 1. Instala dependências
npm install

# 2. Preview interativo (Remotion Studio)
npm run dev
# Abre em http://localhost:3000

# 3. Render final (alta qualidade)
npm run build:high
# Saída: output/video.mp4

# 4. Miniaturas
npm run thumb:yt    # YouTube 1280x720
npm run thumb:tt    # TikTok/Reels 1080x1920
```

## 🎙️ Pipeline de Áudio

```bash
# 1. Gera narração (Piper local, gratuito)
npm run audio:voz

# 2. Extrai timestamps palavra-por-palavra (faster-whisper)
npm run audio:palavras

# 3. Gera efeitos sonoros procedurais
npm run audio:sfx

# 4. Mix final (requer FFmpeg)
npm run audio:mix
```

## ✅ Validação

```bash
npm run validar
# Verifica storyboard.json por erros/avisos
```

## 📁 Estrutura

```
exemplo-asfalto/
├── src/
│   └── index.ts          # Storyboard TypeScript (fonte principal)
├── storyboard.json       # Storyboard JSON (para validação)
├── remotion.config.ts    # Composições Remotion registradas
├── package.json          # Scripts e dependências
├── tsconfig.json         # Config TypeScript
├── assets/
│   ├── audio/            # narracao.wav, palavras.json, sfx/
│   ├── images/           # Texturas, referências
│   └── fonts/            # Fontes customizadas
├── output/               # video.mp4, thumbs gerados
└── roteiro.txt           # Texto para TTS
```

## 🎯 Personalizando

Edite `src/index.ts`:
- **Câmera:** Adicione/remova keyframes em `camera.keyframes`
- **Assets:** Adicione objetos em `assets[]` (tipos em `docs/processos.md`)
- **Fluxos:** Ajuste materiais, origens, destinos em `fluxos[]`
- **Rastros:** Modifique caminhos em `rastros[]`
- **Personagens:** Troque tipos/clips em `personagens[]`
- **Legendas:** Atualize `palavras` sincronizadas com áudio

## 📚 Documentação

- `../../docs/storyboard.md` - Referência completa do storyboard
- `../../docs/processos.md` - Catálogo de 57 processos animados
- `../../docs/roteiro-viral.md` - Estrutura para Shorts/Reels/TikTok
- `../../docs/voz.md` - Pipeline TTS + timestamps + SFX + mix
- `../../docs/postagem.md` - Checklist publicação YouTube/TikTok/Reels

## 🔧 Requisitos

- Node.js 18+
- Python 3.10+ (para ferramentas de áudio)
- FFmpeg (para mixagem final)
- 4GB+ RAM (render Remotion)

## 📹 Qualidades de Render

| Comando | Escala | CRF | Preset | Uso |
|---------|--------|-----|--------|-----|
| `build` | 1.0 | 23 | medium | Teste rápido |
| `build:high` | 1.0 | 18 | slow | **Produção** |
| `build:max` | 1.0 | 14 | veryslow | Arquivo master |

## 🎨 Miniaturas Geradas

- `output/thumb_youtube.png` - 1280x720 (YouTube)
- `output/thumb_vertical.png` - 1080x1920 (TikTok/Reels/Shorts)
- `output/thumb_square.png` - 1080x1080 (Instagram Feed)

## 📊 Stats do Exemplo

- **Frames:** 300 (10s @ 30fps)
- **Assets:** 28 objetos 3D
- **Fluxos:** 8 sistemas de partículas
- **Rastros:** 6 caminhos de máquinas
- **Personagens:** 7 billboards animados
- **Legendas:** 27 palavras karaoke
- **Keyframes câmera:** 10 posições

## 🤝 Próximos Passos

1. Rode `npm run dev` e explore no Remotion Studio
2. Modifique `src/index.ts` - salva = hot reload
3. Gere áudio com `npm run audio:voz && npm run audio:palavras`
4. Render final com `npm run build:high`
5. Publique seguindo `../../docs/postagem.md`

---

**Kit Unificado v1.0.0** | Remotion + Three.js | Procedural 3D Animation