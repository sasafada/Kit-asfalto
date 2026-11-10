// Sistema de etapas (progressão de construção: casa_obra, predio_estrutura, rua_camadas, corte_terreno, guindaste)
import * as THREE from "three";
import { frames, normalizar, curvas } from "./tempo";
import type { EtapaConfig, Vetor3 } from "./types";

interface EtapaInstance {
  config: EtapaConfig;
  alvo: THREE.Object3D;
  progressoAtual: number;
  ativo: boolean;
}

export class EtapaSistema {
  private etapas: EtapaInstance[] = [];
  private root: THREE.Group;
  private objetos: Map<string, THREE.Object3D> = new Map();

  constructor(root: THREE.Group) {
    this.root = root;
  }

  registrar(id: string, obj: THREE.Object3D) {
    this.objetos.set(id, obj);
  }

  adicionar(config: EtapaConfig) {
    const alvo = this.objetos.get(config.alvo);
    if (!alvo) {
      console.warn(`Etapa: objeto "${config.alvo}" não encontrado`);
      return;
    }

    this.etapas.push({
      config: { ...config, progressInicial: config.progressInicial ?? 0 },
      alvo,
      progressoAtual: config.progressInicial ?? 0,
      ativo: false,
    });
  }

  adicionarVarios(configs: EtapaConfig[]) {
    configs.forEach(c => this.adicionar(c));
  }

  update(frame: number) {
    for (const etapa of this.etapas) {
      const { config, alvo, progressoAtual } = etapa;
      const inicio = frames(config.progressInicial !== undefined ? 0 : config.inicio ?? 0); // progressInicial não é frame
      // Usa inicio/duracao da config
      const frameInicio = frames(config.inicio ?? 0);
      const frameFim = frameInicio + frames(config.duracao);

      if (frame < frameInicio || frame > frameFim) {
        if (frame > frameFim) {
          etapa.ativo = false;
          // Garante valor final
          this.aplicarProgresso(alvo, config.progressFinal);
        }
        continue;
      }

      etapa.ativo = true;
      const progresso = normalizar(frame, frameInicio, frameFim);
      const curva = config.curva ?? "ss";
      const easing = curvas[curva](progresso);

      const prog = config.progressInicial + (config.progressFinal - config.progressInicial) * easing;
      etapa.progressoAtual = prog;
      this.aplicarProgresso(alvo, prog);
    }
  }

  private aplicarProgresso(obj: THREE.Object3D, progress: number) {
    // progress vai de 0 a 1
    // O objeto deve ter userData.etapaApply ou ser um tipo conhecido
    const tipo = obj.userData.tipoEtapa;

    switch (tipo) {
      case "casa_obra":
        this.aplicarCasaObra(obj, progress);
        break;
      case "predio_estrutura":
        this.aplicarPredioEstrutura(obj, progress);
        break;
      case "rua_camadas":
        this.aplicarRuaCamadas(obj, progress);
        break;
      case "corte_terreno":
        this.aplicarCorteTerreno(obj, progress);
        break;
      case "guindaste":
        this.aplicarGuindaste(obj, progress);
        break;
      default:
        // Tenta setar progress se tiver método
        if (typeof (obj as any).setProgress === "function") {
          (obj as any).setProgress(progress);
        }
    }
  }

  private aplicarCasaObra(obj: THREE.Object3D, p: number) {
    // p: 0-0.12 fundação, 0.12-0.25 pilares, 0.25-0.55 paredes, 0.55-0.65 laje, 0.65-0.82 madeiramento, 0.82-1 telhas
    obj.traverse(child => {
      if (child instanceof THREE.Mesh && child.userData.etapaParte) {
        const parte = child.userData.etapaParte;
        let visivel = false;
        if (parte === "fundacao") visivel = p > 0;
        else if (parte === "pilares") visivel = p > 0.12;
        else if (parte === "paredes") visivel = p > 0.25;
        else if (parte === "laje") visivel = p > 0.55;
        else if (parte === "madeiramento") visivel = p > 0.65;
        else if (parte === "telhas") visivel = p > 0.82;
        child.visible = visivel;
      }
    });
  }

  private aplicarPredioEstrutura(obj: THREE.Object3D, p: number) {
    // Esqueleto de concreto sobe andar por andar
    const andares = obj.userData.andares || 8;
    const andarAtual = Math.floor(p * andares);

    obj.traverse(child => {
      if (child instanceof THREE.Mesh && child.userData.andar !== undefined) {
        child.visible = child.userData.andar <= andarAtual;
      }
    });
  }

