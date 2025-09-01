import CodeBlock from '../components/code-block.jsx';

export default function Home() {
  const example = `import { Router, Route } from 'preact-iso';

export function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
    </Router>
  );
}`;
  return (
    <main>
      <h1>preact-iso</h1>
      <p>
        Isomorphic utilities for building async-capable Preact apps with
        progressive hydration, smart routing and effortless prerendering.
      </p>
      <ul>
        <li>Lazy-load UI with <code>lazy()</code> and safeguard with <code>&lt;ErrorBoundary&gt;</code></li>
        <li>Prerender to static HTML via <code>prerender()</code> for blazing initial loads</li>
        <li>Async-aware routing using <code>&lt;Router&gt;</code> and file-system friendly URLs</li>
      </ul>
      <p>Here's a tiny app using the built-in router:</p>
      <CodeBlock code={example} />
      <p>
        Jump into the <a href="/getting-started">Getting Started</a> guide to wire
        things up, or browse the <a href="/api">API</a> for every detail.
      </p>
    </main>
  );
}
