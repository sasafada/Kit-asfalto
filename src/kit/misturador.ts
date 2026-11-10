// Sistema de misturador (tanque com pás girando: massa, tinta, concreto, comida)
import * as THREE from "three";
import { frames, normalizar, curvas } from "./tempo";
import { toon, flat } from "./paint";
import { NOINK } from "./ink";
import type { Vetor3 } from "./types";

const MISTURADOR_CONTEUDO: Record<string, string> = {
  tinta:    "#e8586a",
  concreto: "#9a8f7a",
  massa:    "#f2d13a",
  comida:   "#f2c230",
  ceramica: "#c8553d",
};

const PAS_CORES: Record<string, string> = {
  padrao:   "#f2c94c",
  escuro:   "#8a7a4a",
  metal:    "#c9a227",
};

interface MisturadorInstance {
  mesh: THREE.Group;
  config: { raio: number; conteudo: string; pas: string; velocidade: number };
  pasMeshes: THREE.Mesh[];
  anguloAtual: number;
}

export class MisturadorSistema {
  private misturadores: MisturadorInstance[] = [];
  private root: THREE.Group;

  constructor(root: THREE.Group) {
    this.root = root;
  }

  /** Cria misturador tanque aberto com pás girando */
  criar(pos: Vetor3, config: { raio?: number; conteudo?: string; pas?: string; velocidade?: number } = {}): THREE.Group {
    const raio = config.raio || 1.4;
    const conteudo = config.conteudo || "concreto";
    const pas = config.pas || "padrao";
    const velocidade = config.velocidade || 90; // graus/segundo
    const altura = raio * 1.6;

    const g = new THREE.Group();

    // Tanque (cilindro aberto)
    const tanqueGeo = new THREE.CylinderGeometry(raio, raio, altura, 24, 1, true);
    const tanqueMat = toon("#cfd8e3");
    const tanque = new THREE.Mesh(tanqueGeo, tanqueMat);
    tanque.position.y = altura / 2;
    g.add(tanque);

    // Base reforçada
    const baseGeo = new THREE.CylinderGeometry(raio * 1.1, raio * 1.1, 0.4, 24);
    const base = new THREE.Mesh(baseGeo, toon("#8a95a3"));
    base.position.y = 0.2;
    g.add(base);

    // Conteúdo (visível dentro)
    const conteudoGeo = new THREE.CylinderGeometry(raio * 0.9, raio * 0.9, altura * 0.7, 24, 1, true);
    const conteudoMat = flat(MISTURADOR_CONTEUDO[conteudo] || MISTURADOR_CONTEUDO.concreto, {
      transparent: true, opacity: 0.85
    });
    const conteudoMesh = new THREE.Mesh(conteudoGeo, conteudoMat);
    conteudoMesh.position.y = altura * 0.35;
    conteudoMesh.layers.set(NOINK);
    g.add(conteudoMesh);

    // Pás girando (3 pás a 120°)
    const pasMeshes: THREE.Mesh[] = [];
    const pasCor = PAS_CORES[pas] || PAS_CORES.padrao;
    const pasMat = toon(pasCor);

    for (let i = 0; i < 3; i++) {
      const pa = new THREE.Group();

      // Braço da pá
      const bracoGeo = new THREE.BoxGeometry(0.1, raio * 0.85, 0.15);
      const braco = new THREE.Mesh(bracoGeo, pasMat);
      braco.position.y = raio * 0.425;
      pa.add(braco);

      // Lâmina da pá
      const laminaGeo = new THREE.BoxGeometry(0.25, raio * 0.3, raio * 0.6);
      const lamina = new THREE.Mesh(laminaGeo, pasMat);
      lamina.position.set(0, raio * 0.85 - raio * 0.15, 0);
      pa.add(lamina);

      pa.rotation.y = (i / 3) * Math.PI * 2;
      pa.position.y = altura * 0.2;
      g.add(pa);
      pasMeshes.push(pa);
    }

    // Eixo central
    const eixoGeo = new THREE.CylinderGeometry(0.15, 0.15, altura, 12);
    const eixo = new THREE.Mesh(eixoGeo, toon("#5a5a5a"));
    eixo.position.y = altura / 2;
    g.add(eixo);

    // Motor na base
    const motorGeo = new THREE.BoxGeometry(raio * 1.5, 0.8, raio * 1.5);
    const motor = new THREE.Mesh(motorGeo, toon("#3a3a3a"));
    motor.position.y = 0.4;
    g.add(motor);

    g.position.set(pos.x, pos.y, pos.z);
    g.userData.misturador = { raio, conteudo, pas, velocidade };

    this.root.add(g);

    this.misturadores.push({
      mesh: g,
      config: { raio, conteudo, pas, velocidade },
      pasMeshes,
      anguloAtual: 0,
    });

    return g;
  }

  update(frame: number, deltaTime: number) {
    for (const m of this.misturadores) {
      const vel = m.config.velocidade; // graus/segundo
      const radPorFrame = (vel * Math.PI / 180) / 30; // rad/frame a 30fps

      m.anguloAtual += radPorFrame * deltaTime * 30;
      if (m.anguloAtual > Math.PI * 2) m.anguloAtual -= Math.PI * 2;

      for (const pa of m.pasMeshes) {
        pa.rotation.y = m.anguloAtual;
      }

      // Efeito de superfície do líquido girando (leve ondulação)
      const conteudo = m.mesh.children.find(c => c instanceof THREE.Mesh && c.material instanceof THREE.MeshBasicMaterial && c.layers.test(NOINK));
      if (conteudo) {
        conteudo.rotation.y = m.anguloAtual * 0.1; // Gira mais lento que as pás
      }
    }
  }

  /** Para/retoma rotação */
  setAtivo(misturador: THREE.Group, ativo: boolean) {
    misturador.userData.misturadorAtivo = ativo;
  }

  /** Muda velocidade (graus/segundo) */
  setVelocidade(misturador: THREE.Group, velocidade: number) {
    const m = this.misturadores.find(m => m.mesh === misturador);
    if (m) m.config.velocidade = velocidade;
  }

  dispose() {
    for (const m of this.misturadores) {
      this.root.remove(m.mesh);
      m.mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
    this.misturadores = [];
  }
}

// Tipos prontos
export const misturadorConcreto = (root: THREE.Group, pos: Vetor3, raio = 1.4) =>
  new MisturadorSistema(root).criar(pos, { raio, conteudo: "concreto", pas: "padrao", velocidade: 90 });

export const misturadorTinta = (root: THREE.Group, pos: Vetor3, raio = 1.4) =>
  new MisturadorSistema(root).criar(pos, { raio, conteudo: "tinta", pas: "metal", velocidade: 120 });

export const misturadorMassa = (root: THREE.Group, pos: Vetor3, raio = 1.4) =>
  new MisturadorSistema(root).criar(pos, { raio, conteudo: "massa", pas: "escuro", velocidade: 60 });

export const misturadorComida = (root: THREE.Group, pos: Vetor3, raio = 1.4) =>
  new MisturadorSistema(root).criar(pos, { raio, conteudo: "comida", pas: "padrao", velocidade: 45 });