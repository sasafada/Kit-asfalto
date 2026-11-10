// Cenários procedurais - mundo, chão, casas, árvores, cidade, natureza, espaço
import * as THREE from "three";
import { NOINK } from "./ink";
import { toon, flat, CEU, Luz, rng, cloudHD, CLOUD_DAY, CLOUD_GOLD, grass, cobble, water, roof, facade, rep } from "./paint";
import type { Vetor3, Fundo, ChaoTipo, Clima, Horario } from "./types";

export type Mundo = { root: THREE.Group; sol: THREE.DirectionalLight; luz: Luz; nevoaCor?: string };

/** Cria mundo vazio com céu, sol, luz ambiente */
export const criarMundo = (luz: Luz = "dia", solDir: Vetor3 = { x: 30, y: 45, z: 20 }): Mundo => {
  const c = CEU[luz];
  const root = new THREE.Group();

  // Céu esférico com shader degradê
  const ceu = new THREE.Mesh(
    new THREE.SphereGeometry(900, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        a: { value: new THREE.Color(c.topo) },
        b: { value: new THREE.Color(c.meio) },
        h: { value: new THREE.Color(c.horiz) }
      },
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `uniform vec3 a,b,h; varying vec3 vP; void main(){ float y = clamp(vP.y, -0.2, 1.); vec3 col = y < .18 ? mix(h, b, smoothstep(-.05,.18,y)) : mix(b, a, smoothstep(.18,.85,y)); gl_FragColor = vec4(col,1.); }`,
    })
  );
  ceu.layers.set(NOINK);
  ceu.renderOrder = -10;
  root.add(ceu);

  // Sol
  const sol = new THREE.DirectionalLight(c.sol, c.solI);
  sol.position.set(solDir.x, solDir.y, solDir.z);
  sol.target.position.set(0, 0, 0);
  root.add(sol, sol.target);

  // Luz ambiente
  root.add(new THREE.HemisphereLight(c.amb, "#6b5a4a", c.ambI));

  // Estrelas se noite/espaço
  if (luz === "noite" || luz === "espaco") estrelas(root, luz === "espaco" ? 2500 : 900);

  return { root, sol, luz, nevoaCor: c.nevoa };
};

/** Névoa de distância */
export const aplicarNevoa = (scene: THREE.Scene, mundo: Mundo, perto = 60, longe = 320) => {
  scene.fog = mundo.nevoaCor ? new THREE.Fog(mundo.nevoaCor, perto, longe) : null;
};

// ========================== CHÃO E MAR ==========================
export const chao = (root: THREE.Object3D, o: { tam?: number; tipo?: ChaoTipo; cor?: string; seed?: number } = {}) => {
  const tam = o.tam ?? 400;
  const tipo = o.tipo ?? "grama";
  const seed = o.seed ?? 1;
  const r = rng(seed);

  let map: THREE.Texture | undefined;
  if (tipo === "grama") map = rep(grass(), tam / 8, tam / 8);
  else if (tipo === "pedra") map = rep(cobble(), tam / 4, tam / 4);
  else if (tipo === "areia") map = rep(ctex("areia", 256, 256, (g, r) => { g.fillStyle = "#f0d9a0"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 300; i++) { g.fillStyle = r() > .5 ? "#e5c98a" : "#f7e6b8"; g.fillRect(r() * 256, r() * 256, 3, 3); } }), tam / 6, tam / 6);
  else if (tipo === "concreto") map = rep(ctex("concreto", 256, 256, (g, r) => { g.fillStyle = "#b8bcc0"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 200; i++) { g.fillStyle = r() > .5 ? "#a8acb0" : "#c8ccd0"; g.fillRect(r() * 256, r() * 256, 4, 4); } }), tam / 8, tam / 8);
  else if (tipo === "asfalto") map = rep(ctex("asfalto", 256, 256, (g, r) => { g.fillStyle = "#2d2d2d"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 150; i++) { g.fillStyle = r() > .5 ? "#3a3a3a" : "#4a4a4a"; g.fillRect(r() * 256, r() * 256, 5, 5); } }), tam / 6, tam / 6);
  else if (tipo === "madeira") map = rep(ctex("madeira", 256, 256, (g, r) => { g.fillStyle = "#a9743f"; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 16) { g.fillStyle = r() > .5 ? "#9a6b3a" : "#b8804f"; g.fillRect(0, y, 256, 8); } }), tam / 4, tam / 4);
  else if (tipo === "piso") map = rep(ctex("piso", 256, 256, (g, r) => { g.fillStyle = "#e8e6e0"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 100; i++) { g.fillStyle = r() > .5 ? "#d8d6d0" : "#c8c6c0"; g.fillRect(r() * 256, r() * 256, 32, 32); } }), tam / 5, tam / 5);

  const m = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), toon(o.cor ?? "#ffffff", map));
  m.rotation.x = -Math.PI / 2;
  root.add(m);
  return m;
};

