// Miniatura: gerador de thumbnails para YouTube/TikTok/Reels
import React from "react";
import { useVideoConfig, AbsoluteFill, Still } from "remotion";
import { LegendaLinhaUnica } from "./Legenda";
import type { Vetor3 } from "./types";

interface MiniaturaBaseProps {
  /** Título principal */
  titulo: string;
  /** Subtítulo */
  subtitulo?: string;
  /** Frame do vídeo para usar como background (opcional) */
  frameBackground?: React.ReactNode;
  /** Cor de fundo sólida */
  corFundo?: string;
  /** Gradiente de fundo */
  gradiente?: string;
  /** Imagem de fundo (URL) */
  imagemFundo?: string;
  /** Estilo da miniatura */
  estilo?: "youtube" | "tiktok" | "reels" | "shorts" | "custom";
  /** Proporção customizada */
  proporcao?: { w: number; h: number };
  /** Logo/marca d'água */
  logo?: React.ReactNode;
  /** Posição do logo */
  logoPos?: "tl" | "tr" | "bl" | "br" | "center";
  /** Elementos extras (ícones, badges, etc) */
  extras?: React.ReactNode[];
}

const ESTILOS_MINIATURA = {
  youtube: { w: 1280, h: 720, tituloSize: 96, subtituloSize: 48, margem: 80 },
  tiktok: { w: 1080, h: 1920, tituloSize: 72, subtituloSize: 36, margem: 60 },
  reels: { w: 1080, h: 1920, tituloSize: 72, subtituloSize: 36, margem: 60 },
  shorts: { w: 1080, h: 1920, tituloSize: 72, subtituloSize: 36, margem: 60 },
  custom: { w: 1280, h: 720, tituloSize: 96, subtituloSize: 48, margem: 80 },
} as const;

export const Miniatura: React.FC<MiniaturaBaseProps> = ({
  titulo,
  subtitulo,
  frameBackground,
  corFundo = "#1a1a2e",
  gradiente,
  imagemFundo,
  estilo = "youtube",
  proporcao,
  logo,
  logoPos = "tr",
  extras = [],
}) => {
  const { width, height } = useVideoConfig();
  const cfg = proporcao ? { ...ESTILOS_MINIATURA.custom, w: proporcao.w, h: proporcao.h } : ESTILOS_MINIATURA[estilo];

  // Fundo
  const fundoStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundColor: corFundo,
    backgroundImage: gradiente ? `linear-gradient(${gradiente})` : undefined,
    backgroundSize: imagemFundo ? "cover" : undefined,
    backgroundPosition: imagemFundo ? "center" : undefined,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: cfg.margem,
    overflow: "hidden",
  };

  if (imagemFundo) {
    fundoStyle.backgroundImage = `url(${imagemFundo}), ${gradiente ? `linear-gradient(${gradiente})` : "none"}`;
  }

  // Posição do logo
  const logoPositions: Record<string, React.CSSProperties> = {
    tl: { position: "absolute", top: 40, left: 40 },
    tr: { position: "absolute", top: 40, right: 40 },
    bl: { position: "absolute", bottom: 40, left: 40 },
    br: { position: "absolute", bottom: 40, right: 40 },
    center: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  };

  return (
    <div style={{ width: cfg.w, height: cfg.h, position: "relative" }}>
      <div style={fundoStyle}>
        {frameBackground && <AbsoluteFill>{frameBackground}</AbsoluteFill>}

        {/* Overlay escuro para legibilidade */}
        {(gradiente || imagemFundo) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, #00000080 0%, #00000040 50%, #00000080 100%)",
            }}
          />
        )}

        {/* Título principal */}
        <div
          style={{
            textAlign: "center",
            zIndex: 10,
            maxWidth: "90%",
            textShadow: "0 4px 20px #000000cc, 0 0 40px #00000080",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: cfg.tituloSize,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            {titulo}
          </h1>

          {subtitulo && (
            <p
              style={{
                margin: "16px 0 0",
                fontSize: cfg.subtituloSize,
                fontWeight: 500,
                color: "#ffdd00",
                lineHeight: 1.3,
                textShadow: "0 2px 10px #000000aa",
              }}
            >
              {subtitulo}
            </p>
          )}
        </div>

        {/* Logo */}
        {logo && (
          <div style={logoPositions[logoPos]}>
            {logo}
          </div>
        )}

        {/* Extras */}
        {extras.map((extra, i) => (
          <div key={i} style={{ position: "absolute", zIndex: 20 }}>
            {extra}
          </div>
        ))}
      </div>
    </div>
  );
};

// Miniatura com frame do vídeo 3D
export const Miniatura3D: React.FC<{
  /** Componente da cena 3D */
  cena: React.ReactNode;
  /** Frame para capturar (em segundos) */
  frameSegundo?: number;
  /** Configurações da miniatura */
  config: Omit<MiniaturaBaseProps, "frameBackground">;
}> = ({ cena, frameSegundo = 1, config }) => {
  return (
    <Miniatura
      {...config}
      frameBackground={
        <Still frame={Math.round(frameSegundo * 30)}> // 30fps
          <div style={{ width: "100%", height: "100%" }}>{cena}</div>
        </Still>
      }
    />
  );
};

