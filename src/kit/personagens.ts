// Personagens 2D (billboards) com contorno de tinta - estilo cartoon
// Desenhados em canvas por frame, LOD automático por distância
import * as THREE from "three";
import { NOINK } from "./ink";
import { FPS } from "./tempo";
import type { CharacterConfig, CharacterClip, CharacterExpr, CharacterPose, Vetor3 } from "./types";

// Elenco base (8 tipos + overrides)
export const ELENCO: Record<string, CharacterConfig> = {
  crianca: { skin: "#e0ac69", height: 1.10, headScale: 1.18, build: 0.95, top: { color: "#f2d13a", sleeves: "short" }, bottom: { color: "#3d5a80", type: "shorts" }, shoes: "#d94f4f", hair: { style: "short", color: "#2a1a12" }, hat: { type: "cap", color: "#d94f4f" } },
  mae: { skin: "#f3cfae", height: 1.63, build: 0.92, top: { color: "#d9467a", sleeves: "short" }, bottom: { color: "#3b3f52", type: "skirt" }, shoes: "#5b2a3a", hair: { style: "long", color: "#6b3a22" } },
  pai: { skin: "#f3cfae", height: 1.72, build: 1.0, top: { color: "#3a6fd1", sleeves: "short" }, bottom: { color: "#33384a", type: "pants" }, shoes: "#3a2a20", hair: { style: "short", color: "#3a2a20" }, face: { moustache: true, facialHairColor: "#3a2a20" } },
  cientista: { skin: "#f3cfae", height: 1.75, build: 0.95, top: { color: "#f3f1ea", sleeves: "long" }, bottom: { color: "#2f3446", type: "pants" }, shoes: "#2a2230", hair: { style: "short", color: "#9aa0a8" } },
  vovo: { skin: "#f3cfae", height: 1.62, build: 1.08, stoop: 12, top: { color: "#4f8a5b", sleeves: "long" }, bottom: { color: "#4a4038", type: "pants" }, shoes: "#3a2a20", hair: { style: "sides", color: "#eeeeee" }, face: { glasses: true, moustache: true, facialHairColor: "#eeeeee", brow: "#cfcfcf" } },
  astronauta: { skin: "#f3cfae", height: 1.75, build: 1.0, top: { color: "#f4f4f4", sleeves: "long" }, bottom: { color: "#e6e6e6", type: "pants" }, shoes: "#8a8f99", hat: { type: "cap", color: "#f08a2c" } },
  chef: { skin: "#f3cfae", height: 1.72, build: 1.0, top: { color: "#ffffff", sleeves: "long" }, bottom: { color: "#2b2b2b", type: "pants" }, shoes: "#2b2b2b", hat: { type: "tophat", color: "#000000" } },
  turista: { skin: "#e0ac69", height: 1.72, build: 1.0, top: { color: "#f2c230", sleeves: "short" }, bottom: { color: "#4a6b3a", type: "shorts" }, shoes: "#6b4a2a", hat: { type: "cap", color: "#2e9bd6" } },
};

