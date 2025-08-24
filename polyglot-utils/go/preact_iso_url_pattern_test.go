package main

import (
	"reflect"
	"strings"
	"testing"
)

func TestPreactIsoUrlPatternMatch(t *testing.T) {
	tests := []struct {
		name     string
		url      string
		route    string
		matches  *Matches
		expected *Matches
	}{
		// Base route tests
		{
			name:     "Base route - exact match",
			url:      "/",
			route:    "/",
			matches:  nil,
			expected: &Matches{Params: map[string]string{}},
		},
		{
			name:     "Base route - no match",
			url:      "/user/1",
			route:    "/",
			matches:  nil,
			expected: nil,
		},

		// Param route tests
		{
			name:    "Param route - match",
			url:     "/user/2",
			route:   "/user/:id",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"id": "2"},
			},
		},
		{
			name:     "Param route - no match",
			url:      "/",
			route:    "/user/:id",
			matches:  nil,
			expected: nil,
		},

		// Rest segment tests
		{
			name:    "Rest segment - match",
			url:     "/user/foo",
			route:   "/user/*",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{},
				Rest:   "/foo",
			},
		},
		{
			name:     "Rest segment - no match",
			url:      "/",
			route:    "/user/:id/*",
			matches:  nil,
			expected: nil,
		},

		// Param route with rest segment
		{
			name:    "Param with rest - single segment",
			url:     "/user/2/foo",
			route:   "/user/:id/*",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"id": "2"},
				Rest:   "/foo",
			},
		},
		{
			name:    "Param with rest - multiple segments",
			url:     "/user/2/foo/bar/bob",
			route:   "/user/:id/*",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"id": "2"},
				Rest:   "/foo/bar/bob",
			},
		},

		// Optional param tests
		{
			name:    "Optional param - empty",
			url:     "/user",
			route:   "/user/:id?",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"id": ""},
			},
		},
		{
			name:     "Optional param - no match base",
			url:      "/",
			route:    "/user/:id?",
			matches:  nil,
			expected: nil,
		},

		// Optional rest param tests (/:x*)
		{
			name:    "Optional rest param - empty",
			url:     "/user",
			route:   "/user/:id*",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"id": ""},
			},
		},
		{
			name:    "Optional rest param - with segments",
			url:     "/user/foo/bar",
			route:   "/user/:id*",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"id": "foo/bar"},
			},
		},

		// Required rest param tests (/:x+)
		{
			name:    "Required rest param - single segment",
			url:     "/user/foo",
			route:   "/user/:id+",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"id": "foo"},
			},
		},
		{
			name:    "Required rest param - multiple segments",
			url:     "/user/foo/bar",
			route:   "/user/:id+",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"id": "foo/bar"},
			},
		},
		{
			name:     "Required rest param - empty (should fail)",
			url:      "/user",
			route:    "/user/:id+",
			matches:  nil,
			expected: nil,
		},
		{
			name:     "Required rest param - root mismatch",
			url:      "/",
			route:    "/user/:id+",
			matches:  nil,
			expected: nil,
		},

		// Leading/trailing slashes
		{
			name:    "Leading/trailing slashes",
			url:     "/about-late/_SEGMENT1_/_SEGMENT2_/",
			route:   "/about-late/:seg1/:seg2/",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{
					"seg1": "_SEGMENT1_",
					"seg2": "_SEGMENT2_",
				},
			},
		},

		// URL encoding tests
		{
			name:    "URL encoded param",
			url:     "/foo/bar%20baz",
			route:   "/foo/:param",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"param": "bar baz"},
			},
		},
		{
			name:    "URL encoded email in param",
			url:     "/users/test%40example.com/posts",
			route:   "/users/:userId/posts",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"userId": "test@example.com"},
			},
		},

		// Complex rest segment with encoding
		{
			name:    "Rest segment with encoded parts",
			url:     "/api/path/with%20spaces/and%2Fslashes",
			route:   "/api/:path+",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"path": "path/with spaces/and/slashes"},
			},
		},

		// Edge cases
		{
			name:     "Empty route",
			url:      "/foo",
			route:    "",
			matches:  nil,
			expected: nil,
		},
		{
			name:     "Empty url with param",
			url:      "",
			route:    "/:param",
			matches:  nil,
			expected: nil,
		},
		{
			name:    "Multiple optional params",
			url:     "/foo",
			route:   "/:a?/:b?/:c?",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"a": "foo", "b": "", "c": ""},
			},
		},
		{
			name:    "Mixed required and optional params",
			url:     "/foo/bar",
			route:   "/:required/:optional?",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"required": "foo", "optional": "bar"},
			},
		},
		{
			name:    "Mixed required and optional params - missing optional",
			url:     "/foo",
			route:   "/:required/:optional?",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"required": "foo", "optional": ""},
			},
		},

		// Test with pre-existing matches
		{
			name:    "Pre-existing matches object",
			url:     "/foo/bar",
			route:   "/:first/:second",
			matches: &Matches{Params: map[string]string{"existing": "value"}},
			expected: &Matches{
				Params: map[string]string{
					"existing": "value",
					"first":    "foo",
					"second":   "bar",
				},
			},
		},

		// Wildcard anonymous rest
		{
			name:    "Anonymous wildcard rest",
			url:     "/static/css/main.css",
			route:   "/static/*",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{},
				Rest:   "/css/main.css",
			},
		},

		// Complex nested paths
		{
			name:    "Complex nested path with multiple params",
			url:     "/api/v1/users/123/posts/456/comments",
			route:   "/api/:version/users/:userId/posts/:postId/comments",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{
					"version": "v1",
					"userId":  "123",
					"postId":  "456",
				},
			},
		},

		// Test case where route is longer than URL
		{
			name:     "Route longer than URL - required param missing",
			url:      "/api",
			route:    "/api/:version/:resource",
			matches:  nil,
			expected: nil,
		},
		{
			name:    "Route longer than URL - optional param",
			url:     "/api",
			route:   "/api/:version?",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"version": ""},
			},
		},

		// JavaScript-specific behavior tests
		{
			name:    "Empty string should be handled as undefined for optional rest",
			url:     "/user",
			route:   "/user/:id*",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"id": ""},
			},
		},
		{
			name:    "Multiple slashes in URL should be normalized",
			url:     "//user//123//",
			route:   "/user/:id",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"id": "123"},
			},
		},
		{
			name:    "Route with multiple slashes",
			url:     "/user/123",
			route:   "//user//:id//",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"id": "123"},
			},
		},
		{
			name:    "Special characters in param names",
			url:     "/user/123",
			route:   "/user/:user_id",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"user_id": "123"},
			},
		},
		{
			name:    "Param with numbers",
			url:     "/api/v1",
			route:   "/api/:version1",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"version1": "v1"},
			},
		},
		{
			name:    "Rest param with single character",
			url:     "/a/b",
			route:   "/:x+",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"x": "a/b"},
			},
		},
		{
			name:    "Complex URL encoding in rest params",
			url:     "/files/folder%2Fsubfolder/file%20name.txt",
			route:   "/files/:path+",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"path": "folder/subfolder/file name.txt"},
			},
		},
		{
			name:    "Question mark in URL (not query param)",
			url:     "/search/what%3F",
			route:   "/search/:query",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"query": "what?"},
			},
		},
		{
			name:    "Plus sign in URL",
			url:     "/math/1%2B1",
			route:   "/math/:expression",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"expression": "1+1"},
			},
		},
		{
			name:    "Hash in URL (encoded)",
			url:     "/tag/%23javascript",
			route:   "/tag/:name",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"name": "#javascript"},
			},
		},
		{
			name:    "Ampersand in URL",
			url:     "/search/cats%26dogs",
			route:   "/search/:query",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"query": "cats&dogs"},
			},
		},
		{
			name:    "Unicode characters",
			url:     "/user/José",
			route:   "/user/:name",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"name": "José"},
			},
		},
		{
			name:    "Unicode characters encoded",
			url:     "/user/Jos%C3%A9",
			route:   "/user/:name",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"name": "José"},
			},
		},
		{
			name:    "Very long param",
			url:     "/data/" + strings.Repeat("a", 1000),
			route:   "/data/:content",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"content": strings.Repeat("a", 1000)},
			},
		},
		{
			name:    "Empty segments in middle of URL",
			url:     "/api//v1//users",
			route:   "/api/v1/users",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{},
			},
		},
		{
			name:    "Route with only wildcards",
			url:     "/anything/goes/here",
			route:   "*",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{},
				Rest:   "/anything/goes/here",
			},
		},
		{
			name:    "Multiple consecutive optional params",
			url:     "/a/b",
			route:   "/:first?/:second?/:third?/:fourth?",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{
					"first":  "a",
					"second": "b",
					"third":  "",
					"fourth": "",
				},
			},
		},
		{
			name:    "Zero-width param names (edge case)",
			url:     "/test",
			route:   "/:?",
			matches: nil,
			expected: &Matches{
				Params: map[string]string{"": "test"},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := preactIsoUrlPatternMatch(tt.url, tt.route, tt.matches)

			if tt.expected == nil {
				if result != nil {
					t.Errorf("Expected nil, got %+v", result)
				}
				return
			}

			if result == nil {
				t.Errorf("Expected %+v, got nil", tt.expected)
				return
			}

			// Detailed debugging for failing tests
			if !reflect.DeepEqual(result.Params, tt.expected.Params) {
				t.Errorf("Params mismatch for url=%q route=%q", tt.url, tt.route)
				t.Errorf("  Expected: %+v", tt.expected.Params)
				t.Errorf("  Got:      %+v", result.Params)

				// Additional debug info for rest param cases
				if strings.Contains(tt.route, "+") || strings.Contains(tt.route, "*") {
					urlParts := filterEmpty(strings.Split(tt.url, "/"))
					routeParts := filterEmpty(strings.Split(tt.route, "/"))
					t.Errorf("  Debug: urlParts=%v, routeParts=%v", urlParts, routeParts)
				}
			}

			// Check rest
			if result.Rest != tt.expected.Rest {
				t.Errorf("Rest mismatch. Expected %q, got %q", tt.expected.Rest, result.Rest)
			}
		})
	}
}