  private aplicarRuaCamadas(obj: THREE.Object3D, p: number) {
    // Camadas: solo(0-0.2), brita(0.2-0.4), base(0.4-0.6), asfalto base(0.6-0.8), capa(0.8-1)
    const camadas = ["solo", "brita", "base", "asfalto_base", "capa"];
    obj.traverse(child => {
      if (child instanceof THREE.Mesh && child.userData.camada !== undefined) {
        const idx = child.userData.camada;
        child.visible = p > (idx / camadas.length);
      }
    });
  }

  private aplicarCorteTerreno(obj: THREE.Object3D, p: number) {
    // Grama, terra, argila, rocha
    const camadas = ["grama", "terra", "argila", "rocha"];
    obj.traverse(child => {
      if (child instanceof THREE.Mesh && child.userData.camada !== undefined) {
        const idx = child.userData.camada;
        child.visible = p > (idx / camadas.length);
      }
    });
  }

  private aplicarGuindaste(obj: THREE.Object3D, p: number) {
    // p controla altura da lança e posição do gancho
    // Implementação específica dependeria da estrutura do guindaste
  }
}

// Factory para criar assets com suporte a etapas
export const criarCasaObra = (root: THREE.Group, pos: Vetor3, progress = 1): THREE.Group => {
  const g = new THREE.Group();
  g.userData.tipoEtapa = "casa_obra";

  // Fundação (sempre visível se p > 0)
  const fundacao = new THREE.Mesh(
    new THREE.BoxGeometry(7, 0.5, 8),
    new THREE.MeshToonMaterial({ color: "#5a4a3a" })
  );
  fundacao.position.y = 0.25;
  fundacao.userData.etapaParte = "fundacao";
  g.add(fundacao);

  // Pilares
  for (let x = -3; x <= 3; x += 6) for (let z = -3.5; z <= 3.5; z += 7) {
    const pilar = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 3, 0.4),
      new THREE.MeshToonMaterial({ color: "#8a8a8a" })
    );
    pilar.position.set(x, 1.75, z);
    pilar.userData.etapaParte = "pilares";
    g.add(pilar);
  }

  // Paredes
  const paredeMat = new THREE.MeshToonMaterial({ color: "#b8573b" });
  const paredes = [
    new THREE.Mesh(new THREE.BoxGeometry(7, 3, 0.2), paredeMat),
    new THREE.Mesh(new THREE.BoxGeometry(7, 3, 0.2), paredeMat),
    new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 8), paredeMat),
    new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 8), paredeMat),
  ];
  paredes[0].position.set(0, 2.75, -4.1);
  paredes[1].position.set(0, 2.75, 4.1);
  paredes[2].position.set(-3.6, 2.75, 0);
  paredes[3].position.set(3.6, 2.75, 0);
  paredes.forEach(w => { w.userData.etapaParte = "paredes"; g.add(w); });

  // Laje
  const laje = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 0.2, 8.4),
    new THREE.MeshToonMaterial({ color: "#8a8a8a" })
  );
  laje.position.y = 4.3;
  laje.userData.etapaParte = "laje";
  g.add(laje);

  // Madeiramento
  const madeiraMat = new THREE.MeshToonMaterial({ color: "#8a5a34" });
  for (let i = 0; i < 6; i++) {
    const viga = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 0.15, 0.15),
      madeiraMat
    );
    viga.position.set(0, 4.5 + i * 0.3, -4.1 + i * 1.6);
    viga.userData.etapaParte = "madeiramento";
    g.add(viga);
  }

  // Telhas
  const telhaMat = new THREE.MeshToonMaterial({ color: "#d2693a" });
  const telha = new THREE.Mesh(
    new THREE.BoxGeometry(7.8, 0.3, 8.8),
    telhaMat
  );
  telha.position.y = 5.5;
  telha.userData.etapaParte = "telhas";
  g.add(telha);

  g.position.set(pos.x, pos.y, pos.z);
  root.add(g);

  // Aplica progresso inicial
  const etapaSistema = new EtapaSistema(root);
  etapaSistema.registrar("casa_obra", g);
  etapaSistema.adicionar({ alvo: "casa_obra", progressInicial: 0, progressFinal: progress, duracao: 0, inicio: 0 });
  etapaSistema.update(0);

  return g;
};

