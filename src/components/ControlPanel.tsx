import type { Control, ControlGroup, ControlValue, Settings } from '../types'

interface Props {
  groups: ControlGroup[]
  settings: Settings
  open: boolean
  onChange: (key: string, value: ControlValue) => void
}

function formatValue(value: ControlValue, unit?: string) {
  if (typeof value === 'number') {
    const rounded = Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(2)
    return `${rounded}${unit ?? ''}`
  }
  return String(value)
}

function ControlRow({
  control,
  value,
  onChange,
}: {
  control: Control
  value: ControlValue
  onChange: (value: ControlValue) => void
}) {
  if (control.kind === 'slider') {
    return (
      <div className="control" title={control.hint}>
        <div className="control-label">
          <span>{control.label}</span>
          <span className="control-value">{formatValue(value, control.unit)}</span>
        </div>
        <input
          type="range"
          min={control.min}
          max={control.max}
          step={control.step}
          value={Number(value)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    )
  }

  if (control.kind === 'color') {
    return (
      <div className="control" title={control.hint}>
        <div className="control-label">
          <span>{control.label}</span>
        </div>
        <div className="color-row">
          <input
            type="color"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            aria-label={control.label}
          />
          <span className="control-value">{String(value)}</span>
        </div>
      </div>
    )
  }

  if (control.kind === 'select') {
    return (
      <div className="control" title={control.hint}>
        <div className="control-label">
          <span>{control.label}</span>
        </div>
        <select
          className="select-input"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          {control.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (control.kind === 'toggle') {
    return (
      <div className="control" title={control.hint}>
        <div className="control-label">
          <span>{control.label}</span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="track" />
          <span>{value ? 'On' : 'Off'}</span>
        </label>
      </div>
    )
  }

  return (
    <div className="control full" title={control.hint}>
      <div className="control-label">
        <span>{control.label}</span>
      </div>
      <input
        className="text-input"
        type="text"
        value={String(value)}
        placeholder={control.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default function ControlPanel({ groups, settings, open, onChange }: Props) {
  return (
    <div className={`controls ${open ? 'open' : ''}`}>
      {groups.map((group) => (
        <div className="controls-group" key={group.title}>
          <div className="controls-group-title">{group.title}</div>
          <div className="controls-grid">
            {group.controls.map((control) => (
              <ControlRow
                key={control.key}
                control={control}
                value={settings[control.key]}
                onChange={(value) => onChange(control.key, value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
