// Legenda: componente de legenda palavra-por-palavra (estilo TikTok/Reels)
import React from "react";
import { useVideoConfig, useCurrentFrame, interpolateColors } from "remotion";
import type { Palavra } from "./types";

interface LegendaProps {
  palavras: Palavra[];
  /** Estilo da legenda */
  estilo?: "tiktok" | "youtube" | "minimal" | "karaoke";
  /** Cor do texto ativo */
  corAtiva?: string;
  /** Cor do texto inativo */
  corInativa?: string;
  /** Cor do fundo da caixa */
  corFundo?: string;
  /** Tamanho da fonte (em px, base 1080p) */
  fontSize?: number;
  /** Peso da fonte ativa */
  fontWeightAtivo?: number;
  /** Peso da fonte inativo */
  fontWeightInativo?: number;
  /** Posição vertical (0-1, 0.5 = centro) */
  posY?: number;
  /** Animação de entrada por palavra */
  animarEntrada?: boolean;
  /** Escala no highlight */
  escalaHighlight?: number;
}

const ESTILOS_PRESET = {
  tiktok: {
    corAtiva: "#ffffff",
    corInativa: "#ffffff80",
    corFundo: "#000000aa",
    fontSize: 72,
    fontWeightAtivo: 800,
    fontWeightInativo: 500,
    posY: 0.75,
    escalaHighlight: 1.15,
    borderRadius: 16,
    paddingX: 24,
    paddingY: 16,
    gap: 8,
    sombra: "0 4px 20px #00000080",
  },
  youtube: {
    corAtiva: "#ffffffff",
    corInativa: "#cccccccc",
    corFundo: "#000000cc",
    fontSize: 56,
    fontWeightAtivo: 700,
    fontWeightInativo: 400,
    posY: 0.82,
    escalaHighlight: 1.1,
    borderRadius: 12,
    paddingX: 20,
    paddingY: 12,
    gap: 6,
    sombra: "0 2px 12px #00000080",
  },
  minimal: {
    corAtiva: "#ffffffff",
    corInativa: "#aaaaaaff",
    corFundo: "transparent",
    fontSize: 48,
    fontWeightAtivo: 600,
    fontWeightInativo: 300,
    posY: 0.85,
    escalaHighlight: 1.05,
    borderRadius: 0,
    paddingX: 0,
    paddingY: 0,
    gap: 4,
    sombra: "none",
  },
  karaoke: {
    corAtiva: "#ffdd00ff",
    corInativa: "#ffffffff",
    corFundo: "#000000aa",
    fontSize: 64,
    fontWeightAtivo: 800,
    fontWeightInativo: 500,
    posY: 0.7,
    escalaHighlight: 1.2,
    borderRadius: 20,
    paddingX: 28,
    paddingY: 18,
    gap: 10,
    sombra: "0 0 30px #ffdd0080",
  },
} as const;

