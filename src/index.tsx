// ============================================
// KIT UNIFICADO - Entry Point Principal
// Remotion + Three.js para animação 3D viral
// ============================================

import { registerRoot, Config, Composition } from "remotion";
import React from "react";
import { Video3D } from "./kit/Root";

Config.EnableProfiling = false;
Config.ChromiumOpenGlRenderer = "angle";

// Root component que registra as composições
const Root: React.FC = () => {
  return (
    <>
      {/* VÍDEO PRINCIPAL */}
      <Composition
        id="main"
        component={Video3D}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
      />
    </>
  );
};

// Registra root
registerRoot(<Root />);

// ============================================
// EXPORTAÇÕES PRINCIPAIS (para uso externo)
// ============================================

// Tipos
export * from "./kit/types";

// Core systems
export * from "./kit/tempo";
export * from "./kit/camera";
export * from "./kit/ink";
export * from "./kit/paint";
export * from "./kit/personagens";

// Cenários / Mundo
export * from "./kit/cenarios";

// Process Animation
export * from "./kit/fluxos";
export * from "./kit/rastros";
export * from "./kit/anim";
export * from "./kit/etapa";
export * from "./kit/monte";
export * from "./kit/tanque";
export * from "./kit/misturador";
export * from "./kit/escavadeira";
export * from "./kit/fabrica";

// Componentes React/Remotion
export { Cena3D } from "./kit/Cena3D";
export { Legenda, LegendaKaraoke, LegendaLinhaUnica } from "./kit/Legenda";
export {
  Miniatura,
  MiniaturaYoutube,
  MiniaturaVertical,
  Badge,
  BarraProgresso,
  ContadorVisualizacoes
} from "./kit/Miniatura";
export { Video3D } from "./kit/Root";

// ============================================
// FACTORY PARA CRIAÇÃO RÁPIDA (KitUnificado)
// ============================================

import {
  MisturadorSistema, misturadorConcreto, misturadorTinta, misturadorMassa, misturadorComida
} from "./kit/misturador";
import {
  TanqueSistema, tanqueAgua, tanqueLeite, tanqueOleo, tanqueGrao, tanqueConcreto, criarSilo
} from "./kit/tanque";
import {
  MonteSistema, montePedra, monteAreia, monteTerra, monteGrao, monteAsfalto
} from "./kit/monte";
import {
  EtapaSistema, criarCasaObra, criarPredioEstrutura, criarRuaCamadas, criarCorteTerreno, criarGuindaste
} from "./kit/etapa";
import {
  AnimSistema, animPos, animGiro, animEscala, animAparece, animConstrui
} from "./kit/anim";
import {
  FluxoSistema, fluxoParticulas
} from "./kit/fluxos";
import {
  RastroSistema, rastroAsfalto, rastroTerra, rastroBrita, rastroConcreto
} from "./kit/rastros";
import {
  EscavadeiraSistema, criarEscavadeira
} from "./kit/escavadeira";
import {
  FabricaSistema, criarFabrica
} from "./kit/fabrica";
import {
  criarMundo, chao, mar, casa, predio, arvore, cidade, nuvem, estrelas, planeta, rua, cruzamento
} from "./kit/cenarios";
import {
  criarPersonagem, PERSONAGENS
} from "./kit/personagens";
import {
  camNoTempo, camOrbita, camPushIn, camKick
} from "./kit/camera";
import {
  frames, normalizar, curvas, criarCue
} from "./kit/tempo";
import type {
  Storyboard, Cena3DProps, Vetor3, Palavra
} from "./kit/types";
import * as THREE from "three";

/** KitUnificado - Facade para acesso rápido a todos os sistemas */
export class KitUnificado {
  private scene: THREE.Scene;
  private sistemas: {
    misturadores: MisturadorSistema;
    tanques: TanqueSistema;
    montes: MonteSistema;
    etapas: EtapaSistema;
    animacoes: AnimSistema;
    fluxos: FluxoSistema;
    rastros: RastroSistema;
    escavadeiras: EscavadeiraSistema;
    fabricas: FabricaSistema;
  };
  private grupos: {
    mundo: THREE.Group;
    misturadores: THREE.Group;
    tanques: THREE.Group;
    montes: THREE.Group;
    etapas: THREE.Group;
    animacoes: THREE.Group;
    fluxos: THREE.Group;
    rastros: THREE.Group;
    escavadeiras: THREE.Group;
    fabricas: THREE.Group;
    personagens: THREE.Group;
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Cria grupos
    this.grupos = {
      mundo: new THREE.Group(),
      misturadores: new THREE.Group(),
      tanques: new THREE.Group(),
      montes: new THREE.Group(),
      etapas: new THREE.Group(),
      animacoes: new THREE.Group(),
      fluxos: new THREE.Group(),
      rastros: new THREE.Group(),
      escavadeiras: new THREE.Group(),
      fabricas: new THREE.Group(),
      personagens: new THREE.Group(),
    };

    // Adiciona à cena
    Object.values(this.grupos).forEach(g => scene.add(g));

    // Inicializa sistemas
    this.sistemas = {
      misturadores: new MisturadorSistema(this.grupos.misturadores),
      tanques: new TanqueSistema(this.grupos.tanques),
      montes: new MonteSistema(this.grupos.montes),
      etapas: new EtapaSistema(this.grupos.etapas),
      animacoes: new AnimSistema(this.grupos.animacoes),
      fluxos: new FluxoSistema(this.grupos.fluxos),
      rastros: new RastroSistema(this.grupos.rastros),
      escavadeiras: new EscavadeiraSistema(this.grupos.escavadeiras),
      fabricas: new FabricaSistema(this.grupos.fabricas),
    };
  }