// Presets do kit-video-3d (11 personagens) - mapeados para o sistema unificado
export const PRESETS_VIDEO3D: Record<string, CharacterConfig> = {
  construtor: { skin: "#e0ac69", height: 1.72, build: 1.05, top: { color: "#f28c28", stripe: "#f2f2f2", sleeves: "short" }, bottom: { color: "#3d5a80", type: "pants" }, shoes: "#5a3e2b", hair: { style: "short", color: "#2f2118" }, hat: { type: "hardhat", color: "#ffc61a" }, face: { mustache: true, facialHairColor: "#2f2118" } },
  engenheiro: { skin: "#f3cfae", height: 1.75, build: 0.95, top: { color: "#7fb3d5", sleeves: "long" }, bottom: { color: "#4a4f57", type: "pants" }, shoes: "#2d2d2d", hair: { style: "short", color: "#6b4a2b" }, hat: { type: "hardhat", color: "#f5f5f5" }, face: { glasses: true }, held: { L: "clipboard" } },
  engenheira: { skin: "#8d5524", height: 1.65, build: 0.92, top: { color: "#ff8a3d", stripe: "#e8e8e8", sleeves: "long" }, bottom: { color: "#4a4f57", type: "pants" }, shoes: "#3a2a20", hair: { style: "ponytail", color: "#1c1410" }, hat: { type: "hardhat", color: "#f5f5f5" } },
  servente: { skin: "#5c3a21", height: 1.72, build: 1.1, top: { color: "#9aa0a6", sleeves: "short" }, bottom: { color: "#b59a6a", type: "shorts" }, shoes: "#3b3b3b", hair: { style: "short", color: "#16110d" }, hat: { type: "hardhat", color: "#2f6fd6" }, held: { R: "shovel" } },
  homem: { skin: "#f3cfae", height: 1.72, build: 1.0, top: { color: "#5fae6b", sleeves: "short" }, bottom: { color: "#3d5a80", type: "pants" }, shoes: "#f2f2f2", hair: { style: "fringe", color: "#6b4a2b" } },
  mulher: { skin: "#e0ac69", height: 1.63, build: 0.92, top: { color: "#d96c8c", sleeves: "short" }, bottom: { color: "#7a5aa6", type: "skirt" }, shoes: "#5b2a3a", hair: { style: "long", color: "#2a1a12" } },
  velhinho: { skin: "#f3cfae", height: 1.62, build: 1.08, stoop: 12, top: { color: "#8a6d4b", sleeves: "long" }, bottom: { color: "#c9b88f", type: "pants" }, shoes: "#4a3728", hair: { style: "sides", color: "#e8e8e8" }, face: { glasses: true, mustache: true, facialHairColor: "#e8e8e8", brow: "#cfcfcf" } },
  velhinha: { skin: "#c68642", height: 1.55, build: 1.0, stoop: 10, top: { color: "#b08fd0", sleeves: "long" }, bottom: { color: "#8e6fb0", type: "skirt" }, shoes: "#3a3a3a", hair: { style: "bun", color: "#efefef" }, face: { glasses: true, brow: "#cfcfcf" } },
  crianca_v3d: { skin: "#c68642", height: 1.10, headScale: 1.18, build: 0.95, top: { color: "#f2d13a", sleeves: "short" }, bottom: { color: "#3d5a80", type: "shorts" }, shoes: "#d94f4f", hair: { style: "short", color: "#2a1a12" }, hat: { type: "cap", color: "#d94f4f" } },
  menina: { skin: "#8d5524", height: 1.07, headScale: 1.18, build: 0.92, top: { color: "#e8586a", sleeves: "short" }, bottom: { color: "#e8586a", type: "skirt" }, shoes: "#f2f2f2", hair: { style: "ponytail", color: "#1c1410" } },
  motorista: { skin: "#e0ac69", height: 1.72, build: 1.15, top: { color: "#34495e", sleeves: "short" }, bottom: { color: "#2c3e50", type: "pants" }, shoes: "#222222", hair: { style: "short", color: "#4a3020" }, hat: { type: "cap", color: "#1f2d3d" }, face: { beard: true, facialHairColor: "#4a3020" } },
};

// Merge dos dois elencos
export const TODOS_PERSONAGENS = { ...ELENCO, ...PRESETS_VIDEO3D };

// Cores de pele
export const SKIN_COLORS = {
  clara: "#f3cfae",
  media: "#e0ac69",
  parda: "#c68642",
  escura: "#8d5524",
  muitoEscura: "#5c3a21",
};

// Cache de texturas de personagem (canvas)
const charCache = new Map<string, THREE.CanvasTexture>();
const MAX_CACHE = 400;

const q = (v: number) => Math.round(v * 60) / 60;
const chave = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

// Piscada automática
export const piscar = (t: number, seed: number): number => {
  const f = Math.round(t * FPS);
  const LID = [0.5, 1, 1, 0.5];
  const h = (i: number) => { const v = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return v - Math.floor(v); };
  let s = Math.round(-60 * h(9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * h(n + 13));
  }
  return 0;
};

// Geometria do billboard (plano vertical)
const SU = 0.00216; // 1000 unidades = 2.16m
const GEO = (() => {
  const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU);
  g.translate(0, (975 - 500) * SU, 0); // sola no y = 0
  return g;
})();

