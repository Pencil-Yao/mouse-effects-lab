declare class MouseFollower {
  static registerGSAP(gsap: unknown): void
  constructor(options?: Record<string, unknown>)
  options: Record<string, unknown>
  skewing: number
  visible: boolean
  setSkewing(value: number): void
  removeSkewing(): void
  setStick(element: string | HTMLElement): void
  removeStick(): void
  setText(text: string): void
  removeText(): void
  setIcon(icon: string | SVGElement, style?: string): void
  setIconImg(url: string, style?: string): void
  removeIcon(): void
  setImg(url: string): void
  removeImg(): void
  setVideo(url: string): void
  removeVideo(): void
  show(): void
  hide(): void
  destroy(): void
}

export default MouseFollower
