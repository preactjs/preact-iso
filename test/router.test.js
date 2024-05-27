import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { h, hydrate, options, render } from 'preact';
import { useState } from 'preact/hooks';
import { html } from 'htm/preact';
import { LocationProvider, Router, useLocation, Route, useRoute } from '../src/router.js';
import lazy, { ErrorBoundary } from '../src/lazy.js';

Object.defineProperty(window, 'scrollTo', { value() {} });

const sleep = ms => new Promise(r => setTimeout(r, ms));

// delayed lazy()
const groggy = (component, ms) => lazy(() => sleep(ms).then(() => component));

describe('Router', () => {
	let scratch;
	beforeEach(() => {
		if (scratch) {
			render(null, scratch);
			scratch.remove();
		}
		scratch = document.createElement('scratch');
		document.body.appendChild(scratch);
		history.replaceState(null, null, '/');
	});

	it('should allow passing props to a route', async () => {
		const Home = jest.fn(() => html`<h1>Home</h1>`);
		const stack = [];
		let loc;
		render(
			html`
				<${LocationProvider}>
					<${Router}
						onRouteChange=${url => {
							stack.push(url);
						}}
					>
						<${Home} path="/" test="2" />
					<//>
					<${() => {
						loc = useLocation();
					}} />
				<//>
			`,
			scratch
		);

		expect(scratch).toHaveProperty('textContent', 'Home');
		expect(Home).toHaveBeenCalledWith({ path: '/', query: {}, params: {}, rest: '', test: '2' }, expect.anything());
		expect(loc).toMatchObject({
			url: '/',
			path: '/',
			query: {},
			route: expect.any(Function)
		});
	});

	it('should allow updating props in a route', async () => {
		const Home = jest.fn(() => html`<h1>Home</h1>`);
		const stack = [];
		let loc, set;

		const App = () => {
			const [test, setTest] = useState('2');
			set = setTest;
			return html`
				<${LocationProvider}>
				<${Router}
					onRouteChange=${url => {
						stack.push(url);
					}}
				>
					<${Home} path="/" test=${test} />
				<//>
				<${() => {
					loc = useLocation();
				}} />
				<//>
				`;
		}
		render(
			html`<${App} />`,
			scratch
		);

		expect(scratch).toHaveProperty('textContent', 'Home');
		expect(Home).toHaveBeenCalledWith({ path: '/', query: {}, params: {}, rest: '', test: '2' }, expect.anything());
		expect(loc).toMatchObject({
			url: '/',
			path: '/',
			query: {},
			route: expect.any(Function)
		});

		set('3')
		await sleep(1);

		expect(Home).toHaveBeenCalledWith({ path: '/', query: {}, params: {}, rest: '', test: '3' }, expect.anything());
		expect(loc).toMatchObject({
			url: '/',
			path: '/',
			query: {},
			route: expect.any(Function)
		});
		expect(scratch).toHaveProperty('textContent', 'Home');
	});

	it('should switch between synchronous routes', async () => {
		const Home = jest.fn(() => html`<h1>Home</h1>`);
		const Profiles = jest.fn(() => html`<h1>Profiles</h1>`);
		const Profile = jest.fn(({ params }) => html`<h1>Profile: ${params.id}</h1>`);
		const Fallback = jest.fn(() => html`<h1>Fallback</h1>`);
		const stack = [];
		let loc;
		render(
			html`
				<${LocationProvider}>
					<${Router}
						onRouteChange=${url => {
							stack.push(url);
						}}
					>
						<${Home} path="/" />
						<${Profiles} path="/profiles" />
						<${Profile} path="/profiles/:id" />
						<${Fallback} default />
					<//>
					<${() => {
						loc = useLocation();
					}} />
				<//>
			`,
			scratch
		);

		expect(scratch).toHaveProperty('textContent', 'Home');
		expect(Home).toHaveBeenCalledWith({ path: '/', query: {}, params: {}, rest: '' }, expect.anything());
		expect(Profiles).not.toHaveBeenCalled();
		expect(Profile).not.toHaveBeenCalled();
		expect(Fallback).not.toHaveBeenCalled();
		expect(loc).toMatchObject({
			url: '/',
			path: '/',
			query: {},
			route: expect.any(Function)
		});

		Home.mockReset();
		loc.route('/profiles');
		await sleep(1);

		expect(scratch).toHaveProperty('textContent', 'Profiles');
		expect(Home).not.toHaveBeenCalled();
		expect(Profiles).toHaveBeenCalledWith({ path: '/profiles', query: {}, params: {}, rest: '' }, expect.anything());
		expect(Profile).not.toHaveBeenCalled();
		expect(Fallback).not.toHaveBeenCalled();

		expect(loc).toMatchObject({
			url: '/profiles',
			path: '/profiles',
			query: {}
		});

		Profiles.mockReset();
		loc.route('/profiles/bob');
		await sleep(1);

		expect(scratch).toHaveProperty('textContent', 'Profile: bob');
		expect(Home).not.toHaveBeenCalled();
		expect(Profiles).not.toHaveBeenCalled();
		expect(Profile).toHaveBeenCalledWith(
			{ path: '/profiles/bob', query: {}, params: { id: 'bob' }, id: 'bob', rest: '' },
			expect.anything()
		);
		expect(Fallback).not.toHaveBeenCalled();

		expect(loc).toMatchObject({
			url: '/profiles/bob',
			path: '/profiles/bob',
			query: {}
		});

		Profile.mockReset();
		loc.route('/other?a=b&c=d');
		await sleep(1);

		expect(scratch).toHaveProperty('textContent', 'Fallback');
		expect(Home).not.toHaveBeenCalled();
		expect(Profiles).not.toHaveBeenCalled();
		expect(Profile).not.toHaveBeenCalled();
		expect(Fallback).toHaveBeenCalledWith(
			{ default: true, path: '/other', query: { a: 'b', c: 'd' }, params: {}, rest: '' },
			expect.anything()
		);

		expect(loc).toMatchObject({
			url: '/other?a=b&c=d',
			path: '/other',
			query: { a: 'b', c: 'd' }
		});
		expect(stack).toEqual(['/profiles', '/profiles/bob', '/other?a=b&c=d']);
	});

	it('should wait for asynchronous routes', async () => {
		const route = name => html`
			<h1>${name}</h1>
			<p>hello</p>
		`;
		const A = jest.fn(groggy(() => route('A'), 1));
		const B = jest.fn(groggy(() => route('B'), 1));
		const C = jest.fn(groggy(() => html`<h1>C</h1>`, 1));
		let loc;
		render(
			html`
				<${ErrorBoundary}>
					<${LocationProvider}>
						<${Router}>
							<${A} path="/" />
							<${B} path="/b" />
							<${C} path="/c" />
						<//>
						<${() => {
							loc = useLocation();
						}} />
					<//>
				<//>
			`,
			scratch
		);

		expect(scratch).toHaveProperty('innerHTML', '');
		expect(A).toHaveBeenCalledWith({ path: '/', query: {}, params: {}, rest: '' }, expect.anything());

		A.mockClear();
		await sleep(10);

		expect(scratch).toHaveProperty('innerHTML', '<h1>A</h1><p>hello</p>');
		expect(A).toHaveBeenCalledWith({ path: '/', query: {}, params: {}, rest: '' }, expect.anything());

		A.mockClear();
		loc.route('/b');

		expect(scratch).toHaveProperty('innerHTML', '<h1>A</h1><p>hello</p>');
		expect(A).not.toHaveBeenCalled();

		await sleep(1);

		expect(scratch).toHaveProperty('innerHTML', '<h1>A</h1><p>hello</p>');
		// We should never re-invoke <A /> while loading <B /> (that would be a remount of the old route):
		//expect(A).not.toHaveBeenCalled();
		//expect(B).toHaveBeenCalledWith({ path: '/b', query: {}, params: {}, rest: '' }, expect.anything());

		B.mockClear();
		await sleep(10);

		expect(scratch).toHaveProperty('innerHTML', '<h1>B</h1><p>hello</p>');
		expect(A).not.toHaveBeenCalled();
		expect(B).toHaveBeenCalledWith({ path: '/b', query: {}, params: {}, rest: '' }, expect.anything());

		B.mockClear();
		loc.route('/c');
		loc.route('/c?1');
		loc.route('/c');

		expect(scratch).toHaveProperty('innerHTML', '<h1>B</h1><p>hello</p>');
		expect(B).not.toHaveBeenCalled();

		await sleep(1);

		loc.route('/c');
		loc.route('/c?2');
		loc.route('/c');

		expect(scratch).toHaveProperty('innerHTML', '<h1>B</h1><p>hello</p>');
		// We should never re-invoke <A /> while loading <B /> (that would be a remount of the old route):
		expect(B).not.toHaveBeenCalled();
		expect(C).toHaveBeenCalledWith({ path: '/c', query: {}, params: {}, rest: '' }, expect.anything());

		C.mockClear();
		await sleep(10);

		expect(scratch).toHaveProperty('innerHTML', '<h1>C</h1>');
		expect(B).not.toHaveBeenCalled();
		expect(C).toHaveBeenCalledWith({ path: '/c', query: {}, params: {}, rest: '' }, expect.anything());

		// "instant" routing to already-loaded routes

		C.mockClear();
		B.mockClear();
		loc.route('/b');
		await sleep(1);

		expect(scratch).toHaveProperty('innerHTML', '<h1>B</h1><p>hello</p>');
		expect(C).not.toHaveBeenCalled();
		// expect(B).toHaveBeenCalledTimes(1);
		expect(B).toHaveBeenCalledWith({ path: '/b', query: {}, params: {}, rest: '' }, expect.anything());

		B.mockClear();
		loc.route('/');
		await sleep(1);

		expect(scratch).toHaveProperty('innerHTML', '<h1>A</h1><p>hello</p>');
		expect(B).not.toHaveBeenCalled();
		// expect(A).toHaveBeenCalledTimes(1);
		expect(A).toHaveBeenCalledWith({ path: '/', query: {}, params: {}, rest: '' }, expect.anything());
	});

	it('rerenders same-component routes rather than swap', async () => {
		const A = jest.fn(groggy(() => html`<h1>a</h1>`, 1));
		const B = jest.fn(groggy(({ sub }) => html`<h1>b/${sub}</h1>`, 1));
		let loc, childrenLength;

		const old = options.__c;
		options.__c = (vnode, queue) => {
			if (vnode.type === Router) {
				childrenLength = vnode.__k.length;
			}

			if (old) old(vnode, queue);
		}

		render(
			html`
				<${ErrorBoundary}>
					<${LocationProvider}>
						<${Router}>
							<${A} path="/" />
							<${B} path="/b/:sub" />
						<//>
						<${() => {
							loc = useLocation();
						}} />
					<//>
				<//>
			`,
			scratch
		);

		await sleep(10);

		expect(scratch).toHaveProperty('innerHTML', '<h1>a</h1>');
		expect(childrenLength).toBe(2);

		loc.route('/b/a');
		await sleep(10);

		expect(scratch).toHaveProperty('innerHTML', '<h1>b/a</h1>');
		expect(childrenLength).toBe(2);

		loc.route('/b/b');
		await sleep(10);

		expect(scratch).toHaveProperty('innerHTML', '<h1>b/b</h1>');
		expect(childrenLength).toBe(1);

		loc.route('/');
		await sleep(10);

		expect(scratch).toHaveProperty('innerHTML', '<h1>a</h1>');
		expect(childrenLength).toBe(2);

		options.__c = old;
	});

	it('should support onLoadStart/onLoadEnd/onRouteChange w/out navigation', async () => {
		const route = name => html`
			<h1>${name}</h1>
			<p>hello</p>
		`;
		const A = jest.fn(groggy(() => route('A'), 1));
		const loadStart = jest.fn();
		const loadEnd = jest.fn();
		const routeChange = jest.fn();
		render(
			html`
				<${ErrorBoundary}>
					<${LocationProvider}>
						<${Router}
							onLoadStart=${loadStart}
							onLoadEnd=${loadEnd}
							onRouteChange=${routeChange}
						>
							<${A} path="/" />
						<//>
					<//>
				<//>
			`,
			scratch
		);

		expect(scratch).toHaveProperty('innerHTML', '');
		expect(A).toHaveBeenCalledWith({ path: '/', query: {}, params: {}, rest: '' }, expect.anything());
		expect(loadStart).toHaveBeenCalledWith('/');
		expect(loadEnd).not.toHaveBeenCalled();
		expect(routeChange).not.toHaveBeenCalled();

		A.mockClear();
		loadStart.mockClear();
		loadEnd.mockClear();
		routeChange.mockClear();
		await sleep(10);

		expect(scratch).toHaveProperty('innerHTML', '<h1>A</h1><p>hello</p>');
		expect(A).toHaveBeenCalledWith({ path: '/', query: {}, params: {}, rest: '' }, expect.anything());
		expect(loadStart).not.toHaveBeenCalled();
		expect(loadEnd).toHaveBeenCalledWith('/');
		expect(routeChange).not.toHaveBeenCalled();
	});

	it('should support onLoadStart/onLoadEnd/onRouteChange w/ navigation', async () => {
		const route = name => html`
			<h1>${name}</h1>
			<p>hello</p>
		`;
		const A = jest.fn(groggy(() => route('A'), 1));
		const B = jest.fn(groggy(() => route('B'), 1));
		const loadStart = jest.fn();
		const loadEnd = jest.fn();
		const routeChange = jest.fn();
		let loc;
		render(
			html`
				<${ErrorBoundary}>
					<${LocationProvider}>
						<${Router}
							onLoadStart=${loadStart}
							onLoadEnd=${loadEnd}
							onRouteChange=${routeChange}
						>
							<${A} path="/" />
							<${B} path="/b" />
						<//>
						<${() => {
							loc = useLocation();
						}} />
					<//>
				<//>
			`,
			scratch
		);

		await sleep(10);

		A.mockClear();
		loadStart.mockClear();
		loadEnd.mockClear();
		routeChange.mockClear();

		loc.route('/b');

		await sleep(1);

		expect(loadStart).toHaveBeenCalledWith('/b');
		expect(loadEnd).not.toHaveBeenCalled();
		expect(routeChange).not.toHaveBeenCalled();

		A.mockClear();
		loadStart.mockClear();
		loadEnd.mockClear();
		routeChange.mockClear();

		await sleep(10);

		expect(scratch).toHaveProperty('innerHTML', '<h1>B</h1><p>hello</p>');
		expect(loadStart).not.toHaveBeenCalled();
		expect(loadEnd).toHaveBeenCalledWith('/b');
		expect(routeChange).toHaveBeenCalledWith('/b');
	});

	it('should only call onLoadEnd once upon promise flush', async () => {
		const route = name => html`
			<h1>${name}</h1>
			<p>hello</p>
		`;
		const A = jest.fn(groggy(() => route('A'), 1));
		const loadEnd = jest.fn();
		let set;

		const App = () => {
			const [test, setTest] = useState('1');
			set = setTest;
			return html`
				<${ErrorBoundary}>
					<${LocationProvider}>
						<${Router}
							onLoadEnd=${loadEnd}
						>
							<${A} path="/" />
						<//>
					<//>
				<//>
			`;
		}
		render(
			html`<${App} />`,
			scratch
		);

		await sleep(10);

		loadEnd.mockClear();

		set('2');
		await sleep(1);

		expect(loadEnd).not.toHaveBeenCalled();
	});

	describe('intercepted VS external links', () => {
		const shouldIntercept = [null, '', '_self', 'self', '_SELF'];
		const shouldNavigate = ['_top', '_parent', '_blank', 'custom', '_BLANK'];

		// prevent actual navigations (not implemented in JSDOM)
		const clickHandler = jest.fn(e => e.preventDefault());

		const Route = jest.fn(
			() => html`
				<div>
					${[...shouldIntercept, ...shouldNavigate].map((target, i) => {
						const url = '/' + i + '/' + target;
						if (target === null) return html`<a href=${url}>target = ${target + ''}</a>`;
						return html`<a href=${url} target=${target}>target = ${target}</a> `;
					})}
				</div>
			`
		);

		let pushState, loc;

		beforeAll(() => {
			pushState = jest.spyOn(history, 'pushState');
			addEventListener('click', clickHandler);
		});

		afterAll(() => {
			pushState.mockRestore();
			removeEventListener('click', clickHandler);
		});

		beforeEach(async () => {
			render(
				html`
					<${LocationProvider}>
						<${Router}>
							<${Route} default />
						<//>
						<${() => {
							loc = useLocation();
						}} />
					<//>
				`,
				scratch
			);
			await sleep(10);
			Route.mockClear();
			clickHandler.mockClear();
			pushState.mockClear();
		});

		const getName = target => (target == null ? 'no target attribute' : `target="${target}"`);

		// these should all be intercepted by the router.
		for (const target of shouldIntercept) {
			it(`should intercept clicks on links with ${getName(target)}`, async () => {
				await sleep(10);

				const sel = target == null ? `a:not([target])` : `a[target="${target}"]`;
				const el = scratch.querySelector(sel);
				if (!el) throw Error(`Unable to find link: ${sel}`);
				const url = el.getAttribute('href');
				el.click();
				await sleep(1);
				expect(loc).toMatchObject({ url });
				expect(Route).toHaveBeenCalledTimes(1);
				expect(pushState).toHaveBeenCalledWith(null, '', url);
				expect(clickHandler).toHaveBeenCalled();
			});
		}

		// these should all navigate.
		for (const target of shouldNavigate) {
			it(`should allow default browser navigation for links with ${getName(target)}`, async () => {
				await sleep(10);

				const sel = target == null ? `a:not([target])` : `a[target="${target}"]`;
				const el = scratch.querySelector(sel);
				if (!el) throw Error(`Unable to find link: ${sel}`);
				el.click();
				await sleep(1);
				expect(Route).not.toHaveBeenCalled();
				expect(pushState).not.toHaveBeenCalled();
				expect(clickHandler).toHaveBeenCalled();
			});
		}
	});

	it('should scroll to top when navigating forward', async () => {
		const scrollTo = jest.spyOn(window, 'scrollTo');

		const Route = jest.fn(() => html`<div style=${{ height: '1000px' }}><a href="/link">link</a></div>`);
		let loc;
		render(
			html`
				<${LocationProvider}>
					<${Router}>
						<${Route} default />
					<//>
					<${() => {
						loc = useLocation();
					}} />
				<//>
			`,
			scratch
		);

		await sleep(20);

		expect(scrollTo).not.toHaveBeenCalled();
		expect(Route).toHaveBeenCalledTimes(1);
		Route.mockClear();

		loc.route('/programmatic');
		await sleep(10);
		expect(loc).toMatchObject({ url: '/programmatic' });
		expect(scrollTo).toHaveBeenCalledWith(0, 0);
		expect(scrollTo).toHaveBeenCalledTimes(1);
		expect(Route).toHaveBeenCalledTimes(1);
		Route.mockClear();
		scrollTo.mockClear();

		scratch.querySelector('a').click();
		await sleep(10);
		expect(loc).toMatchObject({ url: '/link' });
		expect(scrollTo).toHaveBeenCalledWith(0, 0);
		expect(scrollTo).toHaveBeenCalledTimes(1);
		expect(Route).toHaveBeenCalledTimes(1);
		Route.mockClear();

		await sleep(10);
		scrollTo.mockRestore();
	});

	it('should ignore clicks on anchor links', async () => {
		let loc;
		const pushState = jest.spyOn(history, 'pushState');

		const Route = jest.fn(
			() => html`
				<div>
					<a href="#foo">just #foo</a>
					<a href="/other#bar">other #bar</a>
				</div>
			`
		);
		render(
			html`
				<${LocationProvider}>
					<${Router}>
						<${Route} path="/" />
						<${Route} path="/other" />
						<${Route} default />
					<//>
					<${() => {
						loc = useLocation();
					}} />
				<//>
			`,
			scratch
		);

		expect(Route).toHaveBeenCalledTimes(1);
		Route.mockClear();
		await sleep(20);

		scratch.querySelector('a[href="#foo"]').click();
		await sleep(20);
		// NOTE: we don't (currently) propagate in-page anchor navigations into context, to avoid useless renders.
		expect(loc).toMatchObject({ url: '/' });
		expect(Route).not.toHaveBeenCalled();
		expect(pushState).not.toHaveBeenCalled();
		expect(location.hash).toEqual('#foo');

		await sleep(10);

		scratch.querySelector('a[href="/other#bar"]').click();
		await sleep(10);
		expect(Route).toHaveBeenCalledTimes(1);
		expect(loc).toMatchObject({ url: '/other#bar', path: '/other' });
		expect(pushState).toHaveBeenCalled();
		expect(location.hash).toEqual('#bar');

		pushState.mockRestore();
	});

	it('should normalize children', async () => {
		let loc;
		const pushState = jest.spyOn(history, 'pushState');
		const Route = jest.fn(() => html`<a href="/foo#foo">foo</a>`);

		const routes = ['/foo', '/bar'];
		render(
			html`
				<${LocationProvider}>
					<${Router}>
						${routes.map(route => html`<${Route} path=${route} />`)}
						<${Route} default />
					<//>
					<${() => {
						loc = useLocation();
					}} />
				<//>
			`,
			scratch
		);

		expect(Route).toHaveBeenCalledTimes(1);
		Route.mockClear();
		await sleep(20);

		scratch.querySelector('a[href="/foo#foo"]').click();
		await sleep(20);
		expect(Route).toHaveBeenCalledTimes(1);
		expect(loc).toMatchObject({ url: '/foo#foo', path: '/foo' });
		expect(pushState).toHaveBeenCalled();

		pushState.mockRestore();
	});

	it('should match nested routes', async () => {
		let route;
		const Inner = () => html`
			<${Router}>
				<${Route}
					path="/bob"
					component=${() => {
						route = useRoute();
						return null;
					}}
				/>
			<//>
		`;

		render(
			html`
				<${LocationProvider}>
					<${Router}>
						<${Route} path="/foo/:id/*" component=${Inner} />
					<//>
					<a href="/foo/bar/bob"></a>
				<//>
			`,
			scratch
		);

		scratch.querySelector('a[href="/foo/bar/bob"]').click();
		await sleep(20);
		expect(route).toMatchObject({ path: '/bob', params: { id: 'bar' } });
	});

	it('should append params in nested routes', async () => {
		let params;
		const Inner = () => html`
			<${Router}>
				<${Route}
					path="/bob"
					component=${() => {
						params = useRoute().params;
						return null;
					}}
				/>
			<//>
		`;

		render(
			html`
				<${LocationProvider}>
					<${Router}>
						<${Route} path="/foo/:id/*" component=${Inner} />
					<//>
					<a href="/foo/bar/bob"></a>
				<//>
			`,
			scratch
		);

		scratch.querySelector('a[href="/foo/bar/bob"]').click();
		await sleep(20);
		expect(params).toMatchObject({ id: 'bar' });
	});

	it('should replace the current URL', async () => {
		const pushState = jest.spyOn(history, 'pushState');
		const replaceState = jest.spyOn(history, 'replaceState');
		let loc;

		render(
			html`
				<${LocationProvider}>
					<${Router}>
						<${Route} path="/foo" component=${() => null} />
					<//>
					<${() => {
						loc = useLocation();
					}} />
				<//>
			`,
			scratch
		);

		await sleep(20);
		loc.route("/foo", true);
		expect(pushState).not.toHaveBeenCalled();
		expect(replaceState).toHaveBeenCalledWith(null, "", "/foo");

		pushState.mockRestore();
		replaceState.mockRestore();
	});
});

