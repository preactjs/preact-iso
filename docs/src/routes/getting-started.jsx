import CodeBlock from '../components/code-block.jsx';

export default function GettingStarted() {
  const install = `npm install preact preact-iso`;
  const app = `import { LocationProvider, ErrorBoundary, Router, Route, hydrate } from 'preact-iso';
import Home from './routes/home.jsx';

export function App() {
  return (
    <LocationProvider>
      <ErrorBoundary>
        <Router>
          <Route path="/" component={Home} />
        </Router>
      </ErrorBoundary>
    </LocationProvider>
  );
}

hydrate(<App />);`;
  const prerender = `import { prerender } from 'preact-iso';

export async function prerenderApp() {
  return await prerender(<App />);
}`;
  return (
    <main>
      <h1>Getting Started</h1>
      <p>
        Install the packages and wire up the router. You'll need
        <code>preact</code> and <code>preact-iso</code>:
      </p>
      <CodeBlock code={install} />
      <p>
        Create your app and hydrate it on the client. The router will automatically
        delay hydration for any lazy components until they are loaded.
      </p>
      <CodeBlock code={app} />
      <p>
        To generate static HTML ahead of time, export a <code>prerender</code>
        function:
      </p>
      <CodeBlock code={prerender} />
      <p>
        That's all you need. Check out the <a href="/guides">guides</a> for deeper
        dives into routing, hydration and prerendering.
      </p>
    </main>
  );
}