export const criarPredioEstrutura = (root: THREE.Group, pos: Vetor3, floors = 8, progress = 1): THREE.Group => {
  const g = new THREE.Group();
  g.userData.tipoEtapa = "predio_estrutura";
  g.userData.andares = floors;

  const concrete = new THREE.MeshToonMaterial({ color: "#b9b9b4" });

  for (let f = 0; f < floors; f++) {
    const y = f * 3.2;

    // Pilares
    for (let x = -7; x <= 7; x += 14) for (let z = -5; z <= 5; z += 10) {
      const pilar = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 3.2, 0.6),
        concrete
      );
      pilar.position.set(x, y + 1.6, z);
      pilar.userData.andar = f + 1;
      g.add(pilar);
    }

    // Laje
    const laje = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.3, 11),
      concrete
    );
    laje.position.set(0, y + 3.2, 0);
    laje.userData.andar = f + 1;
    g.add(laje);
  }

  g.position.set(pos.x, pos.y, pos.z);
  root.add(g);
  return g;
};

export const criarRuaCamadas = (root: THREE.Group, pos: Vetor3, progress = 1): THREE.Group => {
  const g = new THREE.Group();
  g.userData.tipoEtapa = "rua_camadas";

  const camadas = [
    { nome: "solo", h: 0.4, cor: "#5a4a3a" },
    { nome: "brita", h: 0.3, cor: "#6a6a6a" },
    { nome: "base", h: 0.25, cor: "#5a5a5a" },
    { nome: "asfalto_base", h: 0.25, cor: "#3a3a3a" },
    { nome: "capa", h: 0.1, cor: "#2a2a2a" },
  ];

  let y = 0;
  camadas.forEach((c, i) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(8, c.h, 8),
      new THREE.MeshToonMaterial({ color: c.cor })
    );
    mesh.position.y = y + c.h / 2;
    mesh.userData.camada = i;
    g.add(mesh);
    y += c.h;
  });

  // Faixa
  const faixa = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 8),
    new THREE.MeshToonMaterial({ color: "#f2f2f2" })
  );
  faixa.rotation.x = -Math.PI / 2;
  faixa.position.y = y + 0.01;
  g.add(faixa);

  g.position.set(pos.x, pos.y, pos.z);
  root.add(g);
  return g;
};

export const criarCorteTerreno = (root: THREE.Group, pos: Vetor3, progress = 1): THREE.Group => {
  const g = new THREE.Group();
  g.userData.tipoEtapa = "corte_terreno";

  const camadas = [
    { nome: "grama", h: 0.3, cor: "#5fae4e" },
    { nome: "terra", h: 0.8, cor: "#8b6b4a" },
    { nome: "argila", h: 0.7, cor: "#a05a3a" },
    { nome: "rocha", h: 1.0, cor: "#6a6a6a" },
  ];

  let y = 0;
  camadas.forEach((c, i) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(8, c.h, 6),
      new THREE.MeshToonMaterial({ color: c.cor })
    );
    mesh.position.y = y + c.h / 2;
    mesh.userData.camada = i;
    g.add(mesh);
    y += c.h;
  });

  g.position.set(pos.x, pos.y, pos.z);
  root.add(g);
  return g;
};

export const criarGuindaste = (root: THREE.Group, pos: Vetor3, height = 22, jib = 16): THREE.Group => {
  const g = new THREE.Group();
  g.userData.tipoEtapa = "guindaste";

  // Torre
  const torre = new THREE.Mesh(
    new THREE.BoxGeometry(2, height, 2),
    new THREE.MeshToonMaterial({ color: "#f2c94c" })
  );
  torre.position.y = height / 2;
  g.add(torre);

  // Lança
  const lança = new THREE.Mesh(
    new THREE.BoxGeometry(jib, 0.5, 1),
    new THREE.MeshToonMaterial({ color: "#f2c94c" })
  );
  lança.position.set(jib / 2, height + 1, 0);
  g.add(lança);

  // Contrapeso
  const contra = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1, 3),
    new THREE.MeshToonMaterial({ color: "#7a7a7a" })
  );
  contra.position.set(-jib * 0.3, height + 1, 0);
  g.add(contra);

  // Cabo e gancho
  const cabo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, height, 8),
    new THREE.MeshToonMaterial({ color: "#3a3a3a" })
  );
  cabo.position.set(0, height / 2, 0);
  g.add(cabo);

  const gancho = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.8, 0.5),
    new THREE.MeshToonMaterial({ color: "#d9473a" })
  );
  gancho.position.set(0, 0.5, 0);
  g.add(gancho);

  g.position.set(pos.x, pos.y, pos.z);
  root.add(g);
  return g;
};