/** Desenha personagem frente (bodyFront) */
function bodyFront(pen: any, roupa: CharacterConfig, opts: any) {
  const { phase, expr, mode, look, blink, seed, wave, tilt } = opts;
  const s = roupa.height || 1;
  const h = 1000 * s;
  const w = 600 * s;

  // Corpo
  pen.fillStyle = roupa.top?.color || "#3a6fd1";
  pen.fillRect(-w/2, -h/2, w, h * 0.6);

  // Calça/saia
  pen.fillStyle = roupa.bottom?.color || "#33384a";
  pen.fillRect(-w/2, -h/2 + h*0.6, w, h * 0.4);

  // Cabeça
  const headSize = 300 * (roupa.headScale || 1);
  pen.fillStyle = roupa.skin || SKIN_COLORS.clara;
  pen.beginPath();
  pen.arc(0, -h/2 - headSize*0.3, headSize, 0, Math.PI * 2);
  pen.fill();

  // Cabelo
  if (roupa.hair) {
    pen.fillStyle = roupa.hair.color;
    pen.beginPath();
    pen.arc(0, -h/2 - headSize*0.5, headSize * 1.1, 0, Math.PI);
    pen.fill();
  }

  // Chapéu
  if (roupa.hat && roupa.hat.type !== "none") {
    pen.fillStyle = roupa.hat.color;
    if (roupa.hat.type === "hardhat") {
      pen.fillRect(-headSize*1.2, -h/2 - headSize*1.5, headSize*2.4, headSize*0.6);
      pen.fillRect(-headSize*0.8, -h/2 - headSize*2, headSize*1.6, headSize*0.5);
    } else if (roupa.hat.type === "cap") {
      pen.beginPath();
      pen.arc(0, -h/2 - headSize*0.4, headSize*1.1, Math.PI, 0);
      pen.fill();
      pen.fillRect(-headSize*1.2, -h/2 - headSize*0.4, headSize*2.4, headSize*0.3);
    }
  }

  // Olhos
  const eyeY = -h/2 - headSize*0.2;
  const eyeX = headSize * 0.25;
  const eyeOpen = 1 - (blink || 0);
  if (eyeOpen > 0.1) {
    pen.fillStyle = "#1a1a2e";
    [-eyeX, eyeX].forEach(ex => {
      pen.beginPath();
      pen.ellipse(ex, eyeY, 15, 20 * eyeOpen, 0, 0, Math.PI * 2);
      pen.fill();
    });
  } else {
    // Olhos fechados
    pen.strokeStyle = "#1a1a2e";
    pen.lineWidth = 3;
    [-eyeX, eyeX].forEach(ex => {
      pen.beginPath();
      pen.moveTo(ex - 12, eyeY);
      pen.lineTo(ex + 12, eyeY);
      pen.stroke();
    });
  }

  // Boca (baseada em expr)
  const mouthY = -h/2 + headSize*0.15;
  pen.strokeStyle = "#1a1a2e";
  pen.lineWidth = 2;
  pen.beginPath();
  if (expr === "happy" || expr === "laugh" || expr === "smile") {
    pen.arc(0, mouthY, 20, 0, Math.PI);
  } else if (expr === "sad") {
    pen.arc(0, mouthY + 10, 20, Math.PI, 0);
  } else if (expr === "surprised" || expr === "shock") {
    pen.arc(0, mouthY, 12, 0, Math.PI * 2);
  } else {
    pen.moveTo(-10, mouthY);
    pen.lineTo(10, mouthY);
  }
  pen.stroke();

  // Óculos
  if (roupa.face?.glasses) {
    pen.strokeStyle = "#3a3a3a";
    pen.lineWidth = 3;
    [-eyeX, eyeX].forEach(ex => {
      pen.beginPath();
      pen.arc(ex, eyeY, 28, 0, Math.PI * 2);
      pen.stroke();
    });
    pen.beginPath();
    pen.moveTo(-eyeX + 28, eyeY);
    pen.lineTo(eyeX - 28, eyeY);
    pen.stroke();
  }

  // Bigode/barba
  if (roupa.face?.mustache) {
    pen.fillStyle = roupa.face.facialHairColor || "#3a2a20";
    pen.beginPath();
    pen.ellipse(0, mouthY - 5, 25, 8, 0, 0, Math.PI * 2);
    pen.fill();
  }
  if (roupa.face?.beard) {
    pen.fillStyle = roupa.face.facialHairColor || "#3a2a20";
    pen.fillRect(-30, mouthY + 5, 60, 30);
  }

  // Aceno
  if (wave && wave > 0) {
    pen.fillStyle = roupa.top?.color || "#3a6fd1";
    pen.save();
    pen.translate(w/2 + 20, -h/2 + 50);
    pen.rotate(wave * Math.sin(phase * 4) * 0.5);
    pen.fillRect(-10, -100, 20, 100);
    pen.restore();
  }

  // Inclinação do corpo
  if (tilt) {
    pen.save();
    pen.translate(0, -h/4);
    pen.rotate(tilt * Math.PI / 180);
    pen.translate(0, h/4);
  }
}

