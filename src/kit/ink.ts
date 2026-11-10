// Contorno de tinta (ink) - camada NOINK para elementos que não devem ter contorno
import * as THREE from "three";

export const NOINK = 1; // layer 1 = sem contorno de tinta

export const setupInk = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => {
  // Sobrescreve render para adicionar contorno via shader
  // Implementação simplificada - usa MeshToonMaterial com gradientMap
  // O contorno real seria feito com post-processing (Sobel/Edge detection)
  // Por enquanto, MeshToonMaterial já dá o visual "cartoon 2 tons"

  return {
    // Marca objeto para NÃO receber contorno
    noInk: (obj: THREE.Object3D) => {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.layers.set(NOINK);
        }
      });
    },

    // Marca objeto para RECEBER contorno (padrão)
    withInk: (obj: THREE.Object3D) => {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.layers.enable(0);
          child.layers.disable(NOINK);
        }
      });
    },
  };
};

// Shader de contorno simples (para uso futuro com EffectComposer)
export const inkShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float edgeWidth;
    uniform vec3 edgeColor;
    void main() {
      float edge = 1.0 - abs(dot(normalize(vNormal), normalize(vPosition)));
      edge = smoothstep(0.0, edgeWidth, edge);
      vec3 color = mix(vec3(1.0), edgeColor, edge);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  uniforms: {
    edgeWidth: { value: 0.02 },
    edgeColor: { value: new THREE.Color(0x1a1a2e) },
  },
};