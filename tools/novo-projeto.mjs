#!/usr/bin/env node
// novo-projeto.mjs - Cria novo projeto com estrutura padrão
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "../templates");

const TEMPLATES = {
  "asfalto": "exemplo-asfalto",
  "construcao": "exemplo-construcao",
  "fabrica": "exemplo-fabrica",
  "mineracao": "exemplo-mineracao",
  "vazio": "vazio",
};

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
📦 Kit Unificado - Novo Projeto

Uso:
  npm run novo-projeto <nome> [template]
  node tools/novo-projeto.mjs <nome> [template]

Templates disponíveis:
  asfalto      - Pavimentação completa (padrão)
  construcao   - Casa/prédio subindo etapas
  fabrica      - Linha de produção com silos/esteira
  mineracao    - Escavadeira + caminhões + britador
  vazio        - Estrutura mínima

Exemplos:
  npm run novo-projeto meu-video
  npm run novo-projeto pavimento asfalto
  npm run novo-projeto edificio construcao
`);
    process.exit(0);
  }

  const nome = args[0];
  const template = args[1] || "asfalto";
  const templateKey = template.toLowerCase();

  if (!TEMPLATES[templateKey]) {
    console.error(`❌ Template desconhecido: ${template}`);
    console.log(`   Disponíveis: ${Object.keys(TEMPLATES).join(", ")}`);
    process.exit(1);
  }

  const projetoPath = path.resolve(`projetos/${nome}`);

  try {
    await fs.access(projetoPath);
    console.error(`❌ Projeto já existe: ${projetoPath}`);
    process.exit(1);
  } catch {}

  console.log(`📁 Criando projeto: ${nome}`);
  console.log(`   Template: ${template}`);

  // Cria estrutura de pastas
  const pastas = [
    "src",
    "assets/audio",
    "assets/images",
    "assets/fonts",
    "storyboards",
    "output",
  ];

  for (const pasta of pastas) {
    await fs.mkdir(path.join(projetoPath, pasta), { recursive: true });
  }

  // Copia template
  const templatePath = path.join(TEMPLATES_DIR, TEMPLATES[templateKey]);

  try {
    await copiarDiretorio(templatePath, projetoPath);
  } catch {
    // Se template não existe, cria estrutura mínima
    await criarEstruturaMinima(projetoPath, nome, template);
  }

  // Cria package.json do projeto
  const pkg = {
    name: `kit-${nome}`,
    version: "1.0.0",
    private: true,
    scripts: {
      "dev": "remotion studio ../../src/index.ts",
      "build": "remotion render ../../src/index.ts main ../../output/video.mp4",
      "thumb": "remotion render ../../src/index.ts thumb ../../output/thumb.png",
      "validar": "node ../../tools/validar.mjs --projeto " + nome,
    },
    dependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "remotion": "^4.0.0",
      "three": "^0.160.0",
    },
    devDependencies: {
      "@remotion/cli": "^4.0.0",
      "@remotion/renderer": "^4.0.0",
      "@remotion/bundler": "^4.0.0",
      "typescript": "^5.3.0",
      "@types/react": "^18.2.0",
      "@types/three": "^0.160.0",
    },
  };

  await fs.writeFile(
    path.join(projetoPath, "package.json"),
    JSON.stringify(pkg, null, 2)
  );

  // Cria tsconfig.json do projeto
  const tsconfig = {
    extends: "../../tsconfig.json",
    compilerOptions: {
      baseUrl: ".",
      paths: {
        "@/*": ["src/*"],
        "@kit/*": ["../../src/kit/*"],
        "@assets/*": ["assets/*"],
      },
    },
    include: ["src/**/*", "../../src/kit/**/*"],
  };

  await fs.writeFile(
    path.join(projetoPath, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2)
  );

  // Cria remotion.config.ts do projeto
  const remotionConfig = `import { Config } from "@remotion/cli";
import { Video3D, ThumbYoutube, ThumbVertical } from "@kit/Root";
import { exemploStoryboard } from "./storyboard";

// Configurações de render
Config.EnableProfiling = false;
Config.ChromiumOpenGlRenderer = "angle";

