// Kit barrel export + storyboard
export * from "./types";
export * from "./tempo";
export * from "./camera";
export * from "./ink";
export * from "./paint";
export * from "./personagens";
export * from "./cenarios";
export * from "./fluxos";
export * from "./rastros";
export * from "./anim";
export * from "./etapa";
export * from "./monte";
export * from "./tanque";
export * from "./misturador";
export * from "./escavadeira";
export * from "./fabrica";
export * from "./Cena3D";
export * from "./Legenda";
export * from "./Miniatura";
export * from "./Root";

// Storyboard do exemplo asfalto (para uso no remotion.config.tsx)
import type { Storyboard } from "./types";

export const exemploStoryboard: Storyboard = {
  id: "exemplo-asfalto",
  config: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300,
    corCeu: "#87ceeb",
    fov: 42,
    iluminacao: {
      tipo: "dia",
      transicoes: [
        { frame: 0, tipo: "externo_dia", intensidade: 1.0 },
        { frame: 200, tipo: "golden_hour", intensidade: 1.2, corSol: "#ffaa66" }
      ]
    }
  },
  camera: {
    inicial: { pos: [0, 14, 28], alvo: [0, 2, 0] },
    keyframes: [
      { frame: 0, pos: [0, 14, 28], lookAt: [0, 2, 0], curva: "ss" },
      { frame: 90, pos: [8, 10, 20], lookAt: [0, 1, 0], curva: "ss" },
      { frame: 90, pos: [8, 10, 20], lookAt: [0, 1, 0], curva: "pop" },
      { frame: 150, pos: [-5, 6, 12], lookAt: [-12, 1.5, 5], curva: "ss" },
      { frame: 180, pos: [-8, 4, 8], lookAt: [-12, 1.5, 5], curva: "kick" },
      { frame: 180, pos: [-8, 4, 8], lookAt: [18, 1, -5], curva: "ss" },
      { frame: 210, pos: [15, 8, -8], lookAt: [18, 1, -5], curva: "ss" },
      { frame: 240, pos: [20, 6, -3], lookAt: [22, 0.5, -5], curva: "pop" },
      { frame: 240, pos: [20, 6, -3], lookAt: [0, 0, 0], curva: "ss" },
      { frame: 300, pos: [0, 18, 30], lookAt: [0, 0, 0], curva: "sss" }
    ]
  },
  mundo: { tipo: "externo", hora: "dia" },
  assets: [
    { tipo: "chao", config: { tamanho: 200, textura: "terra" } },
    { tipo: "misturador", id: "usina_misturador", pos: [-25, 0, 10], config: { raio: 1.8, conteudo: "asfalto", velocidade: 100 } },
    { tipo: "tanque", id: "usina_tanque_asfalto", pos: [-25, 0, 15], config: { raio: 1.5, altura: 4, liquido: "asfalto", nivel: 0.8 } },
    { tipo: "tanque", id: "usina_tanque_oleo", pos: [-28, 0, 15], config: { raio: 1, altura: 3, liquido: "oleo", casca: "metal", nivel: 0.6 } },
    { tipo: "silo", id: "usina_silo_brita", pos: [-30, 0, 5], config: { raio: 1.8, altura: 12, nivel: 0.9 } },
    { tipo: "silo", id: "usina_silo_areia", pos: [-30, 0, 0], config: { raio: 1.8, altura: 12, nivel: 0.8 } },
    { tipo: "misturador", id: "paver", pos: [-10, 0, 0], config: { raio: 1.2, conteudo: "asfalto", velocidade: 80 } },
    { tipo: "tanque", id: "rolo_tanque_agua", pos: [5, 0, 3], config: { raio: 0.8, altura: 1.5, liquido: "agua", nivel: 0.7 } },
    { tipo: "monte", id: "monte_brita", pos: [-15, 0, -8], config: { material: "brita", raio: 2.5, progress: 1 } },
    { tipo: "monte", id: "monte_areia", pos: [-10, 0, -8], config: { material: "areia", raio: 2, progress: 1 } },
    { tipo: "monte", id: "monte_asfalto_pronto", pos: [15, 0, 2], config: { material: "asfalto", raio: 1.5, progress: 0 } },
    { tipo: "escavadeira", id: "escavadeira", pos: [18, 0, -5], config: { tamanho: 1, cor: "#f2c94c", cicloDuracao: 3.5 } },
    { tipo: "fabrica", id: "fabrica_premoldados", pos: [35, 0, -15], config: { tamanho: 0.8 } },
    { tipo: "arvore", pos: [-40, 0, 20], config: { tipo: "pinheiro", tamanho: 2 } },
    { tipo: "arvore", pos: [-45, 0, -15], config: { tipo: "frondosa", tamanho: 1.5 } },
    { tipo: "arvore", pos: [40, 0, 25], config: { tipo: "pinheiro", tamanho: 1.8 } },
    { tipo: "arvore", pos: [45, 0, -20], config: { tipo: "frondosa", tamanho: 1.2 } },
    { tipo: "casa", pos: [60, 0, 30], config: { estilo: "simples", andares: 1 } },
    { tipo: "casa", pos: [55, 0, -25], config: { estilo: "simples", andares: 1 } },
    { tipo: "casa", pos: [-55, 0, 35], config: { estilo: "simples", andares: 1 } },
    { tipo: "nuvem", pos: [-30, 45, 0], config: { escala: 1.5, velocidade: 0.3 } },
    { tipo: "nuvem", pos: [20, 50, -10], config: { escala: 1.2, velocidade: 0.2 } },
    { tipo: "nuvem", pos: [40, 48, 25], config: { escala: 1, velocidade: 0.4 } }
  ],
  registros: [
    { id: "usina_misturador", tipo: "misturador", ativo: true },
    { id: "usina_tanque_asfalto", tipo: "tanque", ativo: true },
    { id: "usina_tanque_oleo", tipo: "tanque", ativo: true },
    { id: "usina_silo_brita", tipo: "silo", ativo: true },
    { id: "usina_silo_areia", tipo: "silo", ativo: true },
    { id: "paver", tipo: "misturador", ativo: true },
    { id: "rolo_tanque_agua", tipo: "tanque", ativo: true },
    { id: "monte_brita", tipo: "monte", ativo: true },
    { id: "monte_areia", tipo: "monte", ativo: true },
    { id: "monte_asfalto_pronto", tipo: "monte", ativo: true },
    { id: "escavadeira", tipo: "escavadeira", ativo: true },
    { id: "fabrica_premoldados", tipo: "fabrica", ativo: true }
  ],
  animacoes: [
    { id: "paver", tipo: "pos", alvo: "paver", propriedades: { inicio: [-10, 0, 0], fim: [30, 0, 0] }, frameInicio: 60, frameFim: 240, curva: "ss" },
    { id: "rolo_seguindo", tipo: "pos", alvo: "rolo_tanque_agua", propriedades: { inicio: [5, 0, 3], fim: [35, 0, 3] }, frameInicio: 60, frameFim: 240, curva: "ss" },
    { id: "monte_asfalto_cresce", tipo: "escala", alvo: "monte_asfalto_pronto", propriedades: { inicio: [1, 0, 1], fim: [1, 1, 1] }, frameInicio: 120, frameFim: 240, curva: "ss" }
  ],
  etapas: [
    { id: "rua_base", tipo: "rua_camadas", pos: [-50, 0, -5], progress: 1, frameInicio: 0, frameFim: 60 },
    { id: "rua_impermeabilizacao", tipo: "rua_camadas", pos: [-30, 0, -5], progress: 0.5, frameInicio: 60, frameFim: 120 },
    { id: "rua_asfalto", tipo: "rua_camadas", pos: [0, 0, -5], progress: 0, frameInicio: 120, frameFim: 240 }
  ],
  fluxos: [
    { id: "asfalto_saindo_misturador", tipo: "asfalto_quente", pos: [-25, 2, 10], direcao: [1, 0, 0], taxa: 60, frameInicio: 60, frameFim: 240 },
    { id: "fumaça_usina", tipo: "fumaça", pos: [-25, 5, 10], direcao: [0, 1, 0], taxa: 30, frameInicio: 0, frameFim: 300 },
    { id: "poeira_brita", tipo: "poeira", pos: [-15, 1, -8], direcao: [0, 1, 0], taxa: 40, frameInicio: 0, frameFim: 60 },
    { id: "vapor_asfalto", tipo: "vapor", pos: [15, 1, 2], direcao: [0, 1, 0], taxa: 25, frameInicio: 120, frameFim: 240 },
    { id: "escavadeira_terra", tipo: "terra", pos: [18, 1, -5], direcao: [0, 1, 0], taxa: 50, frameInicio: 30, frameFim: 270 },
    { id: "fabrica_fumaça", tipo: "fumaça", pos: [35, 8, -15], direcao: [0, 1, 0], taxa: 20, frameInicio: 0, frameFim: 300 },
    { id: "fabrica_vapor", tipo: "vapor", pos: [35, 4, -15], direcao: [0, 1, 0], taxa: 15, frameInicio: 0, frameFim: 300 },
    { id: "paver_asfalto", tipo: "asfalto_quente", pos: [-10, 1, 0], direcao: [0, 0, 0], taxa: 40, frameInicio: 60, frameFim: 240 }
  ],
  rastros: [
    { id: "paver_rastro", tipo: "asfalto", caminho: [[-10, 0, 0], [30, 0, 0]], largura: 3, frameInicio: 60, frameFim: 240, fadeOut: 60 },
    { id: "rolo_rastro", tipo: "agua", caminho: [[5, 0, 3], [35, 0, 3]], largura: 1.5, frameInicio: 60, frameFim: 240, fadeOut: 30 },
    { id: "escavadeira_rastro", tipo: "terra", caminho: [[18, 0, -5], [22, 0, -3], [18, 0, -5]], largura: 2, frameInicio: 30, frameFim: 270, fadeOut: 120 },
    { id: "caminhao_entrada", tipo: "brita", caminho: [[-50, 0, 10], [-25, 0, 10]], largura: 2.5, frameInicio: 0, frameFim: 180, fadeOut: 30 },
    { id: "caminhao_saida", tipo: "terra", caminho: [[18, 0, -5], [50, 0, -10]], largura: 2.5, frameInicio: 60, frameFim: 240, fadeOut: 30 },
    { id: "esteira_fabrica", tipo: "concreto", caminho: [[35, 0, -15], [30, 0, -15], [25, 0, -15]], largura: 1, frameInicio: 0, frameFim: 300, fadeOut: 0 }
  ],
  personagens: [
    { id: "operador_paver", tipo: "operador", pos: [-8, 1.8, 0], escala: 1, frameInicio: 60, frameFim: 240, animação: "caminha", lookAt: [30, 0, 0] },
    { id: "operador_rolo", tipo: "operador", pos: [7, 1.8, 3], escala: 1, frameInicio: 60, frameFim: 240, animação: "caminha", lookAt: [35, 0, 3] },
    { id: "operador_escavadeira", tipo: "operador", pos: [18, 3, -3], escala: 1, frameInicio: 30, frameFim: 270, animação: "opera", lookAt: [20, 0, -5] },
    { id: "pedestre_1", tipo: "pedestre", pos: [-40, 0, 22], escala: 1, frameInicio: 0, frameFim: 300, animação: "caminha", lookAt: [-35, 0, 20] },
    { id: "pedestre_2", tipo: "pedestre", pos: [42, 0, 27], escala: 1, frameInicio: 0, frameFim: 300, animação: "parado", lookAt: [40, 0, 25] },
    { id: "engenheiro", tipo: "engenheiro", pos: [0, 0, -8], escala: 1, frameInicio: 120, frameFim: 240, animação: "aponta", lookAt: [15, 0, 2] },
    { id: "fiscal", tipo: "engenheiro", pos: [-5, 0, -8], escala: 1, frameInicio: 150, frameFim: 210, animação: "anota", lookAt: [0, 0, -5] }
  ],
  legendas: [
    {
      id: "titulo",
      tipo: "linha",
      texto: "Como funciona a pavimentação asfáltica",
      frameInicio: 0,
      frameFim: 90,
      estilo: "tiktok",
      posicao: "topo"
    },
    {
      id: "etapa1",
      tipo: "linha",
      texto: "1. Usina: mistura brita + areia + asfalto quente",
      frameInicio: 60,
      frameFim: 120,
      estilo: "youtube",
      posicao: "baixo"
    },
    {
      id: "etapa2",
      tipo: "linha",
      texto: "2. Paver espalha e nivela a massa",
      frameInicio: 120,
      frameFim: 180,
      estilo: "youtube",
      posicao: "baixo"
    },
    {
      id: "etapa3",
      tipo: "linha",
      texto: "3. Rolo compacta: vibração + água = densidade",
      frameInicio: 180,
      frameFim: 240,
      estilo: "youtube",
      posicao: "baixo"
    },
    {
      id: "final",
      tipo: "linha",
      texto: "Pista pronta! Durabilidade de 10-15 anos",
      frameInicio: 240,
      frameFim: 300,
      estilo: "tiktok",
      posicao: "centro"
    }
  ]
};
