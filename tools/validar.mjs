#!/usr/bin/env node
// validar.mjs - Valida storyboard JSON
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function validarStoryboard(storyboard) {
  const erros = [];
  const avisos = [];

  // Config básica
  if (!storyboard.config) {
    erros.push("Falta 'config' no storyboard");
  } else {
    if (!storyboard.config.width || !storyboard.config.height) {
      erros.push("config.width/height obrigatórios");
    }
    if (!storyboard.config.fps) {
      erros.push("config.fps obrigatório");
    }
    if (!storyboard.config.durationInFrames) {
      erros.push("config.durationInFrames obrigatório");
    }
  }

  // Camera
  if (storyboard.camera?.keyframes) {
    storyboard.camera.keyframes.forEach((kf, i) => {
      if (typeof kf.frame !== "number" || kf.frame < 0) {
        erros.push(`camera.keyframes[${i}]: frame deve ser número >= 0`);
      }
      if (!Array.isArray(kf.pos) || kf.pos.length !== 3) {
        erros.push(`camera.keyframes[${i}]: pos deve ser [x,y,z]`);
      }
      if (kf.lookAt && (!Array.isArray(kf.lookAt) || kf.lookAt.length !== 3)) {
        erros.push(`camera.keyframes[${i}]: lookAt deve ser [x,y,z]`);
      }
      if (kf.fov && (kf.fov < 10 || kf.fov > 120)) {
        avisos.push(`camera.keyframes[${i}]: fov ${kf.fov} fora do normal (10-120)`);
      }
    });
  }

  // Assets
  const assetTiposValidos = [
    "misturador", "tanque", "monte", "casa_obra", "predio_estrutura",
    "rua_camadas", "corte_terreno", "guindaste", "escavadeira", "fabrica",
    "silo", "mundo", "chao", "mar", "casa", "predio", "arvore", "cidade",
    "nuvem", "estrela", "planeta", "rua", "cruzamento"
  ];

  if (storyboard.assets) {
    storyboard.assets.forEach((asset, i) => {
      if (!asset.tipo) {
        erros.push(`assets[${i}]: tipo obrigatório`);
      } else if (!assetTiposValidos.includes(asset.tipo)) {
        avisos.push(`assets[${i}]: tipo "${asset.tipo}" não reconhecido`);
      }
      if (asset.pos && (!Array.isArray(asset.pos) || asset.pos.length !== 3)) {
        erros.push(`assets[${i}]: pos deve ser [x,y,z]`);
      }
    });
  }

  // Animações
  const animPropsValidas = ["pos", "giro", "escala", "oscila", "pulsa"];
  const curvasValidas = ["linear", "ss", "sss", "pop", "kick", "lerp"];

  if (storyboard.animacoes) {
    storyboard.animacoes.forEach((anim, i) => {
      if (!anim.alvo) erros.push(`animacoes[${i}]: alvo obrigatório`);
      if (!anim.propriedade) erros.push(`animacoes[${i}]: propriedade obrigatória`);
      else if (!animPropsValidas.includes(anim.propriedade)) {
        erros.push(`animacoes[${i}]: propriedade "${anim.propriedade}" inválida`);
      }
      if (typeof anim.duracao !== "number" || anim.duracao <= 0) {
        erros.push(`animacoes[${i}]: duracao deve ser número > 0`);
      }
      if (anim.curva && !curvasValidas.includes(anim.curva)) {
        avisos.push(`animacoes[${i}]: curva "${anim.curva}" não reconhecida`);
      }
      if (anim.inicio && (anim.inicio < 0 || anim.inicio > (storyboard.config?.durationInFrames || 300))) {
        avisos.push(`animacoes[${i}]: inicio fora da duração do vídeo`);
      }
    });
  }

  // Etapas
  const etapaTiposValidos = ["casa_obra", "predio_estrutura", "rua_camadas", "corte_terreno", "guindaste"];

  if (storyboard.etapas) {
    storyboard.etapas.forEach((etapa, i) => {
      if (!etapa.alvo) erros.push(`etapas[${i}]: alvo obrigatório`);
      if (typeof etapa.duracao !== "number" || etapa.duracao <= 0) {
        erros.push(`etapas[${i}]: duracao deve ser número > 0`);
      }
      if (etapa.progressInicial !== undefined && (etapa.progressInicial < 0 || etapa.progressInicial > 1)) {
        erros.push(`etapas[${i}]: progressInicial deve ser 0-1`);
      }
      if (etapa.progressFinal !== undefined && (etapa.progressFinal < 0 || etapa.progressFinal > 1)) {
        erros.push(`etapas[${i}]: progressFinal deve ser 0-1`);
      }
    });
  }

  // Fluxos
  const fluxoMateriaisValidos = [
    "pedra", "areia", "terra", "brita", "asfalto", "concreto",
    "agua", "fumaca", "vapor", "poeira", "grao", "carvao",
    "ferro", "madeira", "plastico", "vidro", "lixo", "neve"
  ];

  if (storyboard.fluxos) {
    storyboard.fluxos.forEach((fluxo, i) => {
      if (!fluxo.material) erros.push(`fluxos[${i}]: material obrigatório`);
      else if (!fluxoMateriaisValidos.includes(fluxo.material)) {
        avisos.push(`fluxos[${i}]: material "${fluxo.material}" não padrão`);
      }
      if (!fluxo.origem || !Array.isArray(fluxo.origem) || fluxo.origem.length !== 3) {
        erros.push(`fluxos[${i}]: origem deve ser [x,y,z]`);
      }
      if (fluxo.destino && (!Array.isArray(fluxo.destino) || fluxo.destino.length !== 3)) {
        erros.push(`fluxos[${i}]: destino deve ser [x,y,z]`);
      }
      if (typeof fluxo.taxa !== "number" || fluxo.taxa <= 0) {
        erros.push(`fluxos[${i}]: taxa deve ser número > 0`);
      }
    });
  }

  // Rastros
  const rastroTiposValidos = ["asfalto_quente", "terra_revolvida", "brita", "concreto_fresco", "marca_pneu", "arrasto"];

  if (storyboard.rastros) {
    storyboard.rastros.forEach((rastro, i) => {
      if (!rastro.tipo) erros.push(`rastros[${i}]: tipo obrigatório`);
      else if (!rastroTiposValidos.includes(rastro.tipo)) {
        avisos.push(`rastros[${i}]: tipo "${rastro.tipo}" não padrão`);
      }
      if (!rastro.caminho || !Array.isArray(rastro.caminho)) {
        erros.push(`rastros[${i}]: caminho obrigatório (array de pontos)`);
      } else {
        rastro.caminho.forEach((p, j) => {
          if (!Array.isArray(p) || p.length !== 3) {
            erros.push(`rastros[${i}].caminho[${j}]: deve ser [x,y,z]`);
          }
        });
      }
    });
  }

  // Personagens
  if (storyboard.personagens) {
    storyboard.personagens.forEach((p, i) => {
      if (!p.tipo) erros.push(`personagens[${i}]: tipo obrigatório`);
      if (!p.pos || !Array.isArray(p.pos) || p.pos.length !== 3) {
        erros.push(`personagens[${i}]: pos deve ser [x,y,z]`);
      }
      if (p.clip && typeof p.clip !== "string") {
        avisos.push(`personagens[${i}]: clip deve ser string`);
      }
    });
  }

  // Legendas
  if (storyboard.legendas) {
    storyboard.legendas.forEach((leg, i) => {
      if (leg.tipo === "linha") {
        if (!leg.texto) erros.push(`legendas[${i}]: texto obrigatório para tipo linha`);
        if (typeof leg.inicio !== "number" || typeof leg.fim !== "number") {
          erros.push(`legendas[${i}]: inicio/fim obrigatórios para tipo linha`);
        }
      } else {
        if (!leg.palavras || !Array.isArray(leg.palavras) || leg.palavras.length === 0) {
          erros.push(`legendas[${i}]: palavras obrigatórias para tipo ${leg.tipo}`);
        } else {
          leg.palavras.forEach((pal, j) => {
            if (!pal.texto || typeof pal.inicio !== "number" || typeof pal.fim !== "number") {
              erros.push(`legendas[${i}].palavras[${j}]: texto, inicio, fim obrigatórios`);
            }
          });
        }
      }
    });
  }

  // Stats
  const stats = {
    assets: storyboard.assets?.length || 0,
    animacoes: storyboard.animacoes?.length || 0,
    etapas: storyboard.etapas?.length || 0,
    fluxos: storyboard.fluxos?.length || 0,
    rastros: storyboard.rastros?.length || 0,
    personagens: storyboard.personagens?.length || 0,
    legendas: storyboard.legendas?.length || 0,
    duracaoEstimada: storyboard.config?.durationInFrames / (storyboard.config?.fps || 30),
  };

  return { valido: erros.length === 0, erros, avisos, stats };
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const arquivo = args[0];

  if (!arquivo) {
    console.log("Uso: node validar.mjs <storyboard.json>");
    console.log("   Ou: node validar.mjs --projeto <nome>");
    process.exit(1);
  }

  let storyboardPath;

  if (args[0] === "--projeto") {
    storyboardPath = path.resolve(`projetos/${args[1]}/storyboard.json`);
  } else {
    storyboardPath = path.resolve(arquivo);
  }

  try {
    const conteudo = await fs.readFile(storyboardPath, "utf-8");
    const storyboard = JSON.parse(conteudo);

    console.log(`\n🔍 Validando: ${storyboardPath}`);
    console.log(`   ID: ${storyboard.id || "sem id"}`);
    console.log(`   Duração: ${storyboard.config?.durationInFrames || 0} frames (${(storyboard.config?.durationInFrames / (storyboard.config?.fps || 30)).toFixed(1)}s)`);

    const resultado = validarStoryboard(storyboard);

    if (resultado.valido) {
      console.log("\n✅ Storyboard VÁLIDO");
    } else {
      console.log("\n❌ Storyboard INVÁLIDO");
    }

    if (resultado.erros.length > 0) {
      console.log("\n🔴 ERROS:");
      resultado.erros.forEach(e => console.log(`   - ${e}`));
    }

    if (resultado.avisos.length > 0) {
      console.log("\n🟡 AVISOS:");
      resultado.avisos.forEach(a => console.log(`   - ${a}`));
    }

    console.log("\n📊 ESTATÍSTICAS:");
    console.log(`   Assets: ${resultado.stats.assets}`);
    console.log(`   Animações: ${resultado.stats.animacoes}`);
    console.log(`   Etapas: ${resultado.stats.etapas}`);
    console.log(`   Fluxos: ${resultado.stats.fluxos}`);
    console.log(`   Rastros: ${resultado.stats.rastros}`);
    console.log(`   Personagens: ${resultado.stats.personagens}`);
    console.log(`   Legendas: ${resultado.stats.legendas}`);
    console.log(`   Duração: ${resultado.stats.duracaoEstimada.toFixed(1)}s`);

    process.exit(resultado.valido ? 0 : 1);

  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`❌ Arquivo não encontrado: ${storyboardPath}`);
    } else if (err instanceof SyntaxError) {
      console.error(`❌ JSON inválido: ${err.message}`);
    } else {
      console.error(`❌ Erro: ${err.message}`);
    }
    process.exit(1);
  }
}

main();