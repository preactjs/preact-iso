import { LocationProvider, Router, Route, lazy, ErrorBoundary } from 'preact-iso';
import Header from './components/header.jsx';

const Home = lazy(() => import('./routes/home.jsx'));
const GettingStarted = lazy(() => import('./routes/getting-started.jsx'));
const Api = lazy(() => import('./routes/api.jsx'));
const Guides = lazy(() => import('./routes/guides.jsx'));
const NotFound = lazy(() => import('./routes/404.jsx'));

export function App() {
  return (
    <LocationProvider>
      <ErrorBoundary>
        <Header />
        <Router>
          <Home path="/" />
          <GettingStarted path="/getting-started" />
          <Guides path="/guides" />
          <Api path="/api" />
          <NotFound default />
        </Router>
      </ErrorBoundary>
    </LocationProvider>
  );
}