// Test to document expected JavaScript behavior for debugging
func TestJavaScriptBehaviorReference(t *testing.T) {
	// These tests document what the JavaScript version should return
	// for direct comparison with Go implementation

	t.Run("JavaScript rest param behavior", func(t *testing.T) {
		// In JavaScript: url.slice(i).map(decodeURIComponent).join('/') || undefined
		// This means for "/user/foo/bar" with route "/user/:id*":
		// - url = ["user", "foo", "bar"]
		// - route = ["user", ":id*"]
		// - At i=1: url.slice(1) = ["foo", "bar"]
		// - joined: "foo/bar"
		// - Result: {params: {id: "foo/bar"}}

		t.Logf("Expected: rest params should join ALL remaining segments with '/'")
		t.Logf("Go issue: likely only taking first segment instead of all remaining")
	})

	t.Run("JavaScript URL encoding behavior", func(t *testing.T) {
		// JavaScript uses decodeURIComponent on each segment
		// For rest params, it decodes EACH segment then joins with '/'

		t.Logf("Expected: each URL segment should be decoded separately")
		t.Logf("For rest params: decode each segment, then join with '/'")
	})
}

// Debug helper to trace execution
func TestDebugSpecificCase(t *testing.T) {
	t.Run("Debug rest param multiple segments", func(t *testing.T) {
		url := "/user/foo/bar"
		route := "/user/:id*"

		t.Logf("Testing: url=%q route=%q", url, route)

		// Manual trace of what should happen:
		urlParts := filterEmpty(strings.Split(url, "/"))
		routeParts := filterEmpty(strings.Split(route, "/"))

		t.Logf("urlParts: %v", urlParts)
		t.Logf("routeParts: %v", routeParts)
		t.Logf("Expected at i=1: should take urlParts[1:] = %v", urlParts[1:])
		t.Logf("Expected result: %q", strings.Join(urlParts[1:], "/"))

		result := preactIsoUrlPatternMatch(url, route, nil)
		if result != nil {
			t.Logf("Actual result: %+v", result)
		} else {
			t.Logf("Actual result: nil")
		}
	})
}

