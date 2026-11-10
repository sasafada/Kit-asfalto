// Sistema de fluxos (partículas de processo) - pedra, água, fumaça, asfalto, etc.
import * as THREE from "three";
import { NOINK } from "./ink";
import { flat } from "./paint";
import { frames, normalizar, curvas } from "./tempo";
import type { FluxoMaterial, FluxoConfig, Vetor3 } from "./types";

// Configurações visuais por material
const MATERIAL_CONFIG: Record<FluxoMaterial, { cor: string; tamanho: number; forma: "cubo" | "esfera" | "particula"; brilho?: boolean }> = {
  pedra:    { cor: "#8a8a8a", tamanho: 0.08, forma: "cubo" },
  brita:    { cor: "#7a7a7a", tamanho: 0.06, forma: "cubo" },
  areia:    { cor: "#e5c98a", tamanho: 0.04, forma: "particula" },
  terra:    { cor: "#8b6b4a", tamanho: 0.05, forma: "particula" },
  concreto: { cor: "#b8bcc0", tamanho: 0.06, forma: "cubo" },
  asfalto:  { cor: "#3a3a3a", tamanho: 0.07, forma: "cubo", brilho: true },
  agua:     { cor: "#3fa5e0", tamanho: 0.05, forma: "esfera", brilho: true },
  fumaca:   { cor: "#8a8a8a", tamanho: 0.3, forma: "esfera" },
  vapor:    { cor: "#d0d0e0", tamanho: 0.25, forma: "esfera" },
  poeira:   { cor: "#c8b8a0", tamanho: 0.03, forma: "particula" },
  ar:       { cor: "#b0d0ff", tamanho: 0.1, forma: "esfera" },
  bolha:    { cor: "#80d0ff", tamanho: 0.08, forma: "esfera", brilho: true },
  neve:     { cor: "#ffffff", tamanho: 0.06, forma: "particula" },
  eletricidade: { cor: "#ffef80", tamanho: 0.05, forma: "particula", brilho: true },
  luz:      { cor: "#fff8c0", tamanho: 0.1, forma: "esfera", brilho: true },
  fagulha:  { cor: "#ff8000", tamanho: 0.04, forma: "particula", brilho: true },
  fogo:     { cor: "#ff4000", tamanho: 0.15, forma: "esfera", brilho: true },
};

interface Particula {
  mesh: THREE.Mesh;
  vida: number;
  vidaMax: number;
  velocidade: THREE.Vector3;
  posInicial: THREE.Vector3;
}

export class FluxoSistema {
  private particulas: Particula[] = [];
  private config: FluxoConfig;
  private root: THREE.Group;
  private emissaoAcumulada = 0;
  private seed: number;

  constructor(root: THREE.Object3D, config: FluxoConfig) {
    this.root = root as THREE.Group;
    this.config = config;
    this.seed = Math.floor(Math.random() * 1e6);
  }

  private r = () => { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 0x100000000; };

  private criarParticula(origem: THREE.Vector3, destino: THREE.Vector3): Particula {
    const matCfg = MATERIAL_CONFIG[this.config.material];
    const tamanho = this.config.tamanho * (0.7 + this.r() * 0.6);

    let geo: THREE.BufferGeometry;
    if (matCfg.forma === "cubo") geo = new THREE.BoxGeometry(tamanho, tamanho, tamanho);
    else if (matCfg.forma === "esfera") geo = new THREE.SphereGeometry(tamanho, 6, 4);
    else geo = new THREE.BoxGeometry(tamanho * 0.5, tamanho * 0.5, tamanho * 1.5);

    const mat = matCfg.brilho
      ? new THREE.MeshBasicMaterial({ color: matCfg.cor, transparent: true, opacity: 0.9, toneMapped: false })
      : toon(matCfg.cor);
    mat.side = THREE.DoubleSide;

    const mesh = new THREE.Mesh(geo, mat);
    mesh.layers.set(NOINK);
    mesh.position.copy(origem);

    // Velocidade inicial
    const dir = new THREE.Vector3().subVectors(destino, origem).normalize();
    const spread = 0.15;
    const vel = dir.multiplyScalar(2 + this.r() * 3).add(new THREE.Vector3(
      (this.r() - 0.5) * spread,
      (this.r() - 0.5) * spread,
      (this.r() - 0.5) * spread
    ));

    return {
      mesh,
      vida: 0,
      vidaMax: 1 + this.r() * 2,
      velocidade: vel,
      posInicial: origem.clone(),
    };
  }

