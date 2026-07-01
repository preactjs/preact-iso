import { expect, test } from 'vitest';
import { h } from 'preact';

import { default as prerender } from '../../src/prerender.js';

const assert = {
	equal: (actual, expected, message) => expect(actual, message).toEqual(expected),
	ok: (actual, message) => expect(actual, message).toBeTruthy(),
	match: (actual, expected, message) => expect(actual, message).toMatch(expected),
};

test('extracts links', async () => {
	const App = () => (
		<div>
			<a href="/foo">foo</a>
			<a href="/bar" target="_blank">bar</a>
			<a href="/baz" target="_self">baz</a>
		</div>
	);

	const { links } = await prerender(<App />);
	assert.equal(links.size, 2, `incorrect number of links found: ${links.size}`);
	assert.ok(links.has('/foo'), `missing: /foo`);
	assert.ok(links.has('/baz'), `missing: /baz`);
});

test('appends iso data script', async () => {
	const { html: rendered } = await prerender(<div />);
	// Empty for now, but used for hydration vs render detection
	assert.match(rendered, /<script type="isodata"><\/script>/, 'missing iso data script tag');
});
