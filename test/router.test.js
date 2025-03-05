import { h, Fragment, render, Component, hydrate, options } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import * as chai from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { LocationProvider, Router, useLocation, Route } from '../src/router.js';
import { lazy, ErrorBoundary } from '../src/lazy.js';

import './setup.js';

const expect = chai.expect;
chai.use(sinonChai);

/**
 * Usage:
 * - `await sleep(1)` for nav + loc/pushState/sync component check
 * - `await sleep(10)` for nav + async component check
 */
const sleep = ms => new Promise(r => setTimeout(r, ms));

// delayed lazy()
const groggy = (component, ms) => lazy(() => sleep(ms).then(() => component));

describe('Router', () => {
	let scratch, loc;

	const ShallowLocation = () => {
		loc = useLocation();
		return null;
	}

	beforeEach(() => {
		if (scratch) {
			render(null, scratch);
			scratch.remove();
		}
		loc = undefined;
		scratch = document.createElement('scratch');
		document.body.appendChild(scratch);
		history.replaceState(null, null, '/');
	});


	it('should throw a clear error if the LocationProvider is missing', () => {
		const Home = () => <h1>Home</h1>;

		try {
			render(
				<Router>
					<Home path="/" test="2" />
				</Router>,
				scratch
			);
			expect.fail('should have thrown');
		} catch (e) {
			expect(e.message).to.include('must be used within a <LocationProvider>');
		}
	});

	it('should strip trailing slashes from path', async () => {
		render(
			<LocationProvider>
				<ShallowLocation />
			</LocationProvider>,
			scratch
		);

		navigation.navigate('/a/');

		await sleep(1);

		expect(loc).to.deep.include({
			url: '/a/',
			path: '/a',
			searchParams: {},
		});
	});

	it('should support class components using LocationProvider.ctx', () => {
		class Foo extends Component {
			static contextType = LocationProvider.ctx;

			render() {
				loc = this.context;
				return <h1>{loc.url}</h1>;
			}
		}

		render(
			<LocationProvider>
				<Foo />
			</LocationProvider>,
			scratch
		);

		expect(scratch).to.have.property('innerHTML', '<h1>/</h1>');
		expect(loc).to.deep.include({
			url: '/',
			path: '/',
			searchParams: {},
		});
	});

	it('should allow passing props to a route', async () => {
		const Home = sinon.fake(() => <h1>Home</h1>);

		render(
			<LocationProvider>
				<Router>
					<Home path="/" test="2" />
				</Router>
				<ShallowLocation />
			</LocationProvider>,
			scratch
		);

		expect(scratch).to.have.property('textContent', 'Home');
		expect(Home).to.have.been.calledWith({ path: '/', searchParams: {}, pathParams: {}, test: '2' });
		expect(loc).to.deep.include({
			url: '/',
			path: '/',
			searchParams: {},
		});
	});

	it('should allow updating props in a route', async () => {
		const Home = sinon.fake(() => <h1>Home</h1>);

		/** @type {(string) => void} */
		let set;

		const App = () => {
			const [test, setTest] = useState('2');
			set = setTest;
			return (
				<LocationProvider>
					<Router>
						<Home path="/" test={test} />
					</Router>
					<ShallowLocation />
				</LocationProvider>
			);
		}
		render(<App />, scratch);

		expect(scratch).to.have.property('textContent', 'Home');
		expect(Home).to.have.been.calledWith({ path: '/', searchParams: {}, pathParams: {}, test: '2' });
		expect(loc).to.deep.include({
			url: '/',
			path: '/',
			searchParams: {},
		});

		set('3')
		await sleep(1);

		expect(Home).to.have.been.calledWith({ path: '/', searchParams: {}, pathParams: {}, test: '3' });
		expect(loc).to.deep.include({
			url: '/',
			path: '/',
			searchParams: {},
		});
		expect(scratch).to.have.property('textContent', 'Home');
	});

	it('should switch between synchronous routes', async () => {
		const Home = sinon.fake(() => <h1>Home</h1>);
		const Profiles = sinon.fake(() => <h1>Profiles</h1>);
		const Profile = sinon.fake(({ pathParams }) => <h1>Profile: {pathParams.id}</h1>);
		const Fallback = sinon.fake(() => <h1>Fallback</h1>);
		const stack = [];

		render(
			<LocationProvider>
				<Router onRouteChange={url => stack.push(url)}>
					<Home path="/" />
					<Profiles path="/profiles" />
					<Profile path="/profiles/:id" />
					<Fallback default />
				</Router>
				<ShallowLocation />
			</LocationProvider>,
			scratch
		);

		expect(scratch).to.have.property('textContent', 'Home');
		expect(Home).to.have.been.calledWith({ path: '/', searchParams: {}, pathParams: {} });
		expect(Profiles).not.to.have.been.called;
		expect(Profile).not.to.have.been.called;
		expect(Fallback).not.to.have.been.called;
		expect(loc).to.deep.include({
			url: '/',
			path: '/',
			searchParams: {},
		});

		Home.resetHistory();
		navigation.navigate('/profiles');
		await sleep(1);

		expect(scratch).to.have.property('textContent', 'Profiles');
		expect(Home).not.to.have.been.called;
		expect(Profiles).to.have.been.calledWith({ path: '/profiles', searchParams: {}, pathParams: {} });
		expect(Profile).not.to.have.been.called;
		expect(Fallback).not.to.have.been.called;

		expect(loc).to.deep.include({
			url: '/profiles',
			path: '/profiles',
			searchParams: {}
		});

		Profiles.resetHistory();
		navigation.navigate('/profiles/bob');
		await sleep(1);

		expect(scratch).to.have.property('textContent', 'Profile: bob');
		expect(Home).not.to.have.been.called;
		expect(Profiles).not.to.have.been.called;
		expect(Profile).to.have.been.calledWith(
			{ path: '/profiles/bob', searchParams: {}, pathParams: { id: 'bob' }, id: 'bob' },
		);
		expect(Fallback).not.to.have.been.called;

		expect(loc).to.deep.include({
			url: '/profiles/bob',
			path: '/profiles/bob',
			searchParams: {}
		});

		Profile.resetHistory();
		navigation.navigate('/other?a=b&c=d');
		await sleep(1);

		expect(scratch).to.have.property('textContent', 'Fallback');
		expect(Home).not.to.have.been.called;
		expect(Profiles).not.to.have.been.called;
		expect(Profile).not.to.have.been.called;
		expect(Fallback).to.have.been.calledWith(
			{ default: true, path: '/other', searchParams: { a: 'b', c: 'd' }, pathParams: {} },
		);

		expect(loc).to.deep.include({
			url: '/other?a=b&c=d',
			path: '/other',
			searchParams: { a: 'b', c: 'd' }
		});
		expect(stack).to.eql(['/profiles', '/profiles/bob', '/other?a=b&c=d']);
	});

	it('should wait for asynchronous routes', async () => {
		const route = name => (
			<>
				<h1>{name}</h1>
				<p>hello</p>
			</>
		);
		const A = sinon.fake(groggy(() => route('A'), 1));
		const B = sinon.fake(groggy(() => route('B'), 1));
		const C = sinon.fake(groggy(() => <h1>C</h1>, 1));

		render(
			<ErrorBoundary>
				<LocationProvider>
					<Router>
						<A path="/" />
						<B path="/b" />
						<C path="/c" />
					</Router>
					<ShallowLocation />
				</LocationProvider>
			</ErrorBoundary>,
			scratch
		);

		expect(scratch).to.have.property('innerHTML', '');
		expect(A).to.have.been.calledWith({ path: '/', searchParams: {}, pathParams: {} });

		A.resetHistory();
		await sleep(10);

		expect(scratch).to.have.property('innerHTML', '<h1>A</h1><p>hello</p>');
		expect(A).to.have.been.calledWith({ path: '/', searchParams: {}, pathParams: {} });

		A.resetHistory();
		navigation.navigate('/b');

		expect(scratch).to.have.property('innerHTML', '<h1>A</h1><p>hello</p>');
		expect(A).not.to.have.been.called;

		await sleep(1);

		expect(scratch).to.have.property('innerHTML', '<h1>A</h1><p>hello</p>');
		// We should never re-invoke <A /> while loading <B /> (that would be a remount of the old route):
		expect(A).not.to.have.been.called;
		expect(B).to.have.been.calledWith({ path: '/b', searchParams: {}, pathParams: {} });

		B.resetHistory();
		await sleep(10);

		expect(scratch).to.have.property('innerHTML', '<h1>B</h1><p>hello</p>');
		expect(B).to.have.been.calledOnce;
		expect(B).to.have.been.calledWith({ path: '/b', searchParams: {}, pathParams: {} });

		B.resetHistory();
		navigation.navigate('/c');
		navigation.navigate('/c?1');
		navigation.navigate('/c');

		expect(scratch).to.have.property('innerHTML', '<h1>B</h1><p>hello</p>');
		expect(B).not.to.have.been.called;

		await sleep(1);

		navigation.navigate('/c');
		navigation.navigate('/c?2');
		navigation.navigate('/c');

		expect(scratch).to.have.property('innerHTML', '<h1>B</h1><p>hello</p>');
		// We should never re-invoke <B /> while loading <C /> (that would be a remount of the old route):
		expect(B).not.to.have.been.called;
		expect(C).to.have.been.calledWith({ path: '/c', searchParams: {}, pathParams: {} });

		C.resetHistory();
		await sleep(10);

		expect(scratch).to.have.property('innerHTML', '<h1>C</h1>');
		expect(C).to.have.been.calledOnce;
		expect(C).to.have.been.calledWith({ path: '/c', searchParams: {}, pathParams: {} });

		// "instant" routing to already-loaded routes

		C.resetHistory();
		B.resetHistory();
		navigation.navigate('/b');
		await sleep(1);

		expect(scratch).to.have.property('innerHTML', '<h1>B</h1><p>hello</p>');
		expect(C).not.to.have.been.called;
		expect(B).to.have.been.calledOnce;
		expect(B).to.have.been.calledWith({ path: '/b', searchParams: {}, pathParams: {} });

		A.resetHistory();
		B.resetHistory();
		navigation.navigate('/');
		await sleep(1);

		expect(scratch).to.have.property('innerHTML', '<h1>A</h1><p>hello</p>');
		expect(B).not.to.have.been.called;
		expect(A).to.have.been.calledOnce;
		expect(A).to.have.been.calledWith({ path: '/', searchParams: {}, pathParams: {} });
	});

	it('rerenders same-component routes rather than swap', async () => {
		const A = sinon.fake(() => <h1>a</h1>);
		const B = sinon.fake(groggy(({ sub }) => <h1>b/{sub}</h1>, 1));

		// Counts the wrappers around route components to determine what the Router is returning
		// Count will be 2 for switching route components, and 2 more if the new route is lazily loaded
		// A same-route navigation adds 1
		let renderRefCount = 0;

		const old = options.vnode;
		options.vnode = (vnode) => {
			if (typeof vnode.type === 'function' && vnode.props.r !== undefined) {
				renderRefCount += 1;
			}

			if (old) old(vnode);
		}

		render(
			<ErrorBoundary>
				<LocationProvider>
					<Router>
						<A path="/" />
						<B path="/b/:sub" />
					</Router>
					<ShallowLocation />
				</LocationProvider>
			</ErrorBoundary>,
			scratch
		);

		expect(scratch).to.have.property('innerHTML', '<h1>a</h1>');
		expect(renderRefCount).to.equal(2);

		renderRefCount = 0;
		navigation.navigate('/b/a');
		await sleep(10);

		expect(scratch).to.have.property('innerHTML', '<h1>b/a</h1>');
		expect(renderRefCount).to.equal(4);

		renderRefCount = 0;
		navigation.navigate('/b/b');
		await sleep(10);

		expect(scratch).to.have.property('innerHTML', '<h1>b/b</h1>');
		expect(renderRefCount).to.equal(1);

		renderRefCount = 0;
		navigation.navigate('/');
		await sleep(10);

		expect(scratch).to.have.property('innerHTML', '<h1>a</h1>');
		expect(renderRefCount).to.equal(2);

		options.vnode = old;
	});

	it('should support onLoadStart/onLoadEnd/onRouteChange w/out navigation', async () => {
		const route = name => (
			<>
				<h1>{name}</h1>
				<p>hello</p>
			</>
		);
		const A = sinon.fake(groggy(() => route('A'), 1));
		const loadStart = sinon.fake();
		const loadEnd = sinon.fake();
		const routeChange = sinon.fake();

		render(
			<ErrorBoundary>
				<LocationProvider>
					<Router
						onLoadStart={loadStart}
						onLoadEnd={loadEnd}
						onRouteChange={routeChange}
					>
						<A path="/" />
					</Router>
				</LocationProvider>
			</ErrorBoundary>,
			scratch
		);

		expect(scratch).to.have.property('innerHTML', '');
		expect(A).to.have.been.calledWith({ path: '/', searchParams: {}, pathParams: {} });
		expect(loadStart).to.have.been.calledWith('/');
		expect(loadEnd).not.to.have.been.called;
		expect(routeChange).not.to.have.been.called;

		A.resetHistory();
		loadStart.resetHistory();
		loadEnd.resetHistory();
		routeChange.resetHistory();
		await sleep(1);

		expect(scratch).to.have.property('innerHTML', '<h1>A</h1><p>hello</p>');
		expect(A).to.have.been.calledWith({ path: '/', searchParams: {}, pathParams: {} });
		expect(loadStart).not.to.have.been.called;
		expect(loadEnd).to.have.been.calledWith('/');
		expect(routeChange).not.to.have.been.called;
	});

	it('should support onLoadStart/onLoadEnd/onRouteChange w/ navigation', async () => {
		const route = name => (
			<>
				<h1>{name}</h1>
				<p>hello</p>
			</>
		);
		const A = sinon.fake(() => route('A'));
		const B = sinon.fake(groggy(() => route('B'), 1));
		const loadStart = sinon.fake();
		const loadEnd = sinon.fake();
		const routeChange = sinon.fake();

		render(
			<ErrorBoundary>
				<LocationProvider>
					<Router
						onLoadStart={loadStart}
						onLoadEnd={loadEnd}
						onRouteChange={routeChange}
					>
						<A path="/" />
						<B path="/b" />
					</Router>
					<ShallowLocation />
				</LocationProvider>
			</ErrorBoundary>,
			scratch
		);

		A.resetHistory();
		loadStart.resetHistory();
		loadEnd.resetHistory();
		routeChange.resetHistory();

		navigation.navigate('/b');

		await sleep(1);

		expect(loadStart).to.have.been.calledWith('/b');
		expect(loadEnd).not.to.have.been.called;
		expect(routeChange).not.to.have.been.called;

		A.resetHistory();
		loadStart.resetHistory();
		loadEnd.resetHistory();
		routeChange.resetHistory();
		await sleep(10);

		expect(scratch).to.have.property('innerHTML', '<h1>B</h1><p>hello</p>');
		expect(loadStart).not.to.have.been.called;
		expect(loadEnd).to.have.been.calledWith('/b');
		expect(routeChange).to.have.been.calledWith('/b');
	});

	it('should only call onLoadEnd once upon promise flush', async () => {
		const route = name => (
			<>
				<h1>{name}</h1>
				<p>hello</p>
			</>
		);
		const A = sinon.fake(groggy(() => route('A'), 1));
		const loadEnd = sinon.fake();

		/** @type {(string) => void} */
		let set;

		const App = () => {
			set = useState('1')[1];
			return (
				<ErrorBoundary>
					<LocationProvider>
						<Router onLoadEnd={loadEnd}>
							<A path="/" />
						</Router>
					</LocationProvider>
				</ErrorBoundary>
			);
		}
		render(<App />,	scratch);

		await sleep(10);

		expect(loadEnd).to.have.been.calledWith('/');
		loadEnd.resetHistory();

		set('2');
		await sleep(1);

		expect(loadEnd).not.to.have.been.called;
	});

	// TODO: Relies on upcoming property being added to navigation events
	describe.skip('intercepted VS external links', () => {
		const shouldIntercept = [null, '', '_self', 'self', '_SELF'];
		const shouldNavigate = ['_top', '_parent', '_blank', 'custom', '_BLANK'];

		const Route = () => (
			<div>
				{[...shouldIntercept, ...shouldNavigate].map((target, i) => {
					const url = '/' + i + '/' + target;
					if (target === null) return <a href={url}>target = {target + ''}</a>;
					return <a href={url} target={target}>target = {target}</a>;
				})}
			</div>
		);

		let triedToNavigate = false;
		const handler = (e) => {
			e.intercept();
			if (e['preact-iso-ignored']) {
				triedToNavigate = true;
			}
		}

		beforeEach(async () => {
			const App = () => {
				useEffect(() => {
					navigation.addEventListener('navigate', handler);
					return () => navigation.removeEventListener('navigate', handler);
				}, []);

				return (
					<LocationProvider>
						<Router>
							<Route default />
						</Router>
						<ShallowLocation />
					</LocationProvider>
				);
			}
			render(<App />, scratch);
			await sleep(10);
		});

		const getName = target => (target == null ? 'no target attribute' : `target="${target}"`);

		// these should all be intercepted by the router.
		for (const target of shouldIntercept) {
			it(`should intercept clicks on links with ${getName(target)}`, async () => {
				const sel = target == null ? `a:not([target])` : `a[target="${target}"]`;
				const el = scratch.querySelector(sel);
				if (!el) throw Error(`Unable to find link: ${sel}`);
				const url = el.getAttribute('href');
				el.click();
				await sleep(1);
				expect(loc).to.deep.include({ url });
				expect(triedToNavigate).to.be.false;

				triedToNavigate = false;
			});
		}

		// these should all navigate.
		for (const target of shouldNavigate) {
			it(`should allow default browser navigation for links with ${getName(target)}`, async () => {
				const sel = target == null ? `a:not([target])` : `a[target="${target}"]`;
				const el = scratch.querySelector(sel);
				if (!el) throw Error(`Unable to find link: ${sel}`);
				el.click();
				await sleep(1);
				expect(triedToNavigate).to.be.true;

				triedToNavigate = false;
			});
		}
	});

	describe('intercepted VS external links with `scope`', () => {
		const shouldIntercept = ['/app', '/app/deeper'];
		const shouldNavigate = ['/site', '/site/deeper'];

		const Links = () => (
			<>
				<a href="/app">Internal Link</a>
				<a href="/app/deeper">Internal Deeper Link</a>
				<a href="/site">External Link</a>
				<a href="/site/deeper">External Deeper Link</a>
			</>
		);

		let triedToNavigate = false;
		const handler = (e) => {
			e.intercept();
			if (e['preact-iso-ignored']) {
				triedToNavigate = true;
			}
		}

		it('should support the `scope` prop (string)', async () => {
			const App = () => {
				useEffect(() => {
					navigation.addEventListener('navigate', handler);
					return () => navigation.removeEventListener('navigate', handler);
				}, []);

				return (
					<LocationProvider scope="/app">
						<Links />
						<ShallowLocation />
					</LocationProvider>
				);
			}
			render(<App />, scratch);
			await sleep(10);

			for (const url of shouldIntercept) {
				scratch.querySelector(`a[href="${url}"]`).click();
				await sleep(1);
				expect(loc).to.deep.include({ url });
				expect(triedToNavigate).to.be.false;

				triedToNavigate = false;
			}

			for (const url of shouldNavigate) {
				scratch.querySelector(`a[href="${url}"]`).click();
				await sleep(1);
				expect(triedToNavigate).to.be.true;

				triedToNavigate = false;
			}
		});

		it('should support the `scope` prop (regex)', async () => {
			const App = () => {
				useEffect(() => {
					navigation.addEventListener('navigate', handler);
					return () => navigation.removeEventListener('navigate', handler);
				}, []);

				return (
					<LocationProvider scope={/^\/app/}>
						<Links />
						<ShallowLocation />
					</LocationProvider>
				);
			}
			render(<App />, scratch);
			await sleep(10);

			for (const url of shouldIntercept) {
				scratch.querySelector(`a[href="${url}"]`).click();
				await sleep(1);
				expect(loc).to.deep.include({ url });
				expect(triedToNavigate).to.be.false;

				triedToNavigate = false;
			}

			for (const url of shouldNavigate) {
				scratch.querySelector(`a[href="${url}"]`).click();
				await sleep(1);
				expect(triedToNavigate).to.be.true;

				triedToNavigate = false;
			}
		});
	});

	it('should scroll to top when navigating forward', async () => {
		const scrollTo = sinon.spy(window, 'scrollTo');

		const Route = sinon.fake(
			() => (
				<div style={{ height: '1000px' }}>
					<a href="/link">link</a>
				</div>
			)
		);

		render(
			<LocationProvider>
				<Router>
					<Route default />
				</Router>
				<ShallowLocation />
			</LocationProvider>,
			scratch
		);

		expect(scrollTo).not.to.have.been.called;
		expect(Route).to.have.been.calledOnce;
		Route.resetHistory();

		navigation.navigate('/programmatic');
		await sleep(1);

		expect(loc).to.deep.include({ url: '/programmatic' });
		expect(scrollTo).to.have.been.calledWith(0, 0);
		expect(scrollTo).to.have.been.calledOnce;
		expect(Route).to.have.been.calledOnce;
		Route.resetHistory();
		scrollTo.resetHistory();

		scratch.querySelector('a').click();
		await sleep(1);

		expect(loc).to.deep.include({ url: '/link' });
		expect(scrollTo).to.have.been.calledWith(0, 0);
		expect(scrollTo).to.have.been.calledOnce;
		expect(Route).to.have.been.calledOnce;
		Route.resetHistory();

		scrollTo.restore();
	});

	it('should ignore clicks on document fragment links', async () => {
		const Route = sinon.fake(
			() => <div>
				<a href="#foo">just #foo</a>
				<a href="/other#bar">other #bar</a>
			</div>
		);

		render(
			<LocationProvider>
				<Router>
					<Route path="/" />
					<Route path="/other" />
					<Route default />
				</Router>
				<ShallowLocation />
			</LocationProvider>,
			scratch
		);

		Route.resetHistory();

		scratch.querySelector('a[href="#foo"]').click();
		await sleep(1);

		// NOTE: we don't (currently) propagate in-page anchor navigations into context, to avoid useless renders.
		expect(loc).to.deep.include({ url: '/' });
		expect(Route).not.to.have.been.called;
		expect(location.hash).to.equal('#foo');

		scratch.querySelector('a[href="/other#bar"]').click();
		await sleep(1);

		expect(Route).to.have.been.calledOnce;
		expect(loc).to.deep.include({ url: '/other#bar', path: '/other' });
		expect(location.hash).to.equal('#bar');
	});

	it('should normalize children', async () => {
		const Route = sinon.fake(() => <a href="/foo#foo">foo</a>);

		const routes = ['/foo', '/bar'];
		render(
			<LocationProvider>
				<Router>
					{routes.map(route => <Route path={route} />)}
					<Route default />
				</Router>
				<ShallowLocation />
			</LocationProvider>,
			scratch
		);

		expect(Route).to.have.been.calledOnce;
		Route.resetHistory();

		scratch.querySelector('a[href="/foo#foo"]').click();
		await sleep(10);

		expect(Route).to.have.been.calledOnce;
		expect(loc).to.deep.include({ url: '/foo#foo', path: '/foo' });
	});

	it('should match nested routes', async () => {
		const Inner = () => (
			<Router>
				<Route
					path="/baz"
					component={() => <h1>Baz</h1>}
				/>
			</Router>
		);

		render(
			<LocationProvider>
				<Router>
					<Route path="/foo/:id/*" component={Inner} />
				</Router>
				<a href="/foo/bar/baz"></a>
				<ShallowLocation />
			</LocationProvider>,
			scratch
		);

		scratch.querySelector('a[href="/foo/bar/baz"]').click();
		await sleep(1);
		expect(loc).to.deep.include({ path: '/foo/bar/baz', pathParams: { id: 'bar' }, searchParams: {} });
		expect(scratch).to.have.property('textContent', 'Baz');
	});

	it('should append params in nested routes', async () => {
		const Inner = () => (
			<Router>
				<Route
					path="/bob"
					component={() => null}
				/>
			</Router>
		);

		render(
			<LocationProvider>
				<Router>
					<Route path="/foo/:id/*" component={Inner} />
				</Router>
				<a href="/foo/bar/bob"></a>
				<ShallowLocation />
			</LocationProvider>,
			scratch
		);

		scratch.querySelector('a[href="/foo/bar/bob"]').click();
		await sleep(1);
		expect(loc.pathParams).to.deep.include({ id: 'bar' });
	});

	it('should replace the current URL', async () => {
		render(
			<LocationProvider>
				<Router>
					<Route path="/" component={() => null} />
					<Route path="/foo" component={() => null} />
					<Route path="/bar" component={() => null} />
				</Router>
				<ShallowLocation />
			</LocationProvider>,
			scratch
		);

		navigation.navigate('/foo');
		navigation.navigate('/bar', { history: 'replace' });

		const entries = navigation.entries();

		// Top of the stack
		const last = new URL(entries[entries.length - 1].url);
		expect(last.pathname).to.equal('/bar');

		// Entry before
		const secondLast = new URL(entries[entries.length - 2].url);
		expect(secondLast.pathname).to.equal('/');
	});

	it('should support using `Router` as an implicit suspense boundary', async () => {
		let data;
		function useSuspense() {
			const [_, update] = useState();

			if (!data) {
				data = new Promise(r => setTimeout(r, 5, 'data'));
				data.then(
					(res) => update((data.res = res)),
					(err) => update((data.err = err))
				);
			}

			if (data.res) return data.res;
			if (data.err) throw data.err;
			throw data;
		}

		render(
			<LocationProvider>
				<Router>
					<Route
						path="/"
						component={() => {
							const result = useSuspense();
							return <h1>{result}</h1>;
						}}
					/>
				</Router>
				<ShallowLocation />
			</LocationProvider>,
			scratch
		);

		expect(scratch).to.have.property('textContent', '');
		await sleep(10);
		expect(scratch).to.have.property('textContent', 'data');
	});

	it('should support navigating backwards and forwards', async () => {
		render(
			<LocationProvider>
				<Router>
					<Route path="/" component={() => null} />
					<Route path="/foo" component={() => null} />
				</Router>
				<ShallowLocation />
			</LocationProvider>,
			scratch
		);

		navigation.navigate('/foo');
		await sleep(10);

		expect(loc).to.deep.include({ url: '/foo', path: '/foo', searchParams: {} });

		navigation.back();
		await sleep(10);

		expect(loc).to.deep.include({ url: '/', path: '/', searchParams: {} });

		navigation.forward();
		await sleep(10);

		expect(loc).to.deep.include({ url: '/foo', path: '/foo', searchParams: {} });
	});

	it('should intercept clicks on links inside open shadow DOM', async () => {
		const shadowlink = document.createElement('a');
		shadowlink.href = '/shadow';
		shadowlink.textContent = 'Shadow Link';
		shadowlink.addEventListener('click', e => e.preventDefault());

		const attachShadow = (el) => {
			if (!el || el.shadowRoot) return;
			const shadowroot = el.attachShadow({ mode: 'open' });
			shadowroot.appendChild(shadowlink);
		}

		const Home = sinon.fake(() => <div ref={attachShadow}></div>);
		const Shadow = sinon.fake(() => <div>Shadow Route</div>);

		render(
			<LocationProvider>
				<Router>
					<Route path="/" component={Home} />
					<Route path="/shadow" component={Shadow}/>
				</Router>
				<ShallowLocation />
			</LocationProvider>,
			scratch
		);

		shadowlink.click();

		await sleep(1);

		expect(loc).to.deep.include({ url: '/shadow' });
		expect(Shadow).to.have.been.calledOnce;
		expect(scratch).to.have.property('textContent', 'Shadow Route');
	});
});

