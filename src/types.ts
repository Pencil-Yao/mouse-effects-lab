import type { ComponentType } from 'react'

export type ControlValue = number | string | boolean

export type Control =
  | {
      kind: 'slider'
      key: string
      label: string
      min: number
      max: number
      step: number
      unit?: string
      hint?: string
    }
  | { kind: 'color'; key: string; label: string; hint?: string }
  | {
      kind: 'select'
      key: string
      label: string
      options: { value: string; label: string }[]
      hint?: string
    }
  | { kind: 'toggle'; key: string; label: string; hint?: string }
  | { kind: 'text'; key: string; label: string; placeholder?: string; hint?: string }

export interface ControlGroup {
  title: string
  controls: Control[]
}

export type Settings = Record<string, ControlValue>

export interface EffectProps {
  settings: Settings
}

export interface EffectSource {
  project: string
  projectUrl: string
  originalPath: string
  license: string
  licenseNote?: string
  tech: string[]
  principle: string
  reconstruction: string
}

export interface EffectMeta {
  id: string
  index: string
  title: string
  tagline: string
  category: string
  tech: string
  wide?: boolean
  hint: string
  defaults: Settings
  groups: ControlGroup[]
  source: EffectSource
  component: ComponentType<EffectProps>
}

export interface CategoryMeta {
  id: string
  title: string
  blurb: string
}
