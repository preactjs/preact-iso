# PHP Implementation

URL pattern matching utility for PHP servers.

## Setup

Code tested on PHP 8.3.x.

```sh
php --version  # Ensure PHP 7.0+ is available
# No third party dependencies needed. Just run the tests or use the function directly
```

## Running Tests

```sh
php test_preact_iso_url_pattern.php
```

## Usage

```php
<?php
require_once 'preact-iso-url-pattern.php';

$matches = preactIsoUrlPatternMatch("/users/test%40example.com/posts", "/users/:userId/posts");
if ($matches) {
    echo "User ID: " . $matches['params']->userId . "\n";  // Output: test@example.com
}
?>
```

## Function Signature

```php
function preactIsoUrlPatternMatch($url, $route, $matches = null): array|null
```

### Parameters

- `$url` (string): The URL path to match
- `$route` (string): The route pattern with parameters
- `$matches` (array, optional): Pre-existing matches array to extend

### Return Value

Returns an array on success, or `null` if no match:

```php
[
    'params' => (object)['userId' => '123'],
    'userId' => '123',
    'rest' => '/additional/path'  // Optional
]
```

**Note**: The `params` property is a PHP object (stdClass) to maintain consistency with JSON serialization, while the outer structure is an array.

## Route Patterns

| Pattern | Description | Example Result |
|---------|-------------|----------------|
| `/users/:id` | Named parameter | `['params' => (object)['id' => '123'], 'id' => '123']` |
| `/users/:id?` | Optional parameter | `['params' => (object)['id' => null], 'id' => null]` |
| `/files/:path+` | Required rest parameter | `['params' => (object)['path' => 'docs/readme.txt']]` |
| `/static/:path*` | Optional rest parameter | `['params' => (object)['path' => 'css/main.css']]` |
| `/static/*` | Anonymous wildcard | `['params' => (object)[], 'rest' => '/images/logo.png']` |