describe('hydration', () => {
	let scratch;
	beforeEach(() => {
		if (scratch) {
			render(null, scratch);
			scratch.remove();
		}
		scratch = document.createElement('scratch');
		document.body.appendChild(scratch);
		history.replaceState(null, null, '/');
	});

	it('should wait for asynchronous routes', async () => {
		scratch.innerHTML = '<div><h1>A</h1><p>hello</p></div>';
		const route = name => html`
			<div>
				<h1>${name}</h1>
				<p>hello</p>
			</div>
		`;
		const A = jest.fn(groggy(() => route('A'), 1));
		let loc;
		hydrate(
			html`
				<${ErrorBoundary}>
					<${LocationProvider}>
						<${Router}>
							<${A} path="/" />
						<//>
						<${() => {
							loc = useLocation();
						}} />
					<//>
				<//>
			`,
			scratch
		);

		const mutations = [];
		const mutationObserver = new MutationObserver((x) => {
			mutations.push(...x)
		});
		mutationObserver.observe(scratch, { childList: true, subtree: true });

		expect(scratch).toHaveProperty('innerHTML', '<div><h1>A</h1><p>hello</p></div>');
		expect(A).toHaveBeenCalledWith({ path: '/', query: {}, params: {}, rest: '' }, expect.anything());
		const oldOptionsVnode = options.__b;
		let hasMatched = false;
		options.__b = (vnode) => {
			if (vnode.type === A && !hasMatched) {
				hasMatched = true;
				if (vnode.__ && vnode.__.__h) {
					expect(vnode.__.__h).toBe(true)
				} else if (vnode.__ && vnode.__.__u) {
					expect(!!(vnode.__.__u & MODE_SUSPENDED)).toBe(true);
					expect(!!(vnode.__.__u & MODE_HYDRATE)).toBe(true);
				} else {
					expect(true).toBe(false);
				}
			}

			if (oldOptionsVnode) {
				oldOptionsVnode(vnode);
			}
		}
		A.mockClear();
		await sleep(10);

		expect(scratch).toHaveProperty('innerHTML', '<div><h1>A</h1><p>hello</p></div>');
		expect(A).toHaveBeenCalledWith({ path: '/', query: {}, params: {}, rest: '' }, expect.anything());
		expect(mutations).toHaveLength(0);

		options.__b = oldOptionsVnode;
	});
})

const MODE_HYDRATE = 1 << 5;
const MODE_SUSPENDED = 1 << 7;