export const mar = (root: THREE.Object3D, tam = 600, y = -0.3) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), toon("#ffffff", rep(water(), tam / 10, tam / 10)));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  root.add(m);
  return m;
};

// ========================== CASAS E PRÉDIOS ==========================
const PAREDES = ["#f4e3c1", "#f2c6b4", "#cfe3d2", "#f6d58e", "#d8d1ef", "#ffffff"];
const TELHADOS = ["#c8553d", "#3d6fb0", "#6b4f8c", "#d98b2b", "#4f8a5b"];

export const casa = (root: THREE.Object3D, x: number, z: number, o: { w?: number; d?: number; h?: number; yaw?: number; seed?: number; parede?: string; telhado?: string } = {}) => {
  const r = rng(o.seed ?? Math.round(x * 13 + z * 7));
  const w = o.w ?? 6, d = o.d ?? 5, h = o.h ?? 4 + Math.floor(r() * 3) * 2.8;
  const parede = o.parede ?? PAREDES[Math.floor(r() * PAREDES.length)];
  const tel = o.telhado ?? TELHADOS[Math.floor(r() * TELHADOS.length)];

  const g = new THREE.Group();
  const fr = toon("#ffffff", facade(`f_${parede}_${w}_${h}`, w, h, { wall: parede, shutter: tel, door: true }));
  const lado = toon("#ffffff", facade(`l_${parede}_${d}_${h}`, d, h, { wall: parede, shutter: tel }));
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [lado, lado, toon(parede), toon(parede), fr, fr]);
  corpo.position.y = h / 2;
  g.add(corpo);

  const rh = Math.min(w, d) * 0.45;
  const sh = new THREE.Shape([new THREE.Vector2(-w / 2 - 0.3, 0), new THREE.Vector2(w / 2 + 0.3, 0), new THREE.Vector2(0, rh)]);
  const tg = new THREE.ExtrudeGeometry(sh, { depth: d + 0.6, bevelEnabled: false });
  tg.translate(0, 0, -(d + 0.6) / 2);
  const tet = new THREE.Mesh(tg, toon("#ffffff", rep(roof(tel), 2, 2)));
  tet.position.y = h;
  g.add(tet);

  g.position.set(x, 0, z);
  g.rotation.y = ((o.yaw ?? 0) * Math.PI) / 180;
  root.add(g);
  return g;
};

export const predio = (root: THREE.Object3D, x: number, z: number, o: { w?: number; d?: number; floors?: number; seed?: number } = {}) => {
  const r = rng(o.seed ?? Math.round(x * 7 + z * 13));
  const w = o.w ?? 12, d = o.d ?? 10, floors = o.floors ?? 6 + Math.floor(r() * 8);
  const h = floors * 3.2;

  const g = new THREE.Group();
  const glass = toon("#5b8fb9", undefined);
  const band = toon("#dfe7ee", undefined);
  const mats = [band, band, glass, glass, glass, glass];
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  corpo.position.y = h / 2;
  g.add(corpo);

  // Base/pódio
  const base = new THREE.Mesh(new THREE.BoxGeometry(w * 1.1, 4, d * 1.1), toon("#3a3f4a"));
  base.position.y = 2;
  g.add(base);

  // Caixa d'água
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3, 12), toon("#8a95a3"));
  tank.position.set((r() - 0.5) * w * 0.5, h + 2.5, (r() - 0.5) * d * 0.5);
  g.add(tank);

  // Antena
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 8), toon("#5a5a5a"));
  ant.position.set(0, h + 5, 0);
  g.add(ant);

  g.position.set(x, 0, z);
  root.add(g);
  return g;
};