// Registra composições
export const remotion = [
  {
    id: "main",
    component: Video3D,
    props: { storyboard: exemploStoryboard },
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300,
  },
  {
    id: "thumb",
    component: ThumbYoutube,
    props: {
      titulo: "${nome.toUpperCase()}",
      subtitulo: "Processo animado com Kit Unificado",
      frameSegundo: 2,
    },
    width: 1280,
    height: 720,
    fps: 30,
    durationInFrames: 1,
  },
];
`;

  await fs.writeFile(
    path.join(projetoPath, "remotion.config.ts"),
    remotionConfig
  );

  console.log(`\n✅ Projeto criado em: ${projetoPath}`);
  console.log(`
📋 Próximos passos:
  cd projetos/${nome}
  npm install
  npm run dev        # Abre Remotion Studio
  npm run build      # Renderiza vídeo
  npm run thumb      # Gera miniatura
  npm run validar    # Valida storyboard
`);
}

async function copiarDiretorio(origem: string, destino: string) {
  const entries = await fs.readdir(origem, { withFileTypes: true });

  for (const entry of entries) {
    const src = path.join(origem, entry.name);
    const dest = path.join(destino, entry.name);

    if (entry.isDirectory()) {
      await fs.mkdir(dest, { recursive: true });
      await copiarDiretorio(src, dest);
    } else {
      await fs.copyFile(src, dest);
    }
  }
}

async function criarEstruturaMinima(projetoPath: string, nome: string, template: string) {
  // src/index.ts
  const indexTs = `import {
  criarStoryboardPadrao,
  KitUnificado,
  misturadorConcreto,
  tanqueAgua,
  montePedra,
  criarCasaObra,
  fluxoParticulas,
  rastroAsfalto,
  escavadeiraPequena,
  fabricaPequena,
  criarMundo,
  chao,
  casa,
  arvore,
  camNoTempo,
  frames,
} from "@kit";

import * as THREE from "three";

// ============================================
// STORYBOARD: ${nome.toUpperCase()}
// Template: ${template}
// ============================================

