# 开源鼠标追踪特效分析报告

> 扫描目录：`/home/ypf/extra-app/AI/skill/mouse_track`
> 分析对象：目录下的 13 个开源项目
> 交付工程：`mouse-effects-lab/`（本目录）
> 分析方式：先遍历目录与 `package.json`，再通过 `mousemove` / `pointermove` / `pointerdown` / `requestAnimationFrame` / `gsap` / `onPointerMove` / `uMouse` / `DataTexture` 等关键词定位实现，最后逐个项目阅读入口、组件、Shader 与样式文件。

---

## 1. 总览

| # | 项目 | 主要技术栈 | 鼠标相关入口 | 渲染方式 | 许可证 | 本工程中的使用 |
|---|------|-----------|--------------|----------|--------|----------------|
| 1 | `a-reactive-particle-system` | React + React Three Fiber + Three.js + GSAP | `src/interactivity.js` 的 mesh `onPointerMove` | Three.js instanced quads + GLSL | MIT | 提取为 **Pixel Particle Portrait** |
| 2 | `cursor-shader-trail` | Next.js + React 19 + Three.js WebGPU + TSL | `lib/tsl/interactivity/use-grid-trail-texture.ts` | WebGPU + TSL shader | MIT | 移植为 **Shader Text Trail**（WebGL/GLSL） |
| 3 | `Cursor-Trial-Effect` | 原生 HTML / CSS / Canvas 2D | `script.js` 的 `mousemove` / `touchmove` | Canvas 2D | 无 LICENSE 文件 | 仅行为参考，重写为 **Spring Glow Trail** |
| 4 | `interactive-particles` | Webpack + Three.js + glslify + GSAP | `InteractiveControls.js`, `Particles.onInteractiveMove` | Three.js instanced quads + GLSL | README 为 Codrops 自定义许可（非标准 MIT，尽管 package.json 写 MIT） | 未复制代码；相关概念经 MIT 项目 `a-reactive-particle-system` 学习 |
| 5 | `MotionTrailAnimations` | 原生 JS + GSAP + Three.js TSL | `js/trail.js` 的 `pointermove` | DOM transforms + GSAP | MIT | 提取为 **GSAP Image Trail** |
| 6 | `mouse-animations` | TypeScript，零运行时依赖 | `src/core/*`, `src/animations/*` | Canvas 2D / DOM / CSS | MIT | 提取为 **Dot Trail / Click Burst / Magnetic / Spotlight / Flashlight / Invert Lens** |
| 7 | `mouse-effects` | Next.js + R3F + Three.js + GSAP + Leva | `water-distortion`, `mask-cursor`, `image-follow-cursor` | WebGL ping-pong + DOM + GSAP | 无 LICENSE 文件 | 仅行为参考，重写为 **Water Ripple / Liquid Mask Reveal / Image Follow** |
| 8 | `particles-playground` | Three.js + GSAP | `effect.js` 的 `mousemove` + Raycaster | Three.js instanced quads + GLSL | 自定义“使用前通知”许可 | 未使用（许可不满足无条件复用） |
| 9 | `react-creative-cursor` | React + GSAP + SCSS | `src/Cursor.tsx` 的 `mousemove` / `mouseenter` | DOM + CSS transform | MIT | 提取为 **Gelly Sticky Cursor** |
| 10 | `webgl-fluid-cursor` | Three.js + GLSL | `main.js` 的 `pointermove` / `touchmove` | GPU 流体模拟（FBO ping-pong） | MIT | 提取为 **WebGL Fluid Cursor** |
| 11 | `image-trail` | React 19 + GSAP + Tailwind | `src/ImageTrail.jsx` 的 `mousemove` / `touchmove` | DOM transforms + GSAP | MIT | 提取为 **Image Trail X**（8 变体） |
| 12 | `CursorX-Interactive-Cursor-Effects` | React 19 + Canvas 2D + CSS/SVG | `src/cursors/*.jsx` 的 `mousemove` / `click` | Canvas / DOM / SVG filter | MIT | 提取为 **Morphing Blob / Fire Trail / Constellation** |
| 13 | `ba-click-fx` | 原生 JS + WebGL2 / WebGPU + Canvas 2D 回退 | `src/engine-input.js` 的 Pointer 事件 | WebGL2 / Canvas 2D 多 Canvas 覆盖层 | MIT | 以 npm 依赖集成 **BA Click FX** |

