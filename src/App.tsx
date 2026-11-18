import { useEffect, useMemo, useState } from 'react'
import EffectCard from './components/EffectCard'
import { categories, effects } from './data/effects'
import type { ControlValue, Settings } from './types'

function initialSettings() {
  return Object.fromEntries(effects.map((effect) => [effect.id, { ...effect.defaults }])) as Record<
    string,
    Settings
  >
}

export default function App() {
  const [settings, setSettings] = useState<Record<string, Settings>>(initialSettings)
  const [mountKeys, setMountKeys] = useState<Record<string, number>>(() =>
    Object.fromEntries(effects.map((effect) => [effect.id, 0])),
  )
  const [activeHash, setActiveHash] = useState(() =>
    typeof window === 'undefined' ? '' : window.location.hash.slice(1),
  )
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  useEffect(() => {
    let highlightTimer = 0
    const focusHash = () => {
      const id = window.location.hash.slice(1)
      setActiveHash(id)
      if (!id) return
      const target = document.getElementById(id)
      if (!target) return

      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (target.classList.contains('card')) {
          setHighlightedId(id)
          window.clearTimeout(highlightTimer)
          highlightTimer = window.setTimeout(() => setHighlightedId(null), 2200)
        } else {
          setHighlightedId(null)
        }
      })

      const tab = document.querySelector<HTMLElement>(`.effect-tab[data-id="${id}"]`)
      const strip = tab?.parentElement
      if (tab && strip) {
        requestAnimationFrame(() => {
          strip.scrollLeft =
            tab.offsetLeft - strip.clientWidth / 2 + tab.clientWidth / 2
        })
      }
    }

    focusHash()
    window.addEventListener('hashchange', focusHash)
    return () => {
      window.clearTimeout(highlightTimer)
      setHighlightedId(null)
      window.removeEventListener('hashchange', focusHash)
    }
  }, [])

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const effect of effects) map[effect.category] = (map[effect.category] ?? 0) + 1
    return map
  }, [])

  const update = (effectId: string, key: string, value: ControlValue) => {
    setSettings((prev) => ({
      ...prev,
      [effectId]: { ...prev[effectId], [key]: value },
    }))
  }

  const reset = (effectId: string) => {
    const meta = effects.find((effect) => effect.id === effectId)
    if (!meta) return
    setSettings((prev) => ({ ...prev, [effectId]: { ...meta.defaults } }))
    setMountKeys((prev) => ({ ...prev, [effectId]: (prev[effectId] ?? 0) + 1 }))
  }

  const captureId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('capture')
      : null
  const captureEffect = captureId ? effects.find((effect) => effect.id === captureId) : undefined
  if (captureEffect) {
    return (
      <>
        <div className="app-bg" aria-hidden="true" />
        <div className="capture-shell">
          <EffectCard
            effect={captureEffect}
            settings={settings[captureEffect.id]}
            onSettingChange={(key, value) => update(captureEffect.id, key, value)}
            onReset={() => reset(captureEffect.id)}
            mountKey={mountKeys[captureEffect.id] ?? 0}
            highlighted={highlightedId === captureEffect.id}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="app-bg" aria-hidden="true" />
      <div className="page">
        <header className="hero">
          <div className="eyebrow">
            <span className="pulse" />
            open-source interaction study
          </div>
          <h1>
            Mouse effects, <span className="grad">rebuilt from source.</span>
          </h1>
          <p>
            A hands-on laboratory of cursor trails, particle systems, image residue, magnetic
            interfaces, fluid solvers and liquid shaders. Fourteen open-source projects were scanned,
            their implementations traced, and twenty-five effects reconstructed as independent,
            controllable demos. Every source viewer shows the code that is actually running.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <b>14</b>
              <span>repos scanned</span>
            </div>
            <div className="stat">
              <b>25</b>
              <span>live effects</span>
            </div>
            <div className="stat">
              <b>7</b>
              <span>categories</span>
            </div>
            <div className="stat">
              <b>MIT</b>
              <span>sources prioritised</span>
            </div>
          </div>
        </header>

        <nav className="nav-shell" aria-label="Effect categories">
          <div className="nav-inner">
            <div className="nav-brand">
              <span className="dot" />
              effects lab
            </div>
            {categories.map((category) => (
              <a className="nav-link" href={`#cat-${category.id}`} key={category.id}>
                {category.title}
                <span className="count">{counts[category.title] ?? 0}</span>
              </a>
            ))}
          </div>
          <div className="effect-tabs" aria-label="Effect quick links">
            <div className="effect-tabs-inner">
              {effects.map((effect) => (
                <a
                  className={`effect-tab ${activeHash === effect.id ? 'active' : ''}`}
                  href={`#${effect.id}`}
                  data-id={effect.id}
                  key={effect.id}
                >
                  <span>{effect.index}</span>
                  {effect.title}
                </a>
              ))}
            </div>
          </div>
        </nav>

        <main>
          {categories.map((category) => {
            const list = effects.filter((effect) => effect.category === category.title)
            return (
              <section className="category" id={`cat-${category.id}`} key={category.id}>
                <div className="category-head">
                  <h2>
                    <span>{String(list.length).padStart(2, '0')}</span>
                    {category.title}
                  </h2>
                  <p>{category.blurb}</p>
                </div>
                <div className="grid">
                  {list.map((effect) => (
                    <EffectCard
                      key={effect.id}
                      effect={effect}
                      settings={settings[effect.id]}
                      onSettingChange={(key, value) => update(effect.id, key, value)}
                      onReset={() => reset(effect.id)}
                      mountKey={mountKeys[effect.id] ?? 0}
                      highlighted={highlightedId === effect.id}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </main>

        <footer className="footer">
          <span>Mouse Effects Lab — source-first reconstructions</span>
          <span>
            MIT sources adapted with attribution · unlicensed sources used as behavioural reference
            only
          </span>
        </footer>
      </div>
    </>
  )
}
