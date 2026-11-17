# Mouse Effects Lab

一个从开源项目中分析、提取并**重写**的鼠标交互特效实验室。20 个可独立运行的特效，覆盖 Canvas 2D、DOM/GSAP、CSS、Three.js、GLSL 与 GPU 流体模拟。

- 源码优先：每个效果都追溯到具体开源项目、源码路径与许可证。
- 真实控制：只暴露实际生效的参数，没有装饰性假滑杆。
- 生命周期完整：指针事件、rAF/ticker、WebGL 资源在卸载时清理；鼠标离开/窗口失焦时停止注入。
- 触摸兼容：统一使用 Pointer Events，容器设置 `touch-action: none`。

## 快速运行

```bash
cd mouse-effects-lab
npm install
npm run dev
# http://localhost:5173
```

生产构建与预览：

```bash
npm run build
npm run preview
# http://localhost:4173
```

类型检查：

```bash
npm run typecheck
```

环境：Node.js 18+，现代浏览器（需要 WebGL2；Chrome / Edge / Firefox / Safari 近期版本）。

## 效果清单

| # | 效果 | 分类 | 技术 | 来源 | 许可 |
|---|------|------|------|------|------|
| 01 | WebGL Fluid Cursor | Fluid Effect | Three.js + GPU fluid | webgl-fluid-cursor | MIT |
| 02 | Spring Glow Trail | Cursor Trail | Canvas 2D + 弹簧物理 | Cursor-Trial-Effect | 无 LICENSE，仅行为参考 |
| 03 | Fading Dot Trail | Cursor Trail | Canvas 2D | mouse-animations | MIT |
| 04 | Pixel Particle Portrait | Particle Trail | Three.js + GLSL instancing | a-reactive-particle-system | MIT |
| 05 | Click Particle Burst | Particle Trail | Canvas 2D | mouse-animations | MIT |
| 06 | Fire Trail Cursor | Particle Trail | Canvas 2D + HSL lifecycle | CursorX | MIT |
| 07 | Constellation Cursor | Particle Trail | Canvas 2D + proximity graph | CursorX | MIT |
| 08 | BA Click FX | Particle Trail | WebGL2 + Canvas 2D 回退 | ba-click-fx | MIT |
| 09 | GSAP Image Trail | Image Trail | DOM + GSAP | MotionTrailAnimations | MIT |
| 10 | Image Follow Cursor | Image Trail | DOM + GSAP | mouse-effects | 无 LICENSE，仅行为参考 |
| 11 | Image Trail X | Image Trail | DOM + GSAP（8 变体） | image-trail | MIT |
| 12 | Magnetic Elements | Magnetic Cursor | DOM + rAF | mouse-animations | MIT |
| 13 | Gelly Sticky Cursor | Magnetic Cursor | DOM + velocity deformation | react-creative-cursor | MIT |
| 14 | Spotlight Cards | Spotlight & Lens | CSS variables | mouse-animations | MIT |
| 15 | Flashlight Reveal | Spotlight & Lens | CSS mask | mouse-animations | MIT |
| 16 | Invert Lens | Spotlight & Lens | mix-blend-mode | mouse-animations | MIT |
| 17 | Water Ripple Distortion | Liquid Distortion | Three.js + GLSL | mouse-effects | 无 LICENSE，重写 |
| 18 | Liquid Mask Reveal | Liquid Distortion | Three.js + GLSL | mouse-effects | 无 LICENSE，重写 |
| 19 | Shader Text Trail | Liquid Distortion | WebGL + GLSL | cursor-shader-trail | MIT |
| 20 | Morphing Blob Cursor | Liquid Distortion | SVG gooey filter | CursorX | MIT |

完整分析、原项目目录结构与算法拆解见 **[ANALYSIS.md](./ANALYSIS.md)**；许可证与素材归属见 **[LICENSE-NOTICES.md](./LICENSE-NOTICES.md)**。

## 目录结构