---

## 2. 逐项目分析

### 2.1 `a-reactive-particle-system`

- **结构**：Create React App；入口 `src/index.js → App.js`；核心为 `App.js`、`shaders.js`、`interactivity.js`、`images.js`，素材在 `src/img/` 与 `public/`。
- **鼠标链路**：
  - `Interactivity` 组件渲染一个透明 `mesh`，监听 R3F 的 `onPointerMove`，拿到 `uv` 后调用 `addTouch(uv)`。
  - `addTouch` 根据上一个采样点计算 `force = min(distance² × 10000, 1)`，并把 `{x, y, age, force}` 推入 `trail`。
  - 每帧把 64×64 的离屏 Canvas 清空，用径向渐变绘制每个采样点；`age` 先增大后衰减，形成“指针涟漪”。
  - 该 Canvas 作为 `uRayTexture` 传入顶点着色器。
- **渲染**：`instancedMesh` + 每个像素一个实例；顶点着色器用 `snoise`、随机数、`uDepth` 和 `uRayTexture` 位移实例；片元着色器按纹理颜色和圆形距离裁剪。
- **动画**：GSAP 对 `uDepth` / `uSize` 做“散开→聚合”过渡；每 20 秒或点击切换图片。
- **依赖**：Three.js、@react-three/fiber、@react-three/drei、GSAP。
- **可复用点**：离屏触摸纹理、像素到实例的映射、顶点位移公式。
- **原实现问题**：在 render 体内注册 `window` click 与 `setInterval`，没有清理；图片和交互 mesh 的尺寸绑定较脆弱。
- **本工程处理**：保留离屏触摸纹理与实例化思路，改为纯 Three.js engine，图片先降采样到可控网格；用无限平面射线求交并正确映射到图像 UV（原 1×1 命中面过小，导致卡片大部分区域不触发），指针改为径向 + 深度推力并增加触摸纹理强度与辉光；补充分辨率参数、资源释放和错误兜底。

### 2.2 `cursor-shader-trail`

- **结构**：Next.js App Router；`app/page.tsx → components/shader-trail/shader-trail-experience.tsx`；核心在 `lib/tsl/`。
- **鼠标链路**：`use-grid-trail-texture.ts`
  - 在 canvas 上监听 `pointermove` / `pointerleave` / `pointerup` / `blur`。
  - 把指针映射到 `[0, 2]` 的 NDC 空间。
  - 每帧维护一个 `grid × grid` 的 RGBA `DataTexture`：R/G 存反向 dx/dy 流动，B 存速度；所有单元按 `decay` 衰减，指针附近按笔刷形状写入。
  - 支持 `circle / hatch / corner / crossSquareCorner / cross / star` 六种笔刷 SDF。
- **渲染**：`build-color-node.ts` 用 TSL 组合 9-tap 高斯模糊、UV 扭曲、文字纹理、方向模糊、阈值、三色墨迹渐变、颗粒、Bayer 抖动、速度三色轨迹和暗角。
- **动画**：`useFrame` 驱动 DataTexture 更新；引入动画用虚拟指针驱动同一个笔刷。
- **依赖**：Three.js WebGPU、TSL、R3F、Dialkit。
- **可复用点**：**“JavaScript 写流场纹理 + Shader 读取并决定画什么”** 的拆分方式；速度三色映射。
- **本工程处理**：原项目依赖 WebGPU，兼容性有限。本工程把交互纹理与速度配色移植为 WebGL2/GLSL：160² 的 RGBA float `DataTexture`、JS 写入 + 衰减、9-tap 模糊、文字 Canvas、双色速度渐变。未复制六种笔刷形状，避免提供无法对应源码的“假控制项”。

