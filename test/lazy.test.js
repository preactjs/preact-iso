import { h, render } from 'preact';
import * as chai from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { LocationProvider, Router } from '../src/router.js';
import lazy from '../src/lazy.js';

const expect = chai.expect;
chai.use(sinonChai);

describe('lazy', () => {
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


	it('should support preloading lazy imports', async () => {
		const A = () => <h1>A</h1>;
		const loadB = sinon.fake(() => Promise.resolve(() => <h1>B</h1>));
		const B = lazy(loadB);

		render(
			<LocationProvider>
				<Router>
					<A path="/" />
					<B path="/b" />
				</Router>
			</LocationProvider>,
			scratch
		);

		expect(loadB).not.to.have.been.called;
		await B.preload();
		expect(loadB).to.have.been.calledOnce;
	});
});
