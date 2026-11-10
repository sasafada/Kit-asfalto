// Cena3D: Componente principal da cena 3D - orquestra todos os sistemas
import React, { useEffect, useRef, useMemo } from "react";
import { useVideoConfig, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { CSS3DRenderer, CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";

// Sistemas do kit
import { MisturadorSistema, misturadorConcreto, misturadorTinta, misturadorMassa, misturadorComida } from "./misturador";
import { TanqueSistema, tanqueAgua, tanqueLeite, tanqueOleo, tanqueGrao, tanqueConcreto, criarSilo } from "./tanque";
import { MonteSistema, montePedra, monteAreia, monteTerra, monteGrao, monteAsfalto, criarMonteEsteira } from "./monte";
import { EtapaSistema, criarCasaObra, criarPredioEstrutura, criarRuaCamadas, criarCorteTerreno, criarGuindaste } from "./etapa";
import { AnimSistema, animPos, animGiro, animEscala, animAparece, animConstrui } from "./anim";
import { FluxoSistema, fluxoParticulas } from "./fluxos";
import { RastroSistema, rastroAsfalto, rastroTerra, rastroBrita, rastroConcreto } from "./rastros";
import { EscavadeiraSistema, criarEscavadeira, escavadeiraPequena, escavadeiraGrande } from "./escavadeira";
import { FabricaSistema, criarFabrica, fabricaPequena, fabricaGrande } from "./fabrica";
import { criarMundo, chao, mar, casa, predio, arvore, cidade, nuvem, estrelas, planeta, rua, cruzamento } from "./cenarios";
import { criarPersonagem, PERSONAGENS } from "./personagens";
import { camNoTempo, camOrbita, camPushIn, camKick } from "./camera";
import { frames, normalizar, curvas, criarCue } from "./tempo";
import { Legenda, LegendaKaraoke, LegendaLinhaUnica } from "./Legenda";
import type {
  Storyboard,
  Cena3DProps,
  PersonagemConfig,
  CameraKeyframe,
  FluxoConfig,
  RastroConfig,
  EtapaConfig,
  AnimConfig,
  Vetor3,
  Palavra
} from "./types";

interface Cena3DProps extends React.HTMLProps<HTMLDivElement> {
  /** Storyboard completo */
  storyboard: Storyboard;
  /** Frame atual (injetado pelo Remotion) */
  frame?: number;
  /** Callback quando cena pronta */
  onReady?: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => void;
  /** Mostrar eixos de debug */
  debug?: boolean;
  /** Qualidade de render (baixa para preview) */
  qualidade?: "baixa" | "media" | "alta";
}

export const Cena3D: React.FC<Cena3DProps> = ({
  storyboard,
  frame: frameProp,
  onReady,
  debug = false,
  qualidade = "alta",
  children,
  ...props
}) => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentFrame = frameProp ?? frame;
  const containerRef = useRef<HTMLDivElement>(null);
  const cssContainerRef = useRef<HTMLDivElement>(null);

  // Refs dos sistemas
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cssRendererRef = useRef<CSS3DRenderer>();
  const animationIdRef = useRef<number>();

  // Sistemas
  const sistemasRef = useRef({
    misturadores: new MisturadorSistema(new THREE.Group()),
    tanques: new TanqueSistema(new THREE.Group()),
    montes: new MonteSistema(new THREE.Group()),
    etapas: new EtapaSistema(new THREE.Group()),
    animacoes: new AnimSistema(new THREE.Group()),
    fluxos: new FluxoSistema(new THREE.Group()),
    rastros: new RastroSistema(new THREE.Group()),
    escavadeiras: new EscavadeiraSistema(new THREE.Group()),
    fabricas: new FabricaSistema(new THREE.Group()),
  });

  const gruposRef = useRef({
    mundo: new THREE.Group(),
    misturadores: sistemasRef.current.misturadores["root"],
    tanques: sistemasRef.current.tanques["root"],
    montes: sistemasRef.current.montes["root"],
    etapas: sistemasRef.current.etapas["root"],
    animacoes: sistemasRef.current.animacoes["root"],
    fluxos: sistemasRef.current.fluxos["root"],
    rastros: sistemasRef.current.rastros["root"],
    escavadeiras: sistemasRef.current.escavadeiras["root"],
    fabricas: sistemasRef.current.fabricas["root"],
    personagens: new THREE.Group(),
    cssObjects: new THREE.Group(),
  });

  // Inicialização - roda uma vez
  useEffect(() => {
    if (!containerRef.current) return;

    // Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(storyboard.config?.corCeu || "#87ceeb");
    scene.fog = new THREE.Fog(storyboard.config?.corCeu || "#87ceeb", 50, 200);
    sceneRef.current = scene;

    // Câmera
    const camera = new THREE.PerspectiveCamera(
      storyboard.config?.fov || 45,
      width / height,
      0.1,
      1000
    );
    cameraRef.current = camera;

    // Renderer WebGL
    const renderer = new THREE.WebGLRenderer({
      antialias: qualidade !== "baixa",
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(qualidade === "alta" ? 2 : qualidade === "media" ? 1.5 : 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    rendererRef.current = renderer;

    // CSS3D Renderer para legendas/HTML
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(width, height);
    cssRenderer.domElement.style.position = "absolute";
    cssRenderer.domElement.style.top = "0";
    cssRenderer.domElement.style.pointerEvents = "none";
    cssRendererRef.current = cssRenderer;

    // Container para CSS3D
    if (cssContainerRef.current) {
      cssContainerRef.current.appendChild(cssRenderer.domElement);
    }

    // Adiciona canvas ao container
    containerRef.current.appendChild(renderer.domElement);

    // Grupos principais
    const { mundo, misturadores, tanques, montes, etapas, animacoes, fluxos, rastros, escavadeiras, fabricas, personagens, cssObjects } = gruposRef.current;
    scene.add(mundo);
    scene.add(misturadores);
    scene.add(tanques);
    scene.add(montes);
    scene.add(etapas);
    scene.add(animacoes);
    scene.add(fluxos);
    scene.add(rastros);
    scene.add(escavadeiras);
    scene.add(fabricas);
    scene.add(personagens);
    scene.add(cssObjects);

    // Sistemas recebem os grupos
    sistemasRef.current.misturadores = new MisturadorSistema(misturadores);
    sistemasRef.current.tanques = new TanqueSistema(tanques);
    sistemasRef.current.montes = new MonteSistema(montes);
    sistemasRef.current.etapas = new EtapaSistema(etapas);
    sistemasRef.current.animacoes = new AnimSistema(animacoes);
    sistemasRef.current.fluxos = new FluxoSistema(fluxos);
    sistemasRef.current.rastros = new RastroSistema(rastros);
    sistemasRef.current.escavadeiras = new EscavadeiraSistema(escavadeiras);
    sistemasRef.current.fabricas = new FabricaSistema(fabricas);

    // --- CONSTRÓI MUNDO BASE ---
    if (storyboard.mundo) {
      const mundoObj = criarMundo(mundo, storyboard.mundo);
      sistemasRef.current.animacoes.registrar("mundo", mundoObj);
    }

    // --- CRIA ASSETS DO STORYBOARD ---
    if (storyboard.assets) {
      storyboard.assets.forEach(asset => {
        criarAsset(asset, sistemasRef.current, gruposRef.current);
      });
    }

    // --- REGISTRA OBJETOS PARA ANIMAÇÃO ---
    if (storyboard.registros) {
      storyboard.registros.forEach(reg => {
        const obj = encontrarObjeto(reg.id, gruposRef.current);
        if (obj) {
          sistemasRef.current.animacoes.registrar(reg.id, obj);
          sistemasRef.current.etapas.registrar(reg.id, obj);
        }
      });
    }

    // --- ANIMAÇÕES ---
    if (storyboard.animacoes) {
      storyboard.animacoes.forEach(anim => {
        sistemasRef.current.animacoes.adicionar(anim);
      });
    }

    // --- ETAPAS ---
    if (storyboard.etapas) {
      storyboard.etapas.forEach(etapa => {
        sistemasRef.current.etapas.adicionar(etapa);
      });
    }

    // --- FLUXOS ---
    if (storyboard.fluxos) {
      storyboard.fluxos.forEach(fluxo => {
        sistemasRef.current.fluxos.adicionar(fluxo);
      });
    }

    // --- RASTROS ---
    if (storyboard.rastros) {
      storyboard.rastros.forEach(rastro => {
        sistemasRef.current.rastros.adicionar(rastro);
      });
    }

    // --- PERSONAGENS ---
    if (storyboard.personagens) {
      storyboard.personagens.forEach(p => {
        const perso = criarPersonagem(personagens, p);
        if (p.id) {
          sistemasRef.current.animacoes.registrar(p.id, perso);
        }
      });
    }

    // --- CÂMERA INICIAL ---
    if (storyboard.camera?.inicial) {
      const cam = storyboard.camera.inicial;
      camera.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
      if (cam.alvo) {
        camera.lookAt(cam.alvo[0], cam.alvo[1], cam.alvo[2]);
      }
    }

    // Luzes
    setupLuzes(scene, storyboard.config?.iluminacao);

    // Callback
    if (onReady) onReady(scene, camera, renderer);

    // Cleanup
    return () => {
      renderer.dispose();
      cssRenderer.domElement.remove();
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      Object.values(sistemasRef.current).forEach(sys => {
        if (sys.dispose) sys.dispose();
      });
    };
  }, [width, height, fps, storyboard, qualidade]);

  // Update por frame (Remotion chama isso a cada frame)
  const deltaTime = 1 / fps;

  // Update sistemas
  Object.values(sistemasRef.current).forEach(sys => {
    if (sys.update) sys.update(currentFrame, deltaTime);
  });

  // Camera keyframes
  if (storyboard.camera?.keyframes) {
    const camState = camNoTempo(currentFrame, storyboard.camera.keyframes, fps);
    if (camState && cameraRef.current) {
      cameraRef.current.position.lerp(camState.pos, 1);
      cameraRef.current.lookAt(camState.lookAt);
      if (camState.fov) cameraRef.current.fov = camState.fov;
      cameraRef.current.updateProjectionMatrix();
    }
  }

  // Render
  if (rendererRef.current && cameraRef.current && sceneRef.current && cssRendererRef.current) {
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    cssRendererRef.current.render(sceneRef.current, cameraRef.current);
  }

  // Renderiza legendas CSS3D - TODO: reativar depois
  // const legendasJSX = useMemo(() => {
  //   if (!storyboard.legendas) return null;
  //   return storyboard.legendas.map((leg, i) => (
  //     <CSS3DObject key={i} position={leg.pos || [0, -3, 0]}>
  //       {leg.tipo === "karaoke" ? (
  //         <LegendaKaraoke palavras={leg.palavras} {...leg.props} />
  //       ) : leg.tipo === "linha" ? (
  //         <LegendaLinhaUnica texto={leg.texto} inicio={leg.inicio} fim={leg.fim} {...leg.props} />
  //       ) : (
  //         <Legenda palavras={leg.palavras} {...leg.props} />
  //       )}
  //     </CSS3DObject>
  //   ));
  // }, [storyboard.legendas]);

  return (
    <div ref={containerRef} style={{ width, height, position: "relative", ...props.style }} {...props}>
      {children}
    </div>
  );
};

// --- HELPERS ---

function criarAsset(asset: any, sistemas: any, grupos: any) {
  const { tipo, id, pos, config } = asset;
  const p = pos ? new THREE.Vector3(pos[0], pos[1], pos[2]) : new THREE.Vector3();

  switch (tipo) {
    case "misturador":
      sistemas.misturadores.criar(p, config);
      break;
    case "tanque":
      if (config?.tipo === "silo") criarSilo(grupos.tanques, p, config.raio, config.altura, config.nivel);
      else sistemas.tanques.criar(p, config);
      break;
    case "monte":
      sistemas.montes.criar(p, config);
      break;
    case "casa_obra":
      const casa = criarCasaObra(grupos.etapas, p, config?.progress || 1);
      if (id) grupos.etapas.userData[id] = casa;
      break;
    case "predio_estrutura":
      const predio = criarPredioEstrutura(grupos.etapas, p, config?.andares, config?.progress || 1);
      if (id) grupos.etapas.userData[id] = predio;
      break;
    case "rua_camadas":
      const rua = criarRuaCamadas(grupos.etapas, p, config?.progress || 1);
      if (id) grupos.etapas.userData[id] = rua;
      break;
    case "corte_terreno":
      const corte = criarCorteTerreno(grupos.etapas, p, config?.progress || 1);
      if (id) grupos.etapas.userData[id] = corte;
      break;
    case "guindaste":
      const grua = criarGuindaste(grupos.etapas, p, config?.altura, config?.lança);
      if (id) grupos.etapas.userData[id] = grua;
      break;
    case "escavadeira":
      sistemas.escavadeiras.criar(p, config);
      break;
    case "fabrica":
      sistemas.fabricas.criar(p, config);
      break;
    case "mundo":
      criarMundo(grupos.mundo, config);
      break;
    case "chao":
      chao(grupos.mundo, config);
      break;
    case "mar":
      mar(grupos.mundo, config);
      break;
    case "casa":
      casa(grupos.mundo, p, config);
      break;
    case "predio":
      predio(grupos.mundo, p, config);
      break;
    case "arvore":
      arvore(grupos.mundo, p, config);
      break;
    case "cidade":
      cidade(grupos.mundo, config);
      break;
    case "nuvem":
      nuvem(grupos.mundo, p, config);
      break;
    case "estrela":
      estrelas(grupos.mundo, config);
      break;
    case "planeta":
      planeta(grupos.mundo, p, config);
      break;
    case "rua":
      rua(grupos.mundo, p, config);
      break;
    case "cruzamento":
      cruzamento(grupos.mundo, p, config);
      break;
  }
}

function encontrarObjeto(id: string, grupos: any): THREE.Object3D | null {
  for (const grupo of Object.values(grupos)) {
    if (grupo instanceof THREE.Group) {
      const found = grupo.getObjectByName(id);
      if (found) return found;
      if (grupo.userData?.[id]) return grupo.userData[id];
    }
  }
  return null;
}

function setupLuzes(scene: THREE.Scene, iluminacao?: any) {
  const cfg = iluminacao || { tipo: "dia" };

  // Luz ambiente
  const ambient = new THREE.AmbientLight(0xffffff, cfg.ambientIntensity || 0.5);
  scene.add(ambient);

  // Sol / Direcional principal
  const sun = new THREE.DirectionalLight(0xfff5e6, cfg.sunIntensity || 1.2);
  sun.position.set(50, 100, 50);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  // Luz de preenchimento (fill)
  const fill = new THREE.DirectionalLight(0x88aaff, cfg.fillIntensity || 0.3);
  fill.position.set(-30, 50, -30);
  scene.add(fill);

  // Luz de chão (bounce)
  const bounce = new THREE.HemisphereLight(0xffffff, 0x443322, cfg.bounceIntensity || 0.2);
  scene.add(bounce);

  // Transições de iluminação baseadas no storyboard
  if (cfg.transicoes) {
    // Será animado via sistema de animações
    scene.userData.luzTransicoes = cfg.transicoes;
  }
}

export default Cena3D;