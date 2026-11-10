// Sistema de câmera keyframed + utilitários
import * as THREE from "three";
import { CameraKeyframe, Vetor3 } from "./types";
import { frames, normalizar, curvas } from "./tempo";

export interface CameraState {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
}

/** Interpola câmera entre keyframes */
export const camNoTempo = (keyframes: CameraKeyframe[], frameAtual: number): CameraState => {
  if (keyframes.length === 0) {
    return { pos: new THREE.Vector3(0, 5, 10), look: new THREE.Vector3(0, 1, 0), fov: 45 };
  }
  if (keyframes.length === 1) {
    return {
      pos: new THREE.Vector3(...keyframes[0].c.pos),
      look: new THREE.Vector3(...keyframes[0].c.look),
      fov: keyframes[0].c.fov,
    };
  }

  // Encontra segmento atual
  let seg = 0;
  while (seg < keyframes.length - 1 && frames(keyframes[seg + 1].t) <= frameAtual) {
    seg++;
  }
  seg = Math.min(seg, keyframes.length - 2);

  const k0 = keyframes[seg];
  const k1 = keyframes[seg + 1];
  const t0 = frames(k0.t);
  const t1 = frames(k1.t);
  const t = normalizar(frameAtual, t0, t1);

  // Curva: usa kick se marcado como corte, senão ss
  const curva = k1.corte ? "kick" : "ss";

  return {
    pos: new THREE.Vector3(...interpolarV3(t, k0.c.pos, k1.c.pos, curva)),
    look: new THREE.Vector3(...interpolarV3(t, k0.c.look, k1.c.look, curva)),
    fov: interpolar(t, k0.c.fov, k1.c.fov, curva),
  };
};

/** Cria órbita ao redor de alvo */
export const orbita = (
  alvo: Vetor3,
  graus: number,
  raio: number,
  altura: number,
  fov = 45
): CameraState => {
  const rad = (graus * Math.PI) / 180;
  return {
    pos: new THREE.Vector3(alvo.x + Math.sin(rad) * raio, alvo.y + altura, alvo.z + Math.cos(rad) * raio),
    look: new THREE.Vector3(alvo.x, alvo.y + altura * 0.5, alvo.z),
    fov,
  };
};

/** Push-in (aproximação lenta) */
export const pushIn = (c: CameraState, t0: number, t1: number, t: number, quanto: number): CameraState => {
  const dir = new THREE.Vector3().subVectors(c.look, c.pos).normalize();
  const fator = normalizar(t, t0, t1);
  return {
    ...c,
    pos: c.pos.clone().add(dir.multiplyScalar(quanto * fator)),
  };
};

/** Kick (tremido de impacto) */
export const kick = (t: number, tImpacto: number, duracao = 0.3, intensidade = 0.15) => {
  const dt = t - tImpacto;
  if (dt < 0 || dt > duracao) return 0;
  const fase = dt / duracao;
  return Math.sin(fase * Math.PI * 6) * (1 - fase) * intensidade;
};

/** Aplica câmera ao three.js + tremido */
export const aplicarCam = (
  cam: THREE.Camera,
  state: CameraState,
  tremido: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
) => {
  cam.position.set(state.pos.x + tremido.x, state.pos.y + tremido.y, state.pos.z + tremido.z);
  cam.lookAt(state.look.x, state.look.y, state.look.z);
  if (cam instanceof THREE.PerspectiveCamera) {
    cam.fov = state.fov;
    cam.updateProjectionMatrix();
  }
};

/** Cria keyframes padrão para uma cena */
export const criarKeyframesPadrao = (
  alvo: Vetor3,
  tipo: "geral" | "close" | "dentro" = "geral",
  giro = 0
): CameraKeyframe[] => {
  const configs = {
    geral: { raio: 12, altura: 4, fov: 40 },
    close: { raio: 6, altura: 2, fov: 35 },
    dentro: { raio: 3, altura: 1.5, fov: 50 },
  };
  const cfg = configs[tipo];
  const rad = (giro * Math.PI) / 180;

  return [
    { t: 0, c: { pos: { x: alvo.x + Math.sin(rad) * cfg.raio, y: alvo.y + cfg.altura, z: alvo.z + Math.cos(rad) * cfg.raio }, look: alvo, fov: cfg.fov } },
  ];
};

/** Shake de câmera (handheld) */
export const cameraShake = (frame: number, intensidade = 1.0, seed = 42) => {
  const r = (() => { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; }; })();
  return {
    x: (r() - 0.5) * 0.3 * intensidade,
    y: (r() - 0.5) * 0.2 * intensidade,
    z: (r() - 0.5) * 0.1 * intensidade,
  };
};

/** Converte CameraSettings do storyboard para keyframes */
export const storyboardCameraParaKeyframes = (
  cena: { camera: { tipo: string; alvo: string; angulo: number; plano: number; giro: number } },
  alvos: Map<string, Vetor3>,
  duracaoCena: number
): CameraKeyframe[] => {
  const alvo = alvos.get(cena.camera.alvo) || { x: 0, y: 1, z: 0 };
  const cfg = criarKeyframesPadrao(alvo, cena.camera.tipo as any, cena.camera.giro);

  // Ajusta raio pelo plano
  cfg[0].c.pos.x = alvo.x + Math.sin((cena.camera.giro * Math.PI) / 180) * cena.camera.plano;
  cfg[0].c.pos.z = alvo.z + Math.cos((cena.camera.giro * Math.PI) / 180) * cena.camera.plano;
  cfg[0].c.pos.y = alvo.y + (cena.camera.tipo === "close" ? 2 : 4);

  // Adiciona keyframe final se tiver angulo (rotação)
  if (cena.camera.angulo !== 0) {
    const radFinal = ((cena.camera.giro + cena.camera.angulo) * Math.PI) / 180;
    cfg.push({
      t: duracaoCena,
      c: {
        pos: {
          x: alvo.x + Math.sin(radFinal) * cena.camera.plano,
          y: cfg[0].c.pos.y,
          z: alvo.z + Math.cos(radFinal) * cena.camera.plano,
        },
        look: alvo,
        fov: cfg[0].c.fov,
      },
    });
  }

  return cfg;
};

// Helper para interpolar Vetor3 (reexporta de tempo)
function interpolarV3(t: number, a: Vetor3, b: Vetor3, curva: keyof typeof curvas = "ss") {
  return {
    x: a.x + (b.x - a.x) * curvas[curva](t),
    y: a.y + (b.y - a.y) * curvas[curva](t),
    z: a.z + (b.z - a.z) * curvas[curva](t),
  };
}
function interpolar(t: number, a: number, b: number, curva: keyof typeof curvas = "ss") {
  return a + (b - a) * curvas[curva](t);
}

// Aliases para compatibilidade
export const camOrbita = orbita;
export const camPushIn = pushIn;
export const camKick = kick;