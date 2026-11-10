// Sistema de monte (pilhas crescendo: pedra, areia, terra, grão, carvão, asfalto)
import * as THREE from "three";
import { frames, normalizar, curvas } from "./tempo";
import { toon } from "./paint";
import type { Vetor3 } from "./types";

const MONTE_MATERIAIS: Record<string, { cor: string; roughness: number }> = {
  pedra:    { cor: "#7a7a7a", roughness: 0.9 },
  brita:    { cor: "#6a6a6a", roughness: 0.9 },
  areia:    { cor: "#e5c98a", roughness: 0.8 },
  terra:    { cor: "#8b6b4a", roughness: 0.85 },
  grao:     { cor: "#d4a84a", roughness: 0.7 },
  carvao:   { cor: "#2a2a2a", roughness: 0.95 },
  asfalto:  { cor: "#3a3a3a", roughness: 0.6 },
};

interface MonteInstance {
  mesh: THREE.Mesh;
  config: { material: string; raio: number; progress: number };
  progressoAtual: number;
}

export class MonteSistema {
  private montes: MonteInstance[] = [];
  private root: THREE.Group;

  constructor(root: THREE.Group) {
    this.root = root;
  }

  /** Cria um monte e registra para animação */
  criar(pos: Vetor3, config: { material: string; raio?: number; progress?: number; alturaMax?: number } = {}): THREE.Mesh {
    const material = config.material || "pedra";
    const raio = config.raio || 1.6;
    const progress = config.progress || 1;
    const alturaMax = config.alturaMax || 1.5;
    const matCfg = MONTE_MATERIAIS[material] || MONTE_MATERIAIS.pedra;

    // Geometria cônica (pilha)
    const geo = new THREE.ConeGeometry(raio, alturaMax * progress, 16);
    const mat = toon(matCfg.cor);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, (alturaMax * progress) / 2, pos.z);
    mesh.userData.monte = { material, raio, alturaMax };

    this.root.add(mesh);

    this.montes.push({
      mesh,
      config: { material, raio, progress },
      progressoAtual: progress,
    });

    return mesh;
  }

  /** Anima progresso de 0 a 1 */
  animar(mesh: THREE.Mesh, progressInicial: number, progressFinal: number, duracao: number, curva: keyof typeof curvas = "ss", inicioFrame = 0) {
    const monte = this.montes.find(m => m.mesh === mesh);
    if (!monte) return;

    monte.config.progress = progressInicial;
    monte.progressoAtual = progressInicial;

    // Guarda parâmetros da animação no userData
    mesh.userData.animMonte = {
      progressInicial,
      progressFinal,
      duracao,
      curva,
      inicioFrame,
      ativo: true,
    };
  }

  update(frame: number) {
    for (const monte of this.montes) {
      const anim = monte.mesh.userData.animMonte;
      if (!anim || !anim.ativo) continue;

      const frameInicio = anim.inicioFrame;
      const frameFim = frameInicio + frames(anim.duracao);

      if (frame < frameInicio || frame > frameFim) {
        if (frame > frameFim) {
          anim.ativo = false;
          monte.progressoAtual = anim.progressFinal;
          this.rebuildMesh(monte, anim.progressFinal);
        }
        continue;
      }

      const progresso = normalizar(frame, frameInicio, frameFim);
      const easing = curvas[anim.curva](progresso);
      const prog = anim.progressInicial + (anim.progressFinal - anim.progressInicial) * easing;

      monte.progressoAtual = prog;
      this.rebuildMesh(monte, prog);
    }
  }

  private rebuildMesh(monte: MonteInstance, progress: number) {
    const { material, raio, alturaMax } = monte.mesh.userData.monte;
    const matCfg = MONTE_MATERIAIS[material] || MONTE_MATERIAIS.pedra;

    // Remove geometria antiga
    monte.mesh.geometry.dispose();

    // Nova geometria
    const geo = new THREE.ConeGeometry(raio, alturaMax * progress, 16);
    monte.mesh.geometry = geo;
    monte.mesh.position.y = (alturaMax * progress) / 2;
  }

  dispose() {
    for (const monte of this.montes) {
      this.root.remove(monte.mesh);
      monte.mesh.geometry.dispose();
      (monte.mesh.material as THREE.Material).dispose();
    }
    this.montes = [];
  }
}

// Helpers para materiais específicos
export const montePedra = (root: THREE.Group, pos: Vetor3, raio = 1.6, progress = 1) =>
  new MonteSistema(root).criar(pos, { material: "pedra", raio, progress });

export const monteAreia = (root: THREE.Group, pos: Vetor3, raio = 1.6, progress = 1) =>
  new MonteSistema(root).criar(pos, { material: "areia", raio, progress });

export const monteTerra = (root: THREE.Group, pos: Vetor3, raio = 1.6, progress = 1) =>
  new MonteSistema(root).criar(pos, { material: "terra", raio, progress });

export const monteGrao = (root: THREE.Group, pos: Vetor3, raio = 1.6, progress = 1) =>
  new MonteSistema(root).criar(pos, { material: "grao", raio, progress });

export const monteAsfalto = (root: THREE.Group, pos: Vetor3, raio = 1.6, progress = 1) =>
  new MonteSistema(root).criar(pos, { material: "asfalto", raio, progress });

// Monte na esteira (alongado)
export const criarMonteEsteira = (root: THREE.Group, pos: Vetor3, config: { material: string; comprimento: number; largura: number; progress: number }): THREE.Mesh => {
  const { material, comprimento, largura, progress } = config;
  const matCfg = MONTE_MATERIAIS[material] || MONTE_MATERIAIS.pedra;

  const geo = new THREE.BoxGeometry(largura, 1 * progress, comprimento);
  const mat = toon(matCfg.cor);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos.x, (1 * progress) / 2, pos.z);

  root.add(mesh);
  return mesh;
};