### 2.3 `Cursor-Trial-Effect`

- **结构**：`index.html` + `style.css` + `script.js`，无依赖。
- **鼠标链路**：`canvas.addEventListener('mousemove'/'mouseenter')`，触摸用 `touchmove` 并手动换算坐标。
- **算法**：20 条 `Line`，各自维护 `points`、`vx/vy`、`spring`、`friction`。每帧：
  ```text
  vx += (mouse.x - x) * spring
  vx *= friction
  x += vx
  ```
  然后压入点、裁剪到 `maxPoints`；绘制时用相邻点中点作为二次贝塞尔控制点，`globalCompositeOperation = 'lighter'`，HSL 色相每帧递增。
- **依赖**：无。
- **可复用点**：弹簧积分、二次曲线平滑、加法混合发光。
- **原实现问题**：没有销毁/暂停逻辑；`ctx.running` 永远为真；没有 DPR 处理；只监听鼠标和触摸，不统一为 Pointer Events。
- **许可证**：仓库没有 LICENSE 文件，因此**不复制源码**，只按行为重写。
- **本工程处理**：重写为 engine，使用 Pointer Events、ResizeObserver、DPR 上限、设置实时读取、完整清理；保留弹簧/摩擦/色相漂移/发光。

### 2.4 `interactive-particles`

- **结构**：Webpack + `src/scripts/App.js → WebGLView → Particles`；着色器在 `src/shaders/particle.vert/.frag`。
- **鼠标链路**：`InteractiveControls` 做 `mousedown/mousemove/mouseup/mouseleave`（移动端 touch），用 Raycaster 命中隐藏平面，向 `Particles` 发出 `interactive-move`；`TouchTexture` 维护 64×64 Canvas、`maxAge = 120`。
- **渲染**：`InstancedBufferGeometry`，每个可见像素一个实例；顶点着色器用 `glsl-noise` 的 simplex noise 和触摸纹理做 XYZ 位移；片元按圆形裁剪。
- **动画**：`show()` / `hide()` 用 GSAP 调整 `uSize/uRandom/uDepth`；点击切换图片。
- **许可风险**：README 明确写了 Codrops 自定义许可（不可原样转售/再发布），与 package.json 的 MIT 字段冲突。为降低风险，本工程**没有复制该项目代码**；相同技术通过 MIT 的 `a-reactive-particle-system` 实现。
- **可复用点**：隐藏命中平面 + Raycaster + `uv` 采样、触摸纹理的“力”计算。

### 2.5 `MotionTrailAnimations`

- **结构**：16 个 `indexN.html` 入口；共享 `js/trail.js`、`js/image.js`、`js/utils.js`；每个 `js/demoN/` 是一个动画变体。
- **鼠标链路**：`trail.js`
  - `pointermove` 更新指针；`pointerdown` / `pointerenter` 重置轨迹。
  - `tick` 使用 `gsap.ticker`；`dt = gsap.ticker.deltaRatio(60)`。
  - `trailing` 以 `1 - pow(1 - lag, dt)` 追赶指针。
  - 当 `distance >= threshold` 时，沿最后一段路径等距插值出生点，每帧最多 `maxPerFrame = 4` 个，防止高速移动时爆炸。
- **渲染**：每个变体只决定图片如何出现：`fromTo` 位置/缩放/透明度，外加 `filter: grayscale/brightness/blur`；部分变体用 WebGL/TSL。
- **依赖**：GSAP；部分变体 Three.js。
- **可复用点**：距离阈值出生器、滞后位置、变体插槽设计、`prefers-reduced-motion` 分支。
- **本工程处理**：合并 demo 1/2/6 为一个效果，保留阈值/滞后/尺寸，增加变体选择；使用 16 个 DOM 节点池，组件卸载时移除 ticker 与 tweens。

### 2.6 `mouse-animations`

