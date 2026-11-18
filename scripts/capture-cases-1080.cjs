/* eslint-disable no-console */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const ROOT = path.resolve(__dirname, '..')
const APP_URL = process.env.APP_URL || 'http://127.0.0.1:4180/'
const CHROMIUM = [
  process.env.CHROMIUM_PATH,
  '/home/ypf/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  chromium.executablePath(),
].find((candidate) => candidate && fs.existsSync(candidate))
const CASES_DIR = path.join(ROOT, 'cases')
const TMP = path.join(ROOT, '.tmp-cases', 'capture-1080')

const IDS = [
  'fluid-cursor',
  'spring-trail',
  'dot-trail',
  'pixel-particles',
  'click-burst',
  'fire-trail',
  'constellation',
  'ba-click',
  'image-trail',
  'image-follow',
  'image-trail-x',
  'magnetic-elements',
  'gelly-cursor',
  'spotlight-cards',
  'flashlight',
  'invert-lens',
  'water-ripple',
  'mask-reveal',
  'shader-text',
  'morphing-blob',
  'code-trail',
  'ice-crystal',
  'mist-cloud',
  'fish-school',
  'radar',
  'image-focus',
]

const CLICK_IDS = new Set(['click-burst', 'fire-trail', 'ba-click'])
const CURSORKIT_CLICK_IDS = new Set(['ice-crystal', 'mist-cloud', 'code-trail', 'fish-school', 'radar'])

// Per-case pointer speed multipliers for the recording only.
const SPEED_SCALE = {
  'image-focus': 0.5,
}

