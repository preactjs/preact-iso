import CodeBlock from '../components/code-block.jsx';

export default function Guides() {
  const routing = `import { Router, Route } from 'preact-iso';

export function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/profile/:id" component={Profile} />
    </Router>
  );
}`;

  const lazyExample = `import { lazy } from 'preact-iso';
const Profile = lazy(() => import('./profile.jsx'));`;

  const hydrateExample = `import { hydrate } from 'preact-iso';
import { App } from './app.jsx';

hydrate(<App />);`;

  const prerenderExample = `import { prerender } from 'preact-iso';
import { App } from './app.jsx';

export async function prerenderApp() {
  return await prerender(<App />);
}`;

  const locationStub = `import { locationStub } from 'preact-iso/prerender';
locationStub('/users/123');`;

  return (
    <main>
      <h1>Guides</h1>

      <section>
        <h2>Routing &amp; Suspense</h2>
        <p>
          Routes render instantly if their component is synchronous. When a route
          is lazy-loaded, the current route remains in place until the new
          component finishes loading.
        </p>
        <CodeBlock code={routing} />
        <CodeBlock code={lazyExample} />
      </section>

      <section>
        <h2>Progressive Hydration</h2>
        <p>
          Hydrate server-rendered markup and only activate parts of the page once
          their dependencies have loaded.
        </p>
        <CodeBlock code={hydrateExample} />
      </section>

      <section>
        <h2>Prerendering</h2>
        <p>
          Generate static HTML for your application while waiting for async data
          and lazy components.
        </p>
        <CodeBlock code={prerenderExample} />
        <p>
          In serverless or non-browser environments, simulate the URL using
          <code>locationStub()</code>:
        </p>
        <CodeBlock code={locationStub} />
      </section>
    </main>
  );
}