- **结构**：TypeScript 库，`src/animations/*` 每个效果一个类；`src/core/` 提供 `MouseTracker`、`CanvasOverlay`、`MouseFollower`、`ElementAnimator`。
- **鼠标链路**：
  - `MouseTracker` 单例，首次订阅时挂全局 `mousemove`，最后一个订阅者离开时移除。
  - `MouseFollower` 负责原始位置、lerp 平滑、首帧和 rAF。
  - `ElementAnimator` 为每个匹配元素维护 `mousemove/mouseleave` 与 rAF lerp。
- **效果**：Trail、Ripple、CustomCursor、Magnetic、Particles、Parallax、Tilt、Spotlight、Flashlight、Invert、Image。
- **渲染**：Canvas 2D（Trail/Particles）、DOM transform（Magnetic/Tilt/Parallax）、CSS 变量/渐变（Spotlight）、CSS mask（Flashlight）、`mix-blend-mode`（Invert）。
- **优点**：生命周期接口统一（`enable/disable/destroy`），零依赖，订阅引用计数，参数化完整。
- **本工程处理**：作为主要“高质量可复用”来源，提取 6 个效果，但改成每张卡片独立 engine，不使用全局 body overlay；参数控制直接映射到原选项。

### 2.7 `mouse-effects`

- **结构**：Next.js；`src/app/page.tsx`、`mask-cursor/page.tsx`、`image-follow-cursor/page.tsx`；组件在 `src/components/`。
- **水波纹**：
  - 512² 三张 ping-pong render target。
  - `fluidUpdateShader` 用波动方程：`wave = neighbors*2 - prev`，按 `viscosity` 混合、`decay` 衰减；指针路径上 8 个采样点叠加 ripple。
  - 图像 shader 从位移场求法线，做折射、RGB 色散、specular/Fresnel。
- **遮罩**：同一套流场作为 mask，`revealSize` 缩放、`edgeSoftness` 平滑，混合两张图。
- **图片跟随**：`mousemove` 距离超过 `minDistance` 时创建 DOM 图片，GSAP timeline 先放大淡入、归位、再缩小淡出；排除头部区域。
- **依赖**：R3F、Three.js、GSAP、Leva。
- **许可风险**：仓库没有 LICENSE 文件。因此本工程**没有复制其代码**；水波纹/遮罩用自行编写的 engine 与 shader 重写，图片跟随也重写为 React 组件。
- **原实现问题**：`useEffect` 清理的依赖数组为空但引用闭包值；图片跟随没有节点上限；没有专门的触摸逻辑（仅 window touchmove）。
- **本工程处理**：独立 Three.js engine，显式 FBO 生命周期，支持四张图切换、实时参数、节点上限、Pointer Events、卸载清理。

### 2.8 `particles-playground`

- **结构**：`effect.js`（约 1000 行）+ `examples/main.js` + `index.html`；Three.js + GSAP。
- **鼠标链路**：`window.mousemove` 经 16ms throttle，Raycaster 命中隐藏平面，`buildTail(uv)` 写入 80×80 尾部 Canvas；顶点着色器读取 `uTouch` 做位移。
- **渲染**：instanced quads、RawShaderMaterial、simplex noise、图片纹理；每帧最多 60 FPS。
- **许可**：自定义许可，要求使用前先书面通知作者；不满足“无需额外动作即可复用”的条件。本工程未使用其代码。
- **可复用点**：FPS 限制、节流、尾部纹理尺寸与 `maxAge` 的调参关系。

### 2.9 `react-creative-cursor`

- **结构**：库入口 `src/index.tsx`，核心 `src/Cursor.tsx`，样式 `src/cursor.scss`。
- **鼠标链路**：
  - `window.mousemove` 中用 `gsap.quickTo(pos, 'x'/'y')` 平滑位置。
  - `vel` 由“目标位置 − 平滑位置”得到。
  - `getAngle = atan2(dy, dx)`，`getScale = min(distance / 735, 0.35)`。
  - `scaleX = 1 + scale`，`scaleY = 1 - scale`，光标整体按速度方向旋转；内层文字反向旋转。
  - `data-cursor-stick` 元素把目标位置拉向元素中心（`stickAnimationAmount`）。
  - `data-cursor-size/text/color/exclusion/background-image` 通过 `mouseenter/mouseleave` 改变光标。