/** Desenha personagem lado (bodySide) */
function bodySide(pen: any, roupa: CharacterConfig, opts: any) {
  const { phase, expr, mode, blink, seed, stride } = opts;
  const s = roupa.height || 1;
  const h = 1000 * s;
  const w = 300 * s;

  // Silhueta lateral
  pen.fillStyle = roupa.top?.color || "#3a6fd1";
  pen.beginPath();
  pen.moveTo(-w/2, -h/2);
  pen.lineTo(w/2, -h/2);
  pen.lineTo(w/2 * 0.8, h/2);
  pen.lineTo(-w/2 * 0.8, h/2);
  pen.closePath();
  pen.fill();

  // Cabeça lateral
  const headSize = 200 * (roupa.headScale || 1);
  pen.fillStyle = roupa.skin || SKIN_COLORS.clara;
  pen.beginPath();
  pen.arc(w/2 * 0.5, -h/2 - headSize*0.3, headSize, 0, Math.PI * 2);
  pen.fill();

  // Pernas (walk cycle)
  if (mode === "march" || mode === "stroll") {
    const legPhase = phase * Math.PI * 2;
    const legOffset = Math.sin(legPhase) * 30 * stride;
    pen.fillStyle = roupa.bottom?.color || "#33384a";
    pen.fillRect(-w/2 * 0.8, h/2 - 50 + legOffset, 40, 100);
    pen.fillRect(w/2 * 0.2, h/2 - 50 - legOffset, 40, 100);
  }
}

/** Classe principal do personagem */
export class Personagem {
  mesh: THREE.Mesh;
  sombra: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  roupa: CharacterConfig;
  opts: { altura?: number; seed?: number };