  update(deltaTime: number, frame: number, tempoGlobal: number) {
    const taxa = this.config.taxa || 10; // particulas/segundo
    this.emissaoAcumulada += taxa * deltaTime;

    // Calcula origem e destino
    let origem = new THREE.Vector3();
    let destino = new THREE.Vector3();

    if (this.config.ancora) {
      // Origem/destino em um asset (precisa ser resolvido externamente)
      // Por enquanto usa origem/destino diretos
    }

    if (this.config.origem) origem.set(this.config.origem.x, this.config.origem.y, this.config.origem.z);
    if (this.config.destino) destino.set(this.config.destino.x, this.config.destino.y, this.config.destino.z);

    // Se tem caminho (tubo/cano), interpola ao longo dele
    if (this.config.caminho && this.config.caminho.length > 1) {
      const t = normalizar(tempoGlobal % 5, 0, 5); // loop 5s
      const idx = t * (this.config.caminho.length - 1);
      const i0 = Math.floor(idx);
      const i1 = Math.min(i0 + 1, this.config.caminho.length - 1);
      const ft = idx - i0;
      origem.lerpVectors(
        new THREE.Vector3(this.config.caminho[i0].x, this.config.caminho[i0].y, this.config.caminho[i0].z),
        new THREE.Vector3(this.config.caminho[i1].x, this.config.caminho[i1].y, this.config.caminho[i1].z),
        ft
      );
      // Destino um pouco à frente
      const idx2 = Math.min(idx + 0.1, this.config.caminho.length - 1);
      const i2 = Math.floor(idx2);
      const i3 = Math.min(i2 + 1, this.config.caminho.length - 1);
      const ft2 = idx2 - i2;
      destino.lerpVectors(
        new THREE.Vector3(this.config.caminho[i2].x, this.config.caminho[i2].y, this.config.caminho[i2].z),
        new THREE.Vector3(this.config.caminho[i3].x, this.config.caminho[i3].y, this.config.caminho[i3].z),
        ft2
      );
    }

    // Emite novas partículas
    while (this.emissaoAcumulada >= 1) {
      this.emissaoAcumulada -= 1;
      const p = this.criarParticula(origem, destino);
      this.root.add(p.mesh);
      this.particulas.push(p);
    }

    // Atualiza partículas existentes
    const gravidade = this.config.gravidade ?? -9.81;
    for (let i = this.particulas.length - 1; i >= 0; i--) {
      const p = this.particulas[i];
      p.vida += deltaTime;

      if (p.vida >= p.vidaMax || p.mesh.position.y < -2) {
        this.root.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particulas.splice(i, 1);
        continue;
      }

      // Movimento
      p.mesh.position.addScaledVector(p.velocidade, deltaTime);
      p.velocidade.y += gravidade * deltaTime * 0.3;

      // Fade out no final da vida
      const fade = 1 - normalizar(p.vida, p.vidaMax * 0.7, p.vidaMax);
      if (p.mesh.material instanceof THREE.MeshBasicMaterial) {
        p.mesh.material.opacity = Math.max(0, fade * 0.9);
      }

      // Rotação aleatória
      p.mesh.rotation.x += deltaTime * 2;
      p.mesh.rotation.y += deltaTime * 3;
    }
  }

  dispose() {
    for (const p of this.particulas) {
      this.root.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    this.particulas = [];
  }
}

// Factory para criar fluxos a partir de config do storyboard
export const criarFluxos = (root: THREE.Group, fluxos: FluxoConfig[]): FluxoSistema[] => {
  return fluxos.map(f => new FluxoSistema(root, f));
};

// Helper: fluxo de esteira (partículas seguindo caminho linear)
export const fluxoEsteira = (config: FluxoConfig & { caminho: Vetor3[] }) => {
  return { ...config, material: config.material, taxa: config.taxa || 30 };
};

// Helper: fluxo de queda livre (pedra, brita caindo)
export const fluxoQueda = (origem: Vetor3, material: FluxoMaterial, taxa = 20) => ({
  material, origem, destino: { x: origem.x, y: 0, z: origem.z }, taxa, tamanho: 0.06, gravidade: -9.81,
});

// Helper: fluxo de tubo (água, óleo fluindo)
export const fluxoTubo = (caminho: Vetor3[], material: FluxoMaterial, taxa = 50) => ({
  material, caminho, taxa, tamanho: 0.05, gravidade: 0,
});

// Helper: fumaça subindo
export const fluxoFumaca = (origem: Vetor3, taxa = 10) => ({
  material: "fumaca" as FluxoMaterial, origem, destino: { x: origem.x, y: origem.y + 5, z: origem.z }, taxa, tamanho: 0.3, gravidade: 1,
});

// Helper: vapor
export const fluxoVapor = (origem: Vetor3, taxa = 15) => ({
  material: "vapor" as FluxoMaterial, origem, destino: { x: origem.x, y: origem.y + 3, z: origem.z }, taxa, tamanho: 0.25, gravidade: 0.5,
});

// Re-export toon from paint
import { toon } from "./paint";