export const exemploStoryboard = criarStoryboardPadrao({
  id: "${nome}",
  config: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300, // 10 segundos
    corCeu: "#87ceeb",
    fov: 45,
    iluminacao: { tipo: "dia" },
  },
  camera: {
    inicial: { pos: [0, 12, 25], alvo: [0, 2, 0] },
    keyframes: [
      { frame: 0, pos: [0, 12, 25], lookAt: [0, 2, 0] },
      { frame: 150, pos: [10, 8, 15], lookAt: [0, 2, 0], curva: "ss" },
      { frame: 300, pos: [-5, 15, 20], lookAt: [0, 3, 0], curva: "ss" },
    ],
  },
  mundo: { tipo: "externo", hora: "dia" },
  assets: [
    // Chão
    { tipo: "chao", config: { tamanho: 100, textura: "grama" } },

    // Casa em construção
    { tipo: "casa_obra", id: "casa1", pos: [10, 0, 0], config: { progress: 0 } },

    // Misturador de concreto
    { tipo: "misturador", id: "mist1", pos: [-15, 0, 5], config: { raio: 1.2, conteudo: "concreto", velocidade: 90 } },

    // Tanque de água
    { tipo: "tanque", id: "tanque1", pos: [-15, 0, -5], config: { raio: 1, altura: 3, liquido: "agua", nivel: 0.7 } },

    // Monte de brita
    { tipo: "monte", id: "monte1", pos: [15, 0, 5], config: { material: "brita", raio: 2, progress: 1 } },

    // Escavadeira
    { tipo: "escavadeira", id: "esc1", pos: [20, 0, -5], config: { tamanho: 1, cor: "#f2c94c", cicloDuracao: 4 } },

    // Árvores
    { tipo: "arvore", pos: [-30, 0, 10], config: { tipo: "pinheiro", tamanho: 1.5 } },
    { tipo: "arvore", pos: [-35, 0, -10], config: { tipo: "frondosa", tamanho: 1.2 } },
    { tipo: "arvore", pos: [30, 0, 15], config: { tipo: "pinheiro", tamanho: 1.3 } },
  ],
  registros: [
    { id: "casa1" },
    { id: "mist1" },
    { id: "tanque1" },
    { id: "monte1" },
    { id: "esc1" },
  ],
  animacoes: [
    // Casa constrói
    { alvo: "casa1", propriedade: "escala", valor: { x: 1, y: 1, z: 1 }, duracao: 10, curva: "ss", inicio: 0 },

    // Misturador gira (controlado pelo sistema)
    // Tanque enche
    // Escavadeira ciclo (controlado pelo sistema)
  ],
  etapas: [
    { alvo: "casa1", progressInicial: 0, progressFinal: 1, duracao: 10, curva: "ss", inicio: 0 },
  ],
  fluxos: [
    // Brita caindo do silo para misturador
    {
      material: "brita",
      origem: [15, 3, 5],
      destino: [-15, 2, 5],
      taxa: 30,
      gravidade: 9.8,
      duracao: 8,
      inicio: 2
    },
    // Água do tanque para misturador
    {
      material: "agua",
      origem: [-15, 2, -5],
      destino: [-15, 2, 5],
      taxa: 20,
      gravidade: 2,
      duracao: 5,
      inicio: 3
    },
  ],
  rastros: [
    // Caminhão trazendo brita
    {
      tipo: "terra_revolvida",
      caminho: [[30, 0.1, 5], [15, 0.1, 5]],
      largura: 3,
      duracao: 4,
      inicio: 1
    },
  ],
  personagens: [
    { id: "operador1", tipo: "operario", pos: [-14, 0, 6], clip: "hammer" },
    { id: "operador2", tipo: "operario", pos: [12, 0, 1], clip: "walk" },
  ],
  legendas: [
    {
      tipo: "karaoke",
      palavras: [
        { texto: "Construindo", inicio: 0.5, fim: 1.5 },
        { texto: "o", inicio: 1.5, fim: 1.7 },
        { texto: "futuro", inicio: 1.7, fim: 2.5 },
        { texto: "camada", inicio: 3, fim: 3.7 },
        { texto: "por", inicio: 3.7, fim: 3.9 },
        { texto: "camada", inicio: 3.9, fim: 4.7 },
      ],
      props: { estilo: "tiktok", posY: 0.75 },
    },
  ],
});
`;

  await fs.writeFile(path.join(projetoPath, "src/index.ts"), indexTs);

  // storyboard.json (versão JSON para validação)
  const storyboardJson = {
    id: nome,
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
      inicial: { pos: [0, 12, 25], alvo: [0, 2, 0] },
      keyframes: [
        { frame: 0, pos: [0, 12, 25], lookAt: [0, 2, 0] },
        { frame: 150, pos: [10, 8, 15], lookAt: [0, 2, 0], curva: "ss" },
        { frame: 300, pos: [-5, 15, 20], lookAt: [0, 3, 0], curva: "ss" },
      ],
    },
    mundo: { tipo: "externo", hora: "dia" },
    assets: [
      { tipo: "chao", config: { tamanho: 100, textura: "grama" } },
      { tipo: "casa_obra", id: "casa1", pos: [10, 0, 0], config: { progress: 0 } },
      { tipo: "misturador", id: "mist1", pos: [-15, 0, 5], config: { raio: 1.2, conteudo: "concreto", velocidade: 90 } },
      { tipo: "tanque", id: "tanque1", pos: [-15, 0, -5], config: { raio: 1, altura: 3, liquido: "agua", nivel: 0.7 } },
      { tipo: "monte", id: "monte1", pos: [15, 0, 5], config: { material: "brita", raio: 2, progress: 1 } },
      { tipo: "escavadeira", id: "esc1", pos: [20, 0, -5], config: { tamanho: 1, cor: "#f2c94c", cicloDuracao: 4 } },
      { tipo: "arvore", pos: [-30, 0, 10], config: { tipo: "pinheiro", tamanho: 1.5 } },
      { tipo: "arvore", pos: [-35, 0, -10], config: { tipo: "frondosa", tamanho: 1.2 } },
      { tipo: "arvore", pos: [30, 0, 15], config: { tipo: "pinheiro", tamanho: 1.3 } },
    ],
    registros: [
      { id: "casa1" }, { id: "mist1" }, { id: "tanque1" }, { id: "monte1" }, { id: "esc1" }
    ],
    animacoes: [
      { alvo: "casa1", propriedade: "escala", valor: { x: 1, y: 1, z: 1 }, duracao: 10, curva: "ss", inicio: 0 },
    ],
    etapas: [
      { alvo: "casa1", progressInicial: 0, progressFinal: 1, duracao: 10, curva: "ss", inicio: 0 },
    ],
    fluxos: [
      { material: "brita", origem: [15, 3, 5], destino: [-15, 2, 5], taxa: 30, gravidade: 9.8, duracao: 8, inicio: 2 },
      { material: "agua", origem: [-15, 2, -5], destino: [-15, 2, 5], taxa: 20, gravidade: 2, duracao: 5, inicio: 3 },
    ],
    rastros: [
      { tipo: "terra_revolvida", caminho: [[30, 0.1, 5], [15, 0.1, 5]], largura: 3, duracao: 4, inicio: 1 },
    ],
    personagens: [
      { id: "operador1", tipo: "operario", pos: [-14, 0, 6], clip: "hammer" },
      { id: "operador2", tipo: "operario", pos: [12, 0, 1], clip: "walk" },
    ],
    legendas: [
      {
        tipo: "karaoke",
        palavras: [
          { texto: "Construindo", inicio: 0.5, fim: 1.5 },
          { texto: "o", inicio: 1.5, fim: 1.7 },
          { texto: "futuro", inicio: 1.7, fim: 2.5 },
          { texto: "camada", inicio: 3, fim: 3.7 },
          { texto: "por", inicio: 3.7, fim: 3.9 },
          { texto: "camada", inicio: 3.9, fim: 4.7 },
        ],
        props: { estilo: "tiktok", posY: 0.75 },
      },
    ],
  };

  await fs.writeFile(
    path.join(projetoPath, "storyboard.json"),
    JSON.stringify(storyboardJson, null, 2)
  );

  // README do projeto
  const readme = `# ${nome}

