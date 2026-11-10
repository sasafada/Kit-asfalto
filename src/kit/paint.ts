// Materiais toon (2 tons) + texturas procedurais
import * as THREE from "three";
import { NOINK } from "./ink";

// Ramp texture para MeshToonMaterial (2 tons)
const RAMP = (() => {
  const d = new Uint8Array([150, 150, 150, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 2, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

/** Material cartoon de dois tons (lado iluminado / lado na sombra) */
export const toon = (cor: THREE.ColorRepresentation, map?: THREE.Texture) =>
  new THREE.MeshToonMaterial({ color: cor, map: map ?? null, gradientMap: RAMP });

/** Material básico sem contorno (para céus, partículas, brilhos) */
export const flat = (cor: THREE.ColorRepresentation, opts: { transparent?: boolean; opacity?: number } = {}) =>
  new THREE.MeshBasicMaterial({ color: cor, transparent: opts.transparent ?? false, opacity: opts.opacity ?? 1, toneMapped: false });

// Cache de texturas procedurais
const textureCache = new Map<string, THREE.Texture>();

function getTexture(key: string, generator: () => THREE.Texture): THREE.Texture {
  if (textureCache.has(key)) return textureCache.get(key)!;
  const tex = generator();
  textureCache.set(key, tex);
  return tex;
}

/** Cria textura procedural via canvas */
function ctex(name: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, r: () => number) => void): THREE.Texture {
  return getTexture(`ctex_${name}_${w}x${h}`, () => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext("2d")!;
    let seed = 1;
    const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
    draw(g, r);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  });
}

/** Repete textura */
export const rep = (tex: THREE.Texture, repeatX: number, repeatY: number) => {
  tex.repeat.set(repeatX, repeatY);
  return tex;
};

// Texturas base
export const grass = () => ctex("grass", 256, 256, (g, r) => {
  g.fillStyle = "#5fae4e"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 800; i++) {
    g.fillStyle = r() > 0.5 ? "#4fa34a" : "#6fb85e";
    g.fillRect(r() * 256, r() * 256, 2, 2);
  }
});

export const cobble = () => ctex("cobble", 256, 256, (g, r) => {
  g.fillStyle = "#9aa3ad"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 300; i++) {
    g.fillStyle = r() > 0.5 ? "#8a95a3" : "#aba4b8";
    const x = r() * 256, y = r() * 256, s = 4 + r() * 12;
    g.fillRect(x, y, s, s);
  }
});

export const water = () => ctex("water", 256, 256, (g, r) => {
  g.fillStyle = "#3fa5e0"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 200; i++) {
    g.fillStyle = r() > 0.5 ? "#5fc5f0" : "#2f8fd8";
    g.fillRect(r() * 256, r() * 256, 8, 2);
  }
});

export const roof = (color: string) => ctex(`roof_${color}`, 128, 128, (g, r) => {
  const base = new THREE.Color(color);
  g.fillStyle = color; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 8) {
    g.fillStyle = base.clone().offsetHSL(0, 0, (r() - 0.5) * 0.08).getStyle();
    g.fillRect(0, y, 128, 4);
  }
});

export const facade = (name: string, w: number, h: number, opts: { wall: string; shutter: string; door: boolean }) =>
  ctex(name, w * 32, h * 32, (g, r) => {
    g.fillStyle = opts.wall; g.fillRect(0, 0, w * 32, h * 32);
    // Janelas
    for (let wy = 0; wy < h; wy++) for (let wx = 0; wx < w; wx++) {
      if (r() < 0.7) {
        g.fillStyle = r() > 0.5 ? "#fff8e0" : "#3a3a4a";
        g.fillRect(wx * 32 + 4, wy * 32 + 4, 24, 24);
      }
    }
    // Porta
    if (opts.door) {
      g.fillStyle = opts.shutter;
      g.fillRect((w * 16) - 12, h * 32 - 48, 24, 48);
    }
  });

// RNG determinístico por seed
export const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
};

// Cores de céu por horário
export const CEU = {
  dia: { topo: "#3b8de0", meio: "#7cc0f2", horiz: "#dff1ff", sol: "#fff4e0", solI: 2.2, amb: "#cfe6ff", ambI: 1.4, nevoa: "#cfe6f7" },
  por: { topo: "#4a3a8c", meio: "#e2789a", horiz: "#ffc58a", sol: "#ffb36b", solI: 2.0, amb: "#c7a0d8", ambI: 1.2, nevoa: "#f2b79a" },
  noite: { topo: "#070a24", meio: "#1b2257", horiz: "#3a3f86", sol: "#9fb4ff", solI: 0.9, amb: "#5262b8", ambI: 0.9, nevoa: "#20285e" },
  espaco: { topo: "#05030f", meio: "#0d0826", horiz: "#1a1040", sol: "#ffffff", solI: 2.6, amb: "#6a5ab8", ambI: 0.5, nevoa: "#101020" },
} as const;

export type Luz = keyof typeof CEU;

// Cores para nuvens
export const CLOUD_DAY = "cloud_day";
export const CLOUD_GOLD = "cloud_gold";

export const cloudHD = (seed: number, palette: string = CLOUD_DAY) => {
  return getTexture(`cloud_${seed}_${palette}`, () => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const g = canvas.getContext("2d")!;
    const r = rng(seed);
    const colors = palette === CLOUD_GOLD ? ["#fff8e0", "#ffe8b0", "#ffd880"] : ["#ffffff", "#f0f0f0", "#e0e0e0"];
    g.fillStyle = colors[0]; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 20; i++) {
      g.fillStyle = colors[Math.floor(r() * colors.length)];
      const x = r() * 512, y = r() * 256, w = 60 + r() * 100, h = 30 + r() * 50;
      g.beginPath(); g.ellipse(x, y, w, h, 0, 0, Math.PI * 2); g.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
};