# Ruby Implementation

URL pattern matching utility for Ruby servers.

## Setup

Code tested on ruby 3.2.x.

```sh
ruby --version  # Ensure Ruby 2.0+ is available
# No third party dependencies needed. Just run the tests or use the function directly
```

## Running Tests

```sh
ruby test_preact_iso_url_pattern.rb
```

## Usage

```ruby
require_relative 'preact-iso-url-pattern'

matches = preact_iso_url_pattern_match("/users/test%40example.com/posts", "/users/:userId/posts")
if matches
  puts "User ID: #{matches['params']['userId']}"  # Output: test@example.com
end
```

## Function Signature

```ruby
def preact_iso_url_pattern_match(url, route, matches = nil) -> Hash | nil
```

### Parameters

- `url` (String): The URL path to match
- `route` (String): The route pattern with parameters
- `matches` (Hash, optional): Pre-existing matches hash to extend

### Return Value

Returns a Hash on success, or `nil` if no match:

```ruby
{
  'params' => { 'userId' => '123' },
  'userId' => '123',
  'rest' => '/additional/path'  # Optional
}
```

## Route Patterns

| Pattern | Description | Example Result |
|---------|-------------|----------------|
| `/users/:id` | Named parameter | `{'params' => {'id' => '123'}, 'id' => '123'}` |
| `/users/:id?` | Optional parameter | `{'params' => {'id' => nil}, 'id' => nil}` |
| `/files/:path+` | Required rest parameter | `{'params' => {'path' => 'docs/readme.txt'}}` |
| `/static/:path*` | Optional rest parameter | `{'params' => {'path' => 'css/main.css'}}` |
| `/static/*` | Anonymous wildcard | `{'params' => {}, 'rest' => '/images/logo.png'}` |
