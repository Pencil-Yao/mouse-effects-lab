// Adapted from a-reactive-particle-system (MIT, John Roussos).
// Original technique: Bruno Imbrizi, "Interactive Particles with Three.js".
precision highp float;

attribute vec3 offset;
attribute float pindex;

varying vec2 vUv;
varying vec2 vPUv;
varying float vTouch;

uniform float uTime;
uniform float uRandom;
uniform float uSize;
uniform float uDepth;
uniform float uForce;
uniform float uNoiseSpeed;

uniform vec2 uTextureSize;
uniform sampler2D uRayTexture;
uniform sampler2D uTexture;
uniform vec2 uPointer;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
             + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                          dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float random(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
  vUv = uv;
  vec2 puv = offset.xy / uTextureSize;
  vPUv = puv;

  vec4 tex = texture2D(uTexture, puv);
  float colorIntensity = tex.r * 0.27 + tex.g * 0.52 + tex.b * 0.31;

  vec3 displaced = offset;
  float rndz = random(pindex) + snoise(vec2(pindex * 0.1, uTime * uNoiseSpeed));
  displaced.xy += vec2(random(pindex) - 0.5, random(offset.x + pindex) - 0.5) * uRandom;
  displaced.z += rndz * (random(pindex) * 2.0 * (sin(pindex) + 5.0) * uDepth);
  displaced.xy -= uTextureSize * 0.5;

  float t = texture2D(uRayTexture, puv).r;
  vTouch = t;
  vec2 delta = puv - uPointer;
  delta.x *= uTextureSize.x / max(uTextureSize.y, 1.0);
  vec2 dir = delta / max(length(delta), 0.0001);
  displaced.x += dir.x * t * 26.0 * uForce;
  displaced.y += dir.y * t * 26.0 * uForce;
  displaced.z += t * 42.0 * rndz * uForce;

  float psize = snoise(vec2(uTime, pindex) * 0.5) + 2.0;
  psize *= max(colorIntensity, 0.2);
  psize *= max(uSize * 2.0, 0.25);

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  mvPosition.xyz += position * psize;
  gl_Position = projectionMatrix * mvPosition;
}
