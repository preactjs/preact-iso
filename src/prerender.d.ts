import { VNode } from 'preact';

export interface PrerenderOptions {
	props?: Record<string, unknown>;
}

export interface PrerenderResult {
	html: string;
	links?: Set<string>
}

export function prerender(
	vnode: VNode,
	options?: PrerenderOptions
): Promise<PrerenderResult>;

export function locationStub(path: string): void;
