// Sistema de tempo, curvas e cues (sincronização palavra-frames)
export const FPS = 30;

/** Converte segundos em frames */
export const frames = (segundos: number) => Math.round(segundos * FPS);

/** Converte frames em segundos */
export const segundos = (frames: number) => frames / FPS;

/** Duração total em frames a partir do words.json */
export const quadros = (words: { fim: number }[]) =>
  words.length > 0 ? frames(words[words.length - 1].fim + 0.5) : frames(10);

/** Curvas de interpolação */
export const curvas = {
  linear: (t: number) => t,
  ss: (t: number) => t * t * (3 - 2 * t),           // smoothstep
  sss: (t: number) => {                             // smootherstep
    const t2 = t * t;
    const t3 = t2 * t;
    return 6 * t3 * t2 - 15 * t3 * t + 10 * t3;
  },
  pop: (t: number) => 1 - Math.pow(1 - t, 3),       // ease out cubic
  kick: (t: number) => Math.sin(t * Math.PI),       // impulso (sobe e desce)
  lerp: (t: number, a: number, b: number) => a + (b - a) * t,
  clamp: (t: number, min: number, max: number) => Math.max(min, Math.min(max, t)),
};

/** Interpola com curva */
export const interpolar = (t: number, a: number, b: number, curva: keyof typeof curvas = "ss") =>
  a + (b - a) * curvas[curva](t);

/** Interpola Vetor3 com curva */
export const interpolarV3 = (t: number, a: {x:number,y:number,z:number}, b: {x:number,y:number,z:number}, curva: keyof typeof curvas = "ss") => ({
  x: interpolar(t, a.x, b.x, curva),
  y: interpolar(t, a.y, b.y, curva),
  z: interpolar(t, a.z, b.z, curva),
});

/** Cria função de cue a partir de words.json */
export interface CueFn {
  (regex: string | RegExp, depoisDe?: number, reserva?: number): number;
  palavras: { palavra: string; inicio: number; fim: number }[];
}

export const criarCue = (words: { palavra: string; inicio: number; fim: number }[]): CueFn => {
  const fn = (regex: string | RegExp, depoisDe = 0, reserva = 0) => {
    const re = typeof regex === "string" ? new RegExp(regex) : regex;
    for (let i = 0; i < words.length; i++) {
      if (re.test(words[i].palavra)) {
        const frame = frames(words[i].inicio) - 2; // adianta 2 frames
        return Math.max(0, frame + frames(depoisDe) + frames(reserva));
      }
    }
    return frames(depoisDe) + frames(reserva);
  };
  return Object.assign(fn, { palavras: words });
};

/** Sequencia de frames para remotion */
export const frameRange = (inicio: number, fim: number) =>
  Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);

/** Normaliza tempo 0-1 dentro de um intervalo */
export const normalizar = (t: number, inicio: number, fim: number) =>
  Math.max(0, Math.min(1, (t - inicio) / (fim - inicio)));

/** Delay em frames */
export const delay = (frames: number) => frames;

/** Loop de tempo */
export const loop = (t: number, duracao: number) => t % duracao;

/** Ping-pong (vai e volta) */
export const pingPong = (t: number, duracao: number) => {
  const ciclo = Math.floor(t / duracao);
  const fase = t % duracao;
  return ciclo % 2 === 0 ? fase : duracao - fase;
};