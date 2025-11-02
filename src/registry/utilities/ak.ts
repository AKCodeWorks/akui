import type { ClassValue } from "svelte/elements";

function ak(...classLists: (string | undefined | false | null | ClassValue)[]) {
  return classLists
    .filter((cls): cls is string => typeof cls === 'string' && cls.trim().length > 0)
    .join(' ');
}

export { ak }