const CONTROL_STEPS = {
  'fluid-cursor': [
    { at: 3600, values: [['Splat radius', 0.006], ['Cursor force', 5.2], ['Dye intensity', 0.46]] },
    { at: 6700, values: [['Vorticity', 28], ['Velocity fade', 1.2], ['Dye fade', 1.4]] },
  ],
  'spring-trail': [
    { at: 3600, values: [['Trails', 32], ['Line width', 5], ['Hue', 300]] },
    { at: 6700, values: [['Spring', 0.65], ['Friction', 0.82], ['Hue drift', 2.5]] },
  ],
  'dot-trail': [
    { at: 3600, values: [['Size', 12], ['History', 40], ['Decay', 0.025]] },
    { at: 6700, values: [['Colour', '#ff7a59'], ['Blur', 0.5], ['Decay', 0.01]] },
  ],
  'pixel-particles': [
    { at: 3600, values: [['Particle size', 1.3], ['Depth spread', 14], ['Pointer force', 2.2]] },
    { at: 6700, values: [['Source image', 'art/particles/daisy.jpg'], ['Noise speed', 1.0], ['Brightness', 1.4]] },
  ],
  'click-burst': [
    { at: 3600, values: [['Particles', 60], ['Max radius', 10], ['Speed', 16]] },
    { at: 6700, values: [['Palette', 'warm'], ['Gravity', 0.35], ['Alpha decay', 0.008]] },
  ],
  'fire-trail': [
    { at: 3600, values: [['Embers / frame', 10], ['Rise speed', 4], ['Ember size', 7]] },
    { at: 6700, values: [['Glow', 22], ['Click embers', 50]] },
  ],
  constellation: [
    { at: 3600, values: [['Stars', 200], ['Star link radius', 160], ['Star colour', '#9fd8ff']] },
    { at: 6700, values: [['Cursor link radius', 240], ['Stars', 180]] },
  ],
  'ba-click': [
    { at: 3600, values: [['Theme colour', '#ffffff'], ['Scale', 1.5], ['Opacity', 1]] },
    { at: 6700, values: [['Click time scale', 1.8], ['Trail time scale', 1.8]] },
  ],
  'image-trail': [
    { at: 3600, values: [['Image size', 240], ['Trailing lag', 0.3], ['Variant', 'pop']] },
    { at: 6700, values: [['Spawn distance', 45], ['Variant', 'speed']] },
  ],
  'image-follow': [
    { at: 3600, values: [['Width', 250], ['Height', 250], ['Min distance', 60]] },
    { at: 6700, values: [['Duration', 1.2], ['Ease', 'back.out(1.7)']] },
  ],
  'image-trail-x': [
    { at: 3600, values: [['Variant', 'perspective'], ['Image width', 230], ['Exposure', 0.9]] },
    { at: 6700, values: [['Variant', 'blur'], ['Spawn distance', 45], ['Duration', 1.6]] },
  ],
  'magnetic-elements': [
    { at: 3600, values: [['Strength', 0.7], ['Radius', 300], ['Lerp ease', 0.25]] },
    { at: 6700, values: [['Strength', 0.35], ['Radius', 300]] },
  ],
  'gelly-cursor': [
    { at: 3600, values: [['Size', 80], ['Jelly amount', 110], ['Colour', '#9db4ff']] },
    { at: 6700, values: [['Blend', 'exclusion'], ['Follow smoothness', 0.35], ['Stick amount', 0.35]] },
  ],
  'spotlight-cards': [
    { at: 3600, values: [['Glow colour', '#ff7a59'], ['Radius', 320], ['Intensity', 1]] },
    { at: 6700, values: [['Radius', 160], ['Intensity', 0.7]] },
  ],
  flashlight: [
    { at: 3600, values: [['Radius', 280], ['Outside blur', 6], ['Smoothness', 0.3]] },
    { at: 6700, values: [['Radius', 140], ['Backdrop', 'rgba(18, 8, 30, 0.9)']] },
  ],
  'invert-lens': [
    { at: 3600, values: [['Size', 140], ['Colour', '#ff7a59'], ['Smoothness', 0.4]] },
    { at: 6700, values: [['Blend mode', 'exclusion'], ['Size', 70]] },
  ],
  'water-ripple': [
    { at: 3600, values: [['Ripple intensity', 0.6], ['Ripple radius', 0.15], ['Refraction', 0.06]] },
    { at: 6700, values: [['Photograph', 'art/trail/33.jpg'], ['Aberration', 0.01], ['Light', 0.25]] },
  ],
  'mask-reveal': [
    { at: 3600, values: [['Ripple intensity', 0.9], ['Ripple radius', 0.18], ['Reveal size', 5]] },
    { at: 6700, values: [['Edge softness', 0.3], ['Distortion', 0.006], ['Light', 0.12]] },
  ],
  'shader-text': [
    { at: 3600, values: [['Text', 'MOTION'], ['Warp strength', 0.9], ['Trail intensity', 2.2]] },
    { at: 6700, values: [['Brush radius', 0.14], ['Field decay', 0.98], ['High speed', '#ff7a59']] },
  ],
  'morphing-blob': [
    { at: 3600, values: [['Lead size', 64], ['Trail blobs', 10], ['Colour', '#ff7a59']] },
    { at: 6700, values: [['Opacity', 0.9], ['Trail lerp', 0.35]] },
  ],
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function captureCss(id) {
  return `
html, body {
  width: 1920px !important;
  height: 1080px !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #05060a !important;
}
.app-bg { display: none !important; }
.capture-shell {
  position: fixed !important;
  inset: 0 !important;
  width: 1920px !important;
  height: 1080px !important;
  background: #05060a !important;
}
.card,
.card#${id} {
  display: block !important;
  width: 1920px !important;
  height: 1080px !important;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: #05060a !important;
  box-shadow: none !important;
  overflow: hidden !important;
}
.card#${id} .card-head,
.card#${id} .controls,
.card#${id} .stage-hint {
  display: none !important;
}
.card#${id} .stage-shell {
  width: 1920px !important;
  height: 1080px !important;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: #05060a !important;
}
.card#${id} .stage {
  width: 1920px !important;
  height: 1080px !important;
}
.card#${id} .stage canvas {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
}
${id === 'image-focus' ? `
.card#image-focus .ifx-grid {
  max-width: 1040px !important;
  gap: 24px !important;
}
.card#image-focus .ifx-stage {
  --ifx-media-size: 680px !important;
}
` : ''}
.capture-intro {
  position: fixed;
  inset: 0;
  z-index: 999999;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 16px;
  text-align: center;
  background:
    radial-gradient(circle at 50% 38%, rgba(124, 156, 255, 0.17), transparent 42%),
    #05060a;
  color: #f4f5f7;
  font-family: Inter, 'Helvetica Neue', system-ui, sans-serif;
  transition: opacity 0.35s ease;
  pointer-events: none;
}
.capture-intro .kicker {
  font: 13px/1.2 ui-monospace, monospace;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: #8fa6ff;
}
.capture-intro h2 {
  margin: 0;
  font-size: 92px;
  line-height: 0.96;
  letter-spacing: -0.055em;
  font-weight: 600;
  max-width: 1400px;
}
.capture-intro .meta {
  font: 17px/1.5 ui-monospace, monospace;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9aa1b2;
}
.capture-intro .line {
  width: 180px;
  height: 1px;
  margin: 10px 0;
  background: linear-gradient(90deg, transparent, #7c9cff, transparent);
  animation: captureLine 1.4s ease-in-out infinite;
}
.capture-intro .note {
  font: 12px/1.4 ui-monospace, monospace;
  letter-spacing: 0.12em;
  color: #5f687b;
}
@keyframes captureLine {
  0%, 100% { opacity: 0.45; transform: scaleX(0.82); }
  50% { opacity: 1; transform: scaleX(1); }
}
`
}