```text
mouse-effects-lab/
├── public/
│   ├── art/
│   │   ├── trail/                 # MotionTrailAnimations (MIT) 图片
│   │   ├── image-trail-x/         # image-trail (MIT) 图片
│   │   └── particles/             # a-reactive-particle-system / MotionTrail (MIT) 图片
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── EffectCard.tsx         # 卡片、视口懒挂载、Reset
│   │   ├── ControlPanel.tsx       # 滑块 / 颜色 / 选择 / 开关 / 文本
│   ├── data/
│   │   └── effects.tsx            # 元数据、控制项、源码 ?raw 引用
│   ├── effects/
│   │   ├── spring-trail/
│   │   ├── dot-trail/
│   │   ├── pixel-particles/       # includes shaders/*.vert|frag
│   │   ├── fire-trail/
│   │   ├── constellation/
│   │   ├── ba-click/
│   │   ├── click-burst/
│   │   ├── image-trail/
│   │   ├── image-follow/
│   │   ├── image-trail-x/
│   │   ├── magnetic-elements/
│   │   ├── gelly-cursor/
│   │   ├── spotlight-cards/
│   │   ├── flashlight/
│   │   ├── invert-lens/
│   │   ├── fluid-cursor/          # includes 10 shader files
│   │   ├── water-ripple/
│   │   ├── mask-reveal/
│   │   ├── shader-text/
│   │   └── morphing-blob/
│   ├── hooks/
│   │   ├── useInView.ts           # 进入视口才挂载，离开即卸载
│   │   └── useLatest.ts           # 高频参数不触发 effect 重跑
│   ├── types.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── cases/                      # 每个 case 一个 skill 文件夹 + 视频 + 源码包
├── scripts/                    # 视频录制
├── ANALYSIS.md
├── LICENSE
├── LICENSE-NOTICES.md
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

## 部署到 GitHub Pages

仓库已包含 `.github/workflows/deploy.yml` 和 `public/.nojekyll`。生产构建使用相对路径（`base: './'`），因此既能部署到：

- `https://<user>.github.io/`（用户主页仓库）
- `https://<user>.github.io/mouse-effects-lab/`（项目仓库）

### 1. 把 mouse-effects-lab 作为仓库根目录

```bash
cd mouse-effects-lab
git add .
git commit -m "deploy: mouse effects lab"
git branch -M main
git remote add origin https://github.com/<user>/mouse-effects-lab.git
git push -u origin main
```

> 如果已有 remote，直接 push 即可。当前仓库默认分支是 `master`，workflow 同时监听 `main` 和 `master`。

### 2. 开启 GitHub Pages

在 GitHub 仓库中：

`Settings` → `Pages` → `Build and deployment` → `Source` 选择 **GitHub Actions**。

之后每次 push 到 `main` / `master`，workflow 会：

1. 使用 Node 24 `npm ci`
2. `npm run build`
3. 上传 `dist/`
4. 发布到 GitHub Pages

站点地址：

```text
https://<user>.github.io/mouse-effects-lab/
```

首次部署可能需要几十秒到几分钟。后续 push 会自动更新。

### 注意事项

- **公开仓库**：免费账户的 GitHub Pages 通常要求仓库为 public。
- **素材路径**：所有运行期素材已改为相对路径（`art/...`），因此项目子路径部署不会出现 `/art/...` 404。
- **cases 目录**：`cases/` 约 29 MB（视频 + skill 包），不参与网页构建，但会进入 git 仓库。若只想托管网页，可把 `cases/` 加入 `.gitignore` 后再提交；若需要把视频和源码包也放在 GitHub 上，则保留。
- 构建时已通过 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` 跳过录制用的浏览器下载。
- 如果使用自定义域名，在 Pages 设置中填写域名后，相对路径部署依然有效。

## 每个 Case 的视频与 Skill 源码包

见 **[cases/README.md](./cases/README.md)**，20 个 case 每个一个文件夹：

```text
cases/<case-name>/
├── SKILL.md                 # skill 名称 = case 名称
├── <case-name>.mp4          # 1280×720 / H.264 / 20 秒
├── <case-name>.zip          # skill 形式源码包（不含视频）
├── README.md                # 安装、默认参数、集成说明
├── ATTRIBUTION.md
├── package.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── src/                     # 实际运行的 effect 源码 + shader
└── public/                  # case 需要的素材
```

- 每个视频展示鼠标交互、完整控制面板，以及参数改变后的效果。
- 每个 `SKILL.md` 的 frontmatter `name` 与文件夹和视频文件名一致；zip 为已有静态归档。
- `cases/<case-name>.zip` 解压后根目录为 `<case-name>/`，包含 `SKILL.md` 和可运行的 Vite 源码。
- `cases/manifest.json` 列出每个 case 的视频、zip、skill 路径和文件大小。

重新生成：

```bash
# 终端 A：启动构建后的预览服务
npm run build
npx vite preview --host 0.0.0.0 --port 4180

