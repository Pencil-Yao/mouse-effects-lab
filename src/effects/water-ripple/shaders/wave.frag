// Wave-equation ripple field (ping-pong render targets).
// Clean-room reconstruction of the ripple idea in mouse-effects (unlicensed reference).
uniform sampler2D uPrevState;
uniform sampler2D uCurrentState;
uniform vec2 uResolution;
uniform float uViscosity;
uniform float uDecay;
uniform float uAspect;
uniform vec2 uMouse;
uniform vec2 uPrevMouse;
uniform float uRadius;
uniform float uIntensity;
uniform float uMouseVelocity;
varying vec2 vUv;

void main() {
  vec2 texel = 1.0 / uResolution;
  float current = texture2D(uCurrentState, vUv).r;
  float prev = texture2D(uPrevState, vUv).r;

  float left = texture2D(uCurrentState, vUv + vec2(-texel.x, 0.0)).r;
  float right = texture2D(uCurrentState, vUv + vec2(texel.x, 0.0)).r;
  float top = texture2D(uCurrentState, vUv + vec2(0.0, texel.y)).r;
  float bottom = texture2D(uCurrentState, vUv + vec2(0.0, -texel.y)).r;

  float neighbors = (left + right + top + bottom) * 0.25;
  float wave = neighbors * 2.0 - prev;
  wave = mix(current, wave, uViscosity);
  wave *= uDecay;

  if (uMouseVelocity > 0.0001) {
    vec2 mouseA = uMouse * vec2(uAspect, 1.0);
    vec2 uvA = vUv * vec2(uAspect, 1.0);
    float ripple = smoothstep(uRadius, 0.0, distance(uvA, mouseA));
    ripple = pow(ripple, 2.0);

    for (float i = 0.0; i < 8.0; i++) {
      float t = i / 8.0;
      vec2 trail = mix(uPrevMouse, uMouse, t) * vec2(uAspect, 1.0);
      float d = distance(uvA, trail);
      ripple = max(ripple, pow(smoothstep(uRadius * 0.72, 0.0, d), 2.0));
    }

    wave += ripple * uIntensity * min(uMouseVelocity * 10.0, 1.0);
  }

  gl_FragColor = vec4(wave, wave, wave, 1.0);
}
