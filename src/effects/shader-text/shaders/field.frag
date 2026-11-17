// Text warped by a JS-written flow field, colourised by field speed.
// Inspired by cursor-shader-trail (MIT, Bautista Berto) — WebGPU/TSL original,
// reimplemented as a small WebGL2 / GLSL pipeline.
uniform sampler2D uTrail;
uniform sampler2D uText;
uniform vec2 uTexel;
uniform float uWarp;
uniform float uIntensity;
uniform float uTime;
uniform float uViewportAspect;
uniform float uTextAspect;
uniform vec3 uLow;
uniform vec3 uHigh;
uniform vec3 uBg;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 r = uTexel;
  vec4 trail = texture2D(uTrail, vUv) * 0.25;
  trail += texture2D(uTrail, vUv + vec2(r.x, 0.0)) * 0.125;
  trail += texture2D(uTrail, vUv - vec2(r.x, 0.0)) * 0.125;
  trail += texture2D(uTrail, vUv + vec2(0.0, r.y)) * 0.125;
  trail += texture2D(uTrail, vUv - vec2(0.0, r.y)) * 0.125;
  trail += texture2D(uTrail, vUv + r) * 0.0625;
  trail += texture2D(uTrail, vUv - r) * 0.0625;
  trail += texture2D(uTrail, vUv + vec2(r.x, -r.y)) * 0.0625;
  trail += texture2D(uTrail, vUv + vec2(-r.x, r.y)) * 0.0625;

  float speed = clamp(trail.b, 0.0, 1.0);
  vec2 warped = vUv + trail.rg * uWarp;

  vec2 ratio = vec2(
    min(uViewportAspect / uTextAspect, 1.0),
    min(uTextAspect / uViewportAspect, 1.0)
  );
  vec2 textUv = (warped - 0.5) * ratio + 0.5;
  float mask = texture2D(uText, textUv).r;

  vec3 base = uBg + vec3(0.93, 0.95, 1.0) * mask;

  float lowMid = smoothstep(0.0, 0.55, speed);
  float high = smoothstep(0.55, 1.0, speed);
  vec3 trailColor = mix(mix(uLow, uHigh, lowMid), vec3(1.0), high * 0.45);
  float glow = pow(speed, 0.8);

  vec3 color = base + trailColor * glow * uIntensity * (0.35 + mask * 0.65);

  float grain = (hash(vUv * vec2(910.0, 520.0) + uTime * 0.37) - 0.5) * 0.035;
  color += grain;

  vec2 cv = vUv - 0.5;
  color *= 1.0 - dot(cv, cv) * 0.55;

  gl_FragColor = vec4(color, 1.0);
}
