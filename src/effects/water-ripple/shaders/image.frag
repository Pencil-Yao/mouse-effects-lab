// Refraction + chromatic aberration + specular highlights driven by the wave field.
// Clean-room reconstruction of the water distortion idea in mouse-effects (unlicensed reference).
uniform sampler2D uTexture;
uniform sampler2D uDisplacement;
uniform vec2 uSimResolution;
uniform float uImageAspect;
uniform float uViewportAspect;
uniform float uDistortionStrength;
uniform float uAberration;
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
  vec3 n;
  n.x = (l - r) * strength;
  n.y = (b - t) * strength;
  n.z = 1.0;
  return normalize(n);
}

void main() {
  vec2 baseUv = coverUv(vUv, uImageAspect, uViewportAspect);
  vec3 normal = waveNormal(vUv, 42.0);
  float ripple = smoothstep(0.01, 0.12, length(normal.xy));

  vec2 refracted = baseUv + normal.xy * uDistortionStrength;
  refracted = clamp(refracted, 0.001, 0.999);

  float shift = uAberration * (abs(normal.x) + abs(normal.y));
  vec3 color = vec3(
    texture2D(uTexture, refracted + vec2(shift, 0.0)).r,
    texture2D(uTexture, refracted).g,
    texture2D(uTexture, refracted - vec2(shift, 0.0)).b
  );

  vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
  vec3 halfDir = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float specular = pow(max(dot(normal, halfDir), 0.0), uSpecularPower);
  specular *= uLightIntensity * ripple;
  color += vec3(specular);

  float fresnel = pow(1.0 - max(normal.z, 0.0), 2.0);
  color += vec3(fresnel * uLightIntensity * 0.15 * ripple);

  gl_FragColor = vec4(color, 1.0);
}
