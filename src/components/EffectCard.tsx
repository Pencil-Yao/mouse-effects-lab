import { useState } from 'react'
import type { ControlValue, EffectMeta, Settings } from '../types'
import { useInView } from '../hooks/useInView'
import ControlPanel from './ControlPanel'

interface Props {
  effect: EffectMeta
  settings: Settings
  onSettingChange: (key: string, value: ControlValue) => void
  onReset: () => void
  mountKey: number
  highlighted?: boolean
}

export default function EffectCard({
  effect,
  settings,
  onSettingChange,
  onReset,
  mountKey,
  highlighted = false,
}: Props) {
  const [controlsOpen, setControlsOpen] = useState(false)
  const { ref, inView } = useInView<HTMLDivElement>()
  const Component = effect.component

  return (
    <article className={`card ${effect.wide ? 'wide' : ''} ${highlighted ? 'hash-target' : ''}`} id={effect.id}>
      <header className="card-head">
        <div>
          <div className="card-title-row">
            <span className="card-index">{effect.index}</span>
            <h3>{effect.title}</h3>
            {inView && <span className="badge live">live</span>}
          </div>
          <p className="card-tagline">{effect.tagline}</p>
          <div className="badges">
            <span className="badge">{effect.category}</span>
            <span className="badge">{effect.tech}</span>
          </div>
        </div>
        <div className="card-actions">
          {effect.groups.length > 0 && (
            <button
              className={`icon-btn ${controlsOpen ? 'active' : ''}`}
              onClick={() => setControlsOpen((v) => !v)}
              aria-expanded={controlsOpen}
            >
              Controls
            </button>
          )}
          <button
            className="icon-btn"
            onClick={onReset}
            title="Reset settings and remount this effect"
          >
            Reset
          </button>
        </div>
      </header>

      <div className="stage-shell">
        <div className="stage" ref={ref}>
          {inView ? (
            <Component key={mountKey} settings={settings} />
          ) : (
            <div className="stage-placeholder">scroll into view to activate</div>
          )}
          <span className="stage-hint">{effect.hint}</span>
        </div>
      </div>

      {effect.groups.length > 0 && (
        <ControlPanel
          groups={effect.groups}
          settings={settings}
          open={controlsOpen}
          onChange={onSettingChange}
        />
      )}
    </article>
  )
}
