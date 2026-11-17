/* eslint-disable no-console */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const crypto = require('node:crypto')

const ROOT = path.resolve(__dirname, '..')
const APP_URL = process.env.APP_URL || 'http://127.0.0.1:4180/'
const CHROMIUM = [
  process.env.CHROMIUM_PATH,
  '/home/ypf/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  chromium.executablePath(),
].find((candidate) => candidate && fs.existsSync(candidate))
const CASES_DIR = path.join(ROOT, 'cases')
const TMP_DIR = path.join(ROOT, '.tmp-cases')
const VIDEO_TMP = path.join(TMP_DIR, 'video')
const FPS = Number(process.env.CAPTURE_FPS || 60)

// Capture-only performance presets. Heavy Canvas shadows / filters / instancing
// can make headless rendering block the main thread and stretch a 20 s demo into
// minutes. The preset keeps the effect recognisable while the capture runs at a
// stable cadence; the control panel still shows and edits every field.
const CAPTURE_PRESETS = {
  'spring-trail': [
    { label: 'Glow', value: false },
    { label: 'Trails', value: 12 },
    { label: 'Points', value: 30 },
  ],
}

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
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function captureCss(id) {
  return `
html, body {
  width: 1280px !important;
  height: 720px !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #05060a !important;
}
.app-bg { display: none !important; }
.page {
  width: 1280px !important;
  max-width: none !important;
  height: 720px !important;
  margin: 0 !important;
  padding: 0 !important;
}
.hero, .nav-shell, .footer, .category-head { display: none !important; }
main { display: block !important; }
.category { padding: 0 !important; }
.grid { display: block !important; }
.card { display: none !important; }
.card#${id} {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) 340px;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas: "head head" "stage controls";
  width: 1280px !important;
  height: 720px !important;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: #08090d !important;
  box-shadow: none !important;
  overflow: hidden !important;
}
.card#${id} .card-head {
  grid-area: head;
  padding: 12px 20px 10px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.card#${id} .card-tagline { max-width: 82ch; }
.card#${id} .stage-shell {
  grid-area: stage;
  margin: 10px 6px 10px 10px !important;
  min-height: 0;
  height: auto !important;
}
.card#${id} .stage { height: 100% !important; }
.card#${id} .controls {
  grid-area: controls;
  display: block !important;
  padding: 10px 14px 18px !important;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.012);
  overflow-y: auto !important;
}
.card#${id} .controls-grid {
  grid-template-columns: 1fr !important;
  gap: 9px 12px !important;
}
.card#${id} .control.full { grid-column: span 1 !important; }
${id === 'ba-click' ? `.card#ba-click .ba-root { background: radial-gradient(circle at 68% 42%, rgba(35, 105, 200, 0.14), transparent 34%), #02040a !important; }` : ''}
@keyframes capturePulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.36; } }
@keyframes captureLine { 0%, 100% { opacity: 0.45; transform: scaleX(0.82); } 50% { opacity: 1; transform: scaleX(1); } }
body::after {
  content: 'Mouse Effects Lab · 720p · 60fps · 20s';
  position: fixed;
  right: 14px;
  bottom: 9px;
  z-index: 999998;
  font: 9px/1 ui-monospace, monospace;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
  animation: capturePulse 1.8s ease-in-out infinite;
}
.capture-intro {
  position: fixed;
  inset: 0;
  z-index: 999999;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  text-align: center;
  background:
    radial-gradient(circle at 50% 38%, rgba(124, 156, 255, 0.16), transparent 45%),
    #05060a;
  color: #f4f5f7;
  font-family: Inter, 'Helvetica Neue', system-ui, sans-serif;
  transition: opacity 0.35s ease;
  pointer-events: none;
}
.capture-intro .kicker {
  font: 10px/1.2 ui-monospace, monospace;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #8fa6ff;
}
.capture-intro h2 {
  margin: 0;
  font-size: 56px;
  line-height: 0.98;
  letter-spacing: -0.05em;
  font-weight: 600;
  max-width: 900px;
}
.capture-intro .meta {
  font: 12px/1.5 ui-monospace, monospace;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9aa1b2;
}
.capture-intro .line {
  width: 120px;
  height: 1px;
  margin: 8px 0;
  background: linear-gradient(90deg, transparent, #7c9cff, transparent);
  animation: captureLine 1.4s ease-in-out infinite;
}
.capture-intro .note {
  font: 10px/1.4 ui-monospace, monospace;
  letter-spacing: 0.1em;
  color: #5f687b;
}
`
}

function introCss() {
  return `
.capture-intro { opacity: 1; }
`
}

async function addIntro(page, meta) {
  await page.evaluate(
    ({ title, category, tech }) => {
      const el = document.createElement('div')
      el.className = 'capture-intro'
      const kicker = document.createElement('div')
      kicker.className = 'kicker'
      kicker.textContent = 'Mouse Effects Lab · case study'
      const h2 = document.createElement('h2')
      h2.textContent = title
      const metaEl = document.createElement('div')
      metaEl.className = 'meta'
      metaEl.textContent = `${category} · ${tech}`
      const line = document.createElement('div')
      line.className = 'line'
      const note = document.createElement('div')
      note.className = 'note'
      note.textContent = 'live interaction · every control · 720p / 20s'
      el.append(kicker, h2, metaEl, line, note)
      document.body.appendChild(el)
    },
    meta,
  )
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

async function getStageRect(page, id) {
  return page.evaluate((id) => {
    const el = document.querySelector('#' + id + ' .stage')
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  }, id)
}

function point(rect, x, y) {
  return { x: rect.x + rect.w * x, y: rect.y + rect.h * y }
}

async function movePath(page, points, duration) {
  if (points.length < 2) return
  const segments = []
  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    segments.push({ a, b, length, start: total })
    total += length
  }
  if (total < 0.5) return
  const steps = Math.max(18, Math.round(duration / 33))
  const pathStart = Date.now()
  for (let k = 1; k <= steps; k++) {
    let target = (total * k) / steps
    let seg = segments[segments.length - 1]
    for (const candidate of segments) {
      if (target <= candidate.start + candidate.length) {
        seg = candidate
        break
      }
    }
    const t = Math.min(1, Math.max(0, (target - seg.start) / Math.max(seg.length, 0.001)))
    await page.mouse.move(seg.a.x + (seg.b.x - seg.a.x) * t, seg.a.y + (seg.b.y - seg.a.y) * t)
    const due = pathStart + (duration * k) / steps
    const wait = due - Date.now()
    if (wait > 0) await sleep(wait)
  }
}

async function clickPoints(page, points) {
  for (const p of points) {
    await page.mouse.click(p.x, p.y)
    await sleep(260)
  }
}

async function pointerPhase(page, id, rect, duration) {
  const sweepA = [
    point(rect, 0.15, 0.55),
    point(rect, 0.38, 0.35),
    point(rect, 0.62, 0.62),
    point(rect, 0.85, 0.4),
  ]
  const sweepB = [
    point(rect, 0.82, 0.68),
    point(rect, 0.6, 0.3),
    point(rect, 0.35, 0.7),
    point(rect, 0.16, 0.4),
  ]

  if (['fluid-cursor', 'water-ripple', 'mask-reveal', 'shader-text'].includes(id)) {
    const loops = Math.max(6, Math.round(duration / 650))
    const base = [
      point(rect, 0.16, 0.58),
      point(rect, 0.42, 0.3),
      point(rect, 0.72, 0.62),
      point(rect, 0.84, 0.36),
      point(rect, 0.5, 0.7),
    ]
    for (let i = 0; i < loops; i++) {
      await movePath(page, i % 2 ? [...base].reverse() : base, duration / loops)
    }
    return
  }

  if (id === 'image-follow') {
    const a = [point(rect, 0.15, 0.18), point(rect, 0.85, 0.18)]
    const b = [point(rect, 0.82, 0.82), point(rect, 0.18, 0.82)]
    for (let i = 0; i < 6; i++) {
      await movePath(page, i % 2 ? b : a, duration / 6)
    }
    return
  }

  if (id === 'magnetic-elements') {
    for (let pass = 0; pass < 3; pass++) {
      const pts = []
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * Math.PI * 2 + pass * Math.PI * 0.5
        pts.push({
          x: rect.x + rect.w * (0.5 + Math.cos(a) * 0.22),
          y: rect.y + rect.h * (0.5 + Math.sin(a) * 0.3),
        })
      }
      await movePath(page, pts, duration / 3)
    }
    return
  }

  if (id === 'gelly-cursor') {
    const pts = [
      point(rect, 0.2, 0.75),
      point(rect, 0.5, 0.52),
      point(rect, 0.78, 0.2),
      point(rect, 0.5, 0.5),
      point(rect, 0.25, 0.3),
    ]
    await movePath(page, pts, duration / 3)
    await movePath(page, [...pts].reverse(), duration / 3)
    await movePath(page, pts, duration / 3)
    return
  }

  if (id === 'spotlight-cards' || id === 'flashlight') {
    const pts = [
      point(rect, 0.2, 0.45),
      point(rect, 0.8, 0.45),
      point(rect, 0.65, 0.7),
      point(rect, 0.35, 0.3),
    ]
    for (let i = 0; i < 5; i++) {
      await movePath(page, i % 2 ? [...pts].reverse() : pts, duration / 5)
    }
    return
  }

  if (id === 'ba-click') {
    const stops = [
      point(rect, 0.22, 0.58),
      point(rect, 0.72, 0.4),
      point(rect, 0.5, 0.52),
      point(rect, 0.32, 0.34),
      point(rect, 0.68, 0.66),
      point(rect, 0.5, 0.48),
    ]
    const step = duration / stops.length
    let prev = stops[0]
    await page.mouse.move(prev.x, prev.y)
    for (const next of stops) {
      await page.mouse.down()
      await movePath(page, [prev, next], step * 0.5)
      await page.mouse.up()
      await page.mouse.click(next.x, next.y)
      await sleep(step * 0.55)
      prev = next
    }
    return
  }

  const passes = Math.max(3, Math.round(duration / 850))
  for (let i = 0; i < passes; i++) {
    await movePath(page, i % 2 ? sweepB : sweepA, duration / passes)
  }

  if (['click-burst', 'fire-trail', 'pixel-particles'].includes(id)) {
    await clickPoints(page, [
      point(rect, 0.45, 0.5),
      point(rect, 0.58, 0.42),
      point(rect, 0.52, 0.62),
    ])
  }
}

async function controlFlow(page, id) {
  const count = await page.evaluate(
    (id) => document.querySelectorAll('#' + id + ' .controls .control').length,
    id,
  )
  for (let index = 0; index < count; index++) {
    const info = await page.evaluate(
      ({ id, index }) => {
        const el = document.querySelectorAll('#' + id + ' .controls .control')[index]
        if (!el) return null
        el.scrollIntoView({ block: 'nearest' })
        const label =
          el.querySelector('.control-label span')?.textContent?.trim() || ''
        const input = el.querySelector('input, select')
        return {
          label,
          tag: input?.tagName,
          type: input?.type,
          value: input?.value,
          min: input?.min,
          max: input?.max,
          optionCount: input?.tagName === 'SELECT' ? input.options.length : 0,
        }
      },
      { id, index },
    )
    if (!info) continue

    if (info.type === 'checkbox') {
      await page.evaluate(
        ({ id, index }) => {
          const el = document.querySelectorAll('#' + id + ' .controls .control')[index]
          el.querySelector('input').click()
        },
        { id, index },
      )
      await sleep(260)
      await page.evaluate(
        ({ id, index }) => {
          const el = document.querySelectorAll('#' + id + ' .controls .control')[index]
          el.querySelector('input').click()
        },
        { id, index },
      )
      await sleep(220)
      continue
    }

    if (info.tag === 'SELECT') {
      await page.evaluate(
        ({ id, index }) => {
          const input = document
            .querySelectorAll('#' + id + ' .controls .control')[index]
            .querySelector('select')
          const next = (input.selectedIndex + 1) % input.options.length
          const setter = Object.getOwnPropertyDescriptor(
            HTMLSelectElement.prototype,
            'value',
          ).set
          setter.call(input, input.options[next].value)
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
        },
        { id, index },
      )
      await sleep(info.label.toLowerCase().includes('image') ? 700 : 360)
      continue
    }

    if (info.type === 'text') {
      await page.evaluate(
        ({ id, index }) => {
          const input = document
            .querySelectorAll('#' + id + ' .controls .control')[index]
            .querySelector('input')
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          ).set
          setter.call(input, 'MOTION')
          input.dispatchEvent(new Event('input', { bubbles: true }))
        },
        { id, index },
      )
      await sleep(320)
      continue
    }

    if (info.type === 'color') {
      const colors = ['#ff7a59', '#5cf4fc', '#c77dff']
      const value = colors[index % colors.length]
      await page.evaluate(
        ({ id, index, value }) => {
          const input = document
            .querySelectorAll('#' + id + ' .controls .control')[index]
            .querySelector('input')
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          ).set
          setter.call(input, value)
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
        },
        { id, index, value },
      )
      await sleep(280)
      continue
    }

    if (info.type === 'range') {
      await page.evaluate(
        ({ id, index }) => {
          const input = document
            .querySelectorAll('#' + id + ' .controls .control')[index]
            .querySelector('input')
          const min = Number(input.min)
          const max = Number(input.max)
          const target = min + (max - min) * 0.72
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          ).set
          setter.call(input, String(target))
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
        },
        { id, index },
      )
      await sleep(260)
    }
  }
  await sleep(250)
}

async function applyCapturePreset(page, id) {
  if (process.env.NO_PRESETS === '1') return
  const preset = CAPTURE_PRESETS[id]
  if (!preset) return
  await page.evaluate((preset) => {
    for (const item of preset) {
      const control = [...document.querySelectorAll('.controls .control')].find(
        (el) => el.querySelector('.control-label span')?.textContent?.trim() === item.label,
      )
      if (!control) continue
      const input = control.querySelector('input, select')
      if (!input) continue
      if (input.type === 'checkbox') {
        if (input.checked !== Boolean(item.value)) input.click()
        continue
      }
      const proto =
        input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
      if (setter) setter.call(input, String(item.value))
      else input.value = String(item.value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }, preset)
  await sleep(300)
}

async function demoCase(browser, id) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  })
  const page = await context.newPage()
  const captureUrl = new URL(APP_URL)
  captureUrl.searchParams.set('capture', id)
  await page.goto(captureUrl.toString(), { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#' + id, { timeout: 15000 })
  console.log(`  loaded ${id}`)

  const meta = await page.evaluate((id) => {
    const card = document.querySelector('#' + id)
    const badges = [...card.querySelectorAll('.badges .badge')].map((b) =>
      b.textContent.trim(),
    )
    return {
      title: card.querySelector('h3')?.textContent?.trim() || id,
      tagline: card.querySelector('.card-tagline')?.textContent?.trim() || '',
      category: badges[0] || '',
      tech: badges[1] || '',
    }
  }, id)

  await page.addStyleTag({ content: captureCss(id) })
  await page.evaluate(() => window.scrollTo(0, 0))
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
    await page.waitForSelector('#ba-click canvas', { timeout: 12000 })
  }
  await sleep(id === 'ba-click' ? 1500 : 700)
  await applyCapturePreset(page, id)
  console.log('  effect ready')

  await addIntro(page, meta)
  await page.addStyleTag({ content: introCss() })

  // Capture at the compositor's native cadence via CDP screencast. Playwright's
  // recordVideo path is fixed at 25fps; this path reaches ~60fps in headless
  // Chromium and avoids the duplicate-frame judder of 25→30 conversion.
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
    quality: 86,
    maxWidth: 1280,
    maxHeight: 720,
    everyNthFrame: FPS >= 60 ? 1 : FPS >= 30 ? 2 : 1,
  })
  for (let i = 0; i < 400 && frames.length === 0; i++) await sleep(10)
  if (frames.length === 0) throw new Error('No screencast frames received')

  const t0 = Date.now()
  const rect = await getStageRect(page, id)
  console.log('  start timeline', rect)
  await sleep(1600)
  await fadeIntro(page)
  await pointerPhase(page, id, rect, 4200)
  console.log('  phase1 done', Date.now()-t0)
  await controlFlow(page, id)
  console.log('  controls done', Date.now()-t0)
  const rect2 = await getStageRect(page, id)
  await pointerPhase(page, id, rect2, 6500)
  console.log('  phase2 done', Date.now()-t0)
  await clickPoints(page, [point(rect2, 0.5, 0.5)])

  const remaining = 20600 - (Date.now() - t0)
  if (remaining > 600 && id !== 'image-follow') {
    const rect3 = await getStageRect(page, id)
    await pointerPhase(page, id, rect3, remaining - 350)
  }
  const tail = 20600 - (Date.now() - t0)
  if (tail > 0) await sleep(tail)

  console.log('  stop capture', Date.now()-t0, 'frames', frames.length)
  await client.send('Page.stopScreencast')
  await sleep(180)

  let uniqueFrames = 0
  let lastHash = ''
  for (const frame of frames) {
    const hash = crypto.createHash('sha1').update(frame.data).digest('hex')
    if (hash !== lastHash) {
      uniqueFrames++
      lastHash = hash
    }
  }
  const sourceSpan = Math.max(0.001, frames[frames.length - 1].ts - frames[0].ts)
  if (sourceSpan < 19.5) {
    throw new Error(`screencast stalled: only ${sourceSpan.toFixed(2)}s of frames`)
  }
  const sourceFps = uniqueFrames / sourceSpan
  const outputFps = 60
  const outputFrameCount = 1200

  const frameDir = path.join(VIDEO_TMP, id + '-frames')
  fs.rmSync(frameDir, { recursive: true, force: true })
  fs.mkdirSync(frameDir, { recursive: true })
  const concatPath = path.join(VIDEO_TMP, id + '-concat.txt')
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
  if (totalDuration < 20.6) {
    lines.push(`file '${lastFile.replace(/'/g, "'\\''")}'`)
    lines.push(`duration ${(20.6 - totalDuration).toFixed(6)}`)
  }
  fs.writeFileSync(concatPath, lines.join('\n'))

  const outDir = path.join(CASES_DIR, id)
  console.log('  encode', frames.length, 'frames')
  fs.mkdirSync(outDir, { recursive: true })
  const out = path.join(outDir, id + '.mp4')
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
      '20',
      '-frames:v',
      String(outputFrameCount),
      '-vf',
      `fps=${outputFps},scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fade=t=in:st=0:d=0.2,fade=t=out:st=19.5:d=0.5,format=yuv420p`,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '21',
      '-movflags',
      '+faststart',
      '-an',
      out,
    ],
    { stdio: 'inherit' },
  )
  fs.rmSync(frameDir, { recursive: true, force: true })
  fs.rmSync(concatPath, { force: true })
  await context.close()

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
    `[video] ${id} -> ${path.relative(ROOT, out)} (${duration}s, ${outputFps}fps output, ${uniqueFrames} unique / ${sourceFps.toFixed(1)}fps source)`,
  )
  return {
    id,
    meta,
    video: path.relative(ROOT, out),
    frames: frames.length,
    uniqueFrames,
    sourceFps: Number(sourceFps.toFixed(2)),
    outputFps,
    duration,
  }
}

async function main() {
  fs.mkdirSync(CASES_DIR, { recursive: true })
  fs.mkdirSync(VIDEO_TMP, { recursive: true })
  const only = process.argv.find((a) => a.startsWith('--case='))?.slice(7)
  const ids = only ? [only] : IDS
  const headed = process.env.HEADLESS !== '1'
  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    headless: !headed,
    args: [
      '--disable-dev-shm-usage',
      '--no-sandbox',
      ...(headed ? ['--window-position=0,0', '--window-size=1280,840'] : []),
    ],
  })
  const report = []
  for (const id of ids) {
    console.log(`\n[capture] ${id}`)
    let captured = false
    for (let attempt = 1; attempt <= 3 && !captured; attempt++) {
      try {
        report.push(await demoCase(browser, id))
        captured = true
      } catch (error) {
        console.error(`[capture] failed ${id} (attempt ${attempt}/3):`, error.message || error)
        if (attempt < 3) await sleep(1200)
      }
    }
  }
  await browser.close()
  fs.writeFileSync(
    path.join(TMP_DIR, 'capture-report.json'),
    JSON.stringify(report, null, 2),
  )
  console.log('\n[capture] done', report.length, '/', ids.length)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
