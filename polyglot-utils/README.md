# Preact ISO URL Pattern Matching - Polyglot Utils

Multi-language implementations of URL pattern matching utilities for building bespoke server setups that need to preload JS/CSS resources or handle early 404 responses.

## Use Case

This utility is designed for server languages that **cannot do SSR/prerendering** but still want to provide better experiences. It enables servers to:

- **Add preload head tags** for JS,CSS before serving HTML
- **Return early 404 pages** for unmatched routes
- **Generate dynamic titles** based on route parameters

## How can I implement preloading of JS, CSS?

Typical implementation flow:

1. **Build-time Setup:**
   - Write your routes as an array in a JS file
   - Create a build script that exports route patterns and entry files to a `.json` file
   - Configure your frontend build tool to output a `manifest` file mapping entry files to final fingerprinted/hashed output JS/CSS files and dependencies

2. **Server-time Processing:**
   - Load the JSON route file when a request comes in
   - Match the requested URL against each route pattern until you find a match
   - Once matched, you have the source entry `.jsx` file
   - Load the build manifest file to find which JS chunk contains that code and its dependency files
   - Generate `<link rel="preload">` tags for each dependency (JS, CSS, images, icons)
   - Inject those head tags into the HTML before serving

3. **Result:**
   - Browsers start downloading critical resources immediately
   - Faster page loads without full SSR complexity
   - Early 404s for invalid routes

### Example - preloading of JS, CSS

Here's how you might integrate this into a server setup. Let's say you have a client side `routes.js` as follows:

```js
import { lazy } from 'preact-iso';

export const routes = [
  {
    "path": "/users/:userId/posts",
    "component": lazy(() => import("pages/UserPosts.jsx")),
    "title": "Posts by :userId"
  },
  {
    "path": "/products/:category/:id",
    "component": lazy(() => import("pages/Product.jsx")),
    "title": "Product :id"
  }
];
```

1. **Generate Routes JSON (routes.json)**

You can use the following standalone node.js script to create `routes.json` during build (you could convert it into a plugin for your frontend build tool):
```js
const routeDir = path.resolve(__dirname, 'client/src/routes');
let routesFile = fs.readFileSync(path.resolve(routeDir, 'routes.js'), 'utf-8');
routesFile = routesFile.replace(/lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*(.+)\s*\)\s*\)\s*(,?)/g, '$1$2');
const fileName = path.resolve(__dirname, 'routes-temp.js')
fs.writeFileSync(fileName, routesFile, 'utf-8');
const routes = (await import(fileName)).default;
fs.unlinkSync(fileName);
const routeInfo = routes.map((route) => ({
  path: route.path,
  title: typeof route.title === 'string' ? route.title : null,
  Component: path.relative(__dirname, path.resolve(routeDir, `${route.Component}.jsx`)),
  default: route.default,
}));
// console.log(routeInfo);
fs.writeFileSync(
  path.resolve(__dirname, 'dist/routes.json'),
  JSON.stringify(routeInfo, null, 2),
  'utf-8'
);
```

The script produces the following `routes.json` file:
```json
[
  {
    "path": "/users/:userId/posts",
    "component": "pages/UserPosts.jsx",
    "title": "Posts by :userId"
  },
  {
    "path": "/products/:category/:id",
    "component": "pages/Product.jsx",
    "title": "Product :id"
  }
]
```

2. **Build Manifest (manifest.json)**

This is the file your client build tool generates. Check your build tool's documentation for exact format. Below is an example with few important fields from a Vite manifest file:
```json
{
  "pages/UserPosts.jsx": {
    "file": "assets/UserPosts-abc123.js",
    "css": ["assets/UserPosts-def456.css"],
    "imports": ["chunks/shared-ghi789.js"]
  }
}
```

3. **Server Implementation**
```python
# Python example
import json

routes = json.load(open('../dist/routes.json'))
manifest = json.load(open('../dist/.vite/manifest.json'))

def handle_request(url_path):
    for route in routes:
        matches = preact_iso_url_pattern_match(url_path, route['path'])
        if matches:
            # Generate preload tags
            component = route['component']
            entry_info = manifest[component]

            preload_tags = []
            for js_file in [entry_info['file']] + entry_info.get('imports', []):
                preload_tags.append(f'<link rel="modulepreload" crossorigin href="{js_file}">')

            for css_file in entry_info.get('css', []):
                preload_tags.append(f'<link rel="stylesheet" crossorigin href="{css_file}">')

            # Generate dynamic title
            title = route['title']
            for param, value in matches['params'].items():
                title = title.replace(f':{param}', value)

            return {
                'preload_tags': preload_tags,
                'title': title,
                'params': matches['params']
            }

    # No match found - return early 404
    return None
```

This approach gives you the performance benefits of resource preloading without the complexity of full server-side rendering.

## Available Languages

Go, PHP, Python and Ruby.

Find the corresponding language's sub-directory. Each language has a README that contains usage examples and API reference.

## Running Tests

```bash
# Run all tests across all languages
./run_tests.sh

# Or run individual language tests
cd go && go test -v
cd python && python3 test_preact_iso_url_pattern.py
cd ruby && ruby test_preact_iso_url_pattern.rb
cd php && php test_preact_iso_url_pattern.php
```
