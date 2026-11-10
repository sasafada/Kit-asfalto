import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Importar sistemas do kit (versão simplificada para preview)
import {
  criarMundo, chao, mar, casa, predio, arvore, cidade, nuvem, estrelas, planeta, rua, cruzamento,
  misturadorConcreto, misturadorTinta, misturadorMassa, misturadorComida,
  tanqueAgua, tanqueLeite, tanqueOleo, tanqueGrao, tanqueConcreto, criarSilo,
  montePedra, monteAreia, monteTerra, monteGrao, monteAsfalto,
  criarCasaObra, criarPredioEstrutura, criarRuaCamadas, criarCorteTerreno, criarGuindaste,
  criarEscavadeira, escavadeiraPequena, escavadeiraGrande,
  criarFabrica, fabricaPequena, fabricaGrande,
  fluxoParticulas,
  rastroAsfalto, rastroTerra, rastroBrita, rastroConcreto,
  PERSONAGENS, criarPersonagem,
} from '@kit';

import { toon, flat } from '@kit/paint';
import { frames, curvas } from '@kit/tempo';

// ===== TIPOS DE ASSETS PARA O CATÁLOGO =====
const ASSET_CATEGORIES = [
  {
    name: 'Mundo & Cenários',
    items: [
      { id: 'chao', label: 'Chão', params: { tamanho: 50, textura: 'grama' } },
      { id: 'mar', label: 'Mar/Oceano', params: { tamanho: 100, ondas: true } },
      { id: 'casa', label: 'Casa Simples', params: { tipo: 'simples', tamanho: 1.5, cor: '#c8a888' } },
      { id: 'predio', label: 'Prédio', params: { andares: 6, largura: 12, cor: '#b8bcc0' } },
      { id: 'arvore_pinho', label: 'Pinheiro', params: { tipo: 'pinheiro', tamanho: 2 } },
      { id: 'arvore_frondosa', label: 'Frondosa', params: { tipo: 'frondosa', tamanho: 1.5 } },
      { id: 'arvore_palmeira', label: 'Palmeira', params: { tipo: 'palmeira', tamanho: 2 } },
      { id: 'cidade', label: 'Cidade Procedural', params: { quadras: 5, densidade: 0.7 } },
      { id: 'nuvem', label: 'Nuvem', params: { tamanho: 5, altura: 20, velocidade: 0.2 } },
      { id: 'estrelas', label: 'Campo de Estrelas', params: { quantidade: 1000, raio: 100 } },
      { id: 'planeta_terra', label: 'Planeta Terra', params: { raio: 10, tipo: 'terra' } },
      { id: 'rua', label: 'Rua', params: { comprimento: 30, largura: 8, faixas: 2 } },
      { id: 'cruzamento', label: 'Cruzamento', params: { tamanho: 16, tipo: '4vias' } },
    ],
  },
  {
    name: 'Process Animation (kit-video-3d)',
    items: [
      { id: 'misturador_concreto', label: 'Misturador Concreto', params: { raio: 1.4, conteudo: 'concreto', velocidade: 90 } },
      { id: 'misturador_tinta', label: 'Misturador Tinta', params: { raio: 1.4, conteudo: 'tinta', velocidade: 120 } },
      { id: 'misturador_massa', label: 'Misturador Massa', params: { raio: 1.4, conteudo: 'massa', velocidade: 60 } },
      { id: 'tanque_agua', label: 'Tanque Água', params: { raio: 1.2, altura: 3, nivel: 0.7 } },
      { id: 'tanque_leite', label: 'Tanque Leite', params: { raio: 1.2, altura: 3, nivel: 0.6 } },
      { id: 'tanque_oleo', label: 'Tanque Óleo', params: { raio: 1.2, altura: 3, nivel: 0.5 } },
      { id: 'tanque_grao', label: 'Tanque Grão', params: { raio: 1.2, altura: 3, nivel: 0.8 } },
      { id: 'tanque_concreto', label: 'Tanque Concreto', params: { raio: 1.4, altura: 4, nivel: 0.5 } },
      { id: 'silo', label: 'Silo (Grãos)', params: { raio: 1.5, altura: 10, nivel: 0.7 } },
      { id: 'monte_pedra', label: 'Monte Pedra', params: { raio: 1.6, progress: 1 } },
      { id: 'monte_areia', label: 'Monte Areia', params: { raio: 1.6, progress: 1 } },
      { id: 'monte_terra', label: 'Monte Terra', params: { raio: 1.6, progress: 1 } },
      { id: 'monte_grao', label: 'Monte Grão', params: { raio: 1.6, progress: 1 } },
      { id: 'monte_asfalto', label: 'Monte Asfalto', params: { raio: 1.6, progress: 1 } },
      { id: 'casa_obra', label: 'Casa em Obra', params: { progress: 0.5 } },
      { id: 'predio_estrutura', label: 'Prédio Estrutura', params: { andares: 8, progress: 0.6 } },
      { id: 'rua_camadas', label: 'Rua Camadas', params: { progress: 0.4 } },
      { id: 'corte_terreno', label: 'Corte Terreno', params: { progress: 0.7 } },
      { id: 'guindaste', label: 'Guindaste', params: { altura: 22, lança: 16 } },
    ],
  },
  {
    name: 'Máquinas & Fábrica',
    items: [
      { id: 'escavadeira', label: 'Escavadeira', params: { tamanho: 1, cor: '#f2c94c' } },
      { id: 'escavadeira_pequena', label: 'Escavadeira Pequena', params: { tamanho: 0.7 } },
      { id: 'escavadeira_grande', label: 'Escavadeira Grande', params: { tamanho: 1.4 } },
      { id: 'fabrica', label: 'Fábrica Completa', params: { tamanho: 1 } },
      { id: 'fabrica_pequena', label: 'Fábrica Pequena', params: { tamanho: 0.7 } },
      { id: 'fabrica_grande', label: 'Fábrica Grande', params: { tamanho: 1.5 } },
    ],
  },
  {
    name: 'Personagens (19 presets)',
    items: Object.entries(PERSONAGENS).map(([key, value]) => ({
      id: `personagem_${key}`,
      label: value.nome || key,
      params: { tipo: key, clip: 'idle' },
    })),
  },
];

