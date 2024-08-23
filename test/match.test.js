import { expect } from 'chai';

// @ts-expect-error - no types, not meant for public use
import { exec } from '../src/router.js';

function execPath(path, pattern, opts) {
	return exec(path, pattern, { path, query: {}, params: {}, ...(opts || {}) });
}

describe('match', () => {
	it('Base route', () => {
		const accurateResult = execPath('/', '/');
		expect(accurateResult).to.deep.include({ path: '/', params: {}, query: {} });

		const inaccurateResult = execPath('/user/1', '/');
		expect(inaccurateResult).to.equal(undefined);
	});

	it('Param route', () => {
		const accurateResult = execPath('/user/2', '/user/:id');
		expect(accurateResult).to.deep.include({ path: '/user/2', params: { id: '2' }, id: '2', query: {} });

		const inaccurateResult = execPath('/', '/user/:id');
		expect(inaccurateResult).to.equal(undefined);
	});

	it('Param rest segment', () => {
		const accurateResult = execPath('/user/foo', '/user/*');
		expect(accurateResult).to.deep.include({ path: '/user/foo', params: {}, query: {}, rest: '/foo' });

		const inaccurateResult = execPath('/', '/user/:id/*');
		expect(inaccurateResult).to.equal(undefined);
	});

	it('Param route with rest segment', () => {
		const accurateResult = execPath('/user/2/foo', '/user/:id/*');
		expect(accurateResult).to.deep.include({ path: '/user/2/foo', params: { id: '2' }, id: '2', query: {}, rest: '/foo' });

		const accurateResult2 = execPath('/user/2/foo/bar/bob', '/user/:id/*');
		expect(accurateResult2).to.deep.include({
			path: '/user/2/foo/bar/bob',
			params: { id: '2' },
			id: '2',
			query: {},
			rest: '/foo/bar/bob'
		});

		const inaccurateResult = execPath('/', '/user/:id/*');
		expect(inaccurateResult).to.equal(undefined);
	});

	it('Optional param route', () => {
		const accurateResult = execPath('/user', '/user/:id?');
		expect(accurateResult).to.deep.include({ path: '/user', params: { id: undefined }, id: undefined, query: {} });

		const inaccurateResult = execPath('/', '/user/:id?');
		expect(inaccurateResult).to.equal(undefined);
	});

	it('Optional rest param route "/:x*"', () => {
		const accurateResult = execPath('/user', '/user/:id?');
		expect(accurateResult).to.deep.include({ path: '/user', params: { id: undefined }, id: undefined, query: {} });

		const inaccurateResult = execPath('/', '/user/:id?');
		expect(inaccurateResult).to.equal(undefined);
	});

	it('Rest param route "/:x+"', () => {
		const matchedResult = execPath('/user/foo', '/user/:id+');
		expect(matchedResult).to.deep.include({ path: '/user/foo', params: { id: 'foo' }, id: 'foo', query: {} });

		const matchedResultWithSlash = execPath('/user/foo/bar', '/user/:id+');
		expect(matchedResultWithSlash).to.deep.include({
			path: '/user/foo/bar',
			params: { id: 'foo/bar' },
			id: 'foo/bar',
			query: {}
		});

		const emptyResult = execPath('/user', '/user/:id+');
		expect(emptyResult).to.equal(undefined);

		const mismatchedResult = execPath('/', '/user/:id+');
		expect(mismatchedResult).to.equal(undefined);
	});

	it('Handles leading/trailing slashes', () => {
		const result = execPath('/about-late/_SEGMENT1_/_SEGMENT2_/', '/about-late/:seg1/:seg2/');
		expect(result).to.deep.include({
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

	it('should not overwrite existing properties', () => {
		const result = execPath('/foo/bar', '/:path/:query', { path: '/custom-path' });
		expect(result).to.deep.include({
			params: { path: 'foo', query: 'bar' },
			path: '/custom-path',
			query: {}
		});
	});
});
