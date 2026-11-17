// Adapted from a-reactive-particle-system (MIT, John Roussos).
precision highp float;

varying vec2 vUv;
varying vec2 vPUv;
varying float vTouch;

uniform sampler2D uTexture;
uniform float uThreshold;
uniform float uBrightness;

void main() {
  vec4 tex = texture2D(uTexture, vPUv);
  if (tex.r + tex.g + tex.b <= uThreshold) discard;

  float border = 0.3;
  float radius = 0.5;
  float dist = radius - distance(vUv, vec2(0.5));
  float t = smoothstep(0.0, border, dist);

  vec3 rippleGlow = vec3(0.42, 0.78, 1.0) * clamp(vTouch, 0.0, 1.0) * 1.4;
  gl_FragColor = vec4(tex.rgb * uBrightness + rippleGlow, t);
}