Projeto criado com Kit Unificado (Remotion + Three.js)

## Template: ${template}

## Comandos

\`\`\`bash
npm install        # Instala dependências
npm run dev        # Abre Remotion Studio (preview interativo)
npm run build      # Renderiza vídeo final (output/video.mp4)
npm run thumb      # Gera miniatura YouTube (output/thumb.png)
npm run validar    # Valida storyboard.json
\`\`\`

## Estrutura

\`\`\`
${nome}/
├── src/
│   └── index.ts          # Storyboard principal (TypeScript)
├── storyboards/
│   └── storyboard.json   # Storyboard para validação
├── assets/
│   ├── audio/            # Narração, SFX, música
│   ├── images/           # Texturas, referências
│   └── fonts/            # Fontes customizadas
├── output/               # Vídeos e thumbnails gerados
├── package.json
├── tsconfig.json
└── remotion.config.ts
\`\`\`

## Editando o Storyboard

Edite \`src/index.ts\` para modificar a cena. O arquivo exporta \`exemploStoryboard\` que é usado pelo \`remotion.config.ts\`.

Para testes rápidos, edite \`storyboard.json\` e rode \`npm run validar\`.

## Renderização

- **Desenvolvimento**: \`npm run dev\` abre o Remotion Studio em localhost:3000
- **Produção**: \`npm run build\` renderiza em \`output/video.mp4\`
- **Qualidade**: Edite \`tools/render.mjs\` ou passe args: \`node ../../tools/render.mjs ${nome} main output/video.mp4 alta\`

## Dicas

1. Use \`fps: 30\` e \`durationInFrames: 300\` para 10s
2. Camera keyframes usam \`curva: "ss" | "sss" | "pop" | "kick"\`
3. Legendas palavra-por-palavra precisam de \`palavras.json\` (gere com \`voz.py\`)
4. Para TTS: \`python ../../tools/voz.py "seu texto" assets/audio/narracao.wav\`
`;

  await fs.writeFile(path.join(projetoPath, "README.md"), readme);
}

main().catch(err => {
  console.error("❌ Erro:", err);
  process.exit(1);
});