// Badge "NOVO" / "VIRAL" / etc
export const Badge: React.FC<{
  texto: string;
  cor?: string;
  corTexto?: string;
  tamanho?: "pequeno" | "medio" | "grande";
  rotacao?: number;
}> = ({ texto, cor = "#ff3366", corTexto = "#fff", tamanho = "medio", rotacao = -5 }) => {
  const sizes = {
    pequeno: { padding: "6 16", fontSize: 20, borderRadius: 20 },
    medio: { padding: "10 24", fontSize: 28, borderRadius: 30 },
    grande: { padding: "16 36", fontSize: 40, borderRadius: 40 },
  };
  const s = sizes[tamanho];

  return (
    <div
      style={{
        display: "inline-block",
        padding: `${s.padding}px`,
        backgroundColor: cor,
        color: corTexto,
        fontSize: s.fontSize,
        fontWeight: 900,
        borderRadius: s.borderRadius,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        boxShadow: `0 4px 20px ${cor}80`,
        transform: `rotate(${rotacao}deg)`,
      }}
    >
      {texto}
    </div>
  );
};

// Barra de progresso (para thumbnails de "parte 1/3")
export const BarraProgresso: React.FC<{
  atual: number;
  total: number;
  cor?: string;
  corFundo?: string;
  largura?: number;
  altura?: number;
  arredondado?: boolean;
}> = ({ atual, total, cor = "#ffdd00", corFundo = "#ffffff33", largura = 400, altura = 12, arredondado = true }) => {
  const pct = Math.max(0, Math.min(1, atual / total));

  return (
    <div
      style={{
        width: largura,
        height: altura,
        backgroundColor: corFundo,
        borderRadius: arredondado ? altura / 2 : 0,
        overflow: "hidden",
        boxShadow: "inset 0 2px 4px #00000040",
      }}
    >
      <div
        style={{
          width: `${pct * 100}%`,
          height: "100%",
          backgroundColor: cor,
          borderRadius: arredondado ? altura / 2 : 0,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
};

// Contador de visualizações fake (para thumbnails clickbait)
export const ContadorVisualizacoes: React.FC<{
  views: number | string;
  cor?: string;
  tamanho?: number;
  icone?: boolean;
}> = ({ views, cor = "#ffdd00", tamanho = 32, icone = true }) => {
  const formatar = (v: number | string) => {
    const n = typeof v === "string" ? parseInt(v) : v;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: cor,
        fontSize: tamanho,
        fontWeight: 700,
        textShadow: "0 2px 8px #00000080",
      }}
    >
      {icone && (
        <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-3.86 0-7-2.34-7-7s3.14-7 7-7 7 2.34 7 7-3.14 7-7 7zm0-9.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"/>
        </svg>
      )}
      {formatar(views)}
    </div>
  );
};

// Composição pronta para YouTube (1280x720)
export const MiniaturaYoutube: React.FC<{
  titulo: string;
  subtitulo?: string;
  cena?: React.ReactNode;
  frameSegundo?: number;
  corFundo?: string;
  gradiente?: string;
  logo?: React.ReactNode;
  badges?: string[];
}> = ({ titulo, subtitulo, cena, frameSegundo = 1.5, corFundo = "#0a0a1a", gradiente = "135deg, #1a1a3a 0%, #0a0a1a 100%", logo, badges = [] }) => {
  return (
    <Miniatura
      estilo="youtube"
      titulo={titulo}
      subtitulo={subtitulo}
      corFundo={corFundo}
      gradiente={gradiente}
      logo={logo}
      frameBackground={cena ? (
        <Still frame={Math.round(frameSegundo * 30)}>
          <div style={{ width: "100%", height: "100%", objectFit: "cover" }}>{cena}</div>
        </Still>
      ) : undefined}
      extras={badges.map((b, i) => (
        <Badge key={i} texto={b} cor="#ff3366" tamanho="medio" rotacao={i % 2 === 0 ? -8 : 8} />
      ))}
    />
  );
};

// Composição pronta para TikTok/Reels/Shorts (1080x1920)
export const MiniaturaVertical: React.FC<{
  titulo: string;
  subtitulo?: string;
  cena?: React.ReactNode;
  frameSegundo?: number;
  corFundo?: string;
  gradiente?: string;
  logo?: React.ReactNode;
  badges?: string[];
  contadorViews?: number;
}> = ({ titulo, subtitulo, cena, frameSegundo = 1.5, corFundo = "#0a0a1a", gradiente = "180deg, #1a1a3a 0%, #0a0a1a 100%", logo, badges = [], contadorViews }) => {
  return (
    <Miniatura
      estilo="tiktok"
      titulo={titulo}
      subtitulo={subtitulo}
      corFundo={corFundo}
      gradiente={gradiente}
      logo={logo}
      logoPos="tl"
      frameBackground={cena ? (
        <Still frame={Math.round(frameSegundo * 30)}>
          <div style={{ width: "100%", height: "100%", objectFit: "cover" }}>{cena}</div>
        </Still>
      ) : undefined}
      extras={[
        ...badges.map((b, i) => (
          <div key={`badge-${i}`} style={{ position: "absolute", top: 100 + i * 80, right: 60 }}>
            <Badge texto={b} cor="#ff3366" tamanho="medio" rotacao={i % 2 === 0 ? -8 : 8} />
          </div>
        )),
        contadorViews && (
          <div key="views" style={{ position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)" }}>
            <ContadorVisualizacoes views={contadorViews} cor="#ffdd00" tamanho={36} />
          </div>
        ),
      ].filter(Boolean)}
    />
  );
};