// Fábrica: linha de processo com silos, esteira, tambor aquecido, chaminé
import * as THREE from "three";
import { frames, normalizar, curvas } from "./tempo";
import { toon, flat } from "./paint";
import { fluxoParticulas } from "./fluxos";
import { criarSilo } from "./tanque";
import type { Vetor3 } from "./types";

interface FabricaInstance {
  mesh: THREE.Group;
  config: { tamanho: number };
  // Partes
  silos: THREE.Group[];
  esteira: THREE.Group;
  tambor: THREE.Group;
  chamine: THREE.Mesh;
  // Sistemas
  fluxoEntrada: any;
  fluxoSaida: any;
  particulasEsteira: THREE.Mesh[];
  // Estado
  ativo: boolean;
  anguloTambor: number;
  progressoEsteira: number;
}

export class FabricaSistema {
  private fabricas: FabricaInstance[] = [];
  private root: THREE.Group;

  constructor(root: THREE.Group) {
    this.root = root;
  }

  criar(pos: Vetor3, config: { tamanho?: number } = {}): THREE.Group {
    const tamanho = config.tamanho || 1;
    const s = tamanho;
    const corPredio = "#b8bcc0";
    const corTelha = "#8a5a3a";
    const corMetal = "#5a5a5a";
    const corChamine = "#c8553d";

    const g = new THREE.Group();

    // ===== BASE / CHÃO DA FÁBRICA =====
    const chaoGeo = new THREE.BoxGeometry(25 * s, 0.3 * s, 18 * s);
    const chao = new THREE.Mesh(chaoGeo, toon("#6a6a6a"));
    chao.position.y = 0.15 * s;
    g.add(chao);

    // ===== GALPÃO PRINCIPAL =====
    const galpaoGeo = new THREE.BoxGeometry(20 * s, 10 * s, 14 * s);
    const galpao = new THREE.Mesh(galpaoGeo, toon(corPredio));
    galpao.position.set(0, 5 * s, 0);
    g.add(galpao);

    // Telhado (duas águas)
    const telhadoGeo = new THREE.BoxGeometry(22 * s, 2 * s, 16 * s);
    const telhado = new THREE.Mesh(telhadoGeo, toon(corTelha));
    telhado.position.set(0, 11 * s, 0);
    g.add(telhado);

    // Cumeeira
    const cumeeiraGeo = new THREE.BoxGeometry(22 * s, 0.5 * s, 0.8 * s);
    const cumeeira = new THREE.Mesh(cumeeiraGeo, toon("#6a4a2a"));
    cumeeira.position.set(0, 12 * s, 0);
    g.add(cumeeira);

    // ===== SILOS (3 silos de alimentação) =====
    const silos: THREE.Group[] = [];
    const siloPosicoes = [
      { x: -9 * s, z: 8 * s },
      { x: -9 * s, z: 0 },
      { x: -9 * s, z: -8 * s },
    ];
    const siloCores = ["#d4a84a", "#e8c85a", "#f2d13a"]; // grão, areia, pedra

    siloPosicoes.forEach((pos, i) => {
      const silo = criarSilo(g, { x: pos.x, y: 0, z: pos.z }, 1.5 * s, 14 * s, 0.8);
      // Recolore o conteúdo
      silo.traverse(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.color.set(siloCores[i]);
        }
      });
      silos.push(silo);
    });

    // Tubos de descida dos silos para a esteira
    siloPosicoes.forEach((pos, i) => {
      const tuboGeo = new THREE.CylinderGeometry(0.25 * s, 0.25 * s, 6 * s, 12);
      const tubo = new THREE.Mesh(tuboGeo, toon(corMetal));
      tubo.position.set(pos.x, 3 * s, pos.z + 4 * s);
      tubo.rotation.x = -Math.PI / 2;
      g.add(tubo);

      // Curva do tubo
      const curvaGeo = new THREE.TorusGeometry(0.8 * s, 0.25 * s, 8, 16, Math.PI / 2);
      const curva = new THREE.Mesh(curvaGeo, toon(corMetal));
      curva.position.set(pos.x + 3 * s, 3 * s, pos.z + 4 * s);
      curva.rotation.z = -Math.PI / 2;
      g.add(curva);
    });

    // ===== ESTEIRA TRANSPORTADORA =====
    const esteira = new THREE.Group();
    esteira.position.set(-6 * s, 1 * s, 0);
    g.add(esteira);

    // Estrutura da esteira
    const estruturaGeo = new THREE.BoxGeometry(16 * s, 0.4 * s, 1.2 * s);
    const estrutura = new THREE.Mesh(estruturaGeo, toon("#4a4a4a"));
    estrutura.position.set(8 * s, 0.2 * s, 0);
    esteira.add(estrutura);

    // Correia (parte superior)
    const correiaGeo = new THREE.BoxGeometry(15.5 * s, 0.1 * s, 1 * s);
    const correiaMat = toon("#2a2a2a");
    const correia = new THREE.Mesh(correiaGeo, correiaMat);
    correia.position.set(8 * s, 0.45 * s, 0);
    esteira.add(correia);

    // Rolos
    for (let i = 0; i <= 4; i++) {
      const roloGeo = new THREE.CylinderGeometry(0.15 * s, 0.15 * s, 1.3 * s, 12);
      const rolo = new THREE.Mesh(roloGeo, toon("#3a3a3a"));
      rolo.position.set(-6.5 * s + i * 4 * s, 0.15 * s, 0);
      rolo.rotation.z = Math.PI / 2;
      esteira.add(rolo);
    }

    // Partículas na esteira (materiais sendo transportados)
    const particulasEsteira: THREE.Mesh[] = [];
    const numParticulas = 12;
    for (let i = 0; i < numParticulas; i++) {
      const pGeo = new THREE.BoxGeometry(0.6 * s, 0.3 * s, 0.8 * s);
      const cor = siloCores[i % 3];
      const pMat = toon(cor);
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(-5.5 * s + i * 1.3 * s, 0.6 * s, (Math.random() - 0.5) * 0.6 * s);
      esteira.add(p);
      particulasEsteira.push(p);
    }

    // ===== TAMBOR AQUECIDO (SECADOR/MISTURADOR) =====
    const tambor = new THREE.Group();
    tambor.position.set(4 * s, 3.5 * s, 0);
    g.add(tambor);

    // Corpo do tambor
    const tamborGeo = new THREE.CylinderGeometry(2 * s, 2 * s, 6 * s, 24);
    const tamborMat = toon("#8a5a3a"); // Vermelho tijolo = aquecido
    const tamborMesh = new THREE.Mesh(tamborGeo, tamborMat);
    tambor.add(tamborMesh);

    // Anéis de reforço
    for (let y = -2.5; y <= 2.5; y += 1.2) {
      const anelGeo = new THREE.TorusGeometry(2.1 * s, 0.08 * s, 8, 32);
      const anel = new THREE.Mesh(anelGeo, toon("#3a3a3a"));
      anel.position.y = y * s;
      anel.rotation.x = -Math.PI / 2;
      tambor.add(anel);
    }

    // Entrada do tambor (esteira despeja aqui)
    const entradaGeo = new THREE.CylinderGeometry(0.5 * s, 0.5 * s, 3 * s, 12);
    const entrada = new THREE.Mesh(entradaGeo, toon(corMetal));
    entrada.position.set(-3.5 * s, 3.5 * s, 0);
    entrada.rotation.z = -Math.PI / 2;
    g.add(entrada);

    // Saída do tambor (para chaminé ou silo produto)
    const saidaGeo = new THREE.CylinderGeometry(0.4 * s, 0.4 * s, 2 * s, 12);
    const saida = new THREE.Mesh(saidaGeo, toon(corMetal));
    saida.position.set(6.5 * s, 4.5 * s, 0);
    saida.rotation.z = Math.PI / 2;
    g.add(saida);

    // Chama/brilho do queimador (base do tambor)
    const queimadorGeo = new THREE.CylinderGeometry(0.8 * s, 0.8 * s, 0.5 * s, 12);
    const queimador = new THREE.Mesh(queimadorGeo, flat("#ff6600", { transparent: true, opacity: 0.7 }));
    queimador.position.set(4 * s, 0.25 * s, 0);
    queimador.layers.set(1); // NOINK
    g.add(queimador);

    // ===== CHAMINÉ =====
    const chamineGeo = new THREE.CylinderGeometry(0.6 * s, 0.8 * s, 14 * s, 16);
    const chamine = new THREE.Mesh(chamineGeo, toon(corChamine));
    chamine.position.set(8 * s, 18 * s, -4 * s);
    g.add(chamine);

    // Topo da chaminé
    const chamineTopoGeo = new THREE.CylinderGeometry(0.8 * s, 0.9 * s, 0.5 * s, 16);
    const chamineTopo = new THREE.Mesh(chamineTopoGeo, toon("#3a3a3a"));
    chamineTopo.position.set(8 * s, 25.25 * s, -4 * s);
    g.add(chamineTopo);

    // ===== ESCRITÓRIO / CONTROLE =====
    const escritorioGeo = new THREE.BoxGeometry(6 * s, 4 * s, 4 * s);
    const escritorio = new THREE.Mesh(escritorioGeo, toon("#c8cdd8"));
    escritorio.position.set(-12 * s, 2 * s, -7 * s);
    g.add(escritorio);

    const escritorioTelhadoGeo = new THREE.BoxGeometry(7 * s, 0.5 * s, 5 * s);
    const escritorioTelhado = new THREE.Mesh(escritorioTelhadoGeo, toon(corTelha));
    escritorioTelhado.position.set(-12 * s, 4.25 * s, -7 * s);
    g.add(escritorioTelhado);

    // Janelas escritório
    const janelaGeo = new THREE.PlaneGeometry(1.5 * s, 1.2 * s);
    const janelaMat = new THREE.MeshBasicMaterial({ color: "#6ab0f3", transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    for (let wx = -1; wx <= 1; wx++) {
      const j = new THREE.Mesh(janelaGeo, janelaMat);
      j.position.set(-12 * s + wx * 1.8 * s, 2 * s, -9 * s);
      g.add(j);
    }

    // ===== SISTEMA DE PARTÍCULAS (fumaça da chaminé, poeira) =====
    // Será inicializado no update

    // Posiciona tudo
    g.position.set(pos.x, pos.y, pos.z);

    // Registra instância
    const instancia: FabricaInstance = {
      mesh: g,
      config: { tamanho },
      silos,
      esteira,
      tambor,
      chamine,
      fluxoEntrada: null,
      fluxoSaida: null,
      particulasEsteira,
      ativo: false,
      anguloTambor: 0,
      progressoEsteira: 0,
    };

    this.fabricas.push(instancia);
    this.root.add(g);

    return g;
  }

  /** Liga/desliga a fábrica */
  setAtiva(fabrica: THREE.Group, ativa: boolean) {
    const inst = this.fabricas.find(f => f.mesh === fabrica);
    if (!inst) return;
    inst.ativo = ativa;
  }

  /** Define velocidade da esteira e tambor */
  setVelocidade(fabrica: THREE.Group, velocidade: number) {
    const inst = this.fabricas.find(f => f.mesh === fabrica);
    if (!inst) return;
    inst.mesh.userData.velocidade = velocidade;
  }

  update(frame: number, deltaTime: number) {
    for (const inst of this.fabricas) {
      if (!inst.ativo) continue;

      const vel = inst.mesh.userData.velocidade || 1;

      // --- Tambor gira ---
      inst.anguloTambor += 0.03 * vel * deltaTime * 30;
      inst.tambor.rotation.y = inst.anguloTambor;

      // Brilho do queimador pulsa
      const queimador = inst.mesh.children.find(c => c instanceof THREE.Mesh && c.layers.test(1));
      if (queimador && queimador.material instanceof THREE.Material) {
        const mat = queimador.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.5 + Math.sin(frame * 0.3) * 0.2;
      }

      // --- Esteira move partículas ---
      inst.progressoEsteira += 0.008 * vel * deltaTime * 30;
      const esteiraComprimento = 15.5 * inst.config.tamanho;
      const inicioEsteira = -5.5 * inst.config.tamanho;

      inst.particulasEsteira.forEach((p, i) => {
        let x = p.position.x + 0.08 * vel * deltaTime * 30;
        if (x > inicioEsteira + esteiraComprimento) {
          x = inicioEsteira - (i * 1.3 * inst.config.tamanho);
          // Muda cor (simula mistura)
          if (p.material instanceof THREE.MeshToonMaterial) {
            const cores = ["#d4a84a", "#e8c85a", "#f2d13a", "#9a8f7a"]; // última = misturado
            p.material.color.set(cores[Math.floor(Math.random() * cores.length)]);
          }
        }
        p.position.x = x;
      });

      // --- Fumaça da chaminé (partículas simples) ---
      if (frame % 3 === 0 && Math.random() < 0.7) {
        this.emitirFumaca(inst);
      }

      // --- Poeira nos silos (quando descarregando) ---
      if (frame % 10 === 0) {
        inst.silos.forEach((silo, i) => {
          if (Math.random() < 0.3) {
            this.emitirPoeiraSilo(silo, i);
          }
        });
      }
    }
  }

  private emitirFumaca(inst: FabricaInstance) {
    const pos = new THREE.Vector3();
    inst.chamine.getWorldPosition(pos);
    pos.y += 2;

    const geo = new THREE.SphereGeometry(0.3 * inst.config.tamanho, 8, 8);
    const mat = flat("#aaaaaa", { transparent: true, opacity: 0.4 });
    const part = new THREE.Mesh(geo, mat);
    part.position.copy(pos);
    part.userData = { vida: 60, vy: 0.1 };
    part.layers.set(1); // NOINK
    inst.mesh.add(part);

    // Anima e remove depois
    const animar = () => {
      part.position.y += part.userData.vy;
      part.userData.vy += 0.002;
      part.scale.multiplyScalar(1.02);
      if (part.material instanceof THREE.Material) {
        part.material.opacity *= 0.97;
      }
      part.userData.vida--;
      if (part.userData.vida > 0) {
        requestAnimationFrame(animar);
      } else {
        inst.mesh.remove(part);
        part.geometry.dispose();
        (part.material as THREE.Material).dispose();
      }
    };
    animar();
  }

  private emitirPoeiraSilo(silo: THREE.Group, indice: number) {
    const pos = new THREE.Vector3();
    silo.getWorldPosition(pos);
    pos.y += 10;

    const cores = ["#d4a84a", "#e8c85a", "#f2d13a"];
    const geo = new THREE.SphereGeometry(0.15, 6, 6);
    const mat = flat(cores[indice], { transparent: true, opacity: 0.6 });
    const part = new THREE.Mesh(geo, mat);
    part.position.copy(pos);
    part.userData = { vida: 30, vx: (Math.random() - 0.5) * 0.1, vz: (Math.random() - 0.5) * 0.1, vy: -0.05 };
    part.layers.set(1);
    silo.add(part);

    const animar = () => {
      part.position.x += part.userData.vx;
      part.position.y += part.userData.vy;
      part.position.z += part.userData.vz;
      part.userData.vy -= 0.002;
      if (part.material instanceof THREE.Material) {
        part.material.opacity *= 0.93;
      }
      part.userData.vida--;
      if (part.userData.vida > 0) {
        requestAnimationFrame(animar);
      } else {
        silo.remove(part);
        part.geometry.dispose();
        (part.material as THREE.Material).dispose();
      }
    };
    animar();
  }

  dispose() {
    for (const inst of this.fabricas) {
      this.root.remove(inst.mesh);
      inst.mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
    this.fabricas = [];
  }
}

// Tipos prontos
export const criarFabrica = (root: THREE.Group, pos: Vetor3, tamanho = 1) =>
  new FabricaSistema(root).criar(pos, { tamanho });

export const fabricaPequena = (root: THREE.Group, pos: Vetor3) =>
  criarFabrica(root, pos, 0.7);

export const fabricaGrande = (root: THREE.Group, pos: Vetor3) =>
  criarFabrica(root, pos, 1.5);