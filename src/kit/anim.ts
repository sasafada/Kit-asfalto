// Sistema de animações genéricas: pos, giro, escala, oscila, pulsa
import * as THREE from "three";
import { frames, normalizar, curvas } from "./tempo";
import type { AnimConfig, Vetor3 } from "./types";

interface AnimInstance {
  config: AnimConfig;
  alvo: THREE.Object3D;
  valorInicial: number | THREE.Vector3;
  ativo: boolean;
}

export class AnimSistema {
  private animacoes: AnimInstance[] = [];
  private root: THREE.Group;
  private objetos: Map<string, THREE.Object3D> = new Map();

  constructor(root: THREE.Object3D) {
    this.root = root;
  }

  /** Registra objeto para ser animado por ID */
  registrar(id: string, obj: THREE.Object3D) {
    this.objetos.set(id, obj);
  }

  /** Adiciona animação da config do storyboard */
  adicionar(config: AnimConfig) {
    const alvo = this.objetos.get(config.alvo);
    if (!alvo) {
      console.warn(`Anim: objeto "${config.alvo}" não encontrado`);
      return;
    }

    let valorInicial: number | THREE.Vector3;
    switch (config.propriedade) {
      case "pos": valorInicial = alvo.position.clone(); break;
      case "giro": valorInicial = alvo.rotation.clone(); break;
      case "escala": valorInicial = alvo.scale.clone(); break;
      case "oscila":
      case "pulsa": valorInicial = 1; break;
      default: valorInicial = 0;
    }

    this.animacoes.push({
      config: { ...config, inicio: config.inicio ?? 0 },
      alvo,
      valorInicial,
      ativo: false,
    });
  }

  /** Adiciona múltiplas animações */
  adicionarVarios(configs: AnimConfig[]) {
    configs.forEach(c => this.adicionar(c));
  }

  update(frame: number) {
    const tGlobal = frame / 30; // segundos

    for (const anim of this.animacoes) {
      const { config, alvo, valorInicial } = anim;
      const inicio = frames(config.inicio ?? 0);
      const fim = inicio + frames(config.duracao);

      if (frame < inicio || frame > fim) {
        if (frame > fim) anim.ativo = false;
        continue;
      }

      anim.ativo = true;
      const progresso = normalizar(frame, inicio, fim);
      const curva = config.curva ?? "ss";
      const easing = curvas[curva](progresso);

      const valorFinal = config.valor;

      switch (config.propriedade) {
        case "pos": {
          const vi = valorInicial as THREE.Vector3;
          const vf = valorFinal as Vetor3;
          alvo.position.lerpVectors(vi, new THREE.Vector3(vf.x, vf.y, vf.z), easing);
          break;
        }
        case "giro": {
          const vi = valorInicial as THREE.Euler;
          const vf = valorFinal as Vetor3;
          alvo.rotation.set(
            THREE.MathUtils.lerp(vi.x, vf.x, easing),
            THREE.MathUtils.lerp(vi.y, vf.y, easing),
            THREE.MathUtils.lerp(vi.z, vf.z, easing)
          );
          break;
        }
        case "escala": {
          const vi = valorInicial as THREE.Vector3;
          const vf = valorFinal as Vetor3;
          alvo.scale.lerpVectors(vi, new THREE.Vector3(vf.x, vf.y, vf.z), easing);
          break;
        }
        case "oscila": {
          // Oscilação senoidal em torno do valorInicial
          const amplitude = typeof valorFinal === "number" ? valorFinal : 0.2;
          const freq = config.duracao > 0 ? (1 / config.duracao) : 1;
          const val = valorInicial as number + Math.sin(tGlobal * Math.PI * 2 * freq) * amplitude;
          if (alvo.scale) alvo.scale.setScalar(val);
          break;
        }
        case "pulsa": {
          // Pulsa rápido (escala 1 -> 1.1 -> 1)
          const freq = 4; // 4 Hz
          const pulso = 1 + Math.sin(tGlobal * Math.PI * 2 * freq) * 0.1 * (1 - easing); // Diminui no final
          alvo.scale.setScalar(pulso);
          break;
        }
      }
    }
  }

  dispose() {
    this.animacoes = [];
    this.objetos.clear();
  }
}

// Helpers para animações comuns
export const animPos = (alvo: string, pos: Vetor3, duracao: number, curva: keyof typeof curvas = "ss", inicio = 0): AnimConfig => ({
  alvo, propriedade: "pos", valor: pos, duracao, curva, inicio,
});

export const animGiro = (alvo: string, rot: Vetor3, duracao: number, curva: keyof typeof curvas = "ss", inicio = 0): AnimConfig => ({
  alvo, propriedade: "giro", valor: rot, duracao, curva, inicio,
});

export const animEscala = (alvo: string, escala: Vetor3 | number, duracao: number, curva: keyof typeof curvas = "pop", inicio = 0): AnimConfig => ({
  alvo, propriedade: "escala", valor: escala, duracao, curva, inicio,
});

export const animOscila = (alvo: string, amplitude = 0.15, duracao = 2, inicio = 0): AnimConfig => ({
  alvo, propriedade: "oscila", valor: amplitude, duracao, curva: "linear", inicio,
});

export const animPulsa = (alvo: string, duracao = 1, inicio = 0): AnimConfig => ({
  alvo, propriedade: "pulsa", valor: 0.1, duracao, curva: "linear", inicio,
});

// Animação de aparição (escala 0 -> 1)
export const animAparece = (alvo: string, duracao = 0.5, inicio = 0): AnimConfig[] => [
  { alvo, propriedade: "escala", valor: { x: 0, y: 0, z: 0 }, duracao: 0, inicio },
  { alvo, propriedade: "escala", valor: { x: 1, y: 1, z: 1 }, duracao, curva: "pop", inicio },
];

// Animação de desaparecimento (escala 1 -> 0)
export const animSome = (alvo: string, duracao = 0.5, inicio = 0): AnimConfig[] => [
  { alvo, propriedade: "escala", valor: { x: 1, y: 1, z: 1 }, duracao: 0, inicio },
  { alvo, propriedade: "escala", valor: { x: 0, y: 0, z: 0 }, duracao, curva: "ss", inicio },
];

// Animação de "construção" (escala Y 0 -> 1)
export const animConstrui = (alvo: string, duracao: number, inicio = 0): AnimConfig[] => [
  { alvo, propriedade: "escala", valor: { x: 1, y: 0, z: 1 }, duracao: 0, inicio },
  { alvo, propriedade: "escala", valor: { x: 1, y: 1, z: 1 }, duracao, curva: "ss", inicio },
];