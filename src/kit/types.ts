// Tipos compartilhados do kit unificado

export type Luz = "dia" | "por" | "noite" | "espaco";
export type ChaoTipo = "grama" | "terra" | "areia" | "concreto" | "asfalto" | "madeira" | "piso";
export type Clima = "limpo" | "chuva";
export type Horario = "dia" | "tarde" | "nublado" | "noite";
export type Fundo = "campo" | "cidade" | "floresta" | "deserto" | "litoral" | "industrial" | "interior";

export interface Vetor3 {
  x: number;
  y: number;
  z: number;
}

export interface CorRGB {
  r: number;
  g: number;
  b: number;
}

// Personagem
export interface CharacterPreset {
  nome: string;
  role: string;
  config: CharacterConfig;
}

export interface CharacterConfig {
  skin: string;
  height: number;
  build: number;
  headScale?: number;
  stoop?: number;
  top?: { color: string; stripe?: string; sleeves: "short" | "long" };
  bottom?: { color: string; type: "pants" | "shorts" | "skirt" };
  shoes?: string;
  hair?: { style: HairStyle; color: string };
  hat?: { type: HatType; color: string };
  face?: { glasses?: boolean; mustache?: boolean; beard?: boolean; facialHairColor?: string; brow?: string };
  held?: { R?: HeldItem; L?: HeldItem };
  name?: string;
}

export type HairStyle = "bald" | "short" | "fringe" | "long" | "ponytail" | "bun" | "curly" | "sides";
export type HatType = "none" | "hardhat" | "cap";
export type HeldItem = "none" | "hammer" | "clipboard" | "shovel";

export type CharacterClip =
  | "idle" | "walk" | "run" | "talk" | "hammer" | "carry" | "push" | "dig"
  | "cheer" | "surprised" | "think" | "look_around" | "nod" | "shake_head"
  | "shrug" | "crouch" | "sit" | "read_clipboard";

export type CharacterExpr =
  | "neutral" | "happy" | "laugh" | "sad" | "angry" | "surprised" | "worried" | "thinking" | "sleepy";

export interface CharacterPose {
  x: number;
  y?: number;
  z: number;
  expr?: CharacterExpr;
  modo?: "stand" | "stroll" | "march" | "sit" | "fall";
  fase?: number;
  lado?: boolean;
  espelho?: boolean;
  olhar?: number;
  aceno?: number;
  inclina?: number;
  t?: number;
}

// Câmera
export interface CameraKeyframe {
  t: number;
  c: {
    pos: Vetor3;
    look: Vetor3;
    fov: number;
  };
  corte?: boolean;
}

export interface CameraSettings {
  tipo: "geral" | "close" | "dentro";
  alvo: string; // id do personagem ou "mundo"
  angulo: number; // graus a partir do giro
  plano: number; // distância
  giro: number; // rotação base
  corte?: boolean;
}

// Animações de processo
export type FluxoMaterial =
  | "pedra" | "brita" | "areia" | "terra" | "concreto" | "asfalto"
  | "agua" | "fumaca" | "vapor" | "poeira" | "ar" | "bolha"
  | "neve" | "eletricidade" | "luz" | "fagulha" | "fogo";

export interface FluxoConfig {
  material: FluxoMaterial;
  origem?: Vetor3;
  destino?: Vetor3;
  ancora?: string; // id do asset
  caminho?: Vetor3[]; // para tubos/fios
  taxa: number; // particulas/segundo
  tamanho: number;
  cor?: string;
  gravidade?: number;
  duracao?: number;
}

export interface RastroConfig {
  asset: string; // id da máquina
  material: FluxoMaterial;
  largura: number;
  cor?: string;
  opacidade?: number;
}

export interface AnimConfig {
  alvo: string; // asset id
  propriedade: "pos" | "giro" | "escala" | "oscila" | "pulsa";
  valor: number | Vetor3;
  curva?: "linear" | "ss" | "sss" | "pop" | "kick" | "lerp" | "clamp";
  duracao: number;
  inicio?: number;
}

export interface EtapaConfig {
  alvo: string; // asset id (casa_obra, predio_estrutura, rua_camadas, etc.)
  progressInicial: number;
  progressFinal: number;
  duracao: number;
  curva?: "linear" | "ss" | "sss" | "pop" | "kick" | "lerp" | "clamp";
}

// Assets de cenário
export interface AssetInstance {
  id: string;
  asset: string;
  variante?: string;
  pos: Vetor3;
  rotacao?: Vetor3;
  escala?: Vetor3 | number;
  params?: Record<string, any>;
  etapa?: EtapaConfig;
  anim?: AnimConfig[];
  visivel?: boolean;
}

// Personagens na cena
export interface CharacterInstance {
  id: string;
  preset: string;
  pos: Vetor3;
  clip?: CharacterClip;
  fala?: boolean;
  viraPara?: "camera" | string;
  expr?: CharacterExpr;
  lado?: boolean;
  espelho?: boolean;
  olhar?: number;
  aceno?: number;
  inclina?: number;
  overrides?: Partial<CharacterConfig>;
}

// Elementos visuais
export type ElementoTipo = "seta" | "icone" | "etiqueta" | "pretoebranco";

export interface ElementoConfig {
  tipo: ElementoTipo;
  alvo?: string; // asset ou character id
  posicao?: Vetor3;
  texto?: string;
  icone?: "x" | "v" | "alerta" | "info";
  cor?: string;
  tamanho?: number;
  zona?: "titulo" | "destaque" | "pergunta" | "livre";
  zoom?: boolean; // para pretoebranco
}

export interface TextoConfig {
  tipo: "titulo" | "destaque" | "pergunta";
  texto: string;
  zona?: "titulo" | "destaque" | "pergunta";
  inicio?: number;
  fim?: number;
}

// Cena completa
export interface Cena {
  id: string;
  inicio: number;
  duracao: number;
  frases: string[]; // ids das frases do words.json
  camera: CameraSettings;
  personagens: CharacterInstance[];
  assets: AssetInstance[];
  fluxos: FluxoConfig[];
  rastros: RastroConfig[];
  anim: AnimConfig[];
  etapa: EtapaConfig[];
  elementos: ElementoConfig[];
  textos: TextoConfig[];
  ambiente?: {
    fundo: Fundo;
    chao: ChaoTipo;
    clima: Clima;
    horario: Horario;
  };
}

// Storyboard completo
export interface Storyboard {
  titulo: string;
  duracaoTotal: number;
  ambiente: {
    fundo: Fundo;
    chao: ChaoTipo;
    clima: Clima;
    horario: Horario;
  };
  personagens: Array<{
    id: string;
    preset: string;
    role: string;
    overrides?: Partial<CharacterConfig>;
  }>;
  cenas: Cena[];
}

// Words.json (timestamps palavra por palavra)
export interface WordTiming {
  palavra: string;
  inicio: number;
  fim: number;
  confianca: number;
}

export interface WordsData {
  palavras: WordTiming[];
  duracaoTotal: number;
  coberturaTempos: number;
}

// Config de voz
export type VozTipo = "gratis" | "elevenlabs";

export interface VozConfig {
  tipo: VozTipo;
  voiceId?: string; // para ElevenLabs
  velocidade?: number;
  modelo?: string;
}

// Config do canal
export interface CanalConfig {
  nome: string;
  nicho: string;
  tom: string;
  elenco: {
    protagonista: string;
    especialista?: string;
    curioso?: string;
  };
  mecanismoUnico: string;
  abertura: string;
  fechamento: string;
  capaEstilo: string;
  duracaoPadraoSegundos: number;
  videoRelacionado?: string;
}