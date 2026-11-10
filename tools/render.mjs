#!/usr/bin/env node
// render.mjs - Renderiza vídeo via Remotion CLI
import { renderMedia, selectComposition } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import fs from "fs/promises";
import path from "path";

const args = process.argv.slice(2);
const projeto = args[0] || "exemplo-asfalto";
const composicao = args[1] || "main";
const saida = args[2] || `output/${projeto}.mp4`;
const qualidade = args[3] || "alta";

const QUALIDADES = {
  baixa: { scale: 0.5, crf: 28, preset: "veryfast" },
  media: { scale: 0.75, crf: 23, preset: "medium" },
  alta: { scale: 1, crf: 18, preset: "slow" },
  maxima: { scale: 1, crf: 14, preset: "veryslow" },
};

async function main() {
  console.log(`🎬 Renderizando: ${projeto} → ${saida}`);
  console.log(`   Composição: ${composicao}`);
  console.log(`   Qualidade: ${qualidade}`);

  const q = QUALIDADES[qualidade] || QUALIDADES.alta;
  const projetoPath = path.resolve(".");

  // Verifica se projeto existe
  const entryPoint = path.resolve("src/index.tsx");
  try {
    await fs.access(entryPoint);
  } catch {
    console.error(`❌ Projeto não encontrado: ${projetoPath}`);
    console.log("   Use: npm run novo-projeto <nome> para criar um novo");
    process.exit(1);
  }

  // Bundle
  console.log("📦 Empacotando...");
  const bundleLocation = await bundle(entryPoint);

  // Seleciona composição
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: composicao,
    inputProps: {},
  });

  // Renderiza
  console.log(`🎥 Renderizando ${composition.durationInFrames} frames a ${composition.fps}fps...`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: path.resolve(saida),
    imageFormat: "jpeg",
    jpegQuality: 90,
    scale: q.scale,
    concurrency: 2,
    onProgress: ({ progress, frame, totalFrames }) => {
      const pct = (progress * 100).toFixed(1);
      const eta = ((totalFrames - frame) / composition.fps / 60).toFixed(1);
      process.stdout.write(`\r   Frame ${frame}/${totalFrames} (${pct}%) ETA: ${eta}min`);
    },
    ffmpegOptions: {
      "-crf": q.crf.toString(),
      "-preset": q.preset,
      "-pix_fmt": "yuv420p",
      "-movflags": "+faststart",
    },
    chromiumOptions: {
      headless: "shell",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--use-angle=swiftshader",
      ],
    },
  });

  console.log("\n✅ Render completo!");
  console.log(`   Arquivo: ${path.resolve(saida)}`);
}

main().catch(err => {
  console.error("❌ Erro:", err);
  process.exit(1);
});