# 终端 B：重新录制 20 个视频
npm run cases:videos
```

`cases/` 中已有的 skill 源码包是此前生成的静态归档；网页和卡片的 Source ZIP 下载入口已移除。

要求：系统 `ffmpeg`、Playwright Chromium；如未安装，执行 `npx playwright install chromium ffmpeg`，并通过 `CHROMIUM_PATH` 指定 Chromium 可执行文件。

## 架构说明

### 每张卡片是独立引擎

效果统一为 `EffectCard + Component(settings)`：

- **指针采集**：在各效果容器内监听 `pointermove` / `pointerenter` / `pointerdown` / `pointerleave`。
- **动画逻辑**：由 `engine.ts` 内的 rAF / GSAP ticker / Three.js renderer 驱动。
- **渲染逻辑**：Canvas 2D、DOM style、CSS 自定义属性或 WebGL。
- **参数传递**：`settingsRef` 每帧读取最新设置，改变滑杆不会重建引擎；只有图片/分辨率这类需要重建缓冲区的参数才使用 React key 重建 canvas。
- **清理**：卸载时取消 rAF / ticker、移除监听、断开 ResizeObserver、dispose Three.js 资源并释放上下文。

### 视口懒挂载

`useInView` 使用 IntersectionObserver，只有在卡片接近视口时才挂载效果。离开后卸载，避免十几个 WebGL 上下文同时存在。卡片会显示 `scroll into view to activate` 占位。

### 控制项

控制项由 `src/types.ts` 中的描述符驱动：`slider`、`color`、`select`、`toggle`、`text`。所有列出的控制项都在实现中读取并生效：

- Trail：数量、历史长度、线宽、发光、弹簧、摩擦、色相、色相漂移。
- Particle：图片、网格分辨率、粒子大小、深度、亮度、指针力、噪声速度、暗部阈值；点击爆发的数量、大小、速度、重力、衰减、调色板。
- Image：出生距离、滞后、图片尺寸、变体；跟随效果的宽高、最小距离、时长、缓动。
- Magnetic：强度、半径、lerp；Gelly：尺寸、颜色、混合模式、形变量、跟随平滑、吸附量。
- Spotlight：颜色、半径、强度；Flashlight：半径、模糊、平滑、背景；Invert：尺寸、颜色、平滑、混合模式。
- Fluid：splat 半径、力、染料强度、速度耗散、染料耗散、涡度、压力迭代次数。
- Water / Mask：波纹强度、半径、粘度、衰减、折射、色散、光照、mask 大小/软边。
- Shader Text：文本、扭曲强度、轨迹强度、笔刷半径、衰减、双色速度渐变。

## 已验证

- `npm run typecheck`：通过。
- `npm run build`：通过。
- `npm run dev` 与 `npm run preview` 均实际启动。
- Playwright 逐项测试：20 个卡片全部挂载；鼠标移动/点击会改变 Canvas、WebGL 或 DOM 状态；Pixel Particle Portrait 已修复命中面尺寸/UV 映射问题，整张卡片均可交互，指针附近有径向位移与青色辉光；所有控制项修改后实际生效；Reset 恢复默认值并重建效果；滚动离开后卸载、返回后重新挂载；移动端 390×844 单列布局无横向溢出；生产构建控制台无运行错误；新增的 Image Trail X、Morphing Blob、Fire Trail、Constellation、BA Click FX 均通过交互/截图差异验证。
- 20 个 case 视频：全部 1280×720、H.264、精确 20.000 秒，包含交互与全部控制项。
- 20 个 skill 源码包：`SKILL.md` 的 `name` 与 case 文件夹一致，zip 根目录同名，源码可独立 Vite 构建。

具体数值记录见 [ANALYSIS.md 的验证章节](./ANALYSIS.md#6-验证记录)。

## 说明与限制

- 重力/流体等效果依赖 GPU，低端设备或同时打开大量 WebGL 标签页时可能无法分配上下文。此时卡片会显示可恢复提示，而不是让整页崩溃。
- 数据图与效果图均来自 MIT 项目的示例素材；未使用任何无许可证项目的图片或代码。
- 为保证展示完整度，Three.js 与 GSAP 被打进主 bundle（约 0.91 MB，gzip 254 KB）；BA Click FX 通过动态 `import()` 单独成约 428 KB 的 chunk（gzip 159 KB），仅在卡片进入视口时加载。这是本地 Demo 的取舍，不影响运行。
- 无许可证来源（Cursor-Trial-Effect、mouse-effects）只作为行为参考；对应实现均为重写，详见 `LICENSE-NOTICES.md`。
- BA Click FX 直接依赖 MIT 的 `ba-click-fx` npm 包，而不是复制其 1.4 MB 源码。
