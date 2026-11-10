// Escavadeira: ciclo cavar-girar-descarregar
import * as THREE from "three";
import { frames, normalizar, curvas } from "./tempo";
import { toon } from "./paint";
import type { Vetor3 } from "./types";

interface EscavadeiraInstance {
  mesh: THREE.Group;
  config: { tamanho: number; cor: string };
  // Partes móveis
  base: THREE.Mesh;      // Giro da base (0-360)
  braco: THREE.Mesh;     // Braço principal
  antebraco: THREE.Mesh; // Antebraço
  concha: THREE.Mesh;    // Concha (balde)
  cabine: THREE.Mesh;    // Cabine do operador
  lagartas: THREE.Group; // Esteiras
  // Estados
  anguloBase: number;
  anguloBraco: number;
  anguloAntebraco: number;
  anguloConcha: number;
  // Ciclo
  faseCiclo: number;     // 0=cavar, 1=girar, 2=descarregar, 3=voltar
  progressoFase: number;
  cicloAtivo: boolean;
  duracaoCiclo: number;  // segundos
}

export class EscavadeiraSistema {
  private escavadeiras: EscavadeiraInstance[] = [];
  private root: THREE.Group;

  constructor(root: THREE.Group) {
    this.root = root;
  }

  criar(pos: Vetor3, config: { tamanho?: number; cor?: string; cicloDuracao?: number } = {}): THREE.Group {
    const tamanho = config.tamanho || 1;
    const cor = config.cor || "#f2c94c";
    const corEscura = "#b8962e";
    const corCabine = "#2a5a8a";
    const corMetal = "#4a4a4a";

    const g = new THREE.Group();
    const s = tamanho;

    // ===== BASE (gira) =====
    const baseGeo = new THREE.CylinderGeometry(1.8 * s, 2 * s, 1.2 * s, 16);
    const base = new THREE.Mesh(baseGeo, toon(cor));
    base.position.y = 0.6 * s;
    g.add(base);

    // Anel de giro
    const anelGeo = new THREE.TorusGeometry(1.6 * s, 0.1 * s, 8, 32);
    const anel = new THREE.Mesh(anelGeo, toon(corMetal));
    anel.rotation.x = -Math.PI / 2;
    anel.position.y = 1.2 * s;
    g.add(anel);

    // ===== CABINE =====
    const cabineGeo = new THREE.BoxGeometry(2.4 * s, 1.8 * s, 2 * s);
    const cabine = new THREE.Mesh(cabineGeo, toon(corCabine));
    cabine.position.set(0, 2.5 * s, 1.2 * s);
    g.add(cabine);

    // Janelas da cabine
    const janelaGeo = new THREE.PlaneGeometry(1.8 * s, 1.2 * s);
    const janelaMat = new THREE.MeshBasicMaterial({ color: "#6ab0f3", transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const janelaFrente = new THREE.Mesh(janelaGeo, janelaMat);
    janelaFrente.position.set(0, 2.5 * s, 2.2 * s);
    g.add(janelaFrente);
    const janelaLado = new THREE.Mesh(janelaGeo, janelaMat);
    janelaLado.rotation.y = -Math.PI / 2;
    janelaLado.position.set(-1.4 * s, 2.5 * s, 1.2 * s);
    g.add(janelaLado);

    // ===== CONTRAPESO =====
    const contraGeo = new THREE.BoxGeometry(2 * s, 1.5 * s, 2.5 * s);
    const contra = new THREE.Mesh(contraGeo, toon(corEscura));
    contra.position.set(0, 2.1 * s, -2.5 * s);
    g.add(contra);

    // ===== BRAÇO PRINCIPAL =====
    const bracoGroup = new THREE.Group();
    bracoGroup.position.set(0, 2.2 * s, 0);
    g.add(bracoGroup);

    const bracoGeo = new THREE.BoxGeometry(0.7 * s, 4.5 * s, 0.7 * s);
    const braco = new THREE.Mesh(bracoGeo, toon(cor));
    braco.position.y = 2.25 * s;
    bracoGroup.add(braco);

    // Cilindro hidráulico do braço
    const cilindroBracoGeo = new THREE.CylinderGeometry(0.12 * s, 0.12 * s, 3.5 * s, 8);
    const cilindroBraco = new THREE.Mesh(cilindroBracoGeo, toon(corMetal));
    cilindroBraco.position.set(0, 2.2 * s, -0.8 * s);
    cilindroBraco.rotation.x = Math.PI / 6;
    bracoGroup.add(cilindroBraco);

    // ===== ANTEBRAÇO =====
    const antebracoGroup = new THREE.Group();
    antebracoGroup.position.set(0, 4.5 * s, 0);
    bracoGroup.add(antebracoGroup);

    const antebracoGeo = new THREE.BoxGeometry(0.6 * s, 3.5 * s, 0.6 * s);
    const antebraco = new THREE.Mesh(antebracoGeo, toon(cor));
    antebraco.position.y = 1.75 * s;
    antebracoGroup.add(antebraco);

    // Cilindro hidráulico do antebraço
    const cilindroAnteGeo = new THREE.CylinderGeometry(0.1 * s, 0.1 * s, 2.8 * s, 8);
    const cilindroAnte = new THREE.Mesh(cilindroAnteGeo, toon(corMetal));
    cilindroAnte.position.set(0, 1.7 * s, -0.7 * s);
    cilindroAnte.rotation.x = -Math.PI / 8;
    antebracoGroup.add(cilindroAnte);

    // ===== CONCHA (BALDE) =====
    const conchaGroup = new THREE.Group();
    conchaGroup.position.set(0, 3.5 * s, 0);
    antebracoGroup.add(conchaGroup);

    // Corpo da concha (caçamba)
    const conchaShape = new THREE.Shape();
    conchaShape.moveTo(-0.8 * s, 0);
    conchaShape.lineTo(0.8 * s, 0);
    conchaShape.lineTo(0.6 * s, -1.5 * s);
    conchaShape.lineTo(-0.6 * s, -1.5 * s);
    conchaShape.closePath();
    const conchaExtrude = new THREE.ExtrudeGeometry(conchaShape, { depth: 1 * s, bevelEnabled: false });
    const concha = new THREE.Mesh(conchaExtrude, toon(corEscura));
    concha.position.set(-0.5 * s, -0.3 * s, -0.5 * s);
    concha.rotation.x = Math.PI / 6;
    conchaGroup.add(concha);

    // Dentes da concha
    for (let i = -2; i <= 2; i++) {
      const denteGeo = new THREE.ConeGeometry(0.08 * s, 0.3 * s, 4);
      const dente = new THREE.Mesh(denteGeo, toon("#3a3a3a"));
      dente.position.set(i * 0.4 * s, -1.5 * s, 0.5 * s);
      dente.rotation.x = -Math.PI / 2;
      conchaGroup.add(dente);
    }

    // ===== LAGARTAS (ESTEIRAS) =====
    const lagartas = new THREE.Group();
    g.add(lagartas);

    for (let lado = -1; lado <= 1; lado += 2) {
      const lagarta = new THREE.Group();

      // Corpo da esteira
      const corpoGeo = new THREE.BoxGeometry(0.6 * s, 0.8 * s, 3.5 * s);
      const corpo = new THREE.Mesh(corpoGeo, toon("#2a2a2a"));
      corpo.position.set(lado * 1.5 * s, 0.4 * s, 0);
      lagarta.add(corpo);

      // Rodas
      for (let rz = -1.2; rz <= 1.2; rz += 1.2) {
        const rodaGeo = new THREE.CylinderGeometry(0.5 * s, 0.5 * s, 0.55 * s, 12);
        const roda = new THREE.Mesh(rodaGeo, toon("#3a3a3a"));
        roda.position.set(lado * 1.5 * s, 0.5 * s, rz * s);
        roda.rotation.z = Math.PI / 2;
        lagarta.add(roda);
      }

      lagartas.add(lagarta);
    }

    // Posiciona tudo
    g.position.set(pos.x, pos.y, pos.z);

    // Registra instância
    const instancia: EscavadeiraInstance = {
      mesh: g,
      config: { tamanho, cor },
      base: base,
      braco: bracoGroup,
      antebraco: antebracoGroup,
      concha: conchaGroup,
      cabine: cabine,
      lagartas: lagartas,
      anguloBase: 0,
      anguloBraco: 0,
      anguloAntebraco: 0,
      anguloConcha: Math.PI / 6,
      faseCiclo: 0,
      progressoFase: 0,
      cicloAtivo: false,
      duracaoCiclo: config.cicloDuracao || 4, // 4 segundos por ciclo
    };

    this.escavadeiras.push(instancia);
    this.root.add(g);

    return g;
  }

  /** Inicia/para ciclo automático */
  setCiclo(escavadeira: THREE.Group, ativo: boolean, duracao?: number) {
    const inst = this.escavadeiras.find(e => e.mesh === escavadeira);
    if (!inst) return;
    inst.cicloAtivo = ativo;
    if (duracao) inst.duracaoCiclo = duracao;
    if (ativo) {
      inst.faseCiclo = 0;
      inst.progressoFase = 0;
    }
  }

  /** Define ângulo da base (graus) */
  setBaseAngulo(escavadeira: THREE.Group, graus: number) {
    const inst = this.escavadeiras.find(e => e.mesh === escavadeira);
    if (!inst) return;
    inst.anguloBase = THREE.MathUtils.degToRad(graus);
    inst.base.rotation.y = inst.anguloBase;
  }

  /** Anima para ângulo da base */
  animarBase(escavadeira: THREE.Group, grausAlvo: number, duracao: number, curva: keyof typeof curvas = "ss", inicioFrame = 0) {
    const inst = this.escavadeiras.find(e => e.mesh === escavadeira);
    if (!inst) return;

    const grausAtual = THREE.MathUtils.radToDeg(inst.anguloBase);
    const diff = (grausAlvo - grausAtual + 180) % 360 - 180; // Menor caminho
    const alvo = inst.anguloBase + THREE.MathUtils.degToRad(diff);

    escavadeira.userData.animBase = {
      inicio: inst.anguloBase,
      alvo,
      duracao,
      curva,
      inicioFrame,
      ativo: true,
    };
  }

  /** Anima braço (subir/descer) */
  animarBraco(escavadeira: THREE.Group, anguloGraus: number, duracao: number, curva: keyof typeof curvas = "ss", inicioFrame = 0) {
    const inst = this.escavadeiras.find(e => e.mesh === escavadeira);
    if (!inst) return;

    const alvo = THREE.MathUtils.degToRad(anguloGraus);
    inst.braco.userData.animBraco = {
      inicio: inst.anguloBraco,
      alvo,
      duracao,
      curva,
      inicioFrame,
      ativo: true,
    };
  }

  /** Anima antebraço */
  animarAntebraco(escavadeira: THREE.Group, anguloGraus: number, duracao: number, curva: keyof typeof curvas = "ss", inicioFrame = 0) {
    const inst = this.escavadeiras.find(e => e.mesh === escavadeira);
    if (!inst) return;

    const alvo = THREE.MathUtils.degToRad(anguloGraus);
    inst.antebraco.userData.animAntebraco = {
      inicio: inst.anguloAntebraco,
      alvo,
      duracao,
      curva,
      inicioFrame,
      ativo: true,
    };
  }

  /** Anima concha (abrir/fechar) */
  animarConcha(escavadeira: THREE.Group, anguloGraus: number, duracao: number, curva: keyof typeof curvas = "pop", inicioFrame = 0) {
    const inst = this.escavadeiras.find(e => e.mesh === escavadeira);
    if (!inst) return;

    const alvo = THREE.MathUtils.degToRad(anguloGraus);
    inst.concha.userData.animConcha = {
      inicio: inst.anguloConcha,
      alvo,
      duracao,
      curva,
      inicioFrame,
      ativo: true,
    };
  }

  update(frame: number, deltaTime: number) {
    for (const inst of this.escavadeiras) {
      // --- Animações individuais ---
      this.updateAnimPart(inst.braco, "animBraco", (v) => { inst.anguloBraco = v; inst.braco.rotation.x = v; }, frame);
      this.updateAnimPart(inst.antebraco, "animAntebraco", (v) => { inst.anguloAntebraco = v; inst.antebraco.rotation.x = v; }, frame);
      this.updateAnimPart(inst.concha, "animConcha", (v) => { inst.anguloConcha = v; inst.concha.rotation.x = v; }, frame);

      const animBase = inst.mesh.userData.animBase;
      if (animBase && animBase.ativo) {
        const f = frames(animBase.duracao);
        const ini = animBase.inicioFrame;
        const fim = ini + f;
        if (frame >= ini && frame <= fim) {
          const p = normalizar(frame, ini, fim);
          const e = curvas[animBase.curva](p);
          inst.anguloBase = THREE.MathUtils.lerp(animBase.inicio, animBase.alvo, e);
          inst.base.rotation.y = inst.anguloBase;
        } else if (frame > fim) {
          animBase.ativo = false;
          inst.anguloBase = animBase.alvo;
          inst.base.rotation.y = inst.anguloBase;
        }
      }

      // --- Ciclo automático (cavar → girar → descarregar → voltar) ---
      if (inst.cicloAtivo) {
        const faseDur = inst.duracaoCiclo / 4; // 4 fases iguais
        const frameFase = frames(faseDur);
        inst.progressoFase += deltaTime * 30;

        if (inst.progressoFase >= frameFase) {
          inst.progressoFase = 0;
          inst.faseCiclo = (inst.faseCiclo + 1) % 4;
        }

        const p = normalizar(inst.progressoFase, 0, frameFase);
        const e = curvas.ss(p);

        switch (inst.faseCiclo) {
          case 0: // CAVAR: braço desce, antebraço estende, concha fecha
            inst.anguloBraco = THREE.MathUtils.lerp(0, -Math.PI / 3, e);
            inst.anguloAntebraco = THREE.MathUtils.lerp(0, -Math.PI / 4, e);
            inst.anguloConcha = THREE.MathUtils.lerp(Math.PI / 6, Math.PI / 2, e);
            break;
          case 1: // GIRAR: base gira 90-180°, braço sobe
            inst.anguloBase += (Math.PI / 2) / frameFase * deltaTime * 30;
            inst.anguloBraco = THREE.MathUtils.lerp(-Math.PI / 3, -Math.PI / 6, e);
            inst.anguloAntebraco = THREE.MathUtils.lerp(-Math.PI / 4, 0, e);
            break;
          case 2: // DESCARREGAR: concha abre
            inst.anguloConcha = THREE.MathUtils.lerp(Math.PI / 2, -Math.PI / 6, e);
            break;
          case 3: // VOLTAR: base volta, braço desce para posição inicial
            inst.anguloBase -= (Math.PI / 2) / frameFase * deltaTime * 30;
            inst.anguloBraco = THREE.MathUtils.lerp(-Math.PI / 6, 0, e);
            inst.anguloAntebraco = THREE.MathUtils.lerp(0, 0, e);
            inst.anguloConcha = THREE.MathUtils.lerp(-Math.PI / 6, Math.PI / 6, e);
            break;
        }

        inst.braco.rotation.x = inst.anguloBraco;
        inst.antebraco.rotation.x = inst.anguloAntebraco;
        inst.concha.rotation.x = inst.anguloConcha;
        inst.base.rotation.y = inst.anguloBase;
      }

      // Animação de esteiras (visual apenas quando base gira)
      if (inst.anguloBase !== 0 || inst.cicloAtivo) {
        inst.lagartas.children.forEach(lagarta => {
          lagarta.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry) {
              child.rotation.x += 0.1 * deltaTime * 30;
            }
          });
        });
      }
    }
  }

  private updateAnimPart(obj: THREE.Object3D, key: string, apply: (v: number) => void, frame: number) {
    const anim = obj.userData[key];
    if (!anim || !anim.ativo) return;

    const f = frames(anim.duracao);
    const ini = anim.inicioFrame;
    const fim = ini + f;

    if (frame >= ini && frame <= fim) {
      const p = normalizar(frame, ini, fim);
      const e = curvas[anim.curva](p);
      const v = THREE.MathUtils.lerp(anim.inicio, anim.alvo, e);
      apply(v);
    } else if (frame > fim) {
      anim.ativo = false;
      apply(anim.alvo);
    }
  }

  dispose() {
    for (const inst of this.escavadeiras) {
      this.root.remove(inst.mesh);
      inst.mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
    this.escavadeiras = [];
  }
}

// Tipos prontos
export const criarEscavadeira = (root: THREE.Group, pos: Vetor3, tamanho = 1, cor = "#f2c94c") =>
  new EscavadeiraSistema(root).criar(pos, { tamanho, cor });

export const escavadeiraPequena = (root: THREE.Group, pos: Vetor3) =>
  criarEscavadeira(root, pos, 0.7, "#e8a838");

export const escavadeiraGrande = (root: THREE.Group, pos: Vetor3) =>
  criarEscavadeira(root, pos, 1.4, "#d4a02a");