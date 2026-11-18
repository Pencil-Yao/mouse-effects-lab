# Third-party notices

This lab reconstructs mouse-interaction effects from open-source projects. The
table below records exactly how each source was used.

| Source | License | Use in this project |
|--------|---------|---------------------|
| [a-reactive-particle-system](https://github.com/JRoussos/a-reactive-particle-system) | MIT | Adapted: particle instancing, offscreen pointer texture, GLSL noise |
| [cursor-shader-trail](https://github.com/BertovDev/cursor-shader-trail) | MIT | Adapted: flow-field + text-warp concept; ported from WebGPU/TSL to WebGL/GLSL |
| [MotionTrailAnimations](https://github.com/codrops/MotionTrailAnimations) | MIT | Adapted: distance-threshold image trail engine and variants |
| [mouse-animations](https://github.com/tgomilar/mouse-animations) | MIT | Adapted: dot trail, particle burst, magnetic, spotlight, flashlight, invert |
| [react-creative-cursor](https://github.com/ehsan-shv/react-creative-cursor) | MIT | Adapted: gelly velocity deformation and sticky-target maths |
| [webgl-fluid-cursor](https://github.com/qureshi-shahroz/webgl-fluid-cursor) | MIT | Adapted: full GPU fluid pipeline and shaders |
| [image-trail](https://github.com/sebastianvasquezechavarria1234/image-trail) | MIT | Adapted: eight image-trail variants and distance-threshold spawner |
| [CursorX-Interactive-Cursor-Effects](https://github.com/Felix-au/CursorX-Interactive-Cursor-Effects) | MIT | Adapted: Morphing Blob, Fire Trail and Constellation cursor effects |
| [ba-click-fx](https://github.com/CialloKing/ba-click-fx) | MIT | Used as the published npm dependency `ba-click-fx` (v1.3.15); runtime not vendored |
| [CursorKit](https://github.com/PC2005-cloud/cursorkit) | MIT | Adapted: ice crystal, mist cloud, code trail, fish school and radar cursor effects |
| [Cursor-Trial-Effect](https://github.com/amantha6/Cursor-Trial-Effect) | **No license file** | Behavioural reference only. Rewritten from scratch; no source code copied. |
| [mouse-effects](https://github.com/cortiz2894/mouse-effects) | **No license file** | Behavioural reference only. Water ripple, mask reveal and image-follow were rewritten from scratch; no source code copied. |
| [interactive-particles](https://github.com/brunoimbrizi/interactive-particles) | Custom Codrops license | **Not copied.** Its README forbids redistribution as-is. The same technique is represented through the MIT a-reactive-particle-system project. |
| [particles-playground](https://github.com/isladjan/particles-playground) | Custom notification license | **Not used.** Requires prior written notification to the author. |

---

## MIT license text

The following MIT-licensed works were adapted. The MIT permission notice is
reproduced once below; each copyright line belongs to its respective project.

Copyright (c) 2021 John Roussos — a-reactive-particle-system
Copyright (c) 2026 Bautista Berto — cursor-shader-trail
Copyright (c) 2009–2026 Codrops — MotionTrailAnimations
Copyright (c) 2026 Tanja Gomilar — mouse-animations
Copyright (c) 2022 eh. sh — react-creative-cursor
Copyright (c) 2026 Shahroz Adnan — webgl-fluid-cursor
Copyright (c) 2026 Sebastian Vasquez — image-trail
Copyright (c) 2026 Felix Au — CursorX-Interactive-Cursor-Effects
Copyright (c) 2026 CialloKing — ba-click-fx
Copyright (c) 2026 PC2005-cloud — CursorKit

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Assets

- `public/art/trail/31.jpg` … `40.jpg` — from the
  [MotionTrailAnimations](https://github.com/codrops/MotionTrailAnimations)
  repository (MIT). The project credits Midjourney for image generation.
- `public/art/particles/blossom.png`, `african-daisy.jpg`, `blue.jpg`,
  `daisy.jpg`, `lily.jpg`, `yellow.jpg` — from the
  [a-reactive-particle-system](https://github.com/JRoussos/a-reactive-particle-system)
  repository (MIT).
- `public/art/particles/1.jpg`, `2.jpg`, `3.jpg` — from the
  [MotionTrailAnimations](https://github.com/codrops/MotionTrailAnimations)
  repository (MIT).
- `public/art/image-trail-x/01.jpg` … `07.jpg` — from the
  [image-trail](https://github.com/sebastianvasquezechavarria1234/image-trail)
  repository (MIT).

The assets are used unmodified as demo content. No ownership is claimed.

## Scope of this project's license

The reconstruction code in `src/` is an original implementation, except where a
file header or this notice explicitly identifies an adapted MIT source. The
project is distributed under the MIT license (see `LICENSE`). The unlicensed
projects above are not included in that grant because no code from them is
present.

`ba-click-fx` is consumed as an external npm package. Its own MIT license and
copyright notice apply to that package; see `node_modules/ba-click-fx/LICENSE`
and its `THIRD_PARTY_NOTICES.md` after installation.
