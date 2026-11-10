// Sistema de tanque (reservatórios enchendo/esvaziando: água, leite, óleo, grão)
import * as THREE from "three";
import { frames, normalizar, curvas } from "./tempo";
import { toon, flat } from "./paint";
import { NOINK } from "./ink";
import type { Vetor3 } from "./types";

const LIQUIDO_CORES: Record<string, string> = {
  agua:     "#3fa5e0",
  leite:    "#fffaf0",
  oleo:     "#3a3a2a",
  grao:     "#d4a84a",
  combustivel: "#2a2a1a",
  concreto: "#b8bcc0",
  asfalto:  "#3a3a3a",
};

const CASCA_CORES: Record<string, string> = {
  padrao:   "#cfd8e3",
  metal:    "#8a95a3",
  plastico: "#e8e8e8",
  concreto: "#7a7a7a",
};

interface TanqueInstance {
  mesh: THREE.Group;
  config: { raio: number; altura: number; liquido: string; casca: string; nivel: number };
  nivelAtual: number;
  liquidoMesh: THREE.Mesh;
  cascaMesh: THREE.Mesh;
}

export class TanqueSistema {
  private tanques: TanqueInstance[] = [];
  private root: THREE.Group;

  constructor(root: THREE.Group) {
    this.root = root;
  }