const MODE_HYDRATE = 1 << 5;
const MODE_SUSPENDED = 1 << 7;

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
		const route = name => (
			<div>
				<h1>{name}</h1>
				<p>hello</p>
			</div>
		);
		const A = sinon.fake(groggy(() => route('A'), 1));

		hydrate(
			<ErrorBoundary>
				<LocationProvider>
					<Router>
						<A path="/" />
					</Router>
				</LocationProvider>
			</ErrorBoundary>,
			scratch
		);

		const mutations = [];
		const mutationObserver = new MutationObserver((x) => {
			mutations.push(...x)
		});
		mutationObserver.observe(scratch, { childList: true, subtree: true });

		expect(scratch).to.have.property('innerHTML', '<div><h1>A</h1><p>hello</p></div>');
		expect(A).to.have.been.calledWith({ path: '/', searchParams: {}, pathParams: {} });
		const oldOptionsVnode = options.__b;
		let hasMatched = false;
		options.__b = (vnode) => {
			if (vnode.type === A && !hasMatched) {
				hasMatched = true;
				if (vnode.__h) {
					expect(vnode.__h).to.equal(true)
				} else if (vnode.__u) {
					expect(!!(vnode.__u & MODE_SUSPENDED)).to.equal(true);
					expect(!!(vnode.__u & MODE_HYDRATE)).to.equal(true);
				} else {
					expect(true).to.equal(false);
				}
			}

			if (oldOptionsVnode) {
				oldOptionsVnode(vnode);
			}
		}
		A.resetHistory();
		await sleep(10);

		expect(scratch).to.have.property('innerHTML', '<div><h1>A</h1><p>hello</p></div>');
		expect(A).to.have.been.calledWith({ path: '/', searchParams: {}, pathParams: {} });
		expect(mutations).to.have.length(0);

		options.__b = oldOptionsVnode;
	});
})
