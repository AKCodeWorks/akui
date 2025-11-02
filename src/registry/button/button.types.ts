import type { Snippet } from "svelte"
import type { HTMLButtonAttributes } from "svelte/elements"

type AkUiMouseEvent = MouseEvent & { currentTarget: HTMLButtonElement }
type ButtonProps = {
  before?: Snippet
  after?: Snippet
  onRightClick?: (event: AkUiMouseEvent) => void
  onMiddleClick?: (event: AkUiMouseEvent) => void
  onLeftClick?: (event: AkUiMouseEvent) => void
  onShiftRightClick?: (event: AkUiMouseEvent) => void
  onShiftMiddleClick?: (event: AkUiMouseEvent) => void
  onShiftLeftClick?: (event: AkUiMouseEvent) => void
  onCtrlRightClick?: (event: AkUiMouseEvent) => void
  onCtrlMiddleClick?: (event: AkUiMouseEvent) => void
  onCtrlLeftClick?: (event: AkUiMouseEvent) => void
  onAltRightClick?: (event: AkUiMouseEvent) => void
  onAltMiddleClick?: (event: AkUiMouseEvent) => void
  onAltLeftClick?: (event: AkUiMouseEvent) => void
  onMetaRightClick?: (event: AkUiMouseEvent) => void
  onMetaMiddleClick?: (event: AkUiMouseEvent) => void
  onMetaLeftClick?: (event: AkUiMouseEvent) => void
} & HTMLButtonAttributes

const buttonTypes = ['left', 'middle', 'right'] as const;
const metaKeys = ['shift', 'ctrl', 'alt', 'meta'] as const;

type MouseButton = (typeof buttonTypes)[number];
type ModifierKey = (typeof metaKeys)[number];


export type { ButtonProps, MouseButton, ModifierKey, AkUiMouseEvent }
export { buttonTypes, metaKeys }