  /** Cria tanque cilíndrico com nível de líquido visível */
  criar(pos: Vetor3, config: { raio?: number; altura?: number; liquido?: string; casca?: string; nivel?: number } = {}): THREE.Group {
    const raio = config.raio || 1.2;
    const altura = config.altura || 3;
    const liquido = config.liquido || "agua";
    const casca = config.casca || "padrao";
    const nivel = Math.max(0, Math.min(1, config.nivel || 0.6));

    const g = new THREE.Group();

    // Casca externa (semi-transparente)
    const cascaGeo = new THREE.CylinderGeometry(raio, raio, altura, 32, 1, true); // openEnded
    const cascaMat = flat(CASCA_CORES[casca] || CASCA_CORES.padrao, { transparent: true, opacity: 0.3 });
    const cascaMesh = new THREE.Mesh(cascaGeo, cascaMat);
    cascaMesh.position.y = altura / 2;
    g.add(cascaMesh);

    // Base
    const baseGeo = new THREE.CylinderGeometry(raio, raio, 0.1, 32);
    const baseMat = toon(CASCA_CORES[casca] || CASCA_CORES.padrao);
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.05;
    g.add(base);

    // Topo (tampa)
    const topoGeo = new THREE.CylinderGeometry(raio, raio, 0.1, 32);
    const topo = new THREE.Mesh(topoGeo, baseMat);
    topo.position.y = altura - 0.05;
    g.add(topo);

    // Líquido interno
    const liquidoGeo = new THREE.CylinderGeometry(raio * 0.95, raio * 0.95, altura * nivel, 32);
    const liquidoMat = flat(LIQUIDO_CORES[liquido] || LIQUIDO_CORES.agua, { transparent: true, opacity: 0.8 });
    const liquidoMesh = new THREE.Mesh(liquidoGeo, liquidoMat);
    liquidoMesh.position.y = (altura * nivel) / 2;
    liquidoMesh.layers.set(NOINK);
    g.add(liquidoMesh);

    // Borda superior do líquido (menisco)
    const bordaGeo = new THREE.RingGeometry(raio * 0.93, raio * 0.97, 32);
    const bordaMat = flat(LIQUIDO_CORES[liquido] || LIQUIDO_CORES.agua, { transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    const borda = new THREE.Mesh(bordaGeo, bordaMat);
    borda.rotation.x = -Math.PI / 2;
    borda.position.y = altura * nivel + 0.001;
    g.add(borda);

    g.position.set(pos.x, pos.y, pos.z);
    g.userData.tanque = { raio, altura, liquido, casca };

    this.root.add(g);

    this.tanques.push({
      mesh: g,
      config: { raio, altura, liquido, casca, nivel },
      nivelAtual: nivel,
      liquidoMesh,
      cascaMesh,
    });

    return g;
  }

  /** Anima nível do líquido (0 a 1) */
  animarNivel(tanque: THREE.Group, nivelInicial: number, nivelFinal: number, duracao: number, curva: keyof typeof curvas = "ss", inicioFrame = 0) {
    const t = this.tanques.find(t => t.mesh === tanque);
    if (!t) return;

    tanque.userData.animNivel = {
      nivelInicial,
      nivelFinal,
      duracao,
      curva,
      inicioFrame,
      ativo: true,
    };
  }

  update(frame: number) {
    for (const t of this.tanques) {
      const anim = t.mesh.userData.animNivel;
      if (!anim || !anim.ativo) continue;

      const frameInicio = anim.inicioFrame;
      const frameFim = frameInicio + frames(anim.duracao);

      if (frame < frameInicio || frame > frameFim) {
        if (frame > frameFim) {
          anim.ativo = false;
          t.nivelAtual = anim.nivelFinal;
          this.atualizarLiquido(t, anim.nivelFinal);
        }
        continue;
      }

      const progresso = normalizar(frame, frameInicio, frameFim);
      const easing = curvas[anim.curva](progresso);
      const nivel = anim.nivelInicial + (anim.nivelFinal - anim.nivelInicial) * easing;

      t.nivelAtual = nivel;
      this.atualizarLiquido(t, nivel);
    }
  }

  private atualizarLiquido(t: TanqueInstance, nivel: number) {
    const { raio, altura } = t.mesh.userData.tanque;
    const h = altura * Math.max(0, Math.min(1, nivel));

    // Atualiza geometria do líquido
    t.liquidoMesh.geometry.dispose();
    t.liquidoMesh.geometry = new THREE.CylinderGeometry(raio * 0.95, raio * 0.95, h, 32);
    t.liquidoMesh.position.y = h / 2;

    // Atualiza borda
    const borda = t.mesh.children.find(c => c instanceof THREE.Mesh && c.geometry instanceof THREE.RingGeometry);
    if (borda) {
      borda.position.y = h + 0.001;
    }
  }

  dispose() {
    for (const t of this.tanques) {
      this.root.remove(t.mesh);
      t.mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
    this.tanques = [];
  }
}

// Tanques especiais
export const tanqueAgua = (root: THREE.Group, pos: Vetor3, raio = 1.2, altura = 3, nivel = 0.6) =>
  new TanqueSistema(root).criar(pos, { raio, altura, liquido: "agua", nivel });

export const tanqueLeite = (root: THREE.Group, pos: Vetor3, raio = 1.2, altura = 3, nivel = 0.6) =>
  new TanqueSistema(root).criar(pos, { raio, altura, liquido: "leite", casca: "metal", nivel });

export const tanqueOleo = (root: THREE.Group, pos: Vetor3, raio = 1.2, altura = 3, nivel = 0.6) =>
  new TanqueSistema(root).criar(pos, { raio, altura, liquido: "oleo", casca: "metal", nivel });

export const tanqueGrao = (root: THREE.Group, pos: Vetor3, raio = 1.2, altura = 3, nivel = 0.6) =>
  new TanqueSistema(root).criar(pos, { raio, altura, liquido: "grao", casca: "metal", nivel });

export const tanqueConcreto = (root: THREE.Group, pos: Vetor3, raio = 1.4, altura = 4, nivel = 0.5) =>
  new TanqueSistema(root).criar(pos, { raio, altura, liquido: "concreto", casca: "concreto", nivel });

// Silo (tanque alto para grãos)
export const criarSilo = (root: THREE.Group, pos: Vetor3, raio = 1.5, altura = 10, nivel = 0.7): THREE.Group => {
  const g = new THREE.Group();

  // Corpo cilíndrico
  const corpoGeo = new THREE.CylinderGeometry(raio, raio, altura, 24, 1, true);
  const corpoMat = toon("#c9cdd2");
  const corpo = new THREE.Mesh(corpoGeo, corpoMat);
  corpo.position.y = altura / 2;
  g.add(corpo);

  // Topo cônico
  const topoGeo = new THREE.ConeGeometry(raio, raio * 0.8, 24);
  const topoMat = toon("#6d7783");
  const topo = new THREE.Mesh(topoGeo, topoMat);
  topo.position.y = altura + raio * 0.4;
  g.add(topo);

  // Base
  const baseGeo = new THREE.CylinderGeometry(raio * 1.1, raio * 1.1, 0.5, 24);
  const base = new THREE.Mesh(baseGeo, corpoMat);
  base.position.y = 0.25;
  g.add(base);

  // Conteúdo (grãos)
  const conteudoAltura = altura * nivel;
  const conteudoGeo = new THREE.CylinderGeometry(raio * 0.95, raio * 0.95, conteudoAltura, 24);
  const conteudoMat = flat("#d4a84a", { transparent: true, opacity: 0.9 });
  const conteudo = new THREE.Mesh(conteudoGeo, conteudoMat);
  conteudo.position.y = conteudoAltura / 2;
  conteudo.layers.set(NOINK);
  g.add(conteudo);

  g.position.set(pos.x, pos.y, pos.z);
  g.userData.silo = { raio, altura };
  root.add(g);

  return g;
};