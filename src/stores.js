import { writable } from 'svelte/store';

export const score = writable(0);
export const mode=writable("INTRODUCTION_MODE")