- **依赖**：GSAP。
- **可复用点**：gelly 形变数学、sticky 目标、data 属性驱动。
- **原实现问题**：清理函数里 `removeEventListener` 传入的是新建的 no-op 回调，真实监听器实际上不会被移除；`useLayoutEffect` 没有依赖数组，每次 render 都重新绑定。
- **本工程处理**：只取核心数学，重写为分区内的 rAF 循环；使用 `closest('[data-gelly]')` 做命中，避免全局 DOM 查询；实时参数 + 完整清理。

### 2.10 `webgl-fluid-cursor`

- **结构**：`index.html` + `main.js` + `shaders/*.frag`，import map 引入 Three.js。
- **鼠标链路**：`pointermove` 与 `touchmove` 更新归一化坐标；每帧比较当前/上一位置得到速度，当速度 > 0.02 时注入 splat。
- **模拟管线**：
  `splat → curl → vorticity → divergence → clear pressure → Jacobi pressure ×N → gradient subtract → advect velocity → advect dye → display`
  - 速度场 128²，染料场 720²，均使用 half-float ping-pong。
  - `splat.frag` 用高斯核 `exp(-dot(p,p)/radius)` 注入。
  - `display.frag` 由染料亮度梯度求法线，加漫反射，再用 ACES 色调映射；alpha 由亮度导出。
- **依赖**：Three.js。
- **可复用点**：完整可运行的 GPU 流体管线、速度与染料分辨率解耦、色相随机跳变。
- **本工程处理**：保留管线与 shader（MIT，注明出处），把画布缩到卡片内，增加 splat 半径、力、染料强度、速度/染料耗散、涡度、压力迭代次数等实时控制；补充 ResizeObserver、每帧清屏和完整 dispose。

---


### 2.11 `image-trail`

- **结构**：Vite + React 19；`src/App.jsx` 负责分类、变体切换与侧栏；核心 `src/ImageTrail.jsx` 中包含 `ImageTrailVariant1…8` 八个类。
- **鼠标链路**：每个变体在容器上监听 `mousemove` / `touchmove`，把指针换算为容器局部坐标；`cacheMousePos` 以 `lerp(..., 0.1)` 滞后跟随；`render()` 每帧计算与上一个出生点的距离，超过 `threshold = 80` 时调用 `showNextImage()`。
- **渲染**：图片节点用 GSAP timeline 做位移/缩放/透明度/旋转/filter。八个变体分别覆盖：平滑缩小、闪白放大、爆炸上升、速度惯性与色散、旋转与拉伸、运动模糊/去色、持久堆叠、基于屏幕中心的 3D 旋转。
- **依赖**：React、GSAP、Tailwind CSS 4、Vite。
- **可复用点**：距离阈值出生、缓存点滞后、每个变体只负责“图片如何出现”的插槽结构。
- **原实现问题**：每个变体类在自己的构造器里注册监听和 rAF，但没有对应销毁方法；切换变体依赖 React 重新挂载，旧循环/监听依赖 GC。`ImageItem` 的 resize 监听也未移除。
- **本工程处理**：重写为独立 `ImageTrailXEngine`，统一 18 个 DOM 节点池和 8 个 GSAP 变体；`gsap.ticker`、监听、tween 和行内样式在卸载时清理；阈值/滞后/图片宽度/时长/变体均可实时控制。

### 2.12 `CursorX-Interactive-Cursor-Effects`

