# Run program: python3 preact-iso-url-pattern.py

from urllib.parse import unquote

# Safe URL decode function with error handling
def safe_unquote(s):
    if s is None or s == '':
        return s
    try:
        return unquote(s)
    except UnicodeDecodeError:
        # If unquote fails due to malformed encoding, return original string
        return s

def preact_iso_url_pattern_match(url, route, matches=None):
    # Initialize matches object if not provided
    if matches is None:
        matches = {'params': {}}
    url = list(filter(None, url.split('/')))
    route = list(filter(None, (route or '').split('/')))

    for i in range(max(len(url), len(route))):
        m, param, flag = '', '', ''
        if i < len(route):
            parts = route[i].split(':')
            m = ':' if len(parts) > 1 else ''
            param = parts[-1]
            flag = ''
            if param and param[-1] in '+*?':
                flag = param[-1]
                param = param[:-1]

        val = url[i] if i < len(url) else None

        # segment match:
        if not m and param == val:
            continue

        # /foo/* match
        if not m and val and flag == '*':
            # Store remaining path segments in rest
            matches['rest'] = '/' + '/'.join(map(safe_unquote, url[i:]))
            break

        # segment mismatch / missing required field:
        if not m or (not val and flag != '?' and flag != '*'):
            return None

        rest = flag in ('+', '*')

        # rest (+/*) match:
        if rest:
            val = '/'.join(map(safe_unquote, url[i:])) or None
        # normal/optional field:
        elif val:
            val = safe_unquote(val)

        # Store parameter values in matches
        matches['params'][param] = val
        if param not in matches:
            matches[param] = val

        if rest:
            break

    return matches

# Example usage:
# print(preact_iso_url_pattern_match("/foo/bar%20baz", "/foo/:param"))
# print(preact_iso_url_pattern_match("/foo/bar/baz", "/foo/*"))
# print(preact_iso_url_pattern_match("/foo", "/foo/:param?"))
# print(preact_iso_url_pattern_match("/foo/bar", "/bar/:param"))
# print(preact_iso_url_pattern_match('/users/test%40example.com/posts', '/users/:userId/posts'))