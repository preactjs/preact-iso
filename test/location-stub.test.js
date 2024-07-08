import { describe, it, beforeEach, expect } from '@jest/globals';
import { locationStub } from '../src/prerender.js';

describe('location-stub', () => {
	beforeEach(() => {
		if (globalThis.location) {
			delete globalThis.location;
		}
	});

	it('Contains all Location instance properties', () => {
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
			expect(globalThis.location).toHaveProperty(key);
		});
	});

	// Do we need to support `assign`, `reload`, and/or `replace`?
	it('Support bound methods', () => {
		locationStub('/foo/bar?baz=qux#quux');

		expect(globalThis.location.toString()).toBe('http://localhost/foo/bar?baz=qux#quux');
	});
});
