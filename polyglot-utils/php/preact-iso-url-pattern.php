<?php
// Run program: php preact-iso-url-pattern.php

// Safe URL decode function with error handling
function safeUrldecode($str) {
    if ($str === null || $str === '') {
        return $str;
    }
    
    // urldecode in PHP generally doesn't throw exceptions,
    // but we can add validation for malformed percent encoding
    $decoded = urldecode($str);
    
    // If the original contained a % but decoding didn't change much,
    // it might be malformed, but PHP's urldecode is quite tolerant
    return $decoded;
}

function preactIsoUrlPatternMatch($url, $route, $matches = null) {
    if ($matches === null) {
        $matches = ['params' => (object)[]];
    }
    $url = array_values(array_filter(explode('/', $url)));
    $route = array_values(array_filter(explode('/', $route ?? '')));

    for ($i = 0; $i < max(count($url), count($route)); $i++) {
        preg_match('/^(:?)(.*?)([+*?]?)$/', $route[$i] ?? '', $parts);
        $m = $parts[1] ?? '';
        $param = $parts[2] ?? '';
        $flag = $parts[3] ?? '';
        $val = $url[$i] ?? null;

        // segment match:
        if (!$m && $param === $val) continue;
        
        // /foo/* match
        if (!$m && $val && $flag == '*') {
            $decodedParts = array_map('safeUrldecode', array_slice($url, $i));
            $matches['rest'] = '/' . implode('/', $decodedParts);
            break;
        }

        // segment mismatch / missing required field:
        if (!$m || (!$val && $flag != '?' && $flag != '*')) {
            return null;
        }
        $rest = $flag == '+' || $flag == '*';

        // rest (+/*) match:
        if ($rest) {
            $decodedParts = array_map('safeUrldecode', array_slice($url, $i));
            $val = implode('/', $decodedParts) ?: null;
        }
        // normal/optional field:
        elseif ($val) {
            $val = safeUrldecode($url[$i]);
        }

        $matches['params']->$param = $val;
        if (!isset($matches[$param])) {
            $matches[$param] = $val;
        }

        if ($rest) break;
    }

    return $matches;
}
// Example usage:
// var_dump(preactIsoUrlPatternMatch("/foo/bar%20baz", "/foo/:param"));
// var_dump(preactIsoUrlPatternMatch("/foo/bar/baz", "/foo/*"));
// var_dump(preactIsoUrlPatternMatch("/foo", "/foo/:param?"));
// var_dump(preactIsoUrlPatternMatch("/foo/bar", "/bar/:param"));
// var_dump(preactIsoUrlPatternMatch('/users/test%40example.com/posts', '/users/:userId/posts'));
?>