// Run program: go run preact-iso-url-pattern.go

package main

import (
	// "fmt"
	"net/url"
	"regexp"
	"strings"
)

type Matches struct {
	Params map[string]string `json:"params"`
	Rest   string            `json:"rest,omitempty"`
}

func preactIsoUrlPatternMatch(urlStr, route string, matches *Matches) *Matches {
	if matches == nil {
		matches = &Matches{
			Params: make(map[string]string),
		}
	}
	urlParts := filterEmpty(strings.Split(urlStr, "/"))
	routeParts := filterEmpty(strings.Split(route, "/"))

	for i := 0; i < max(len(urlParts), len(routeParts)); i++ {
		var m, param, flag string
		if i < len(routeParts) {
			re := regexp.MustCompile(`^(:?)(.*?)([+*?]?)$`)
			matches := re.FindStringSubmatch(routeParts[i])
			if len(matches) > 3 {
				m, param, flag = matches[1], matches[2], matches[3]
			}
		}

		var val string
		if i < len(urlParts) {
			val = urlParts[i]
		}

		// segment match:
		if m == "" && param == val {
			continue
		}

		// /foo/* match
		if m == "" && val != "" && flag == "*" {
			matches.Rest = "/" + strings.Join(urlParts[i:], "/")
			break
		}

		// segment mismatch / missing required field:
		if m == "" || (val == "" && flag != "?" && flag != "*") {
			return nil
		}

		rest := flag == "+" || flag == "*"

		// rest (+/*) match:
		if rest {
			decodedParts := make([]string, len(urlParts[i:]))
			for j, part := range urlParts[i:] {
				decoded, err := url.QueryUnescape(part)
				if err != nil {
					decoded = part // fallback to original if decode fails
				}
				decodedParts[j] = decoded
			}
			val = strings.Join(decodedParts, "/")
		} else if val != "" {
			// normal/optional field: decode val (like JavaScript does)
			decoded, err := url.QueryUnescape(val)
			if err != nil {
				decoded = urlParts[i]
			}
			val = decoded
		}

		matches.Params[param] = val

		if rest {
			break
		}
	}

	return matches
}

func filterEmpty(s []string) []string {
	var result []string
	for _, str := range s {
		if str != "" {
			result = append(result, str)
		}
	}
	return result
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// Example usage:
// func main() {
// 	params := &Matches{Params: make(map[string]string)}
// 	fmt.Println(preactIsoUrlPatternMatch("/foo/bar%20baz", "/foo/:param", params))
//
// 	params := &Matches{Params: make(map[string]string)}
// 	fmt.Println(preactIsoUrlPatternMatch("/foo/bar/baz", "/foo/*"))
//
// 	params := &Matches{Params: make(map[string]string)}
// 	fmt.Println(preactIsoUrlPatternMatch("/foo", "/foo/:param?"))
//
// 	params := &Matches{Params: make(map[string]string)}
// 	fmt.Println(preactIsoUrlPatternMatch("/foo/bar", "/bar/:param"))
//
// 	params := &Matches{Params: make(map[string]string)}
// 	fmt.Println(preactIsoUrlPatternMatch("/users/test%40example.com/posts", "/users/:userId/posts"))
// }