export const arranhaCeu = (root: THREE.Object3D, x: number, z: number, o: { floors?: number; seed?: number } = {}) => {
  return predio(root, x, z, { w: 22, d: 22, floors: o.floors ?? 14, seed: o.seed });
};

export const loja = (root: THREE.Object3D, x: number, z: number, o: { variante?: string; seed?: number } = {}) => {
  const r = rng(o.seed ?? Math.round(x * 11 + z * 17));
  const g = new THREE.Group();
  const wall = toon("#f0e6d2");
  const awning = toon("#d9473a");
  const sign = toon("#3d6fb6");
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 9), [wall, wall, wall, wall, sign, sign]);
  corpo.position.y = 2;
  g.add(corpo);

  // Toldo
  const toldo = new THREE.Mesh(new THREE.BoxGeometry(9, 0.5, 3), awning);
  toldo.position.set(0, 4.5, 6);
  g.add(toldo);

  g.position.set(x, 0, z);
  g.rotation.y = ((Math.round(r() * 4) * 90) * Math.PI) / 180;
  root.add(g);
  return g;
};

export const galpao = (root: THREE.Object3D, x: number, z: number, o: { variante?: string; seed?: number } = {}) => {
  const r = rng(o.seed ?? Math.round(x * 19 + z * 23));
  const g = new THREE.Group();
  const wall = toon("#c9cdd2");
  const roofMat = toon("#6d7783");
  const door = toon("#d9473a");
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(25, 15, 15), [wall, wall, wall, wall, door, door]);
  corpo.position.y = 7.5;
  g.add(corpo);

  // Telhado
  const rh = 5;
  const sh = new THREE.Shape([new THREE.Vector2(-12.8, 0), new THREE.Vector2(12.8, 0), new THREE.Vector2(0, rh)]);
  const tg = new THREE.ExtrudeGeometry(sh, { depth: 15.6, bevelEnabled: false });
  tg.translate(0, 0, -7.8);
  const tet = new THREE.Mesh(tg, roofMat);
  tet.position.y = 15;
  g.add(tet);

  // Chaminé
  const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 12), toon("#7a5232"));
  chim.position.set((r() - 0.5) * 10, 18, (r() - 0.5) * 10);
  g.add(chim);

  g.position.set(x, 0, z);
  g.rotation.y = ((Math.round(r() * 4) * 90) * Math.PI) / 180;
  root.add(g);
  return g;
};

// ========================== NATUREZA ==========================
export const arvore = (root: THREE.Object3D, x: number, z: number, h = 5, cor = "#4fa34a", seed = 1) => {
  const r = rng(seed + Math.round(x * 3 + z));
  const g = new THREE.Group();
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * h / 5, 0.2 * h / 5, h * 0.45, 8), toon("#7a5232"));
  tr.position.y = h * 0.22;
  g.add(tr);
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(h * (0.2 + r() * 0.1), 16, 12), toon(new THREE.Color(cor).offsetHSL(0, 0, (r() - 0.5) * 0.08)));
    s.position.set((r() - 0.5) * h * 0.35, h * (0.55 + r() * 0.25), (r() - 0.5) * h * 0.35);
    g.add(s);
  }
  g.position.set(x, 0, z);
  root.add(g);
  return g;
};

export const arvoreFrutifera = (root: THREE.Object3D, x: number, z: number, h = 4.5, corFruta = "#e8452c", seed = 1) => {
  const r = rng(seed + Math.round(x * 3 + z));
  const g = arvore(root, x, z, h, "#4f9d4a", seed);
  // Adiciona frutas
  for (let i = 0; i < 12; i++) {
    const fruta = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), toon(corFruta));
    fruta.position.set((r() - 0.5) * 2, 2 + r() * 2, (r() - 0.5) * 2);
    g.add(fruta);
  }
  return g;
};

export const palmeira = (root: THREE.Object3D, x: number, z: number, h = 7, seed = 1) => {
  const r = rng(seed + Math.round(x * 5 + z));
  const g = new THREE.Group();
  // Tronco curvo
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3((r() - 0.5) * 0.5, h * 0.3, (r() - 0.5) * 0.5),
    new THREE.Vector3((r() - 0.5) * 1, h * 0.7, (r() - 0.5) * 1),
    new THREE.Vector3((r() - 0.5) * 0.8, h, (r() - 0.5) * 0.8),
  ]);
  const troncoGeo = new THREE.TubeGeometry(curve, 20, 0.15 * h / 7, 6, false);
  const tr = new THREE.Mesh(troncoGeo, toon("#8a5a34"));
  g.add(tr);

  // Folhas
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), toon("#4faa52"));
    leaf.scale.set(2, 0.1, 1);
    leaf.rotation.y = (i / 6) * Math.PI * 2;
    leaf.position.y = h * 0.85;
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  root.add(g);
  return g;
};

