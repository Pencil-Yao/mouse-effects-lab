// Two images are composited by a liquid mask derived from the wave field.
// Clean-room reconstruction of the mask-reveal idea in mouse-effects (unlicensed reference).
uniform sampler2D uBaseTexture;
uniform sampler2D uRevealTexture;
uniform sampler2D uDisplacement;
uniform vec2 uSimResolution;
uniform float uBaseAspect;
uniform float uRevealAspect;
uniform float uViewportAspect;
uniform float uRevealSize;
uniform float uEdgeSoftness;
uniform float uDistortionStrength;
uniform float uLightIntensity;
uniform float uSpecularPower;
varying vec2 vUv;

vec2 coverUv(vec2 uv, float imageAspect, float planeAspect) {
  vec2 ratio = vec2(
    min(planeAspect / imageAspect, 1.0),
    min(imageAspect / planeAspect, 1.0)
  );
  return vec2(
    uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    uv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
}

vec3 waveNormal(vec2 uv, float strength) {
  vec2 texel = 1.0 / uSimResolution;
  float l = texture2D(uDisplacement, uv - vec2(texel.x, 0.0)).r;
  float r = texture2D(uDisplacement, uv + vec2(texel.x, 0.0)).r;
  float t = texture2D(uDisplacement, uv + vec2(0.0, texel.y)).r;
  float b = texture2D(uDisplacement, uv - vec2(0.0, texel.y)).r;
  return normalize(vec3((l - r) * strength, (b - t) * strength, 1.0));
}

void main() {
  float displacement = texture2D(uDisplacement, vUv).r;
  vec3 normal = waveNormal(vUv, 42.0);
  float ripple = smoothstep(0.01, 0.1, length(normal.xy));

  vec2 distortion = normal.xy * uDistortionStrength;
  vec2 baseUv = coverUv(clamp(vUv + distortion, 0.001, 0.999), uBaseAspect, uViewportAspect);
  vec2 revealUv = coverUv(clamp(vUv + distortion, 0.001, 0.999), uRevealAspect, uViewportAspect);

  vec3 base = texture2D(uBaseTexture, baseUv).rgb;
  vec3 reveal = texture2D(uRevealTexture, revealUv).rgb;

  float mask = smoothstep(0.0, max(uEdgeSoftness, 0.001), displacement * uRevealSize);
  vec3 color = mix(base, reveal, clamp(mask, 0.0, 1.0));

  vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
  vec3 halfDir = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float specular = pow(max(dot(normal, halfDir), 0.0), uSpecularPower);
  color += vec3(specular * uLightIntensity * ripple);

  float fresnel = pow(1.0 - max(normal.z, 0.0), 2.0);
  color += vec3(fresnel * uLightIntensity * 0.16 * ripple);

  gl_FragColor = vec4(color, 1.0);
}