- **结构**：Vite + React 19；`src/cursors/` 下 24 个独立 cursor 组件，`src/App.jsx` 用轮播/配置面板组织；每个组件接收 `containerRef` 与 `config`。
- **鼠标链路**：大部分组件在容器上监听 `mousemove` / `click`，用 `requestAnimationFrame` 更新 DOM 或 Canvas；部分效果用 `document.elementsFromPoint` 检测是否悬停在按钮/链接上。
- **渲染**：Canvas 2D（粒子、火、星座、碎裂、文字轨道等）、CSS transform（磁吸、弹性环等）、SVG filter（Morphing Blob 的 gooey 融合）。
- **依赖**：React、Vite、原生 Canvas/SVG。
- **可复用点**：
  - Morphing Blob：`feGaussianBlur` + `feColorMatrix` 的 alpha 融合，配合 lerp 拖尾。
  - Fire Trail：HSL 生命周期 + 上升速度 + 点击径向迸发。
  - Constellation：星点漂移 + O(n²) 邻近连线 + 指针连接 + 点击脉冲。
- **原实现问题**：`PixelShatterCursor` 使用全局 `window._pxHue`；多个组件只清理部分监听；`elementsFromPoint` 依赖特定的 `btn` 类名；部分效果在未移入容器时也会在 `(0,0)` 生成粒子。
- **本工程处理**：选择 3 个视觉差异最大的效果，重写为独立 engine：作用域限定在卡片、无全局变量、使用 Pointer Events、DPR 限制、参数实时读取、卸载清理。

### 2.13 `ba-click-fx`

- **结构**：一个完整的 MIT 特效库；入口 `src/fx.js`，内部拆分为 `engine-core.js`、`engine-input.js`、`engine-trail.js`、`engine-particles.js`、`engine-render.js`、`webgl2-*`、`webgpu-*` 等模块；`src/main.js` 是官方演示页。
- **鼠标链路**：`engine-input.js` 在 `window` 上以 capture 阶段监听 Pointer/Touch 事件，再按 `target` 容器的边界、Shadow DOM 与 `inputFilter` 过滤；也支持 `manual` 输入 API（`pointerDown/Move/Up/boom`）。
- **渲染**：默认 WebGL2 场景，可选 WebGPU/HDR；GPU 不可用时回退 Canvas 2D 与原生辉光。点击产生溶解圆环、中心光盘与三角碎片爆发；移动可产生连续拖尾。默认参数来自《蔚蓝档案》Unity 资源。
- **依赖**：零外部运行时依赖；构建要求 Node ≥ 24，但发布的 `dist` 在浏览器运行。
- **可复用点**：成熟的后端选择/回退、容器挂载、输入过滤、无活跃特效时自动停止调度、`destroy()` 生命周期。
- **本工程处理**：通过 `npm install ba-click-fx` 直接依赖其发布包，在卡片容器上用 `target` 挂载，采用 `browser-overlay` + `screen` 合成；主题色/缩放/透明度/开关/后端/时间倍率实时 `updateConfig`。归档源码通过 `package.json` 声明依赖，而不复制 1.4 MB 源码。

## 3. 技术横向对比

### 3.1 坐标采集

| 方式 | 项目 | 特点 |
|------|------|------|
| 全局 `mousemove` | mouse-animations, react-creative-cursor | 简单，但需要单例/引用计数管理 |
| 元素级 `pointermove` | cursor-shader-trail, MotionTrailAnimations, webgl-fluid-cursor | 天然限定作用域，触摸/笔一致 |
| R3F `onPointerMove` + Raycaster | a-reactive-particle-system, interactive-particles, particles-playground | 能得到 3D 平面 UV，适合纹理反馈 |
| `touchmove` 单独处理 | Cursor-Trial-Effect, webgl-fluid-cursor, mouse-effects | 兼容旧代码，但容易出现两套逻辑 |

重构统一优先使用 **Pointer Events**，鼠标、触摸、笔共用一条路径，并在容器上设置 `touch-action: none`。

### 3.2 平滑与轨迹

| 算法 | 代表 | 说明 |
|------|------|------|
| 直接跟随 | Cursor-Trial-Effect 的鼠标采样、dot-trail | 不额外平滑 |
| 弹簧积分 | spring-trail | 有过冲，视觉弹性强 |
| 线性插值 | mouse-animations `MouseFollower`、react-creative-cursor | `x += (target-x)*k`，帧率无关版本为 `1-(1-k)^dt` |
| GSAP `quickTo` | react-creative-cursor | 交给 GSAP 的补间 |
| 滞后位置 + 阈值出生 | MotionTrailAnimations | 把“跟随”和“出生节奏”解耦 |
| 流场写入 | cursor-shader-trail | 历史信息存在纹理里，而不是 JS 数组 |

