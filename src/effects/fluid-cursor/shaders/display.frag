// Adapted from webgl-fluid-cursor (MIT, Shahroz Adnan).
// Original fluid pipeline: splat → curl → vorticity → divergence → pressure → gradient → advect.
uniform sampler2D uDye;
uniform vec2 texelSize;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

// Repeated overlapping splats (fast movement, or dwelling in one spot) add up in the dye field
// with no inherent ceiling — left unbounded, that additive buildup pushes color values well past
// 1.0 in every channel at once, which clips to flat white instead of reading as "more intense,
// saturated color." This rolls values above 1.0 off gracefully toward a rich, vivid result instead
// — a safety ceiling, not a desaturation step, so colors stay vivid rather than washing out.
vec3 acesFilm(vec3 x) {
  float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec3 c = texture2D(uDye, vUv).rgb;

  // "Shading": treat local dye brightness as a heightfield and derive a fake normal from its
  // gradient, then apply simple diffuse lighting against a light pointed straight at the viewer.
  // Flat, unshaded color reads as smoke/gas. With this, edges and curls catch "light" and gain
  // subtle highlight/shadow variation depending on their local slope, which is what makes it read
  // as a glossy, dimensional liquid surface instead of a flat colored cloud.
  vec3 lc = texture2D(uDye, vL).rgb;
  vec3 rc = texture2D(uDye, vR).rgb;
  vec3 tc = texture2D(uDye, vT).rgb;
  vec3 bc = texture2D(uDye, vB).rgb;
  float dx = length(rc) - length(lc);
  float dy = length(tc) - length(bc);
  vec3 n = normalize(vec3(dx, dy, length(texelSize)));
  vec3 l = vec3(0.0, 0.0, 1.0);
  float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
  c *= diffuse;

  c = acesFilm(c);

  // Alpha comes from brightness, not a fixed 1.0 — combined with normal (non-additive) alpha
  // blending on the material (see main.js), this is what lets the dye cloud composite naturally
  // against the page background and fade smoothly to transparent at its edges, rather than either
  // stacking to white (pure additive) or hard-cutting at some threshold.
  float a = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c, a);
}
