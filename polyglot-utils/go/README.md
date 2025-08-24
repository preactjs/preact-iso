# Go Implementation

URL pattern matching utility for Go servers.

## Setup

Code tested on Go 1.24.x.

```sh
# If using in a project, initialize go module
go mod init myproject
# No third party dependencies needed. Just run the tests or use the function directly
```

## Running Tests

```sh
go test -v
```

## Usage

```go
package main

import "fmt"

func main() {
    matches := preactIsoUrlPatternMatch("/users/test%40example.com/posts", "/users/:userId/posts", nil)
    if matches != nil {
        fmt.Printf("User ID: %s\n", matches.Params["userId"]) // Output: test@example.com
    }
}
```

## Function Signature

```go
func preactIsoUrlPatternMatch(url, route string, matches *Matches) *Matches
```

### Parameters

- `url` (string): The URL path to match
- `route` (string): The route pattern with parameters
- `matches` (*Matches): Optional pre-existing matches to extend

### Return Value

Returns a `*Matches` struct on success, or `nil` if no match:

```go
type Matches struct {
    Params map[string]string
    Rest   string
}
```

## Route Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| `/users/:id` | Named parameter | `{id: "123"}` |
| `/users/:id?` | Optional parameter | `{id: ""}` |
| `/files/:path+` | Required rest parameter | `{path: "docs/readme.txt"}` |
| `/static/:path*` | Optional rest parameter | `{path: "css/main.css"}` |
| `/static/*` | Anonymous wildcard | `{Rest: "/images/logo.png"}` |
