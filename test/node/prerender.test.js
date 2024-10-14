import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { html } from 'htm/preact';

import { prerender } from '../../src/prerender.js';

test('extracts links', async () => {
	const App = () => html`
		<div>
			<a href="/foo">foo</a>
			<a href="/bar" target="_blank">bar</a>
			<a href="/baz" target="_self">baz</a>
		</div>
	`;


	const { links } = await prerender(html`<${App} />`);
	assert.equal(links.size, 2, `incorrect number of links found: ${links.size}`);
	assert.ok(links.has('/foo'), `missing: /foo`);
	assert.ok(links.has('/baz'), `missing: /baz`);
});

test('appends iso data script', async () => {
	const { html: h } = await prerender(html`<div />`);
	// Empty for now, but used for hydration vs render detection
	assert.match(h, /<script id="isodata"><\/script>/, 'missing iso data script tag');
});

test.run();
