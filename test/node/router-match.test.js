import { test } from 'uvu';
import * as assert from 'uvu/assert';

// @ts-expect-error - no types, not meant for public use
import { exec } from '../../src/router.js';

function execPath(path, pattern, opts) {
	return exec(path, pattern, { path, query: {}, params: {}, ...(opts || {}) });
}

test('Base route', () => {
	const accurateResult = execPath('/', '/');
	assert.equal(accurateResult, { path: '/', params: {}, query: {} });

	const inaccurateResult = execPath('/user/1', '/');
	assert.equal(inaccurateResult, undefined);
});

test('Param route', () => {
	const accurateResult = execPath('/user/2', '/user/:id');
	assert.equal(accurateResult, { path: '/user/2', params: { id: '2' }, id: '2', query: {} });

	const inaccurateResult = execPath('/', '/user/:id');
	assert.equal(inaccurateResult, undefined);
});

test('Param rest segment', () => {
	const accurateResult = execPath('/user/foo', '/user/*');
	assert.equal(accurateResult, { path: '/user/foo', params: {}, query: {}, rest: '/foo' });

	const accurateResult2 = execPath('/user', '/user/*');
	assert.equal(accurateResult2, { path: '/user', params: {}, query: {}, rest: '/' });

	const inaccurateResult = execPath('/', '/user/:id/*');
	assert.equal(inaccurateResult, undefined);
});

test('Param route with rest segment', () => {
	const accurateResult = execPath('/user/2/foo', '/user/:id/*');
	assert.equal(accurateResult, { path: '/user/2/foo', params: { id: '2' }, id: '2', query: {}, rest: '/foo' });

	const accurateResult2 = execPath('/user/2/foo/bar/bob', '/user/:id/*');
	assert.equal(accurateResult2, {
		path: '/user/2/foo/bar/bob',
		params: { id: '2' },
		id: '2',
		query: {},
		rest: '/foo/bar/bob'
	});

	const inaccurateResult = execPath('/', '/user/:id/*');
	assert.equal(inaccurateResult, undefined);
});

test('Optional param route', () => {
	const accurateResult = execPath('/user', '/user/:id?');
	assert.equal(accurateResult, { path: '/user', params: { id: undefined }, id: undefined, query: {} });

	const inaccurateResult = execPath('/', '/user/:id?');
	assert.equal(inaccurateResult, undefined);
});

test('Optional rest param route "/:x*"', () => {
	const matchedResult = execPath('/user', '/user/:id*');
	assert.equal(matchedResult, { path: '/user', params: { id: undefined }, id: undefined, query: {} });

	const matchedResultWithSlash = execPath('/user/foo/bar', '/user/:id*');
	assert.equal(matchedResultWithSlash, {
		path: '/user/foo/bar',
		params: { id: 'foo/bar' },
		id: 'foo/bar',
		query: {}
	});

	const emptyResult = execPath('/user', '/user/:id*');
	assert.equal(emptyResult, {
		path: '/user',
		params: { id: undefined },
		id: undefined,
		query: {}
	});

	const inaccurateResult = execPath('/', '/user/:id*');
	assert.equal(inaccurateResult, undefined);
});

test('Rest param route "/:x+"', () => {
	const matchedResult = execPath('/user/foo', '/user/:id+');
	assert.equal(matchedResult, { path: '/user/foo', params: { id: 'foo' }, id: 'foo', query: {} });

	const matchedResultWithSlash = execPath('/user/foo/bar', '/user/:id+');
	assert.equal(matchedResultWithSlash, {
		path: '/user/foo/bar',
		params: { id: 'foo/bar' },
		id: 'foo/bar',
		query: {}
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
		params: {
			seg1: '_SEGMENT1_',
			seg2: '_SEGMENT2_'
		},
		seg1: '_SEGMENT1_',
		seg2: '_SEGMENT2_',
		query: {}
	});
});

test('should not overwrite existing properties', () => {
	const result = execPath('/foo/bar', '/:path/:query', { path: '/custom-path' });
	assert.equal(result, {
		params: { path: 'foo', query: 'bar' },
		path: '/custom-path',
		query: {}
	});
});

test.run();
