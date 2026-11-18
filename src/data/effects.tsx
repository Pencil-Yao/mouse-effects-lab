import type { CategoryMeta, EffectMeta } from '../types'

import SpringTrail from '../effects/spring-trail'
import DotTrail from '../effects/dot-trail'
import PixelParticles from '../effects/pixel-particles'
import ClickBurst from '../effects/click-burst'
import ImageTrail from '../effects/image-trail'
import ImageFollow from '../effects/image-follow'
import MagneticElements from '../effects/magnetic-elements'
import GellyCursor from '../effects/gelly-cursor'
import SpotlightCards from '../effects/spotlight-cards'
import Flashlight from '../effects/flashlight'
import InvertLens from '../effects/invert-lens'
import FluidCursor from '../effects/fluid-cursor'
import WaterRipple from '../effects/water-ripple'
import MaskReveal from '../effects/mask-reveal'
import ShaderText from '../effects/shader-text'
import ImageTrailX from '../effects/image-trail-x'
import MorphingBlob from '../effects/morphing-blob'
import FireTrail from '../effects/fire-trail'
import Constellation from '../effects/constellation'
import BAClick from '../effects/ba-click'
import IceCrystal from '../effects/ice-crystal'
import MistCloud from '../effects/mist-cloud'
import CodeTrail from '../effects/code-trail'
import FishSchool from '../effects/fish-school'
import Radar from '../effects/radar'





















export const categories: CategoryMeta[] = [
  {
    id: 'fluid',
    title: 'Fluid Effect',
    blurb: 'A full GPU fluid solver — velocity, pressure projection, vorticity and coloured dye.',
  },
  {
    id: 'cursor-trail',
    title: 'Cursor Trail',
    blurb: 'Canvas-drawn paths that remember the pointer. Two takes: spring physics and fading dots.',
  },
  {
    id: 'particle-trail',
    title: 'Particle Trail',
    blurb: 'Thousands of GPU instances, or a small burst pool — particles that react to presence and clicks.',
  },
  {
    id: 'image-trail',
    title: 'Image Trail',
    blurb: 'Photographic residue. Images are spawned by pointer distance and animated with GSAP.',
  },
  {
    id: 'magnetic-cursor',
    title: 'Magnetic Cursor',
    blurb: 'The interface leans toward the pointer. Includes DOM magnetics and a jelly custom cursor.',
  },
  {
    id: 'spotlight',
    title: 'Spotlight & Lens',
    blurb: 'Light, darkness and blend modes. The pointer becomes an optical instrument.',
  },
  {
    id: 'liquid',
    title: 'Liquid Distortion',
    blurb: 'Wave fields refract images, reveal a second layer, and warp typography.',
  },
]

