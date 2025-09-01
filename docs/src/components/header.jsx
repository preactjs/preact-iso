import { useLocation } from 'preact-iso';

export default function Header() {
  const { path } = useLocation();
  const link = (href, label) => (
    <a href={href} class={path === href ? 'active' : ''}>
      {label}
    </a>
  );

  return (
    <header>
      <nav>
        <a href="/" class="brand">preact-iso</a>
        {link('/getting-started', 'Getting Started')}
        {link('/guides', 'Guides')}
        {link('/api', 'API')}
      </nav>
    </header>
  );
}