async function addIntro(page, meta) {
  await page.evaluate(
    ({ title, category, tech }) => {
      const el = document.createElement('div')
      el.className = 'capture-intro'
      const kicker = document.createElement('div')
      kicker.className = 'kicker'
      kicker.textContent = 'Mouse Effects Lab'
      const h2 = document.createElement('h2')
      h2.textContent = title
      const metaEl = document.createElement('div')
      metaEl.className = 'meta'
      metaEl.textContent = `${category} · ${tech}`
      const line = document.createElement('div')
      line.className = 'line'
      const note = document.createElement('div')
      note.className = 'note'
      note.textContent = '1080p / 24fps / 10s · live interaction + parameter response'
      el.append(kicker, h2, metaEl, line, note)
      document.body.appendChild(el)
    },
    meta,
  )
  await sleep(180)
}

async function fadeIntro(page) {
  await page.evaluate(() => {
    const el = document.querySelector('.capture-intro')
    if (!el) return
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 420)
  })
  await sleep(450)
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

async function stageRect(page) {
  return page.evaluate(() => {
    const r = document.querySelector('.stage').getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  })
}

async function setControl(page, label, value) {
  await page.evaluate(
    ({ label, value }) => {
      const control = [...document.querySelectorAll('.controls .control')].find(
        (el) => el.querySelector('.control-label span')?.textContent?.trim() === label,
      )
      if (!control) return
      const input = control.querySelector('input, select')
      if (!input) return
      const proto =
        input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
      if (setter) setter.call(input, String(value))
      else input.value = String(value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { label, value },
  )
}

async function moveCurve(page, from, to, control, duration) {
  const steps = Math.max(18, Math.round(duration / 16.7))
  const start = Date.now()
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const mt = 1 - t
    const x = mt * mt * from.x + 2 * mt * t * control.x + t * t * to.x
    const y = mt * mt * from.y + 2 * mt * t * control.y + t * t * to.y
    await page.mouse.move(x, y)
    const due = start + (duration * i) / steps
    const wait = due - Date.now()
    if (wait > 0) await sleep(wait)
  }
}

async function randomPointerDemo(page, id, rect, random, until, controlSteps) {
  const speed = rect.w * 2.9 * (SPEED_SCALE[id] ?? 1)
  const point = () => ({
    x: rect.x + rect.w * (0.03 + random() * 0.94),
    y: rect.y + rect.h * (0.03 + random() * 0.94),
  })
  let from = point()
  await page.mouse.move(from.x, from.y)
  const t0 = Date.now()
  let stepIndex = 0
  let lastClick = -2000
  let lastCursorKitClick = -2000
  let cursorKitClickCount = 0
  while (Date.now() - t0 < until) {
    while (
      stepIndex < controlSteps.length &&
      Date.now() - t0 >= controlSteps[stepIndex].at
    ) {
      for (const [label, value] of controlSteps[stepIndex].values) {
        await setControl(page, label, value)
      }
      stepIndex++
      await sleep(120)
    }

    const targets = [point()]
    if (random() < 0.45) targets.push(point())
    for (const to of targets) {
      const dx = to.x - from.x
      const dy = to.y - from.y
      const distance = Math.max(70, Math.hypot(dx, dy))
      const length = Math.min(1.5, Math.max(0.18, distance / speed))
      const duration = length * 1000 * (0.6 + random() * 0.4)
      const mx = (from.x + to.x) / 2
      const my = (from.y + to.y) / 2
      const nx = -dy / distance
      const ny = dx / distance
      const bend =
        (random() - 0.5) * Math.min(rect.w, rect.h) * (random() < 0.35 ? 0.8 : 0.3)
      const control = { x: mx + nx * bend, y: my + ny * bend }
      await moveCurve(page, from, to, control, duration)
      from = to
    }
    if (CLICK_IDS.has(id) && Date.now() - t0 - lastClick > 1400) {
      await page.mouse.click(from.x, from.y)
      lastClick = Date.now() - t0
      await sleep(120)
    }
    if (CURSORKIT_CLICK_IDS.has(id) && Date.now() - t0 - lastCursorKitClick > 1700) {
      const button = cursorKitClickCount % 2 === 0 ? 'left' : 'right'
      await page.mouse.move(from.x, from.y)
      await page.mouse.down({ button })
      await sleep(480)
      await page.mouse.up({ button })
      cursorKitClickCount++
      lastCursorKitClick = Date.now() - t0
      await sleep(150)
    }
  }
  // Apply any remaining control step even if the path loop ended early.
  while (stepIndex < controlSteps.length) {
    for (const [label, value] of controlSteps[stepIndex].values) {
      await setControl(page, label, value)
    }
    stepIndex++
    await sleep(120)
  }
}

async function imageFocusDemo(page, rect, until) {
  const centers = await page.evaluate(() => {
    const stage = document.querySelector('.stage').getBoundingClientRect()
    return [...document.querySelectorAll('.ifx-tile')].map((el) => {
      const r = el.getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    })
  })
  if (centers.length < 3) return randomPointerDemo(page, 'image-focus', rect, mulberry32(7), until, [])

  await page.mouse.move(centers[0].x, centers[0].y)
  const t0 = Date.now()
  let index = 0
  let direction = 1
  await sleep(1000)
  while (Date.now() - t0 < until) {
    let next = index + direction
    if (next > 2) {
      direction = -1
      next = 1
    } else if (next < 0) {
      direction = 1
      next = 1
    }
    await moveCurve(
      page,
      centers[index],
      centers[next],
      { x: (centers[index].x + centers[next].x) / 2, y: (centers[index].y + centers[next].y) / 2 },
      450,
    )
    index = next
    await sleep(1000)
  }
}

function encodeFrames(frames, frameDir, concatPath, out) {
  const lines = ['ffconcat version 1.0']
  let totalDuration = 0
  let lastFile = ''
  frames.forEach((frame, index) => {
    const file = path.join(frameDir, `frame-${String(index + 1).padStart(5, '0')}.jpg`)
    fs.writeFileSync(file, frame.data)
    lastFile = file
    const next = index + 1 < frames.length ? frames[index + 1].ts : frame.ts + 1 / 60
    const duration = Math.max(1 / 240, next - frame.ts)
    totalDuration += duration
    lines.push(`file '${file.replace(/'/g, "'\\''")}'`)
    lines.push(`duration ${duration.toFixed(6)}`)
  })
  if (totalDuration < 10.4) {
    lines.push(`file '${lastFile.replace(/'/g, "'\\''")}'`)
    lines.push(`duration ${(10.4 - totalDuration).toFixed(6)}`)
  }
  fs.writeFileSync(concatPath, lines.join('\n'))
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatPath,
      '-t',
      '10',
      '-frames:v',
      '240',
      '-vf',
      'fps=24,tpad=stop_mode=clone:stop_duration=1,fade=t=in:st=0:d=0.2,fade=t=out:st=9.55:d=0.45,format=yuv420p',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '19',
      '-movflags',
      '+faststart',
      '-an',
      out,
    ],
    { stdio: 'inherit' },
  )
}

