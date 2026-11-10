// Root: Registro de composições Remotion + configuração global
import React from "react";
import { Config, Composition, registerRoot } from "remotion";
import { Cena3D } from "./Cena3DTest";

// Configuração global
Config.EnableProfiling = false;
Config.ChromiumOpenGlRenderer = "angle";
Config.Parallelism = navigator.hardwareConcurrency || 4;

// ===== COMPOSIÇÃO PRINCIPAL: VÍDEO 3D =====
export const Video3D: React.FC = () => {
  return (
    <Cena3D />
  );
};

// ===== REGISTRO DAS COMPOSIÇÕES =====
export const Root: React.FC = () => {
  return null;
};

// Registra root para desenvolvimento
if (typeof window !== "undefined" && (window as any).__REMOTION_DEV__) {
  registerRoot(<Root />);
}

export default Root;