// Sistema de rastros (faixas deixadas por máquinas: asfalto quente, terra revolvida, etc.)
import * as THREE from "three";
import { NOINK } from "./ink";
import { toon } from "./paint";
import { frames, normalizar } from "./tempo";
import type { RastroConfig, Vetor3, FluxoMaterial } from "./types";

const RASTRO_MATERIAL: Record<FluxoMaterial, { cor: string; opacidade: number; larguraPadrao: number }> = {
  pedra:    { cor: "#7a7a7a", opacidade: 0.8, larguraPadrao: 1.0 },
  brita:    { cor: "#6a6a6a", opacidade: 0.8, larguraPadrao: 1.2 },
  areia:    { cor: "#d5b87a", opacidade: 0.7, larguraPadrao: 1.0 },
  terra:    { cor: "#8b6b4a", opacidade: 0.7, larguraPadrao: 1.5 },
  concreto: { cor: "#a8acb0", opacidade: 0.9, larguraPadrao: 1.0 },
  asfalto:  { cor: "#2a2a2a", opacidade: 1.0, larguraPadrao: 3.5 },
  agua:     { cor: "#2fa5e0", opacidade: 0.5, larguraPadrao: 0.8 },
  fumaca:   { cor: "#7a7a7a", opacidade: 0.3, larguraPadrao: 2.0 },
  vapor:    { cor: "#c0c0d0", opacidade: 0.4, larguraPadrao: 1.5 },
  poeira:   { cor: "#b8a890", opacidade: 0.4, larguraPadrao: 1.0 },
  ar:       { cor: "#a0c0f0", opacidade: 0.3, larguraPadrao: 1.0 },
  bolha:    { cor: "#70d0ff", opacidade: 0.5, larguraPadrao: 0.5 },
  neve:     { cor: "#ffffff", opacidade: 0.6, larguraPadrao: 0.8 },
  eletricidade: { cor: "#ffdf70", opacidade: 0.8, larguraPadrao: 0.3 },
  luz:      { cor: "#fff8a0", opacidade: 0.7, larguraPadrao: 0.5 },
  fagulha:  { cor: "#ff7000", opacidade: 0.9, larguraPadrao: 0.3 },
  fogo:     { cor: "#ff3000", opacidade: 0.8, larguraPadrao: 0.5 },
};

interface RastroSegmento {
  mesh: THREE.Mesh;
  inicio: number; // frame de início
  fim: number;    // frame de fim (quando desaparece)
  posInicial: THREE.Vector3;
  posFinal: THREE.Vector3;
}

export class RastroSistema {
  private segmentos: RastroSegmento[] = [];
  private config: RastroConfig;
  private root: THREE.Group;
  private ultimaPos: THREE.Vector3 | null = null;
  private frameAtual = 0;

  constructor(root: THREE.Object3D, config: RastroConfig) {
    this.root = root as THREE.Group;
    this.config = config;
  }

  update(frame: number, posMaquina: THREE.Vector3) {
    this.frameAtual = frame;

    if (this.ultimaPos) {
      const dist = this.ultimaPos.distanceTo(posMaquina);
      if (dist > 0.1) { // Cria segmento se moveu o suficiente
        this.criarSegmento(this.ultimaPos.clone(), posMaquina.clone());
      }
    }
    this.ultimaPos = posMaquina.clone();

    // Remove segmentos velhos
    const duracaoVida = 300; // frames (10s a 30fps)
    for (let i = this.segmentos.length - 1; i >= 0; i--) {
      const seg = this.segmentos[i];
      if (frame > seg.fim + duracaoVida) {
        this.root.remove(seg.mesh);
        seg.mesh.geometry.dispose();
        (seg.mesh.material as THREE.Material).dispose();
        this.segmentos.splice(i, 1);
      } else if (frame > seg.fim) {
        // Fade out
        const fade = 1 - normalizar(frame, seg.fim, seg.fim + duracaoVida);
        if (seg.mesh.material instanceof THREE.MeshToonMaterial) {
          seg.mesh.material.opacity = Math.max(0, fade * (this.config.opacidade ?? RASTRO_MATERIAL[this.config.material]?.opacidade ?? 0.8));
          seg.mesh.material.transparent = true;
          seg.mesh.material.needsUpdate = true;
        }
      }
    }
  }

  private criarSegmento(inicio: THREE.Vector3, fim: THREE.Vector3) {
    const cfg = RASTRO_MATERIAL[this.config.material] ?? { cor: "#888888", opacidade: 0.7, larguraPadrao: 1 };
    const largura = this.config.largura ?? cfg.larguraPadrao;
    const comprimento = inicio.distanceTo(fim);

    if (comprimento < 0.05) return;

    const geo = new THREE.PlaneGeometry(largura, comprimento);
    const mat = toon(this.config.cor ?? cfg.cor);
    mat.opacity = this.config.opacidade ?? cfg.opacidade;
    mat.transparent = true;
    mat.side = THREE.DoubleSide;

    const mesh = new THREE.Mesh(geo, mat);
    mesh.layers.set(NOINK);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02; // Ligeiramente acima do chão

    // Posiciona no meio do segmento, orientado na direção do movimento
    const meio = new THREE.Vector3().lerpVectors(inicio, fim, 0.5);
    mesh.position.copy(meio);
    mesh.position.y = 0.02;

    const dir = new THREE.Vector3().subVectors(fim, inicio).normalize();
    const angulo = Math.atan2(dir.x, dir.z);
    mesh.rotation.z = angulo;

    this.root.add(mesh);

    this.segmentos.push({
      mesh,
      inicio: this.frameAtual,
      fim: this.frameAtual + 60, // Visível por ~2s depois que a máquina passa
      posInicial: inicio,
      posFinal: fim,
    });
  }

  dispose() {
    for (const seg of this.segmentos) {
      this.root.remove(seg.mesh);
      seg.mesh.geometry.dispose();
      (seg.mesh.material as THREE.Material).dispose();
    }
    this.segmentos = [];
  }
}

export const criarRastros = (root: THREE.Group, rastros: RastroConfig[]): RastroSistema[] => {
  return rastros.map(r => new RastroSistema(root, r));
};

// Helper: rastro de vibroacabadora (asfalto quente)
export const rastroVibroacabadora = (largura = 3.5) => ({
  material: "asfalto" as FluxoMaterial,
  largura,
  cor: "#2a2a2a",
  opacidade: 1.0,
});

// Helper: rastro de rolo compressor (asfalto compactado)
export const rastroRolo = (largura = 2.0) => ({
  material: "asfalto" as FluxoMaterial,
  largura,
  cor: "#3a3a3a",
  opacidade: 0.9,
});

// Helper: rastro de escavadeira (terra revolvida)
export const rastroEscavadeira = (largura = 2.5) => ({
  material: "terra" as FluxoMaterial,
  largura,
  cor: "#8b6b4a",
  opacidade: 0.7,
});

// Helper: rastro de esteira (material transportado)
export const rastroEsteira = (material: FluxoMaterial, largura = 0.9) => ({
  material,
  largura,
  cor: RASTRO_MATERIAL[material]?.cor,
  opacidade: RASTRO_MATERIAL[material]?.opacidade,
});