export const effects: EffectMeta[] = [
  {
    id: 'spring-trail',
    index: '02',
    title: 'Spring Glow Trail',
    tagline: 'Twenty spring-driven curves chase the pointer and settle with a soft overshoot.',
    category: 'Cursor Trail',
    tech: 'Canvas 2D',
    hint: 'Move inside the stage',
    defaults: {
      trails: 20,
      length: 46,
      lineWidth: 3,
      glow: true,
      spring: 0.42,
      friction: 0.7,
      hue: 224,
      hueSpeed: 1.2,
    },
    groups: [
      {
        title: 'Trail',
        controls: [
          { kind: 'slider', key: 'trails', label: 'Trails', min: 4, max: 40, step: 1 },
          { kind: 'slider', key: 'length', label: 'Points', min: 10, max: 100, step: 1 },
          { kind: 'slider', key: 'lineWidth', label: 'Line width', min: 1, max: 10, step: 0.5, unit: 'px' },
          { kind: 'toggle', key: 'glow', label: 'Glow' },
        ],
      },
      {
        title: 'Physics & colour',
        controls: [
          { kind: 'slider', key: 'spring', label: 'Spring', min: 0.1, max: 0.9, step: 0.01 },
          { kind: 'slider', key: 'friction', label: 'Friction', min: 0.5, max: 0.95, step: 0.01 },
          { kind: 'slider', key: 'hue', label: 'Hue', min: 0, max: 360, step: 1, unit: '°' },
          { kind: 'slider', key: 'hueSpeed', label: 'Hue drift', min: 0, max: 4, step: 0.1 },
        ],
      },
    ],

    source: {
      project: 'Cursor-Trial-Effect',
      projectUrl: 'https://github.com/amantha6/Cursor-Trial-Effect',
      originalPath: 'script.js → class Line, render()',
      license: 'No license file — reference only',
      licenseNote:
        'No source code is reproduced; the spring-trail behaviour was rewritten from scratch for this lab.',
      tech: ['Canvas 2D', 'Spring physics', 'quadraticCurveTo', 'lighter composite'],
      principle:
        'Every trail keeps its own position and velocity. Each frame it integrates vx += (pointer - x) * spring, multiplies by friction, and appends the result to a point history. Points are joined with midpoint quadratic curves and drawn additively in a cycling HSL hue.',
      reconstruction:
        'Extracted into an engine class with resize-observer sizing, DPR limiting, live uniforms from a settings ref, and full listener/rAF cleanup. Per-line physics jitter is kept.',
    },
    component: SpringTrail,
  },
  {
    id: 'dot-trail',
    index: '03',
    title: 'Fading Dot Trail',
    tagline: 'A compact canvas overlay of decaying dots, oldest points smaller and dimmer.',
    category: 'Cursor Trail',
    tech: 'Canvas 2D',
    hint: 'Move inside the stage',
    defaults: {
      color: '#9db4ff',
      size: 7,
      length: 26,
      decay: 0.045,
      blur: 1.5,
    },
    groups: [
      {
        title: 'Dots',
        controls: [
          { kind: 'color', key: 'color', label: 'Colour' },
          { kind: 'slider', key: 'size', label: 'Size', min: 1, max: 20, step: 0.5, unit: 'px' },
          { kind: 'slider', key: 'length', label: 'History', min: 4, max: 80, step: 1 },
        ],
      },
      {
        title: 'Fade',
        controls: [
          { kind: 'slider', key: 'decay', label: 'Decay', min: 0.005, max: 0.15, step: 0.005 },
          { kind: 'slider', key: 'blur', label: 'Blur', min: 0, max: 6, step: 0.5, unit: 'px' },
        ],
      },
    ],

    source: {
      project: 'mouse-animations',
      projectUrl: 'https://github.com/tgomilar/mouse-animations',
      originalPath: 'src/animations/trail.ts, src/core/canvas-overlay.ts',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['Canvas 2D', 'rAF', 'lerp-free point history'],
      principle:
        'A global pointer tracker pushes {x, y, alpha} on every mousemove. The render loop clears the overlay, draws each point at a size/alpha ratio based on its age, subtracts a decay constant, and drops dead points.',
      reconstruction:
        'Moved into a self-contained engine with a per-card canvas instead of a body-level singleton overlay. Color, size, history length, decay and blur are exposed as live controls.',
    },
    component: DotTrail,
  },
  {
    id: 'pixel-particles',
    index: '05',
    title: 'Pixel Particle Portrait',
    tagline: 'Every pixel of an image becomes an instanced quad; the pointer pushes them outward and in depth.',
    category: 'Particle Trail',
    tech: 'Three.js + GLSL',
    hint: 'Move across the card',
    wide: false,
    defaults: {
      image: 'art/particles/blossom.png',
      resolution: 140,
      size: 0.7,
      depth: 6,
      mouseForce: 0.5,
      noiseSpeed: 0.45,
      threshold: 0.35,
      brightness: 1.1,
    },
    groups: [
      {
        title: 'Particles',
        controls: [
          {
            kind: 'select',
            key: 'image',
            label: 'Source image',
            options: [
              { value: 'art/particles/blossom.png', label: 'Blossom' },
              { value: 'art/particles/daisy.jpg', label: 'Daisy' },
              { value: 'art/particles/african-daisy.jpg', label: 'African daisy' },
              { value: 'art/particles/blue.jpg', label: 'Blue' },
            ],
          },
          { kind: 'slider', key: 'resolution', label: 'Grid resolution', min: 80, max: 200, step: 10, hint: 'Rebuilds the instance buffer when changed.' },
          { kind: 'slider', key: 'size', label: 'Particle size', min: 0.2, max: 2, step: 0.05 },
          { kind: 'slider', key: 'depth', label: 'Depth spread', min: 0, max: 30, step: 0.5 },
          { kind: 'slider', key: 'brightness', label: 'Brightness', min: 0.4, max: 2, step: 0.05 },
        ],
      },
      {
        title: 'Interaction',
        controls: [
          { kind: 'slider', key: 'mouseForce', label: 'Pointer force', min: 0, max: 4, step: 0.05 },
          { kind: 'slider', key: 'noiseSpeed', label: 'Noise speed', min: 0, max: 2, step: 0.05 },
          { kind: 'slider', key: 'threshold', label: 'Dark cutoff', min: 0, max: 1.5, step: 0.05 },
        ],
      },
    ],

    source: {
      project: 'a-reactive-particle-system',
      projectUrl: 'https://github.com/JRoussos/a-reactive-particle-system',
      originalPath: 'src/App.js, src/shaders.js, src/interactivity.js',
      license: 'MIT',
      licenseNote:
        'Adapted with attribution. The original demo itself credits Bruno Imbrizi’s Codrops article for the offscreen pointer-texture technique.',
      tech: ['React Three Fiber', 'InstancedBufferGeometry', 'GLSL simplex noise', 'raycasting'],
      principle:
        'The image is quantised into a pixel grid. One quad is instanced per pixel; a vertex shader reads the pixel colour and a 64×64 offscreen "touch" canvas to displace each instance. A raycaster maps the pointer into the image plane so pointer speed can be painted into that touch texture.',
      reconstruction:
        'Rewritten without React Three Fiber as a plain Three.js engine. The image is downsampled to a controllable grid, all pixel quads are instanced, and the touch canvas is retained as a real texture. The pointer now pushes particles radially away from the intersection point and in depth; a ray-plane mapping keeps the whole card interactive even outside the square portrait. Resolution, particle size, depth, pointer force, noise speed and dark cutoff are live parameters.',
    },
    component: PixelParticles,
  },
  {
    id: 'click-burst',
    index: '06',
    title: 'Click Particle Burst',
    tagline: 'A radial burst of coloured particles with gravity, drag and per-particle alpha.',
    category: 'Particle Trail',
    tech: 'Canvas 2D',
    hint: 'Click or tap the stage',
    defaults: {
      count: 26,
      size: 5,
      spread: 10,
      gravity: 0.16,
      decay: 0.018,
      palette: 'neon',
    },
    groups: [
      {
        title: 'Burst',
        controls: [
          { kind: 'slider', key: 'count', label: 'Particles', min: 6, max: 100, step: 1 },
          { kind: 'slider', key: 'size', label: 'Max radius', min: 1, max: 16, step: 0.5, unit: 'px' },
          { kind: 'slider', key: 'spread', label: 'Speed', min: 2, max: 24, step: 0.5 },
          {
            kind: 'select',
            key: 'palette',
            label: 'Palette',
            options: [
              { value: 'neon', label: 'Neon' },
              { value: 'warm', label: 'Warm' },
              { value: 'ice', label: 'Ice' },
              { value: 'confetti', label: 'Confetti' },
            ],
          },
        ],
      },
      {
        title: 'Physics',
        controls: [
          { kind: 'slider', key: 'gravity', label: 'Gravity', min: 0, max: 0.6, step: 0.01 },
          { kind: 'slider', key: 'decay', label: 'Alpha decay', min: 0.005, max: 0.06, step: 0.001 },
        ],
      },
    ],

    source: {
      project: 'mouse-animations',
      projectUrl: 'https://github.com/tgomilar/mouse-animations',
      originalPath: 'src/animations/particles.ts',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['Canvas 2D', 'Euler integration', 'object pooling'],
      principle:
        'A click spawns a ring of particles with random speed. Each frame advances position, applies gravity and drag, decays alpha, and draws with additive blending. Dead particles are filtered out.',
      reconstruction:
        'Independent engine with palette selection, live particle count/size/speed/gravity/decay, a hard pool cap, and full cleanup. The interaction also works with touch because it listens to pointerdown.',
    },
    component: ClickBurst,
  },
  {
    id: 'image-trail',
    index: '13',
    title: 'GSAP Image Trail',
    tagline: 'Photographs are dropped along the pointer path, then scale, blur and fade away.',
    category: 'Image Trail',
    tech: 'GSAP + DOM',
    hint: 'Sweep across the stage',
    defaults: {
      threshold: 80,
      lag: 0.12,
      imageSize: 170,
      variant: 'classic',
    },
    groups: [
      {
        title: 'Trail',
        controls: [
          { kind: 'slider', key: 'threshold', label: 'Spawn distance', min: 30, max: 200, step: 5, unit: 'px' },
          { kind: 'slider', key: 'lag', label: 'Trailing lag', min: 0.03, max: 0.5, step: 0.01 },
          { kind: 'slider', key: 'imageSize', label: 'Image size', min: 90, max: 280, step: 5, unit: 'px' },
          {
            kind: 'select',
            key: 'variant',
            label: 'Variant',
            options: [
              { value: 'classic', label: 'Classic' },
              { value: 'pop', label: 'Pop' },
              { value: 'speed', label: 'Speed-reactive' },
            ],
          },
        ],
      },
    ],

    source: {
      project: 'MotionTrailAnimations (Codrops)',
      projectUrl: 'https://github.com/codrops/MotionTrailAnimations',
      originalPath: 'js/trail.js, js/demo1/imageTrail.js, js/demo2/imageTrail.js, js/demo6/imageTrail.js',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['GSAP', 'DOM transforms', 'pointer distance accumulator'],
      principle:
        'A trailing position lags the pointer. Once the pointer has travelled a threshold distance, the engine interpolates evenly spaced spawn points along the segment and hands the next pooled image to the variant. Each variant is a GSAP timeline: move, scale, filter, fade.',
      reconstruction:
        'Merged demos 1, 2 and 6 into one effect with a variant selector. Rebuilt as a React component with a 16-node image pool, a distance-threshold spawner, live threshold/lag/size controls, and gsap.ticker cleanup. Local MIT-licensed artwork is used.',
    },
    component: ImageTrail,
  },
  {
    id: 'image-follow',
    index: '14',
    title: 'Image Follow Cursor',
    tagline: 'Sequential images pop in at the pointer, drift into place, then shrink away.',
    category: 'Image Trail',
    tech: 'GSAP + DOM',
    hint: 'Move around, avoid the caption',
    defaults: {
      width: 180,
      height: 180,
      minDistance: 120,
      duration: 0.7,
      ease: 'power3.out',
    },
    groups: [
      {
        title: 'Spawn',
        controls: [
          { kind: 'slider', key: 'width', label: 'Width', min: 80, max: 320, step: 5, unit: 'px' },
          { kind: 'slider', key: 'height', label: 'Height', min: 80, max: 320, step: 5, unit: 'px' },
          { kind: 'slider', key: 'minDistance', label: 'Min distance', min: 50, max: 300, step: 5, unit: 'px' },
        ],
      },
      {
        title: 'Motion',
        controls: [
          { kind: 'slider', key: 'duration', label: 'Duration', min: 0.2, max: 1.5, step: 0.05, unit: 's' },
          {
            kind: 'select',
            key: 'ease',
            label: 'Ease',
            options: [
              { value: 'power3.out', label: 'power3.out' },
              { value: 'power2.out', label: 'power2.out' },
              { value: 'expo.out', label: 'expo.out' },
              { value: 'back.out(1.7)', label: 'back.out' },
            ],
          },
        ],
      },
    ],

    source: {
      project: 'mouse-effects',
      projectUrl: 'https://github.com/cortiz2894/mouse-effects',
      originalPath: 'src/components/image-follow-cursor/index.tsx',
      license: 'No license file — reference only',
      licenseNote:
        'The implementation is a clean-room rewrite of the behaviour; no source code is reproduced.',
      tech: ['GSAP timeline', 'DOM nodes', 'pointer distance gating'],
      principle:
        'On pointermove the distance from the previous spawn is measured. If it exceeds a minimum, a new image node is placed at the pointer and animated from an offset in the movement direction: scale/opacity in, translate to zero, then scale/fade out and remove.',
      reconstruction:
        'Rebuilt in React with a configurable exclusion caption, width/height, spawn distance, duration and ease. A node cap prevents runaway DOM growth; all generated nodes and tweens are torn down on unmount.',
    },
    component: ImageFollow,
  },
  {
    id: 'magnetic-elements',
    index: '16',
    title: 'Magnetic Elements',
    tagline: 'Tiles inside an activation radius lean toward the pointer, then spring home.',
    category: 'Magnetic Cursor',
    tech: 'DOM + rAF',
    hint: 'Move between the tiles',
    defaults: {
      strength: 0.3,
      radius: 160,
      ease: 0.14,
    },
    groups: [
      {
        title: 'Magnet',
        controls: [
          { kind: 'slider', key: 'strength', label: 'Strength', min: 0.05, max: 0.8, step: 0.01 },
          { kind: 'slider', key: 'radius', label: 'Radius', min: 60, max: 300, step: 5, unit: 'px' },
          { kind: 'slider', key: 'ease', label: 'Lerp ease', min: 0.03, max: 0.4, step: 0.01 },
        ],
      },
    ],

    source: {
      project: 'mouse-animations',
      projectUrl: 'https://github.com/tgomilar/mouse-animations',
      originalPath: 'src/animations/magnetic.ts, src/core/element-animator.ts',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['DOM transforms', 'rAF lerp', 'per-element hover lifecycle'],
      principle:
        'Each element computes the pointer vector from its centre. Inside the radius, the target transform becomes delta * strength; otherwise it returns to zero. A rAF loop lerps the current transform toward the target and writes a translate3d.',
      reconstruction:
        'Reimplemented with root-relative offsets (avoiding layout feedback from transformed rects), one shared pointer listener, live strength/radius/ease, and transform restoration on destroy.',
    },
    component: MagneticElements,
  },
  {
    id: 'gelly-cursor',
    index: '17',
    title: 'Gelly Sticky Cursor',
    tagline: 'A custom cursor that stretches with velocity, snaps to a sticky target and labels hover zones.',
    category: 'Magnetic Cursor',
    tech: 'DOM + GSAP maths',
    hint: 'Hover the target and the blend zone',
    defaults: {
      size: 46,
      color: '#ffffff',
      blend: 'difference',
      jelly: 60,
      smoothness: 0.2,
      stick: 0.12,
    },
    groups: [
      {
        title: 'Cursor',
        controls: [
          { kind: 'slider', key: 'size', label: 'Size', min: 24, max: 120, step: 1, unit: 'px' },
          { kind: 'color', key: 'color', label: 'Colour' },
          {
            kind: 'select',
            key: 'blend',
            label: 'Blend',
            options: [
              { value: 'normal', label: 'Normal' },
              { value: 'difference', label: 'Difference' },
              { value: 'exclusion', label: 'Exclusion' },
            ],
          },
        ],
      },
      {
        title: 'Physics',
        controls: [
          { kind: 'slider', key: 'jelly', label: 'Jelly amount', min: 0, max: 140, step: 1 },
          { kind: 'slider', key: 'smoothness', label: 'Follow smoothness', min: 0.05, max: 0.6, step: 0.01 },
          { kind: 'slider', key: 'stick', label: 'Stick amount', min: 0, max: 0.6, step: 0.01 },
        ],
      },
    ],

    source: {
      project: 'react-creative-cursor',
      projectUrl: 'https://github.com/ehsan-shv/react-creative-cursor',
      originalPath: 'src/Cursor.tsx, src/cursor.scss',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['DOM', 'GSAP quickTo/quickSetter', 'mix-blend-mode', 'velocity deformation'],
      principle:
        'The cursor position eases toward the pointer. Velocity between the target and the eased position yields an angle and a scale; the cursor is rotated by the angle, stretched on X, squashed on Y, and the inner label counter-rotates. Sticky targets replace the pointer target with a point near the element centre.',
      reconstruction:
        'Dependency-free rewrite of the core loop inside a card: rAF lerp, frame-rate-independent smoothing, live jelly/stick/size/colour/blend, data-attribute hover zones, scoped cursor hiding, and teardown on unmount.',
    },
    component: GellyCursor,
  },
  {
    id: 'spotlight-cards',
    index: '18',
    title: 'Spotlight Cards',
    tagline: 'A radial light and a lit border follow the pointer independently on every card.',
    category: 'Spotlight & Lens',
    tech: 'CSS variables',
    hint: 'Sweep across the cards',
    defaults: {
      color: '#9db4ff',
      size: 220,
      intensity: 0.55,
    },
    groups: [
      {
        title: 'Light',
        controls: [
          { kind: 'color', key: 'color', label: 'Glow colour' },
          { kind: 'slider', key: 'size', label: 'Radius', min: 100, max: 360, step: 5, unit: 'px' },
          { kind: 'slider', key: 'intensity', label: 'Intensity', min: 0.1, max: 1, step: 0.05 },
        ],
      },
    ],

    source: {
      project: 'mouse-animations',
      projectUrl: 'https://github.com/tgomilar/mouse-animations',
      originalPath: 'src/animations/spotlight.ts',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['CSS custom properties', 'radial-gradient', 'mask-composite border'],
      principle:
        'Each card listens for pointer movement and writes its local pointer position into two CSS variables consumed by a radial-gradient pseudo-element. Leaving the element parks the gradient off-screen.',
      reconstruction:
        'Delegated to one root listener, with colour/radius/intensity controls. A second masked gradient draws a lit border; no React state is updated on pointer movement.',
    },
    component: SpotlightCards,
  },
  {
    id: 'flashlight',
    index: '19',
    title: 'Flashlight Reveal',
    tagline: 'A dark mask with a transparent hole, moved with a little inertia, reveals a bright scene.',
    category: 'Spotlight & Lens',
    tech: 'CSS mask',
    hint: 'Move the light around',
    defaults: {
      size: 170,
      blur: 0,
      smoothness: 0.18,
      backdrop: 'rgba(3, 4, 8, 0.93)',
    },
    groups: [
      {
        title: 'Light',
        controls: [
          { kind: 'slider', key: 'size', label: 'Radius', min: 60, max: 340, step: 5, unit: 'px' },
          { kind: 'slider', key: 'blur', label: 'Outside blur', min: 0, max: 14, step: 0.5, unit: 'px' },
          { kind: 'slider', key: 'smoothness', label: 'Smoothness', min: 0.05, max: 0.6, step: 0.01 },
          {
            kind: 'select',
            key: 'backdrop',
            label: 'Backdrop',
            options: [
              { value: 'rgba(3, 4, 8, 0.93)', label: 'Near black' },
              { value: 'rgba(8, 12, 24, 0.9)', label: 'Midnight' },
              { value: 'rgba(18, 8, 30, 0.9)', label: 'Violet' },
            ],
          },
        ],
      },
    ],

    source: {
      project: 'mouse-animations',
      projectUrl: 'https://github.com/tgomilar/mouse-animations',
      originalPath: 'src/animations/flashlight.ts, src/core/mouse-follower.ts',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['CSS mask-image', 'backdrop-filter', 'rAF lerp'],
      principle:
        'A fixed overlay is masked by a radial gradient that is transparent inside the light radius and opaque outside. The light centre is a pair of CSS variables updated by a smoothed mouse follower.',
      reconstruction:
        'Scoped to the demo stage instead of the whole document. Radius, blur, backdrop and smoothing are live; the follower is frame-rate independent and cleans up on unmount.',
    },
    component: Flashlight,
  },
  {
    id: 'invert-lens',
    index: '20',
    title: 'Invert Lens',
    tagline: 'A white circle with difference blending turns everything it touches inside out.',
    category: 'Spotlight & Lens',
    tech: 'mix-blend-mode',
    hint: 'Move the lens over the type',
    defaults: {
      size: 90,
      color: '#ffffff',
      smoothness: 0.25,
      blend: 'difference',
    },
    groups: [
      {
        title: 'Lens',
        controls: [
          { kind: 'slider', key: 'size', label: 'Size', min: 30, max: 160, step: 2, unit: 'px' },
          { kind: 'color', key: 'color', label: 'Colour' },
          { kind: 'slider', key: 'smoothness', label: 'Smoothness', min: 0.05, max: 0.6, step: 0.01 },
          {
            kind: 'select',
            key: 'blend',
            label: 'Blend mode',
            options: [
              { value: 'difference', label: 'Difference' },
              { value: 'exclusion', label: 'Exclusion' },
            ],
          },
        ],
      },
    ],

    source: {
      project: 'mouse-animations',
      projectUrl: 'https://github.com/tgomilar/mouse-animations',
      originalPath: 'src/animations/invert.ts',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['mix-blend-mode: difference', 'CSS transforms', 'rAF lerp'],
      principle:
        'A solid circle follows the pointer and uses difference blending, so each channel is replaced by the absolute difference against the page. White inverts, black does nothing, colours shift hue.',
      reconstruction:
        'Added smoothness and blend-mode controls, scoped native-cursor hiding to the stage, and made teardown remove listeners and inline state.',
    },
    component: InvertLens,
  },
  {
    id: 'fluid-cursor',
    index: '01',
    title: 'WebGL Fluid Cursor',
    tagline: 'Splat, curl, vorticity, divergence, Jacobi pressure solve, gradient subtract, advect, display.',
    category: 'Fluid Effect',
    tech: 'Three.js + GLSL',
    hint: 'Move or drag across the canvas',
    wide: true,
    defaults: {
      splatRadius: 0.0025,
      force: 3,
      dyeIntensity: 0.28,
      velocityFade: 4.5,
      dyeFade: 3.5,
      swirl: 14,
      pressureIterations: 20,
    },
    groups: [
      {
        title: 'Injection',
        controls: [
          { kind: 'slider', key: 'splatRadius', label: 'Splat radius', min: 0.001, max: 0.01, step: 0.0005 },
          { kind: 'slider', key: 'force', label: 'Cursor force', min: 0.5, max: 6, step: 0.1 },
          { kind: 'slider', key: 'dyeIntensity', label: 'Dye intensity', min: 0.05, max: 0.8, step: 0.01 },
        ],
      },
      {
        title: 'Simulation',
        controls: [
          { kind: 'slider', key: 'velocityFade', label: 'Velocity fade', min: 0.5, max: 8, step: 0.1 },
          { kind: 'slider', key: 'dyeFade', label: 'Dye fade', min: 0.5, max: 8, step: 0.1 },
          { kind: 'slider', key: 'swirl', label: 'Vorticity', min: 0, max: 30, step: 0.5 },
          { kind: 'slider', key: 'pressureIterations', label: 'Pressure iterations', min: 8, max: 32, step: 1 },
        ],
      },
    ],

    source: {
      project: 'webgl-fluid-cursor',
      projectUrl: 'https://github.com/qureshi-shahroz/webgl-fluid-cursor',
      originalPath: 'main.js, shaders/*.frag',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['Three.js', 'GPU fluid simulation', 'ping-pong render targets', 'GLSL'],
      principle:
        'A 128² velocity field and a 512² dye field live in half-float render targets. Pointer movement injects a Gaussian velocity + dye splat. Each frame runs curl, vorticity confinement, divergence, a Jacobi pressure solve, gradient subtraction and advection. The display pass derives normals from dye brightness for a glossy liquid look.',
      reconstruction:
        'Retained the full simulation pipeline and shaders, added live controls for splat radius, cursor force, dye intensity, velocity/dye fade, vorticity and pressure iterations. The simulation is scoped to one card, uses a ResizeObserver, clears the screen each frame, and disposes every target/material on unmount.',
    },
    component: FluidCursor,
  },
  {
    id: 'water-ripple',
    index: '22',
    title: 'Water Ripple Distortion',
    tagline: 'A wave field refracts a photograph with chromatic aberration and specular highlights.',
    category: 'Liquid Distortion',
    tech: 'Three.js + GLSL',
    hint: 'Move across the image',
    defaults: {
      image: 'art/trail/31.jpg',
      intensity: 0.3,
      scale: 0.1,
      viscosity: 0.9,
      decay: 0.98,
      distortionStrength: 0.03,
      aberration: 0.003,
      lightIntensity: 0.12,
      specularPower: 8,
    },
    groups: [
      {
        title: 'Image',
        controls: [
          {
            kind: 'select',
            key: 'image',
            label: 'Photograph',
            options: [
              { value: 'art/trail/31.jpg', label: 'Frame 31' },
              { value: 'art/trail/33.jpg', label: 'Frame 33' },
              { value: 'art/trail/35.jpg', label: 'Frame 35' },
              { value: 'art/trail/37.jpg', label: 'Frame 37' },
            ],
          },
        ],
      },
      {
        title: 'Ripple',
        controls: [
          { kind: 'slider', key: 'intensity', label: 'Ripple intensity', min: 0.02, max: 0.8, step: 0.01 },
          { kind: 'slider', key: 'scale', label: 'Ripple radius', min: 0.02, max: 0.2, step: 0.005 },
          { kind: 'slider', key: 'viscosity', label: 'Viscosity', min: 0.5, max: 0.99, step: 0.01 },
          { kind: 'slider', key: 'decay', label: 'Wave decay', min: 0.85, max: 0.995, step: 0.005 },
        ],
      },
      {
        title: 'Distortion',
        controls: [
          { kind: 'slider', key: 'distortionStrength', label: 'Refraction', min: 0, max: 0.08, step: 0.001 },
          { kind: 'slider', key: 'aberration', label: 'Aberration', min: 0, max: 0.02, step: 0.001 },
          { kind: 'slider', key: 'lightIntensity', label: 'Light', min: 0, max: 0.4, step: 0.01 },
          { kind: 'slider', key: 'specularPower', label: 'Specular power', min: 1, max: 16, step: 0.5 },
        ],
      },
    ],

    source: {
      project: 'mouse-effects',
      projectUrl: 'https://github.com/cortiz2894/mouse-effects',
      originalPath: 'src/components/water-distortion/ripple-effect.tsx',
      license: 'No license file — reference only',
      licenseNote:
        'Behavioural reference only. The shaders and engine here were written from scratch; no source code is reproduced.',
      tech: ['React Three Fiber', 'ping-pong wave equation', 'normal from heightfield', 'chromatic aberration'],
      principle:
        'A wave equation is integrated in ping-pong render targets, with pointer speed injecting ripples along the recent path. The image pass samples the displacement field, derives a normal from neighbouring texels, offsets UVs by the normal, and splits RGB samples for chromatic aberration. Specular and Fresnel terms are masked to the ripples.',
      reconstruction:
        'Written as an independent Three.js engine with explicit targets and cleanup. Added four selectable photographs, an aspect-corrected ripple radius, and live controls for the wave and lighting parameters.',
    },
    component: WaterRipple,
  },
  {
    id: 'mask-reveal',
    index: '23',
    title: 'Liquid Mask Reveal',
    tagline: 'A second image appears through the liquid mask generated by pointer ripples.',
    category: 'Liquid Distortion',
    tech: 'Three.js + GLSL',
    hint: 'Paint over the image',
    defaults: {
      intensity: 0.73,
      scale: 0.1,
      viscosity: 0.6,
      decay: 0.96,
      revealSize: 1.9,
      edgeSoftness: 0.1,
      distortionStrength: 0.002,
      lightIntensity: 0.05,
    },
    groups: [
      {
        title: 'Ripple',
        controls: [
          { kind: 'slider', key: 'intensity', label: 'Ripple intensity', min: 0.05, max: 1, step: 0.01 },
          { kind: 'slider', key: 'scale', label: 'Ripple radius', min: 0.02, max: 0.25, step: 0.005 },
          { kind: 'slider', key: 'viscosity', label: 'Viscosity', min: 0.5, max: 0.8, step: 0.01 },
          { kind: 'slider', key: 'decay', label: 'Wave decay', min: 0.85, max: 0.995, step: 0.005 },
        ],
      },
      {
        title: 'Mask',
        controls: [
          { kind: 'slider', key: 'revealSize', label: 'Reveal size', min: 0.3, max: 10, step: 0.1 },
          { kind: 'slider', key: 'edgeSoftness', label: 'Edge softness', min: 0.01, max: 1, step: 0.01 },
          { kind: 'slider', key: 'distortionStrength', label: 'Distortion', min: 0, max: 0.01, step: 0.0005 },
          { kind: 'slider', key: 'lightIntensity', label: 'Light', min: 0, max: 0.2, step: 0.005 },
        ],
      },
    ],

    source: {
      project: 'mouse-effects',
      projectUrl: 'https://github.com/cortiz2894/mouse-effects',
      originalPath: 'src/components/mask-cursor/index.tsx',
      license: 'No license file — reference only',
      licenseNote:
        'Behavioural reference only. The shaders and engine here were written from scratch; no source code is reproduced.',
      tech: ['React Three Fiber', 'liquid mask', 'two-image composition', 'cover UV'],
      principle:
        'The same wave field is used as a soft mask. Displacement values above a threshold mix the base photograph with a second reveal photograph, while the normal offsets both samples and adds liquid highlights on the rippling edge.',
      reconstruction:
        'Separate Three.js engine with independent shaders, aspect-corrected wave field, live mask/ripple/lighting controls, and full GPU resource cleanup on unmount.',
    },
    component: MaskReveal,
  },
  {
    id: 'shader-text',
    index: '24',
    title: 'Shader Text Trail',
    tagline: 'Pointer deposits write a flow field; a fragment shader warps and colours a line of type.',
    category: 'Liquid Distortion',
    tech: 'WebGL + GLSL',
    hint: 'Drag across the word',
    defaults: {
      text: 'shader',
      warp: 0.55,
      intensity: 1.4,
      brushRadius: 0.08,
      decay: 0.94,
      lowColor: '#3b82f6',
      highColor: '#a78bfa',
    },
    groups: [
      {
        title: 'Content',
        controls: [
          { kind: 'text', key: 'text', label: 'Text', placeholder: 'type something' },
        ],
      },
      {
        title: 'Field',
        controls: [
          { kind: 'slider', key: 'warp', label: 'Warp strength', min: 0, max: 1.5, step: 0.01 },
          { kind: 'slider', key: 'intensity', label: 'Trail intensity', min: 0, max: 3, step: 0.05 },
          { kind: 'slider', key: 'brushRadius', label: 'Brush radius', min: 0.02, max: 0.2, step: 0.005 },
          { kind: 'slider', key: 'decay', label: 'Field decay', min: 0.85, max: 0.995, step: 0.005 },
        ],
      },
      {
        title: 'Palette',
        controls: [
          { kind: 'color', key: 'lowColor', label: 'Low speed' },
          { kind: 'color', key: 'highColor', label: 'High speed' },
        ],
      },
    ],

    source: {
      project: 'cursor-shader-trail',
      projectUrl: 'https://github.com/BertovDev/cursor-shader-trail',
      originalPath: 'lib/tsl/interactivity/use-grid-trail-texture.ts, lib/tsl/shader-trail/build-color-node.ts',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['Three.js', 'WebGPU / TSL (original)', 'DataTexture flow field', 'GLSL (this port)'],
      principle:
        'A 200×200 RGBA float texture stores flow in RG, speed in B. JavaScript writes brush deposits into it every frame and decays it. The shader offsets its UV by the flow, samples a text canvas, then applies a three-stop speed colour ramp, grain and vignette.',
      reconstruction:
        'Ported from WebGPU/TSL to a compact WebGL/GLSL pipeline (a 160² flow field, JS deposits, 9-tap blur, text canvas). The original brush shapes are not reproduced; the lab exposes text, warp, intensity, brush radius, decay and a two-stop palette so the visible parameters are honest.',
    },
    component: ShaderText,
  },

  {
    id: 'image-trail-x',
    index: '15',
    title: 'Image Trail X',
    tagline: 'Eight GSAP trail variants: scale, flash, rise, speed, spin, blur, stack and 3D perspective.',
    category: 'Image Trail',
    tech: 'GSAP + DOM',
    hint: 'Sweep across the stage',
    defaults: {
      variant: 'speed',
      threshold: 80,
      lag: 0.12,
      imageSize: 160,
      duration: 1,
      brightness: 0.75,
    },
    groups: [
      {
        title: 'Trail',
        controls: [
          {
            kind: 'select',
            key: 'variant',
            label: 'Variant',
            options: [
              { value: 'smooth', label: 'Smooth scale' },
              { value: 'flash', label: 'Flash & glow' },
              { value: 'rise', label: 'Explosive rise' },
              { value: 'speed', label: 'Speed inertia' },
              { value: 'spin', label: 'Spin & shift' },
              { value: 'blur', label: 'Motion blur' },
              { value: 'stack', label: 'Persistent stack' },
              { value: 'perspective', label: '3D perspective' },
            ],
          },
          { kind: 'slider', key: 'threshold', label: 'Spawn distance', min: 30, max: 200, step: 5, unit: 'px' },
          { kind: 'slider', key: 'lag', label: 'Trailing lag', min: 0.03, max: 0.5, step: 0.01 },
          { kind: 'slider', key: 'imageSize', label: 'Image width', min: 90, max: 260, step: 5, unit: 'px' },
          { kind: 'slider', key: 'duration', label: 'Duration', min: 0.5, max: 2.5, step: 0.05, unit: '×' },
          { kind: 'slider', key: 'brightness', label: 'Exposure', min: 0.45, max: 1.2, step: 0.02 },
        ],
      },
    ],

    source: {
      project: 'image-trail',
      projectUrl: 'https://github.com/sebastianvasquezechavarria1234/image-trail',
      originalPath: 'src/ImageTrail.jsx → ImageTrailVariant1…8',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['React', 'GSAP timelines', 'DOM transforms', 'distance-threshold spawner'],
      principle:
        'A lerped cache position trails the pointer. Each frame the distance to the last spawn is measured; above the threshold the next pooled image is animated by one of eight GSAP timelines, covering scale, brightness, upward drift, speed filters, rotation, motion blur, a persistent queue and 3D rotation.',
      reconstruction:
        'Rebuilt as a standalone DOM/GSAP engine with a live variant selector, threshold, lag, image width, duration and exposure controls. A single pool serves all eight variants; listeners, ticker and tweens are torn down on unmount. Artwork comes from the MIT image-trail repository.',
    },
    component: ImageTrailX,
  },
  {
    id: 'morphing-blob',
    index: '25',
    title: 'Morphing Blob Cursor',
    tagline: 'A lead blob and a lerped trail fuse into liquid shapes through an SVG gooey filter.',
    category: 'Liquid Distortion',
    tech: 'SVG filter + DOM',
    hint: 'Move; click cycles colour',
    defaults: {
      size: 38,
      trail: 6,
      color: '#7c5cfc',
      opacity: 0.65,
      lerp: 0.2,
      clickAnim: true,
    },
    groups: [
      {
        title: 'Blob',
        controls: [
          { kind: 'slider', key: 'size', label: 'Lead size', min: 18, max: 80, step: 1, unit: 'px' },
          { kind: 'slider', key: 'trail', label: 'Trail blobs', min: 0, max: 12, step: 1 },
          { kind: 'color', key: 'color', label: 'Colour' },
        ],
      },
      {
        title: 'Motion',
        controls: [
          { kind: 'slider', key: 'opacity', label: 'Opacity', min: 0.2, max: 1, step: 0.05 },
          { kind: 'slider', key: 'lerp', label: 'Trail lerp', min: 0.05, max: 0.5, step: 0.01 },
          { kind: 'toggle', key: 'clickAnim', label: 'Click colour cycle' },
        ],
      },
    ],

    source: {
      project: 'CursorX — Interactive Cursor Effects',
      projectUrl: 'https://github.com/Felix-au/CursorX-Interactive-Cursor-Effects',
      originalPath: 'src/cursors/MorphingBlobCursor.jsx',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['SVG feGaussianBlur', 'feColorMatrix', 'DOM', 'rAF lerp'],
      principle:
        'Several circular divs are placed inside a wrapper with `filter: url(#goo)`. The SVG filter blurs the alpha and applies a 22/-9 colour matrix, so nearby circles merge into a liquid silhouette. The lead circle snaps to the pointer while each trail circle lerps toward the previous one.',
      reconstruction:
        'Scoped the SVG filter and layers to the card, added live size/trail/colour/opacity/lerp controls, a morph target and click colour cycling. The loop, listeners, filter and DOM nodes are removed on unmount.',
    },
    component: MorphingBlob,
  },
  {
    id: 'fire-trail',
    index: '07',
    title: 'Fire Trail Cursor',
    tagline: 'Rising embers cool from yellow to red to smoke; clicking throws a radial flare.',
    category: 'Particle Trail',
    tech: 'Canvas 2D',
    hint: 'Move; click for a burst',
    defaults: {
      count: 5,
      rise: 2.2,
      size: 4.5,
      clickBurst: 30,
      glow: 14,
    },
    groups: [
      {
        title: 'Trail',
        controls: [
          { kind: 'slider', key: 'count', label: 'Embers / frame', min: 1, max: 16, step: 1 },
          { kind: 'slider', key: 'rise', label: 'Rise speed', min: 0.5, max: 6, step: 0.1 },
          { kind: 'slider', key: 'size', label: 'Ember size', min: 1, max: 12, step: 0.5, unit: 'px' },
        ],
      },
      {
        title: 'Burst',
        controls: [
          { kind: 'slider', key: 'clickBurst', label: 'Click embers', min: 0, max: 60, step: 1 },
          { kind: 'slider', key: 'glow', label: 'Glow', min: 0, max: 30, step: 1 },
        ],
      },
    ],

    source: {
      project: 'CursorX — Interactive Cursor Effects',
      projectUrl: 'https://github.com/Felix-au/CursorX-Interactive-Cursor-Effects',
      originalPath: 'src/cursors/FireTrailCursor.jsx',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['Canvas 2D', 'HSL lifecycle', 'particle physics'],
      principle:
        'Each frame the pointer emits a few flames with upward velocity and horizontal jitter. Life decreases; hue moves from yellow to red and finally grey, while size shrinks. Clicks add radial embers with their own gravity and decay.',
      reconstruction:
        'Independent engine with DPR-aware canvas sizing, particle cap, live emission/rise/size/burst/glow controls and full listener/rAF cleanup.',
    },
    component: FireTrail,
  },
  {
    id: 'constellation',
    index: '08',
    title: 'Constellation Cursor',
    tagline: 'Drifting stars form a proximity graph that reaches out to the pointer and pulses on click.',
    category: 'Particle Trail',
    tech: 'Canvas 2D',
    hint: 'Move; click to pulse',
    defaults: {
      stars: 180,
      maxDist: 115,
      cursorDist: 175,
      color: '#c8c8ff',
      clickGlow: true,
    },
    groups: [
      {
        title: 'Network',
        controls: [
          { kind: 'slider', key: 'stars', label: 'Stars', min: 20, max: 200, step: 5 },
          { kind: 'slider', key: 'maxDist', label: 'Star link radius', min: 40, max: 220, step: 5, unit: 'px' },
          { kind: 'slider', key: 'cursorDist', label: 'Cursor link radius', min: 60, max: 280, step: 5, unit: 'px' },
        ],
      },
      {
        title: 'Style',
        controls: [
          { kind: 'color', key: 'color', label: 'Star colour' },
          { kind: 'toggle', key: 'clickGlow', label: 'Click pulse' },
        ],
      },
    ],

    source: {
      project: 'CursorX — Interactive Cursor Effects',
      projectUrl: 'https://github.com/Felix-au/CursorX-Interactive-Cursor-Effects',
      originalPath: 'src/cursors/ConstellationCursor.jsx',
      license: 'MIT',
      licenseNote: 'Adapted with attribution.',
      tech: ['Canvas 2D', 'O(n²) proximity graph', 'particle drift'],
      principle:
        'Stars drift and wrap around the canvas. Every pair closer than `maxDist` is connected by a line whose alpha falls with distance; stars near the pointer connect to it. A click drives a sine pulse that brightens linked stars.',
      reconstruction:
        'Independent canvas engine with DPR sizing, live star count/link radii/colour/pulse controls, wrap-around bounds and complete teardown.',
    },
    component: Constellation,
  },
  {
    id: 'ba-click',
    index: '09',
    title: 'BA Click FX',
    tagline: 'Blue Archive-style dissolving rings, shards and a continuous cursor trail from Unity defaults.',
    category: 'Particle Trail',
    tech: 'WebGL2 + Canvas 2D',
    hint: 'Move for trail · click for rings',
    wide: true,
    defaults: {
      color: '#4ca7ff',
      scale: 1,
      opacity: 1,
      trail: true,
      click: true,
      trailAlways: true,
      backend: 'auto',
      clickSpeed: 1,
      trailSpeed: 1,
    },
    groups: [
      {
        title: 'Appearance',
        controls: [
          { kind: 'color', key: 'color', label: 'Theme colour' },
          { kind: 'slider', key: 'scale', label: 'Scale', min: 0.5, max: 2, step: 0.05, unit: '×' },
          { kind: 'slider', key: 'opacity', label: 'Opacity', min: 0.2, max: 1, step: 0.05 },
        ],
      },
      {
        title: 'Behaviour',
        controls: [
          { kind: 'toggle', key: 'trail', label: 'Cursor trail' },
          { kind: 'toggle', key: 'click', label: 'Click rings' },
          { kind: 'toggle', key: 'trailAlways', label: 'Trail on hover' },
          {
            kind: 'select',
            key: 'backend',
            label: 'Backend',
            options: [
              { value: 'auto', label: 'Auto' },
              { value: 'webgl2', label: 'WebGL2' },
              { value: 'canvas2d', label: 'Canvas 2D' },
            ],
          },
        ],
      },
      {
        title: 'Timing',
        controls: [
          { kind: 'slider', key: 'clickSpeed', label: 'Click time scale', min: 0.2, max: 3, step: 0.05, unit: '×' },
          { kind: 'slider', key: 'trailSpeed', label: 'Trail time scale', min: 0.2, max: 3, step: 0.05, unit: '×' },
        ],
      },
    ],

    source: {
      project: 'ba-click-fx',
      projectUrl: 'https://github.com/CialloKing/ba-click-fx',
      originalPath: 'src/fx.js, src/engine-core.js, src/engine-*.js',
      license: 'MIT',
      licenseNote:
        'Integrated as the published `ba-click-fx` npm package (v1.3.15), not copied into this repository.',
      tech: ['WebGL2', 'Canvas 2D fallback', 'WebGPU (optional)', 'Unity-derived parameters'],
      principle:
        'The library renders dissolving click rings, a centre disk, shard bursts and a continuous trail. WebGL2 (or optional WebGPU) handles the GPU path, with Canvas 2D and native glow fallbacks. Pointer input is scoped to the host container; animation scheduling stops when no effects are active.',
      reconstruction:
        'Mounted the actual MIT library into this card via its `target` option and `browser-overlay` compositing. Theme colour, scale, opacity, toggles, backend and time scales are live; pointerleave cancels the active trail so moving outside the card cannot keep interacting. `destroy()` releases listeners and library-created canvases on unmount. The MIT library is kept as a package dependency rather than vendoring its 1.4 MB source tree.',
    },
    component: BAClick,
  },

  {
    id: 'ice-crystal',
    index: '10',
    title: 'Ice Crystal Cursor',
    tagline: 'Ice shards and needles trail the pointer; hold click to charge a crystal burst.',
    category: 'Particle Trail',
    tech: 'Canvas 2D',
    hint: 'Move · hold click to charge',
    defaults: {},
    groups: [],
    source: {
      project: 'CursorKit',
      projectUrl: 'https://github.com/PC2005-cloud/cursorkit',
      originalPath: 'src/effects/ice.js',
      license: 'MIT',
      licenseNote: 'Adapted from the MIT CursorKit source; mounted in a scoped host with the themed cursor disabled.',
      tech: ['Canvas 2D', 'particle pool', 'shard / needle geometry', 'additive glow'],
      principle:
        'Original CursorKit ice component adapted to a card-scoped host; pointer coordinates are local to the stage.',
      reconstruction:
        'Original shard / needle / charge logic is kept; the themed cursor and global native-cursor hiding are disabled, so no runtime control panel is exposed.',
    },
    component: IceCrystal,
  },
  {
    id: 'mist-cloud',
    index: '11',
    title: 'Mist Cloud Cursor',
    tagline: 'Cloud puffs condense around the pointer; left-click cloud, right-click fog.',
    category: 'Particle Trail',
    tech: 'Canvas 2D',
    hint: 'Move · left/right click',
    defaults: {},
    groups: [],
    source: {
      project: 'CursorKit',
      projectUrl: 'https://github.com/PC2005-cloud/cursorkit',
      originalPath: 'src/effects/mist.js',
      license: 'MIT',
      licenseNote: 'Adapted from the MIT CursorKit source; mounted in a scoped host with the themed cursor disabled.',
      tech: ['Canvas 2D', 'pre-rendered soft sprite', 'turbulent particle drift'],
      principle:
        'Original CursorKit mist component adapted to a card-scoped host; pointer coordinates are local to the stage.',
      reconstruction:
        'Original soft-cloud / condensation and left-right charge logic is kept; the themed cursor and global native-cursor hiding are disabled, so no runtime control panel is exposed.',
    },
    component: MistCloud,
  },
  {
    id: 'code-trail',
    index: '04',
    title: 'Code Trail',
    tagline: 'Code glyphs stream from the cursor; click compiles, right-click crashes.',
    category: 'Cursor Trail',
    tech: 'Canvas 2D',
    hint: 'Move · click compile · right-click crash',
    defaults: {},
    groups: [],
    source: {
      project: 'CursorKit',
      projectUrl: 'https://github.com/PC2005-cloud/cursorkit',
      originalPath: 'src/effects/code.js',
      license: 'MIT',
      licenseNote: 'Adapted from the MIT CursorKit source; mounted in a scoped host with the themed cursor disabled.',
      tech: ['Canvas 2D', 'monospace glyph pool', 'falling particles'],
      principle:
        'Original CursorKit code component adapted to a card-scoped host; pointer coordinates are local to the stage.',
      reconstruction:
        'Original glyph trail, compile and crash-stack click logic is kept; the themed cursor and global native-cursor hiding are disabled, so no runtime control panel is exposed.',
    },
    component: CodeTrail,
  },
  {
    id: 'fish-school',
    index: '12',
    title: 'Fish School Cursor',
    tagline: 'A boids fish school follows the pointer; click bait, right-click migration.',
    category: 'Particle Trail',
    tech: 'Canvas 2D',
    hint: 'Move · click bait · right-click migrate',
    defaults: {},
    groups: [],
    source: {
      project: 'CursorKit',
      projectUrl: 'https://github.com/PC2005-cloud/cursorkit',
      originalPath: 'src/effects/fish.js',
      license: 'MIT',
      licenseNote: 'Adapted from the MIT CursorKit source; mounted in a scoped host with the themed cursor disabled.',
      tech: ['Canvas 2D', 'boids', 'separation / alignment / cohesion', 'procedural fish'],
      principle:
        'Original CursorKit fish component adapted to a card-scoped host; pointer coordinates are local to the stage.',
      reconstruction:
        'Original boids, bait-ball and migration click logic is kept; the themed cursor and global native-cursor hiding are disabled, so no runtime control panel is exposed.',
    },
    component: FishSchool,
  },
  {
    id: 'radar',
    index: '21',
    title: 'Radar Cursor',
    tagline: 'A radar sweep and echo blips track the pointer; hold click beam, right-click pulse.',
    category: 'Spotlight & Lens',
    tech: 'Canvas 2D',
    hint: 'Move · hold click · right-click pulse',
    defaults: {},
    groups: [],
    source: {
      project: 'CursorKit',
      projectUrl: 'https://github.com/PC2005-cloud/cursorkit',
      originalPath: 'src/effects/radar.js',
      license: 'MIT',
      licenseNote: 'Adapted from the MIT CursorKit source; mounted in a scoped host with the themed cursor disabled.',
      tech: ['Canvas 2D', 'polar geometry', 'rotating sweep', 'echo blips'],
      principle:
        'Original CursorKit radar component adapted to a card-scoped host; pointer coordinates are local to the stage.',
      reconstruction:
        'Original sweep, beam and pulse click logic is kept; the themed cursor and global native-cursor hiding are disabled, so no runtime control panel is exposed.',
    },
    component: Radar,
  },

]
