<!-- AKUI_VERSION: UNTRACKED DO NOT DELETE OR YOUR FILE WILL BE OVERWRITTEN ON UPDATE! -->
<script lang="ts">
	import AccordionDep from './accordion-dep.svelte';

	let { someProp } = $props();
</script>

<div>
	<h1>{someProp}</h1>
	<AccordionDep />
</div>