### 3.3 渲染与性能

- **Canvas 2D**：实现成本低，适合少量点/线；需要处理 DPR，避免每帧 `filter` 过多。
- **DOM + GSAP**：适合图片/卡片，能利用浏览器合成层；需要限制节点数量，注意 `will-change`。
- **Three.js instancing**：像素粒子必须实例化；本工程把图片降采样到 80–200 的网格，控制实例数量。
- **FBO / 流体**：分辨率与屏幕解耦；本工程保留 128² 速度场、512² 染料场，压力迭代可调。
- **生命周期**：本工程用 IntersectionObserver 在卡片接近视口时挂载引擎，离开后卸载；WebGL 引擎在卸载时 dispose 所有 target/material/texture/geometry 并释放上下文。

---

## 4. 特效筛选与重构映射

筛选标准：视觉辨识度、算法可提取性、技术多样性、许可证允许程度、原实现质量。

| 交付效果 | 类型 | 来源 | 许可证 | 重构方式 |
|----------|------|------|--------|----------|
| Spring Glow Trail | Cursor Trail | Cursor-Trial-Effect | 无（仅参考） | 从零重写弹簧曲线 + Canvas 2D |
| Fading Dot Trail | Cursor Trail | mouse-animations `trail.ts` | MIT | 独立 Canvas engine + 实时参数 |
| Pixel Particle Portrait | Particle Trail | a-reactive-particle-system | MIT | 去 React，纯 Three.js 实例化 |
| Click Particle Burst | Particle Trail | mouse-animations `particles.ts` | MIT | 独立 engine + 调色板 |
| GSAP Image Trail | Image Trail | MotionTrailAnimations demo 1/2/6 | MIT | 合并变体，DOM 节点池 |
| Image Follow Cursor | Image Trail | mouse-effects | 无（仅参考） | React + GSAP 重写，节点上限 |
| Magnetic Elements | Magnetic Cursor | mouse-animations `magnetic.ts` | MIT | 独立 engine，root 相对坐标 |
| Gelly Sticky Cursor | Magnetic Cursor | react-creative-cursor | MIT | 提取数学，重写循环与命中 |
| Spotlight Cards | Spotlight & Lens | mouse-animations `spotlight.ts` | MIT | 事件委托 + CSS 变量 + 描边 |
| Flashlight Reveal | Spotlight & Lens | mouse-animations `flashlight.ts` | MIT | 分区遮罩 + 惯性跟随 |
| Invert Lens | Spotlight & Lens | mouse-animations `invert.ts` | MIT | 平滑/混合模式控制 |
| WebGL Fluid Cursor | Fluid | webgl-fluid-cursor | MIT | 保留管线，卡片化 + 参数化 |
| Water Ripple Distortion | Liquid Distortion | mouse-effects | 无（仅参考） | 自行编写波动方程 + 折射 shader |
| Liquid Mask Reveal | Liquid Distortion | mouse-effects | 无（仅参考） | 自行编写 mask 合成 shader |
| Shader Text Trail | Liquid Distortion | cursor-shader-trail | MIT | WebGPU/TSL → WebGL/GLSL 移植 |
| Image Trail X | Image Trail | image-trail | MIT | 合并 8 个变体，独立 GSAP engine |
| Morphing Blob Cursor | Liquid Distortion | CursorX | MIT | SVG gooey filter + 独立 rAF |
| Fire Trail Cursor | Particle Trail | CursorX | MIT | 独立 Canvas engine |
| Constellation Cursor | Particle Trail | CursorX | MIT | 独立 Canvas engine |
| BA Click FX | Particle Trail | ba-click-fx | MIT | 直接依赖 npm 发布包 |

