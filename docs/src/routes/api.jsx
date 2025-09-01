import CodeBlock from '../components/code-block.jsx';

export default function Api() {
  return (
    <main>
      <h1>API</h1>
      <section>
        <h2>&lt;LocationProvider&gt;</h2>
        <p>
          Sets up a routing context using the current browser URL. Wrap your app
          in this component so routing utilities can access the current location.
        </p>
        <CodeBlock code={`<LocationProvider>\n  ...\n</LocationProvider>`} />
      </section>
      <section>
        <h2>&lt;Router&gt; &amp; &lt;Route&gt;</h2>
        <p>
          Declare client-side routes that can suspend while loading. Lazy routes
          keep the previous page visible until their module finishes loading.
        </p>
        <CodeBlock code={`<Router>\n  <Route path="/" component={Home} />\n  <Route path="/about" component={About} />\n</Router>`} />
      </section>
      <section>
        <h2>lazy()</h2>
        <p>
          Lazy-load a component, enabling progressive hydration and code splitting.
          The returned component suspends until the import resolves.
        </p>
        <CodeBlock code={`const Profiles = lazy(() => import('./profiles.jsx'));`} />
      </section>
      <section>
        <h2>&lt;ErrorBoundary&gt;</h2>
        <p>
          Wrap routes to catch errors thrown by lazy components or suspended data
          fetches. You can render a fallback UI by providing a <code>fallback</code>
          prop.
        </p>
        <CodeBlock code={`<ErrorBoundary fallback={<p>Something broke</p>}><App /></ErrorBoundary>`} />
      </section>
      <section>
        <h2>hydrate()</h2>
        <p>
          Hydrate server-rendered HTML on the client. Components that suspend will
          delay their own hydration until ready.
        </p>
        <CodeBlock code={`import { hydrate } from 'preact-iso';\nhydrate(<App />);`} />
      </section>
      <section>
        <h2>prerender()</h2>
        <p>
          Render your app to static HTML, awaiting async data. Useful for generating
          static pages in build steps or serverless environments.
        </p>
        <CodeBlock code={`import { prerender } from 'preact-iso';\nexport async function prerenderApp() {\n  return await prerender(<App />);\n}`} />
      </section>
      <section>
        <h2>locationStub()</h2>
        <p>
          Simulate the browser location in non-DOM environments. This is handy for
          testing or prerendering when <code>window.location</code> is unavailable.
        </p>
        <CodeBlock code={`import { locationStub } from 'preact-iso/prerender';\nlocationStub('/foo');`} />
      </section>
    </main>
  );
}
