import { beforeEach, expect, test } from 'vitest';

import { locationStub } from '../../src/prerender.js';

const assert = {
	equal: (actual, expected) => expect(actual).toEqual(expected),
	ok: (actual, message) => expect(actual, message).toBeTruthy(),
};

beforeEach(() => {
	if (globalThis.location) {
		delete globalThis.location;
	}
});

test('Contains all Location instance properties', () => {
	locationStub('/foo/bar?baz=qux#quux');

	[
		// 'ancestorOrigins', // Not supported by FireFox and sees little use, but we could add an empty val if it's needed
		'hash',
		'host',
		'hostname',
		'href',
		'origin',
		'pathname',
		'port',
		'protocol',
		'search',
	].forEach(key => {
		assert.ok(Object.hasOwn(globalThis.location, key), `missing: ${key}`);
	});
});

// Do we need to support `assign`, `reload`, and/or `replace`?
test('Support bound methods', () => {
	locationStub('/foo/bar?baz=qux#quux');

	assert.equal(globalThis.location.toString(), 'http://localhost/foo/bar?baz=qux#quux')
});