// ===== COMPONENTE PRINCIPAL =====
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [assetParams, setAssetParams] = useState<Record<string, any>>({});
  const [cameraPos, setCameraPos] = useState([0, 10, 20]);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [category, setCategory] = useState(0);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();
  const assetGroupRef = useRef<THREE.Group>();
  const animationIdRef = useRef<number>();

  // Inicializa Three.js
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 30, 150);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 500);
    camera.position.set(...cameraPos);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 2, 0);
    controlsRef.current = controls;

    // Luzes
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e6, 1.2);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x88aaff, 0.3);
    fill.position.set(-30, 50, -30);
    scene.add(fill);

    // Chão base
    const ground = chao(scene, { tamanho: 200, textura: 'terra' });
    ground.receiveShadow = true;

    // Grupo para assets de preview
    const assetGroup = new THREE.Group();
    assetGroupRef.current = assetGroup;
    scene.add(assetGroup);

    // Grid helper
    const grid = new THREE.GridHelper(200, 50, 0x444466, 0x222244);
    grid.visible = showGrid;
    scene.add(grid);

    // Axes helper
    const axes = new THREE.AxesHelper(10);
    axes.visible = showAxes;
    scene.add(axes);

    // Loop de animação
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (playing) {
        setTime(t => t + 1/60);
      }

      controls.update();

      // Anima assets no grupo
      assetGroup.children.forEach(child => {
        if (child.userData.update) {
          child.userData.update(time);
        }
        // Rotação contínua para misturadores, escavadeiras, etc.
        if (child.userData.tipo === 'misturador') {
          child.children.forEach(c => {
            if (c.userData.isPa) c.rotation.y += 0.02;
          });
        }
        if (child.userData.tipo === 'escavadeira' && child.userData.cicloAtivo) {
          // Animação simples de ciclo
          child.userData.fase = (child.userData.fase || 0) + 0.01;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!canvasRef.current) return;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [cameraPos, showGrid, showAxes]);

  // Cria asset selecionado
  useEffect(() => {
    if (!sceneRef.current || !assetGroupRef.current || !selectedAsset) return;

    const group = assetGroupRef.current;
    // Limpa assets anteriores
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      child.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    const params = assetParams[selectedAsset] || {};
    const pos = new THREE.Vector3(0, 0, 0);

    try {
      let asset: THREE.Group | THREE.Mesh | null = null;

      // MUNDO & CENÁRIOS
      if (selectedAsset === 'chao') asset = chao(group, params);
      else if (selectedAsset === 'mar') asset = mar(group, params);
      else if (selectedAsset === 'casa') asset = casa(group, pos, params);
      else if (selectedAsset === 'predio') asset = predio(group, pos, params);
      else if (selectedAsset === 'arvore_pinho') asset = arvore(group, pos, { ...params, tipo: 'pinheiro' });
      else if (selectedAsset === 'arvore_frondosa') asset = arvore(group, pos, { ...params, tipo: 'frondosa' });
      else if (selectedAsset === 'arvore_palmeira') asset = arvore(group, pos, { ...params, tipo: 'palmeira' });
      else if (selectedAsset === 'cidade') asset = cidade(group, params);
      else if (selectedAsset === 'nuvem') asset = nuvem(group, pos, params);
      else if (selectedAsset === 'estrelas') asset = estrelas(group, params);
      else if (selectedAsset === 'planeta_terra') asset = planeta(group, pos, params);
      else if (selectedAsset === 'rua') asset = rua(group, pos, params);
      else if (selectedAsset === 'cruzamento') asset = cruzamento(group, pos, params);

      // PROCESS ANIMATION
      else if (selectedAsset === 'misturador_concreto') asset = misturadorConcreto(group, pos, params.raio);
      else if (selectedAsset === 'misturador_tinta') asset = misturadorTinta(group, pos, params.raio);
      else if (selectedAsset === 'misturador_massa') asset = misturadorMassa(group, pos, params.raio);
      else if (selectedAsset === 'tanque_agua') asset = tanqueAgua(group, pos, params.raio, params.altura, params.nivel);
      else if (selectedAsset === 'tanque_leite') asset = tanqueLeite(group, pos, params.raio, params.altura, params.nivel);
      else if (selectedAsset === 'tanque_oleo') asset = tanqueOleo(group, pos, params.raio, params.altura, params.nivel);
      else if (selectedAsset === 'tanque_grao') asset = tanqueGrao(group, pos, params.raio, params.altura, params.nivel);
      else if (selectedAsset === 'tanque_concreto') asset = tanqueConcreto(group, pos, params.raio, params.altura, params.nivel);
      else if (selectedAsset === 'silo') asset = criarSilo(group, pos, params.raio, params.altura, params.nivel);
      else if (selectedAsset === 'monte_pedra') asset = montePedra(group, pos, params.raio, params.progress);
      else if (selectedAsset === 'monte_areia') asset = monteAreia(group, pos, params.raio, params.progress);
      else if (selectedAsset === 'monte_terra') asset = monteTerra(group, pos, params.raio, params.progress);
      else if (selectedAsset === 'monte_grao') asset = monteGrao(group, pos, params.raio, params.progress);
      else if (selectedAsset === 'monte_asfalto') asset = monteAsfalto(group, pos, params.raio, params.progress);
      else if (selectedAsset === 'casa_obra') asset = criarCasaObra(group, pos, params.progress);
      else if (selectedAsset === 'predio_estrutura') asset = criarPredioEstrutura(group, pos, params.andares, params.progress);
      else if (selectedAsset === 'rua_camadas') asset = criarRuaCamadas(group, pos, params.progress);
      else if (selectedAsset === 'corte_terreno') asset = criarCorteTerreno(group, pos, params.progress);
      else if (selectedAsset === 'guindaste') asset = criarGuindaste(group, pos, params.altura, params.lança);

      // MÁQUINAS & FÁBRICA
      else if (selectedAsset === 'escavadeira') asset = criarEscavadeira(group, pos, params.tamanho, params.cor);
      else if (selectedAsset === 'escavadeira_pequena') asset = escavadeiraPequena(group, pos);
      else if (selectedAsset === 'escavadeira_grande') asset = escavadeiraGrande(group, pos);
      else if (selectedAsset === 'fabrica') asset = criarFabrica(group, pos, params.tamanho);
      else if (selectedAsset === 'fabrica_pequena') asset = fabricaPequena(group, pos);
      else if (selectedAsset === 'fabrica_grande') asset = fabricaGrande(group, pos);

      // PERSONAGENS
      else if (selectedAsset.startsWith('personagem_')) {
        const tipo = selectedAsset.replace('personagem_', '');
        asset = criarPersonagem(group, { tipo, pos: [0, 0, 0], clip: params.clip || 'idle' });
      }

      if (asset) {
        asset.userData.tipo = selectedAsset;
        asset.userData.params = params;
        // Centraliza
        const box = new THREE.Box3().setFromObject(asset);
        const center = box.getCenter(new THREE.Vector3());
        asset.position.sub(center);
        group.add(asset);

        // Ajusta câmera para enquadrar
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2.5;
        cameraRef.current!.position.set(0, maxDim * 0.5, distance);
        cameraRef.current!.lookAt(0, maxDim * 0.2, 0);
        controlsRef.current!.target.set(0, maxDim * 0.2, 0);
      }
    } catch (e) {
      console.error('Erro ao criar asset:', e);
    }
  }, [selectedAsset, assetParams, time]);

  // Handlers
  const handleAssetClick = (assetId: string, defaultParams: any) => {
    setSelectedAsset(assetId);
    setAssetParams(prev => ({ ...prev, [assetId]: defaultParams }));
  };

  const handleParamChange = (key: string, value: any) => {
    if (!selectedAsset) return;
    setAssetParams(prev => ({
      ...prev,
      [selectedAsset]: { ...prev[selectedAsset], [key]: value }
    }));
    // Re-cria asset com novos parâmetros
    setSelectedAsset(null);
    setTimeout(() => setSelectedAsset(selectedAsset), 0);
  };

  const currentCategory = ASSET_CATEGORIES[category];
  const searchTerm = ''; // TODO: adicionar busca

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🎬 Kit Unificado - Asset Preview</h1>
        <div style={styles.headerRight}>
          <label style={styles.checkbox}>
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
            Grid
          </label>
          <label style={styles.checkbox}>
            <input type="checkbox" checked={showAxes} onChange={e => setShowAxes(e.target.checked)} />
            Eixos
          </label>
          <label style={styles.checkbox}>
            <input type="checkbox" checked={playing} onChange={e => setPlaying(e.target.checked)} />
            Animação
          </label>
        </div>
      </header>

      <div style={styles.main}>
        {/* Sidebar - Categorias & Assets */}
        <aside style={styles.sidebar}>
          <div style={styles.categoryTabs}>
            {ASSET_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                style={{ ...styles.tab, ...(i === category ? styles.tabActive : {}) }}
                onClick={() => setCategory(i)}
              >
                {cat.name} <span style={styles.badge}>{cat.items.length}</span>
              </button>
            ))}
          </div>

          <div style={styles.assetList}>
            {currentCategory.items.map(asset => (
              <button
                key={asset.id}
                style={{ ...styles.assetBtn, ...(selectedAsset === asset.id ? styles.assetBtnActive : {}) }}
                onClick={() => handleAssetClick(asset.id, asset.params)}
                title={asset.label}
              >
                {asset.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Canvas 3D */}
        <main style={styles.canvasWrapper}>
          <canvas ref={canvasRef} style={styles.canvas} />

          {/* Info overlay */}
          <div style={styles.infoOverlay}>
            {selectedAsset ? (
              <>
                <strong>{currentCategory.items.find(a => a.id === selectedAsset)?.label}</strong>
                <div style={styles.params}>
                  {Object.entries(assetParams[selectedAsset] || {}).map(([key, value]) => (
                    <div key={key} style={styles.paramRow}>
                      <label>{key}:</label>
                      {typeof value === 'number' ? (
                        <input
                          type="range"
                          min={key.includes('raio') || key.includes('tamanho') ? 0.1 : 0}
                          max={key.includes('raio') ? 5 : key.includes('tamanho') ? 3 : key.includes('velocidade') ? 200 : key.includes('progress') ? 1 : key.includes('andares') ? 20 : 10}
                          step={key.includes('progress') || key.includes('nivel') ? 0.05 : 0.1}
                          value={value}
                          onChange={e => handleParamChange(key, parseFloat(e.target.value))}
                          style={styles.slider}
                        />
                      ) : typeof value === 'string' ? (
                        <input
                          type="text"
                          value={value}
                          onChange={e => handleParamChange(key, e.target.value)}
                          style={styles.input}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={e => handleParamChange(key, e.target.checked)}
                        />
                      )}
                      <span style={styles.value}>{typeof value === 'number' ? value.toFixed(2) : value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              'Selecione um asset na lista →'
            )}
          </div>
        </main>

        {/* Props Panel */}
        <aside style={styles.propsPanel}>
          <h3 style={styles.panelTitle}>📋 Código para Storyboard</h3>
          {selectedAsset && (
            <pre style={styles.codeBlock}>
{JSON.stringify({
  tipo: selectedAsset.replace(/^personagem_/, 'personagem'),
  id: selectedAsset,
  pos: [0, 0, 0],
  config: assetParams[selectedAsset] || {}
}, null, 2)}
          </pre>
          )}
          {!selectedAsset && <p style={styles.empty}>Selecione um asset para ver o código</p>}
        </aside>
      </div>
    </div>
  );
}

// ===== ESTILOS =====
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0a0a1a',
    color: '#e8e8e8',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    background: 'rgba(0,0,0,0.5)',
    borderBottom: '1px solid #222',
    flexWrap: 'wrap',
    gap: '10px',
  },
  title: { margin: 0, fontSize: '18px', fontWeight: 600, color: '#ffdd00' },
  headerRight: { display: 'flex', gap: '16px', alignItems: 'center' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' },
  main: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: {
    width: '220px',
    background: 'rgba(0,0,0,0.3)',
    borderRight: '1px solid #222',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  categoryTabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    padding: '8px',
    borderBottom: '1px solid #222',
  },
  tab: {
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#aaa',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: '#ffdd00',
    borderColor: '#ffdd00',
    color: '#000',
    fontWeight: 600,
  },
  badge: { background: 'rgba(255,221,0,0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' },
  assetList: {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  assetBtn: {
    padding: '10px 12px',
    background: 'transparent',
    border: '1px solid #222',
    borderRadius: '6px',
    color: '#ccc',
    fontSize: '12px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  assetBtnActive: {
    background: 'rgba(255,221,0,0.15)',
    borderColor: '#ffdd00',
    color: '#ffdd00',
  },
  canvasWrapper: {
    flex: 1,
    position: 'relative',
    background: '#000',
  },
  canvas: { width: '100%', height: '100%', display: 'block' },
  infoOverlay: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    right: '16px',
    background: 'rgba(0,0,0,0.8)',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #333',
    maxHeight: '200px',
    overflow: 'auto',
    fontSize: '12px',
    lineHeight: 1.6,
  },
  params: { marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' },
  paramRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  paramRow_label: { minWidth: '80px', fontSize: '11px', color: '#aaa' },
  slider: { flex: 1, minWidth: '100px', accentColor: '#ffdd00' },
  input: { flex: 1, minWidth: '100px', background: '#111', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' },
  value: { minWidth: '50px', textAlign: 'right', color: '#ffdd00', fontFamily: 'monospace', fontSize: '11px' },
  propsPanel: {
    width: '320px',
    background: 'rgba(0,0,0,0.4)',
    borderLeft: '1px solid #222',
    padding: '16px',
    overflow: 'auto',
  },
  panelTitle: { margin: '0 0 12px', fontSize: '14px', color: '#ffdd00' },
  codeBlock: {
    margin: 0,
    padding: '12px',
    background: '#050510',
    border: '1px solid #222',
    borderRadius: '6px',
    fontSize: '11px',
    lineHeight: 1.5,
    overflow: 'auto',
    color: '#8f8',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  empty: { color: '#666', fontSize: '13px', textAlign: 'center', padding: '20px' },
};