export const arbusto = (root: THREE.Object3D, x: number, z: number, h = 1.5, seed = 1) => {
  const r = rng(seed + Math.round(x * 7 + z));
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(h * (0.3 + r() * 0.2), 12, 10), toon("#4f9d4a"));
    s.position.set((r() - 0.5) * h, h * 0.3, (r() - 0.5) * h);
    g.add(s);
  }
  g.position.set(x, 0, z);
  root.add(g);
  return g;
};

// ========================== RUAS E TERRENO ==========================
export const rua = (root: THREE.Object3D, x: number, z: number, o: { length?: number; lanes?: number; yaw?: number; seed?: number } = {}) => {
  const r = rng(o.seed ?? Math.round(x * 29 + z * 31));
  const length = o.length ?? 20;
  const lanes = o.lanes ?? 2;
  const laneWidth = 3.4;
  const sidewalk = 2.2;
  const w = lanes * laneWidth;

  const g = new THREE.Group();

  // Asfalto
  const asfalto = new THREE.Mesh(new THREE.PlaneGeometry(w, length), toon("#2d2d2d", rep(ctex("asfalto2", 256, 256, (g, r) => { g.fillStyle = "#2d2d2d"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 100; i++) { g.fillStyle = r() > .5 ? "#3a3a3a" : "#4a4a4a"; g.fillRect(r() * 256, r() * 256, 4, 4); } }), w / 4, length / 4)));
  asfalto.rotation.x = -Math.PI / 2;
  g.add(asfalto);

  // Faixa central
  const faixa = new THREE.Mesh(new THREE.PlaneGeometry(0.3, length), toon("#f2f2f2"));
  faixa.rotation.x = -Math.PI / 2;
  faixa.position.y = 0.02;
  g.add(faixa);

  // Calçadas
  const calcada = toon("#c8c8c8", rep(cobble(), (sidewalk) / 2, length / 4));
  [-1, 1].forEach(side => {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(sidewalk, length), calcada);
    c.rotation.x = -Math.PI / 2;
    c.position.set(side * (w / 2 + sidewalk / 2), 0.03, 0);
    g.add(c);
  });

  g.position.set(x, 0, z);
  g.rotation.y = ((o.yaw ?? 0) * Math.PI) / 180;
  root.add(g);
  return g;
};

export const cruzamento = (root: THREE.Object3D, x: number, z: number, o: { arm?: number; lanes?: number; seed?: number } = {}) => {
  const arm = o.arm ?? 8;
  // Simplificado: 4 ruas se cruzando
  rua(root, x - arm, z, { length: arm * 2, yaw: 0, seed: o.seed });
  rua(root, x, z - arm, { length: arm * 2, yaw: Math.PI / 2, seed: (o.seed ?? 0) + 1 });
  return root;
};

// ========================== CIDADE PROCEDURAL ==========================
export const cidade = (root: THREE.Object3D, o: { raio?: number; livre?: number; seed?: number } = {}) => {
  const r = rng(o.seed ?? 7);
  const R = o.raio ?? 60;
  const livre = o.livre ?? 12;
  for (let x = -R; x <= R; x += 11) for (let z = -R; z <= R; z += 11) {
    if (Math.hypot(x, z) < livre) continue;
    if (r() < 0.7) {
      const tipo = r() < 0.5 ? "casa" : r() < 0.8 ? "predio" : "loja";
      if (tipo === "casa") casa(root, x + (r() - 0.5) * 2, z + (r() - 0.5) * 2, { yaw: Math.round(r() * 4) * 90, seed: Math.round(r() * 1e4) });
      else if (tipo === "predio") predio(root, x + (r() - 0.5) * 2, z + (r() - 0.5) * 2, { seed: Math.round(r() * 1e4) });
      else loja(root, x + (r() - 0.5) * 2, z + (r() - 0.5) * 2, { seed: Math.round(r() * 1e4) });
    } else {
      arvore(root, x, z, 4 + r() * 3, "#4fa34a", Math.round(r() * 100));
    }
  }
};