func TestFilterEmpty(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		expected []string
	}{
		{
			name:     "empty slice",
			input:    []string{},
			expected: []string{},
		},
		{
			name:     "no empty strings",
			input:    []string{"a", "b", "c"},
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "with empty strings",
			input:    []string{"", "a", "", "b", ""},
			expected: []string{"a", "b"},
		},
		{
			name:     "all empty strings",
			input:    []string{"", "", ""},
			expected: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := filterEmpty(tt.input)
			// Handle nil slice vs empty slice comparison
			if len(result) == 0 && len(tt.expected) == 0 {
				return // Both are effectively empty
			}
			if !reflect.DeepEqual(result, tt.expected) {
				t.Errorf("Expected %+v, got %+v", tt.expected, result)
			}
		})
	}
}

func TestMax(t *testing.T) {
	tests := []struct {
		name     string
		a, b     int
		expected int
	}{
		{"a greater", 5, 3, 5},
		{"b greater", 3, 5, 5},
		{"equal", 4, 4, 4},
		{"negative", -1, -5, -1},
		{"zero", 0, 0, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := max(tt.a, tt.b)
			if result != tt.expected {
				t.Errorf("max(%d, %d) = %d, expected %d", tt.a, tt.b, result, tt.expected)
			}
		})
	}
}
