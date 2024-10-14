import { render, hydrate as hydrativeRender } from 'preact';

let initialized;

/** @type {typeof hydrativeRender} */
export function hydrate(jsx, parent) {
	if (typeof window === 'undefined') return;
	let isodata = document.getElementById('isodata');
	// @ts-ignore-next
	parent = parent || (isodata && isodata.parentNode) || document.body;
	if (!initialized && isodata) {
		hydrativeRender(jsx, parent);
	} else {
		render(jsx, parent);
	}
	initialized = true;
}
