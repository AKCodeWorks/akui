import type { ButtonProps, ModifierKey, MouseButton } from "./button.types.js";

/**
 * Given a MouseEvent, determine which button was clicked and which modifier keys were held.
 * @param e MouseEvent from the click
 * @returns Tuple of [MouseButton, ModifierKey[]]
 * 
 */
function getMouseClickButton(e: MouseEvent): [MouseButton, ModifierKey[]] {
  let button: MouseButton = 'left';
  if (e.button === 1) button = 'middle';
  else if (e.button === 2) button = 'right';

  const modifiers: ModifierKey[] = [];
  if (e.shiftKey) modifiers.push('shift');
  if (e.ctrlKey) modifiers.push('ctrl');
  if (e.altKey) modifiers.push('alt');
  if (e.metaKey) modifiers.push('meta');

  return [button, modifiers];
}

function handleClick(e: MouseEvent & { currentTarget: HTMLButtonElement }, props: ButtonProps) {
  const [button, modifiers] = getMouseClickButton(e);

  // onclick is called no matter what
  props.onclick?.(e);

  if (button === 'left' && modifiers.length === 0) props.onLeftClick?.(e);
  if (button === 'middle' && modifiers.length === 0) props.onMiddleClick?.(e);
  if (button === 'right' && modifiers.length === 0) props.onRightClick?.(e);

  for (const mod of modifiers) {
    if (button === 'left' && mod === 'ctrl') props.onCtrlLeftClick?.(e);
    if (button === 'left' && mod === 'shift') props.onShiftLeftClick?.(e);
    if (button === 'left' && mod === 'alt') props.onAltLeftClick?.(e);
    if (button === 'left' && mod === 'meta') props.onMetaLeftClick?.(e);

    if (button === 'right' && mod === 'ctrl') props.onCtrlRightClick?.(e);
    if (button === 'right' && mod === 'shift') props.onShiftRightClick?.(e);
    if (button === 'right' && mod === 'alt') props.onAltRightClick?.(e);
    if (button === 'right' && mod === 'meta') props.onMetaRightClick?.(e);
  }
}

export { handleClick, getMouseClickButton };