未采用：

- `interactive-particles`：README 许可限制原样再发布；相关技术已由 MIT 项目覆盖。
- `particles-playground`：自定义“先通知作者”许可，不适合直接放入可自由运行的 Demo。
- `mouse-effects` 与 `Cursor-Trial-Effect`：无 LICENSE 文件，因此只做行为分析，不复制实现。

---

## 5. 原项目中的问题与本工程的修正

| 问题 | 出现位置 | 修正 |
|------|----------|------|
| 监听器只加不减 | Cursor-Trial-Effect、a-reactive-particle-system、webgl-fluid-cursor | 统一在 engine `destroy()` 中移除；React 卸载时调用 |
| 清理函数移除的是新建 no-op 回调 | react-creative-cursor | 重写为具名处理函数 |
| 全局 body overlay 影响整页 | mouse-animations 的 Trail/Flashlight | 改为卡片内 canvas / 遮罩 |
| 每帧高频 React state | 多数 React 示例 | 指针数据写入 ref / DOM style / shader uniform，不进入 state |
| 移动端只有 touch 分支 | Cursor-Trial-Effect 等 | 统一 Pointer Events |
| 没有 DPR 上限 | Canvas 2D 示例 | DPR 限制到 2（WebGL 到 1.75） |
| 大图直接逐像素实例化 | a-reactive-particle-system | 先降采样到可控分辨率，再实例化 |
| 命中面尺寸与粒子世界尺寸不一致 | a-reactive-particle-system 的重构版本 | 改为无限平面射线求交 + 按纹理尺寸归一化 UV，整张卡片可交互 |
| WebGL 资源未释放 | mouse-effects、webgl-fluid-cursor | 显式 dispose + `forceContextLoss` |
| 只支持固定全屏 | 流体、水波纹 | ResizeObserver 绑定卡片尺寸，模拟分辨率与显示尺寸解耦 |
| 无 WebGL 失败兜底 | 全部 WebGL 示例 | 捕获引擎构造失败，显示可恢复的提示层，应用不崩溃 |

---

## 6. 验证记录

- `npx tsc -b --pretty false`：通过。
- `npm run build`：通过（Vite 生产构建）。
- 开发服务器与生产预览均实际启动。
- Playwright 逐项验证：
  - 20 张卡片全部挂载；
  - Canvas 2D 效果在指针移动时有非空像素：Spring Trail 约 21,060 个绘制像素，Click Burst 约 5,785 个，Dot Trail 实时约 4,864 个；
  - WebGL 效果截图存在明显亮度/色度变化（Pixel Portrait、Fluid、Water Ripple、Mask Reveal、Shader Text）；
  - DOM 效果验证了实际状态变化：Image Trail 同时 4 张可见图片、Image Follow 生成 5 个节点、Image Trail X 同时 4 张可见图片、Morphing Blob 生成 7 个 blob、Magnetic transform、Gelly 光标宽度、Spotlight CSS 变量、Flashlight 半径、Invert 尺寸；
  - 新增 Canvas/WebGL 效果截图差异：Fire Trail 约 11k 像素、Constellation 约 29k 像素、BA Click FX 约 34k 像素发生变化；
  - BA Click FX 指针离开卡片后调用 `pointerCancel()` + `clearTrail()`，卡片外移动/点击截图差异为 0；
  - Image Trail X 的 Exposure 默认 0.75，并调低 Speed Inertia 的亮度/对比度上限，避免照片过曝；
  - 参数控制逐项修改并验证：颜色/尺寸/数量/强度/变体/文本均反映到运行效果；
  - cases 归档：检查源码包文件列表、源码内容、素材、归属信息和最小 Vite 工程；
  - Reset 将参数恢复默认并重新挂载效果；
  - 滚动离开后卡片卸载（顶部仅 2 个 live，13 个占位），滚动回来后重新挂载；
  - 390×844 移动端：单列布局、无横向溢出、导航可横向滚动；
  - 生产构建下控制台无运行错误（favicon 已补齐）。
