import { Config } from "@remotion/cli";
import { Video3D, ThumbYoutube, ThumbVertical } from "@kit/Root";
import { storyboard } from "./src/index";

// Configurações de render
Config.EnableProfiling = false;
Config.ChromiumOpenGlRenderer = "angle";
Config.Parallelism = 4;

// Registra composições
export const remotion = [
  // ===== VÍDEO PRINCIPAL (YouTube 16:9) =====
  {
    id: "main",
    component: Video3D,
    props: { storyboard },
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300,
  },

  // ===== MINIATURA YOUTUBE (1280x720) =====
  {
    id: "thumb",
    component: ThumbYoutube,
    props: {
      titulo: "ASFALTAR 1KM EM 4H",
      subtitulo: "Processo completo: usina → paver → rolo",
      cena: <Video3D storyboard={storyboard} />,
      frameSegundo: 3.5, // Frame com paver em ação
      corFundo: "#0a0a1a",
      gradiente: "135deg, #1a1a3a 0%, #0a0a1a 100%",
      badges: ["ENGENHARIA", "4K", "TEMPO REAL"],
    },
    width: 1280,
    height: 720,
    fps: 30,
    durationInFrames: 1,
  },

  // ===== MINIATURA VERTICAL (TikTok/Reels/Shorts 9:16) =====
  {
    id: "thumb_vertical",
    component: ThumbVertical,
    props: {
      titulo: "ASFALTAR 1KM\nEM 4 HORAS",
      subtitulo: "Usina → Paver → Rolo Compactador",
      cena: <Video3D storyboard={storyboard} />,
      frameSegundo: 3.5,
      corFundo: "#0a0a1a",
      gradiente: "180deg, #1a1a3a 0%, #0a0a1a 100%",
      badges: ["ENGENHARIA", "VIRAL", "SHORTS"],
      contadorViews: 1250000,
    },
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 1,
  },

  // ===== MINIATURA QUADRADA (Instagram Feed) =====
  {
    id: "thumb_square",
    component: ThumbYoutube,
    props: {
      titulo: "1KM ASFALTO",
      subtitulo: "4 HORAS • Processo Completo",
      cena: <Video3D storyboard={storyboard} />,
      frameSegundo: 5,
      corFundo: "#0a0a1a",
      gradiente: "135deg, #1a1a3a 0%, #0a0a1a 100%",
      badges: ["ENGENHARIA"],
    },
    width: 1080,
    height: 1080,
    fps: 30,
    durationInFrames: 1,
  },
];