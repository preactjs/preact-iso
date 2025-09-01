import { useEffect, useRef } from 'preact/hooks';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';

export default function CodeBlock({ code, language = 'js' }) {
  const ref = useRef();
  useEffect(() => {
    Prism.highlightElement(ref.current);
  }, []);
  return (
    <pre>
      <code ref={ref} class={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
}