  constructor(parent: THREE.Object3D, roupa: CharacterConfig, opts: { altura?: number; seed?: number } = {}) {
    this.roupa = roupa;
    this.opts = opts;

    this.mat = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      toneMapped: false
    });
    this.mesh = new THREE.Mesh(GEO, this.mat);
    this.mesh.layers.set(NOINK);

    const s = (opts.altura ?? 1.75) / 1.75;
    this.mesh.scale.setScalar(s);

    // Sombra
    const sm = new THREE.MeshBasicMaterial({
      color: "#1d1630",
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });
    this.sombra = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), sm);
    this.sombra.rotation.x = -Math.PI / 2;
    this.sombra.scale.set(s, s * 0.55, 1);
    this.sombra.layers.set(NOINK);

    parent.add(this.mesh, this.sombra);
  }

  /** Posiciona e desenha o personagem para este quadro */
  pose(p: CharacterPose, cam: THREE.Camera, visivel = true) {
    this.mesh.visible = this.sombra.visible = visivel;
    if (!visivel) return;

    const seed = this.opts.seed ?? 1;
    const blink = p.t !== undefined ? piscar(p.t, seed) : 0;
    const dist = cam.position.distanceTo(new THREE.Vector3(p.x, (p.y ?? 0) + 1, p.z));

    // LOD: resolução baseada na distância
    const [w, h, k] = dist < 4 ? [1200, 2000, 2] : dist < 12 ? [720, 1200, 1.2] : [300, 500, 0.5];

    let key: string, draw: (pen: any) => void;

    if (p.lado) {
      const so = {
        phase: p.fase ?? 0,
        expr: p.expr ?? "neutral",
        mode: p.modo === "march" || p.modo === "stroll" ? "march" : "stand",
        blink,
        seed,
        stride: p.modo === "stroll" ? 0.6 : 1
      };
      key = `S|${w}|${chave(this.roupa)}|${chave(so)}`;
      draw = (pen) => bodySide(pen, this.roupa, so);
    } else {
      const fo = {
        phase: p.fase ?? 0,
        expr: p.expr ?? "neutral",
        mode: p.modo ?? "stand",
        look: p.olhar ?? 0,
        blink,
        seed,
        wave: p.aceno,
        tilt: p.inclina ?? 0
      };
      key = `F|${w}|${chave(this.roupa)}|${chave(fo)}`;
      draw = (pen) => bodyFront(pen, this.roupa, fo);
    }

    // Cache de textura
    let tex = charCache.get(key);
    if (!tex) {
      if (charCache.size > MAX_CACHE) {
        for (const v of charCache.values()) v.dispose();
        charCache.clear();
      }
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const g = cv.getContext("2d")!;
      g.setTransform(k, 0, 0, k, 0, 0);
      draw(new Pen(g));
      tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      charCache.set(key, tex);
    }
    this.mat.map = tex;
    this.mat.needsUpdate = true;

    const y = p.y ?? 0;
    this.mesh.position.set(p.x, y, p.z);
    this.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
    this.mesh.scale.x = Math.abs(this.mesh.scale.x) * (p.lado && p.espelho ? -1 : 1);
    this.sombra.position.set(p.x, y + 0.015, p.z);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mat.dispose();
    this.sombra.geometry.dispose();
    this.sombra.material.dispose();
  }
}

// ===== FUNÇÃO HELPER PARA CRIAR PERSONAGEM =====
/** Cria um personagem e adiciona ao grupo pai */
export function criarPersonagem(parent: THREE.Object3D, config: CharacterConfig & { tipo?: string; pos?: Vetor3; escala?: number; seed?: number }): Personagem {
  const { pos, escala, seed, tipo, ...roupa } = config;
  const p = new Personagem(parent, roupa as CharacterConfig, {
    altura: escala ? escala * 1.75 : undefined,
    seed: seed ?? Math.random() * 1000
  });

  // Posiciona se houver posição
  if (pos) {
    p.mesh.position.set(pos[0], pos[1], pos[2]);
    p.sombra.position.set(pos[0], pos[1], pos[2]);
  }

  return p;
}

// Alias para compatibilidade
export const PERSONAGENS = TODOS_PERSONAGENS;

// Pen simplificado para desenho no canvas
class Pen {
  constructor(public ctx: CanvasRenderingContext2D) {}
  fillStyle = "#000000";
  strokeStyle = "#000000";
  lineWidth = 1;
  fillRect(x: number, y: number, w: number, h: number) { this.ctx.fillStyle = this.fillStyle; this.ctx.fillRect(x, y, w, h); }
  strokeRect(x: number, y: number, w: number, h: number) { this.ctx.strokeStyle = this.strokeStyle; this.ctx.lineWidth = this.lineWidth; this.ctx.strokeRect(x, y, w, h); }
  beginPath() { this.ctx.beginPath(); }
  closePath() { this.ctx.closePath(); }
  fill() { this.ctx.fillStyle = this.fillStyle; this.ctx.fill(); }
  stroke() { this.ctx.strokeStyle = this.strokeStyle; this.ctx.lineWidth = this.lineWidth; this.ctx.stroke(); }
  arc(x: number, y: number, r: number, a1: number, a2: number) { this.ctx.arc(x, y, r, a1, a2); }
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, a1: number, a2: number) { this.ctx.ellipse(x, y, rx, ry, rot, a1, a2); }
  moveTo(x: number, y: number) { this.ctx.moveTo(x, y); }
  lineTo(x: number, y: number) { this.ctx.lineTo(x, y); }
  save() { this.ctx.save(); }
  restore() { this.ctx.restore(); }
  translate(x: number, y: number) { this.ctx.translate(x, y); }
  rotate(a: number) { this.ctx.rotate(a); }
}