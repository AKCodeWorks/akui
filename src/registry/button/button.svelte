<script lang="ts">
	import type { AkRegMouseEvent, ButtonProps } from './button.types.js';
	import { mergeProps } from 'bits-ui';
	import { handleClick } from './button.utils.js';
	import { ak } from '../utilities/ak.js';

	let { children, before, after, class: className, ...props }: ButtonProps = $props();

	const merged = mergeProps(
		{ onclick: (e: AkRegMouseEvent) => handleClick(e, props) },
		{ onauxclick: (e: AkRegMouseEvent) => handleClick(e, props) }
	);
</script>

<button
	{...merged}
	class={ak(
		'flex h-12 items-center justify-center rounded-md border border-border bg-background text-primary shadow-sm hover:bg-background/95 active:scale-[0.98] active:transition-all',
		className
	)}
>
	<div class="flex h-full w-full items-center justify-between gap-2 border border-red-400/5 px-2">
		{@render before?.()}
		{@render children?.()}
		{@render after?.()}
	</div>
</button>
