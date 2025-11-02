import type { Snippet } from "svelte"
import type { ClassValue, HTMLButtonAttributes } from "svelte/elements"

type AkRegMouseEvent = MouseEvent & { currentTarget: HTMLButtonElement }
type ButtonProps = {
  before?: Snippet
  after?: Snippet
  onRightClick?: (event: AkRegMouseEvent) => void
  onMiddleClick?: (event: AkRegMouseEvent) => void
  onLeftClick?: (event: AkRegMouseEvent) => void
  onShiftRightClick?: (event: AkRegMouseEvent) => void
  onShiftMiddleClick?: (event: AkRegMouseEvent) => void
  onShiftLeftClick?: (event: AkRegMouseEvent) => void
  onCtrlRightClick?: (event: AkRegMouseEvent) => void
  onCtrlMiddleClick?: (event: AkRegMouseEvent) => void
  onCtrlLeftClick?: (event: AkRegMouseEvent) => void
  onAltRightClick?: (event: AkRegMouseEvent) => void
  onAltMiddleClick?: (event: AkRegMouseEvent) => void
  onAltLeftClick?: (event: AkRegMouseEvent) => void
  onMetaRightClick?: (event: AkRegMouseEvent) => void
  onMetaMiddleClick?: (event: AkRegMouseEvent) => void
  onMetaLeftClick?: (event: AkRegMouseEvent) => void
  class?: ClassValue | null | undefined
} & Omit<HTMLButtonAttributes, "class">

const buttonTypes = ['left', 'middle', 'right'] as const;
const metaKeys = ['shift', 'ctrl', 'alt', 'meta'] as const;

type MouseButton = (typeof buttonTypes)[number];
type ModifierKey = (typeof metaKeys)[number];


export type { ButtonProps, MouseButton, ModifierKey, AkRegMouseEvent }
export { buttonTypes, metaKeys }