  // --- MISTURADORES ---
  misturadorConcreto(pos: Vetor3, raio = 1.4) { return misturadorConcreto(this.grupos.misturadores, pos, raio); }
  misturadorTinta(pos: Vetor3, raio = 1.4) { return misturadorTinta(this.grupos.misturadores, pos, raio); }
  misturadorMassa(pos: Vetor3, raio = 1.4) { return misturadorMassa(this.grupos.misturadores, pos, raio); }
  misturadorComida(pos: Vetor3, raio = 1.4) { return misturadorComida(this.grupos.misturadores, pos, raio); }

  // --- TANQUES ---
  tanqueAgua(pos: Vetor3, raio = 1.2, altura = 3, nivel = 0.6) { return tanqueAgua(this.grupos.tanques, pos, raio, altura, nivel); }
  tanqueLeite(pos: Vetor3, raio = 1.2, altura = 3, nivel = 0.6) { return tanqueLeite(this.grupos.tanques, pos, raio, altura, nivel); }
  tanqueOleo(pos: Vetor3, raio = 1.2, altura = 3, nivel = 0.6) { return tanqueOleo(this.grupos.tanques, pos, raio, altura, nivel); }
  tanqueGrao(pos: Vetor3, raio = 1.2, altura = 3, nivel = 0.6) { return tanqueGrao(this.grupos.tanques, pos, raio, altura, nivel); }
  tanqueConcreto(pos: Vetor3, raio = 1.4, altura = 4, nivel = 0.5) { return tanqueConcreto(this.grupos.tanques, pos, raio, altura, nivel); }
  silo(pos: Vetor3, raio = 1.5, altura = 10, nivel = 0.7) { return criarSilo(this.grupos.tanques, pos, raio, altura, nivel); }

  // --- MONTES ---
  montePedra(pos: Vetor3, raio = 1.6, progress = 1) { return montePedra(this.grupos.montes, pos, raio, progress); }
  monteAreia(pos: Vetor3, raio = 1.6, progress = 1) { return monteAreia(this.grupos.montes, pos, raio, progress); }
  monteTerra(pos: Vetor3, raio = 1.6, progress = 1) { return monteTerra(this.grupos.montes, pos, raio, progress); }
  monteGrao(pos: Vetor3, raio = 1.6, progress = 1) { return monteGrao(this.grupos.montes, pos, raio, progress); }
  monteAsfalto(pos: Vetor3, raio = 1.6, progress = 1) { return monteAsfalto(this.grupos.montes, pos, raio, progress); }

  // --- ETAPAS ---
  casaObra(pos: Vetor3, progress = 1) { return criarCasaObra(this.grupos.etapas, pos, progress); }
  predioEstrutura(pos: Vetor3, andares = 8, progress = 1) { return criarPredioEstrutura(this.grupos.etapas, pos, andares, progress); }
  ruaCamadas(pos: Vetor3, progress = 1) { return criarRuaCamadas(this.grupos.etapas, pos, progress); }
  corteTerreno(pos: Vetor3, progress = 1) { return criarCorteTerreno(this.grupos.etapas, pos, progress); }
  guindaste(pos: Vetor3, altura = 22, lança = 16) { return criarGuindaste(this.grupos.etapas, pos, altura, lança); }

  // --- ESCAVADEIRA ---
  escavadeira(pos: Vetor3, tamanho = 1, cor = "#f2c94c") { return criarEscavadeira(this.grupos.escavadeiras, pos, tamanho, cor); }

  // --- FÁBRICA ---
  fabrica(pos: Vetor3, tamanho = 1) { return criarFabrica(this.grupos.fabricas, pos, tamanho); }

  // --- MUNDO / CENÁRIOS ---
  mundo(config: any) { return criarMundo(this.grupos.mundo, config); }
  chao(config: any) { return chao(this.grupos.mundo, config); }
  mar(config: any) { return mar(this.grupos.mundo, config); }
  casa(pos: Vetor3, config: any) { return casa(this.grupos.mundo, pos, config); }
  predio(pos: Vetor3, config: any) { return predio(this.grupos.mundo, pos, config); }
  arvore(pos: Vetor3, config: any) { return arvore(this.grupos.mundo, pos, config); }
  cidade(config: any) { return cidade(this.grupos.mundo, config); }
  nuvem(pos: Vetor3, config: any) { return nuvem(this.grupos.mundo, pos, config); }
  estrelas(config: any) { return estrelas(this.grupos.mundo, config); }
  planeta(pos: Vetor3, config: any) { return planeta(this.grupos.mundo, pos, config); }
  rua(pos: Vetor3, config: any) { return rua(this.grupos.mundo, pos, config); }
  cruzamento(pos: Vetor3, config: any) { return cruzamento(this.grupos.mundo, pos, config); }

