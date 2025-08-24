import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { exec } from '../../src/router.js';

function execPath(path, pattern, opts) {
	return exec(path, pattern, { path, searchParams: {}, pathParams: {}, ...(opts || {}) });
}

test('Base route', () => {
	const accurateResult = execPath('/', '/');
	assert.equal(accurateResult, { path: '/', pathParams: {}, searchParams: {} });

	const inaccurateResult = execPath('/user/1', '/');
	assert.equal(inaccurateResult, undefined);
});

test('Param route', () => {
	const accurateResult = execPath('/user/2', '/user/:id');
	assert.equal(accurateResult, { path: '/user/2', pathParams: { id: '2' }, id: '2', searchParams: {} });

	const inaccurateResult = execPath('/', '/user/:id');
	assert.equal(inaccurateResult, undefined);
});

test('Param rest segment', () => {
	const accurateResult = execPath('/user/foo', '/user/*');
	assert.equal(accurateResult, { path: '/user/foo', pathParams: {}, searchParams: {}, rest: '/foo' });

	const accurateResult2 = execPath('/user/foo/bar/baz', '/user/*');
	assert.equal(accurateResult2, { path: '/user/foo/bar/baz', pathParams: {}, searchParams: {}, rest: '/foo/bar/baz' });

	const inaccurateResult = execPath('/user', '/user/*');
	assert.equal(inaccurateResult, undefined);
});

test('Param route with rest segment', () => {
	const accurateResult = execPath('/user/2/foo', '/user/:id/*');
	assert.equal(accurateResult, { path: '/user/2/foo', pathParams: { id: '2' }, id: '2', searchParams: {}, rest: '/foo' });

	const accurateResult2 = execPath('/user/2/foo/bar/bob', '/user/:id/*');
	assert.equal(accurateResult2, {
		path: '/user/2/foo/bar/bob',
		pathParams: { id: '2' },
		id: '2',
		searchParams: {},
		rest: '/foo/bar/bob'
	});

	const inaccurateResult = execPath('/', '/user/:id/*');
	assert.equal(inaccurateResult, undefined);
});

test('Optional param route', () => {
	const accurateResult = execPath('/user', '/user/:id?');
	assert.equal(accurateResult, { path: '/user', pathParams: { id: undefined }, id: undefined, searchParams: {} });

	const inaccurateResult = execPath('/', '/user/:id?');
	assert.equal(inaccurateResult, undefined);
});

test('Optional rest param route "/:x*"', () => {
	const matchedResult = execPath('/user', '/user/:id*');
	assert.equal(matchedResult, { path: '/user', pathParams: { id: undefined }, id: undefined, searchParams: {} });

	const matchedResultWithSlash = execPath('/user/foo/bar', '/user/:id*');
	assert.equal(matchedResultWithSlash, {
		path: '/user/foo/bar',
		pathParams: { id: 'foo/bar' },
		id: 'foo/bar',
		searchParams: {}
	});

	const emptyResult = execPath('/user', '/user/:id*');
	assert.equal(emptyResult, {
		path: '/user',
		pathParams: { id: undefined },
		id: undefined,
		searchParams: {}
	});

	const inaccurateResult = execPath('/', '/user/:id*');
	assert.equal(inaccurateResult, undefined);
});

test('Rest param route "/:x+"', () => {
	const matchedResult = execPath('/user/foo', '/user/:id+');
	assert.equal(matchedResult, { path: '/user/foo', pathParams: { id: 'foo' }, id: 'foo', searchParams: {} });

	const matchedResultWithSlash = execPath('/user/foo/bar', '/user/:id+');
	assert.equal(matchedResultWithSlash, {
		path: '/user/foo/bar',
		pathParams: { id: 'foo/bar' },
		id: 'foo/bar',
		searchParams: {}
	});

	const emptyResult = execPath('/user', '/user/:id+');
	assert.equal(emptyResult, undefined);

	const mismatchedResult = execPath('/', '/user/:id+');
	assert.equal(mismatchedResult, undefined);
});

test('Handles leading/trailing slashes', () => {
	const result = execPath('/about-late/_SEGMENT1_/_SEGMENT2_/', '/about-late/:seg1/:seg2/');
	assert.equal(result, {
		path: '/about-late/_SEGMENT1_/_SEGMENT2_/',
		pathParams: {
			seg1: '_SEGMENT1_',
			seg2: '_SEGMENT2_'
		},
		seg1: '_SEGMENT1_',
		seg2: '_SEGMENT2_',
		searchParams: {}
	});
});

test('should not overwrite existing properties', () => {
	const result = execPath('/foo/bar', '/:path/:searchParams', { path: '/custom-path' });
	assert.equal(result, {
		pathParams: { path: 'foo', searchParams: 'bar' },
		path: '/custom-path',
		searchParams: {},
	});
});

test.run();