// ========================== CÉU: NUVENS E ESTRELAS ==========================
export const nuvem = (root: THREE.Object3D, x: number, y: number, z: number, w = 30, seed = 1, luz: Luz = "dia") => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudHD(seed, luz === "por" ? CLOUD_GOLD : CLOUD_DAY), depthWrite: false, fog: false }));
  sp.scale.set(w, w / 2, 1);
  sp.position.set(x, y, z);
  sp.layers.set(NOINK);
  root.add(sp);
  return sp;
};

export const estrelas = (root: THREE.Object3D, n = 1500, raio = 800) => {
  const r = rng(99);
  const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    p.set([raio * s * Math.cos(a), raio * Math.abs(u) * 0.9 + 20, raio * s * Math.sin(a)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: "#ffffff", size: 2.2, sizeAttenuation: false, fog: false, depthWrite: false }));
  pts.layers.set(NOINK);
  root.add(pts);
  return pts;
};

// ========================== PLANETAS ==========================
export type TipoPlaneta = "terra" | "lua" | "marte" | "gasoso" | "sol";

const texPlaneta = (tipo: TipoPlaneta, seed: number) => ctex(`pl_${tipo}_${seed}`, 1024, 512, (g, r) => {
  const W = 1024, H = 512;
  const blob = (cx: number, cy: number, rx: number, ry: number, col: string) => {
    g.fillStyle = col; g.beginPath();
    for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2, k = 0.75 + r() * 0.35; g.lineTo(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); }
    g.fill();
  };
  if (tipo === "terra") {
    g.fillStyle = "#2f7fd8"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) blob(r() * W, 90 + r() * 330, 60 + r() * 110, 40 + r() * 70, i % 3 ? "#5fbf5a" : "#d9c27a");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, 30); g.fillRect(0, H - 30, W, 30);
    g.globalAlpha = 0.55; for (let i = 0; i < 14; i++) blob(r() * W, r() * H, 70 + r() * 90, 10 + r() * 14, "#ffffff"); g.globalAlpha = 1;
  } else if (tipo === "lua") {
    g.fillStyle = "#d9d6cf"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 6; i++) blob(r() * W, 100 + r() * 300, 60 + r() * 90, 40 + r() * 60, "#b8b4ad");
    for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, s = 4 + r() * 22; g.fillStyle = "#a9a49c"; g.beginPath(); g.ellipse(x, y, s, s * 0.8, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(40,30,40,.35)"; g.lineWidth = 2; g.stroke(); }
  } else if (tipo === "marte") {
    g.fillStyle = "#d4683a"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 10; i++) blob(r() * W, r() * H, 50 + r() * 90, 30 + r() * 50, "#a9472a");
  } else if (tipo === "gasoso") {
    const cs = ["#e7c08a", "#d49a62", "#f2dcb0", "#c47f4e"];
    for (let y = 0; y < H; y += 24) { g.fillStyle = cs[Math.floor(r() * cs.length)]; g.fillRect(0, y, W, 26); }
  } else {
    g.fillStyle = "#ffcf3f"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) blob(r() * W, r() * H, 20 + r() * 40, 15 + r() * 25, "#ffb21f");
  }
});

export const planeta = (root: THREE.Object3D, tipo: TipoPlaneta, raio: number, pos: Vetor3, seed = 1) => {
  const map = texPlaneta(tipo, seed);
  const mat = tipo === "sol" ? new THREE.MeshBasicMaterial({ map, toneMapped: false }) : toon("#ffffff", map);
  const m = new THREE.Mesh(new THREE.SphereGeometry(raio, 64, 32), mat);
  m.position.set(pos.x, pos.y, pos.z);
  root.add(m);
  if (tipo === "terra") {
    const h = new THREE.Mesh(new THREE.SphereGeometry(raio * 1.025, 48, 24), new THREE.MeshBasicMaterial({ color: "#9fe0ff", transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false }));
    h.layers.set(NOINK);
    m.add(h);
  }
  return m;
};

// Helper para textura procedural (reexporta de paint)
function ctex(name: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, r: () => number) => void): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext("2d")!;
  let seed = 1;
  const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
  draw(g, r);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}