  // --- PERSONAGENS ---
  personagem(config: any) { return criarPersonagem(this.grupos.personagens, config); }
  getPersonagens() { return PERSONAGENS; }

  // --- FLUXOS / RASTROS ---
  fluxo(config: any) { return this.sistemas.fluxos.adicionar(config); }
  rastro(config: any) { return this.sistemas.rastros.adicionar(config); }

  // --- ANIMAÇÕES / ETAPAS ---
  animar(config: any) { return this.sistemas.animacoes.adicionar(config); }
  etapa(config: any) { return this.sistemas.etapas.adicionar(config); }
  registrarAnimacao(id: string, obj: THREE.Object3D) { this.sistemas.animacoes.registrar(id, obj); }
  registrarEtapa(id: string, obj: THREE.Object3D) { this.sistemas.etapas.registrar(id, obj); }

  // --- CÂMERA ---
  camNoTempo(frame: number, keyframes: any[], fps: number) { return camNoTempo(frame, keyframes, fps); }
  camOrbita(...args: any[]) { return camOrbita(...args); }
  camPushIn(...args: any[]) { return camPushIn(...args); }
  camKick(...args: any[]) { return camKick(...args); }

  // --- TEMPO ---
  frames(seg: number) { return frames(seg); }
  normalizar(v: number, min: number, max: number) { return normalizar(v, min, max); }
  curvas = curvas;
  criarCue(palavras: Palavra[]) { return criarCue(palavras); }

  // --- UPDATE LOOP ---
  update(frame: number, deltaTime: number) {
    Object.values(this.sistemas).forEach(sys => {
      if (sys.update) sys.update(frame, deltaTime);
    });
  }

  // --- DISPOSE ---
  dispose() {
    Object.values(this.sistemas).forEach(sys => {
      if (sys.dispose) sys.dispose();
    });
    Object.values(this.grupos).forEach(g => {
      this.scene.remove(g);
      g.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    });
  }
}

// ============================================
// HELPERS PARA STORYBOARD
// ============================================

/** Cria storyboard padrão */
export const criarStoryboardPadrao = (overrides: Partial<Storyboard> = {}): Storyboard => ({
  id: `video-${Date.now()}`,
  config: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300,
    corCeu: "#87ceeb",
    fov: 45,
    iluminacao: { tipo: "dia" },
  },
  camera: {
    inicial: { pos: [0, 10, 20], alvo: [0, 2, 0] },
    keyframes: [],
  },
  mundo: { tipo: "externo", hora: "dia" },
  assets: [],
  registros: [],
  animacoes: [],
  etapas: [],
  fluxos: [],
  rastros: [],
  personagens: [],
  legendas: [],
  ...overrides,
});

/** Valida storyboard */
export const validarStoryboard = (sb: Storyboard): { valido: boolean; erros: string[] } => {
  const erros: string[] = [];

  if (!sb.config?.width || !sb.config?.height) erros.push("Config: width/height obrigatórios");
  if (!sb.config?.fps) erros.push("Config: fps obrigatório");
  if (!sb.config?.durationInFrames) erros.push("Config: durationInFrames obrigatório");

  if (sb.camera?.keyframes) {
    sb.camera.keyframes.forEach((kf, i) => {
      if (!kf.frame || kf.frame < 0) erros.push(`Camera keyframe ${i}: frame inválido`);
      if (!kf.pos || kf.pos.length !== 3) erros.push(`Camera keyframe ${i}: pos deve ser [x,y,z]`);
    });
  }

  if (sb.legendas) {
    sb.legendas.forEach((leg, i) => {
      if (leg.tipo !== "linha" && (!leg.palavras || leg.palavras.length === 0)) {
        erros.push(`Legenda ${i}: palavras obrigatórias para tipo ${leg.tipo}`);
      }
      if (leg.tipo === "linha" && !leg.texto) {
        erros.push(`Legenda ${i}: texto obrigatório para tipo linha`);
      }
    });
  }

  return { valido: erros.length === 0, erros };
};

// ============================================
// THREE.JS (re-export para conveniência)
// ============================================
export { THREE };

// ============================================
// VERSÃO
// ============================================
export const VERSAO = "1.0.0";
export const NOME = "Kit Unificado - Remotion + Three.js";

// ============================================
// LOG DE INICIALIZAÇÃO
// ============================================
console.log(`%c${NOME} v${VERSAO}`, "color: #ffdd00; font-size: 14px; font-weight: bold;");
console.log("Sistemas carregados:", [
  "Misturador", "Tanque/Silo", "Monte", "Etapa", "Anim",
  "Fluxo", "Rastro", "Escavadeira", "Fabrica",
  "Cenarios", "Personagens", "Camera", "Tempo",
  "Legenda", "Miniatura", "Cena3D"
].join(", "));