function chooseContentFrame(video, outDir) {
  const framesDir = path.join(outDir, '.content-frames')
  fs.rmSync(framesDir, { recursive: true, force: true })
  fs.mkdirSync(framesDir, { recursive: true })
  execFileSync('ffmpeg', [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-ss',
    '1.9',
    '-t',
    '8.0',
    '-i',
    video,
    '-vf',
    'fps=5,scale=480:270',
    '-q:v',
    '2',
    path.join(framesDir, 'f-%03d.jpg'),
  ])
  const py = `
from PIL import Image, ImageFilter, ImageStat
import glob, os, sys
files = sorted(glob.glob(os.path.join(sys.argv[1], 'f-*.jpg')))
best = None
for f in files:
    im = Image.open(f).convert('RGB')
    g = im.convert('L')
    st = ImageStat.Stat(g)
    edge = ImageStat.Stat(g.filter(ImageFilter.FIND_EDGES)).mean[0]
    color = sum(ImageStat.Stat(im).stddev) / 3.0
    bright = sum(1 for p in im.resize((80,45)).getdata() if sum(p) > 150) / 3600.0
    score = st.stddev[0] * 1.4 + edge * 2.2 + color * 0.7 + bright * 80
    if best is None or score > best[0]:
        best = (score, f)
print(best[1] if best else '')
`
  const best = execFileSync('python3', ['-c', py, framesDir]).toString().trim()
  if (best) {
    const idx = Number(path.basename(best).match(/(\d+)/)?.[1] || 1)
    const timestamp = 1.9 + Math.max(0, idx - 1) / 5 + 0.12
    execFileSync('ffmpeg', [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-ss',
      String(timestamp),
      '-i',
      video,
      '-frames:v',
      '1',
      path.join(outDir, 'content.png'),
    ])
  }
  fs.rmSync(framesDir, { recursive: true, force: true })
}

