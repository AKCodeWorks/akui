<script lang="ts">
	import type { AkUiMouseEvent, ButtonProps } from './button.types.js';
	import { mergeProps } from 'bits-ui';
	import { handleClick } from './button.utils.js';

	let { children, before, after, ...props }: ButtonProps = $props();

	const merged = mergeProps(
		{ onclick: (e: AkUiMouseEvent) => handleClick(e, props) },
		{ onauxclick: (e: AkUiMouseEvent) => handleClick(e, props) },
		props
	);
</script>

<button
	{...merged}
	class="flex h-12 items-center justify-center rounded-md border border-border bg-background
	text-primary shadow-sm hover:bg-background/95 active:scale-[0.98] active:transition-all"
>
	<div class="flex h-full w-full items-center justify-between gap-2 border border-red-400/5 px-2">
		{@render before?.()}
		{@render children?.()}
		{@render after?.()}
	</div>
</button>
