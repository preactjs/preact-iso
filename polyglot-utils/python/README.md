# Python Implementation

URL pattern matching utility for Python servers.

## Setup

Code tested on Python 3.12.x.

No external dependencies required - uses only Python standard library.

```sh
python3 --version  # Ensure Python 3.6+ is available
# No third party dependencies needed. Just run the tests or use the function directly
```

## Running Tests

```sh
python3 test_preact_iso_url_pattern.py
```

## Usage

```python
from preact_iso_url_pattern import preact_iso_url_pattern_match

matches = preact_iso_url_pattern_match("/users/test%40example.com/posts", "/users/:userId/posts")
if matches:
    print(f"User ID: {matches['params']['userId']}")  # Output: test@example.com
```

## Function Signature

```python
def preact_iso_url_pattern_match(url, route, matches=None) -> dict | None
```

### Parameters

- `url` (str): The URL path to match
- `route` (str): The route pattern with parameters
- `matches` (dict, optional): Pre-existing matches dictionary to extend

### Return Value

Returns a dictionary on success, or `None` if no match:

```python
{
    "params": {"userId": "123"},
    "userId": "123",
    "rest": "/additional/path"  # Optional
}
```

## Route Patterns

| Pattern | Description | Example Result |
|---------|-------------|----------------|
| `/users/:id` | Named parameter | `{"params": {"id": "123"}, "id": "123"}` |
| `/users/:id?` | Optional parameter | `{"params": {"id": None}, "id": None}` |
| `/files/:path+` | Required rest parameter | `{"params": {"path": "docs/readme.txt"}}` |
| `/static/:path*` | Optional rest parameter | `{"params": {"path": "css/main.css"}}` |
| `/static/*` | Anonymous wildcard | `{"params": {}, "rest": "/images/logo.png"}` |