async function demoCase(browser, id) {
  const random = mulberry32(
    [...id].reduce((h, c) => ((h * 31 + c.charCodeAt(0)) >>> 0), 2166136261),
  )
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  })
  const page = await context.newPage()
  const url = new URL(APP_URL)
  url.searchParams.set('capture', id)
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#' + id, { timeout: 15000 })
  const meta = await page.evaluate((id) => {
    const card = document.querySelector('#' + id)
    const badges = [...card.querySelectorAll('.badges .badge')].map((b) =>
      b.textContent.trim(),
    )
    return {
      title: card.querySelector('h3')?.textContent?.trim() || id,
      category: badges[0] || '',
      tech: badges[1] || '',
    }
  }, id)
  await page.addStyleTag({ content: captureCss(id) })
  await page.waitForFunction(
    (id) => {
      const stage = document.querySelector('#' + id + ' .stage')
      return stage && !stage.querySelector('.stage-placeholder')
    },
    id,
    { timeout: 15000 },
  )
  await page.evaluate(() => document.fonts.ready)
  if (id === 'ba-click') {
    await page.waitForSelector('#ba-click canvas', { timeout: 15000 })
  }
  await sleep(id === 'ba-click' ? 1600 : 800)

  // The capture stylesheet resizes .stage after the effect has mounted, and the
  // CursorKit components only remeasure their canvas backing store on window
  // resize. Force one so the 1920x1080 stage is not CSS-stretched from a stale
  // (e.g. 1892x340) buffer.
  await page.evaluate(() => window.dispatchEvent(new Event('resize')))
  await sleep(250)

  const outDir = path.join(CASES_DIR, id)
  fs.mkdirSync(outDir, { recursive: true })
  await addIntro(page, meta)
  await page.screenshot({ path: path.join(outDir, 'origin.png') })

  const client = await context.newCDPSession(page)
  const frames = []
  client.on('Page.screencastFrame', (event) => {
    frames.push({
      data: Buffer.from(event.data, 'base64'),
      ts: event.metadata.timestamp,
    })
    client
      .send('Page.screencastFrameAck', { sessionId: event.sessionId })
      .catch(() => {})
  })
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 88,
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: 1,
  })
  for (let i = 0; i < 400 && frames.length === 0; i++) await sleep(10)
  if (frames.length === 0) throw new Error('No screencast frames received')

  const t0 = Date.now()
  await sleep(1350)
  await fadeIntro(page)
  const rect = await stageRect(page)
  if (id === 'image-focus') {
    await imageFocusDemo(page, rect, 9250)
  } else {
    await randomPointerDemo(
      page,
      id,
      rect,
      random,
      9250,
      CONTROL_STEPS[id] || [],
    )
  }
  const tail = 10400 - (Date.now() - t0)
  if (tail > 0) await sleep(tail)

  await client.send('Page.stopScreencast')
  await sleep(180)
  const sourceSpan =
    frames[frames.length - 1].ts - frames[0].ts
  if (sourceSpan < 9.5) {
    throw new Error(`screencast stalled: only ${sourceSpan.toFixed(2)}s`)
  }

  const frameDir = path.join(TMP, id + '-frames')
  fs.rmSync(frameDir, { recursive: true, force: true })
  fs.mkdirSync(frameDir, { recursive: true })
  const concatPath = path.join(TMP, id + '-concat.txt')
  const out = path.join(outDir, id + '.mp4')
  encodeFrames(frames, frameDir, concatPath, out)
  fs.rmSync(frameDir, { recursive: true, force: true })
  fs.rmSync(concatPath, { force: true })
  await context.close()

  chooseContentFrame(out, outDir)
  const duration = execFileSync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=nw=1:nk=1',
    out,
  ])
    .toString()
    .trim()
  console.log(
    `[1080p] ${id} -> ${path.relative(ROOT, out)} (${duration}s), origin.png + content.png`,
  )
  return { id, duration, frames: frames.length }
}

async function main() {
  fs.mkdirSync(TMP, { recursive: true })
  const only = process.argv.find((a) => a.startsWith('--case='))?.slice(7)
  const ids = only ? [only] : IDS
  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  })
  for (const id of ids) {
    console.log(`\n[1080p] ${id}`)
    try {
      await demoCase(browser, id)
    } catch (error) {
      console.error(`[1080p] failed ${id}:`, error)
    }
  }
  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