export const Legenda: React.FC<LegendaProps> = ({
  palavras,
  estilo = "tiktok",
  corAtiva,
  corInativa,
  corFundo,
  fontSize,
  fontWeightAtivo,
  fontWeightInativo,
  posY,
  animarEntrada = true,
  escalaHighlight,
}) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Merge config
  const preset = ESTILOS_PRESET[estilo];
  const cfg = {
    corAtiva: corAtiva ?? preset.corAtiva,
    corInativa: corInativa ?? preset.corInativa,
    corFundo: corFundo ?? preset.corFundo,
    fontSize: fontSize ?? preset.fontSize,
    fontWeightAtivo: fontWeightAtivo ?? preset.fontWeightAtivo,
    fontWeightInativo: fontWeightInativo ?? preset.fontWeightInativo,
    posY: posY ?? preset.posY,
    escalaHighlight: escalaHighlight ?? preset.escalaHighlight,
    borderRadius: preset.borderRadius,
    paddingX: preset.paddingX,
    paddingY: preset.paddingY,
    gap: preset.gap,
    sombra: preset.sombra,
  };

  // Encontra palavra ativa
  let palavraAtivaIdx = -1;
  let progressoPalavra = 0;

  for (let i = 0; i < palavras.length; i++) {
    const p = palavras[i];
    const inicio = Math.round(p.inicio * fps);
    const fim = Math.round(p.fim * fps);

    if (frame >= inicio && frame < fim) {
      palavraAtivaIdx = i;
      progressoPalavra = (frame - inicio) / (fim - inicio);
      break;
    } else if (frame >= fim && i === palavras.length - 1) {
      // Última palavra, mantém highlight no fim
      palavraAtivaIdx = i;
      progressoPalavra = 1;
    }
  }

  // Container style
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: `${cfg.posY * 100}%`,
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: cfg.gap,
    padding: `${cfg.paddingY}px ${cfg.paddingX}px`,
    borderRadius: cfg.borderRadius,
    backgroundColor: cfg.corFundo,
    boxShadow: cfg.sombra,
    pointerEvents: "none",
    zIndex: 100,
    maxWidth: width * 0.9,
  };

  return (
    <div style={containerStyle}>
      {palavras.map((p, i) => {
        const isAtivo = i === palavraAtivaIdx;
        const jaPassou = i < palavraAtivaIdx;
        const inicio = Math.round(p.inicio * fps);
        const fim = Math.round(p.fim * fps);
        const framePalavra = frame - inicio;

        // Animação de entrada
        let entradaOpacity = 1;
        let entradaScale = 1;
        let entradaY = 0;

        if (animarEntrada && frame < inicio) {
          const framesAntes = inicio - frame;
          if (framesAntes < 15) { // 0.5s antes
            const p = 1 - framesAntes / 15;
            entradaOpacity = p;
            entradaScale = 0.8 + p * 0.2;
            entradaY = (1 - p) * 20;
          } else {
            entradaOpacity = 0;
          }
        }

        // Highlight da palavra ativa
        let cor = cfg.corInativa;
        let weight = cfg.fontWeightInativo;
        let scale = 1;
        let bgHighlight = "transparent";

        if (isAtivo) {
          cor = cfg.corAtiva;
          weight = cfg.fontWeightAtivo;
          scale = cfg.escalaHighlight;
          // Background highlight animado
          bgHighlight = interpolateColors(
            ["transparent", cfg.corAtiva + "33", "transparent"],
            [0, 0.5, 1],
            progressoPalavra
          );
        } else if (jaPassou) {
          cor = cfg.corAtiva;
          weight = cfg.fontWeightAtivo;
        }

        const wordStyle: React.CSSProperties = {
          fontSize: `${cfg.fontSize}px`,
          fontWeight: weight,
          color: cor,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          transform: `translateY(${entradaY}px) scale(${entradaScale * scale})`,
          opacity: entradaOpacity,
          backgroundColor: bgHighlight,
          borderRadius: isAtivo ? 8 : 0,
          padding: isAtivo ? "2px 6px" : 0,
          transition: "all 0.05s ease-out",
          textShadow: "0 2px 8px #00000080",
        };

        return (
          <span
            key={`${i}-${p.texto}`}
            style={wordStyle}
            data-word={p.texto}
            data-index={i}
          >
            {p.texto}
          </span>
        );
      })}
    </div>
  );
};

// Legenda com destaque tipo "karaoke" - preenchimento progressivo
export const LegendaKaraoke: React.FC<LegendaProps & { corPreenchimento?: string }> = ({
  palavras,
  corPreenchimento = "#ffdd00",
  ...props
}) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const preset = ESTILOS_PRESET.karaoke;
  const cfg = {
    ...preset,
    corAtiva: props.corAtiva ?? preset.corAtiva,
    corInativa: props.corInativa ?? preset.corInativa,
    fontSize: props.fontSize ?? preset.fontSize,
    posY: props.posY ?? preset.posY,
  };

  let palavraAtivaIdx = -1;
  let progressoPalavra = 0;

  for (let i = 0; i < palavras.length; i++) {
    const p = palavras[i];
    const inicio = Math.round(p.inicio * fps);
    const fim = Math.round(p.fim * fps);

    if (frame >= inicio && frame < fim) {
      palavraAtivaIdx = i;
      progressoPalavra = (frame - inicio) / (fim - inicio);
      break;
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: `${cfg.posY * 100}%`,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: cfg.gap,
        padding: `${cfg.paddingY}px ${cfg.paddingX}px`,
        borderRadius: cfg.borderRadius,
        backgroundColor: cfg.corFundo,
        boxShadow: cfg.sombra,
        pointerEvents: "none",
        zIndex: 100,
        maxWidth: width * 0.9,
      }}
    >
      {palavras.map((p, i) => {
        const isAtivo = i === palavraAtivaIdx;
        const jaPassou = i < palavraAtivaIdx;
        const inicio = Math.round(p.inicio * fps);

        let entradaOpacity = 1;
        let entradaScale = 1;
        let entradaY = 0;

        if (frame < inicio) {
          const framesAntes = inicio - frame;
          if (framesAntes < 15) {
            const prog = 1 - framesAntes / 15;
            entradaOpacity = prog;
            entradaScale = 0.8 + prog * 0.2;
            entradaY = (1 - prog) * 20;
          } else {
            entradaOpacity = 0;
          }
        }

        let cor = jaPassou ? corPreenchimento : cfg.corInativa;
        let weight = jaPassou ? cfg.fontWeightAtivo : cfg.fontWeightInativo;
        let scale = 1;

        if (isAtivo) {
          weight = cfg.fontWeightAtivo;
          scale = cfg.escalaHighlight;
          // Gradiente de preenchimento
          cor = `linear-gradient(90deg, ${corPreenchimento} ${progressoPalavra * 100}%, ${cfg.corInativa} ${progressoPalavra * 100}%)`;
        }

        const wordStyle: React.CSSProperties = {
          fontSize: `${cfg.fontSize}px`,
          fontWeight: weight,
          color: typeof cor === "string" && cor.startsWith("linear") ? "transparent" : cor,
          backgroundImage: typeof cor === "string" && cor.startsWith("linear") ? cor : undefined,
          backgroundClip: typeof cor === "string" && cor.startsWith("linear") ? "text" : undefined,
          WebkitBackgroundClip: typeof cor === "string" && cor.startsWith("linear") ? "text" : undefined,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          transform: `translateY(${entradaY}px) scale(${entradaScale * scale})`,
          opacity: entradaOpacity,
          textShadow: "0 2px 8px #00000080",
        };

        return (
          <span key={`${i}-${p.texto}`} style={wordStyle}>
            {p.texto}
          </span>
        );
      })}
    </div>
  );
};

// Legenda de linha única (para textos curtos)
export const LegendaLinhaUnica: React.FC<{
  texto: string;
  inicio: number;
  fim: number;
  estilo?: "tiktok" | "youtube" | "minimal";
  cor?: string;
  fontSize?: number;
  posY?: number;
}> = ({ texto, inicio, fim, estilo = "tiktok", cor, fontSize, posY }) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const frameInicio = Math.round(inicio * fps);
  const frameFim = Math.round(fim * fps);

  if (frame < frameInicio || frame > frameFim) return null;

  const progresso = (frame - frameInicio) / (frameFim - frameInicio);
  const preset = ESTILOS_PRESET[estilo];

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: `${(posY ?? preset.posY) * 100}%`,
    transform: `translate(-50%, -50%) scale(${0.9 + progresso * 0.1})`,
    opacity: progresso < 0.1 ? progresso * 10 : progresso > 0.9 ? (1 - progresso) * 10 : 1,
    padding: `${preset.paddingY}px ${preset.paddingX}px`,
    borderRadius: preset.borderRadius,
    backgroundColor: preset.corFundo,
    boxShadow: preset.sombra,
    pointerEvents: "none",
    zIndex: 100,
  };

  const textStyle: React.CSSProperties = {
    fontSize: `${fontSize ?? preset.fontSize}px`,
    fontWeight: preset.fontWeightAtivo,
    color: cor ?? preset.corAtiva,
    textShadow: "0 2px 8px #00000080",
    whiteSpace: "nowrap",
  };

  return (
    <div style={containerStyle}>
      <span style={textStyle}>{texto}</span>
    </div>
  );
};