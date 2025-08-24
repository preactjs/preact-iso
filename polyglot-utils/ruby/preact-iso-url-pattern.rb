# Run program: ruby preact-iso-url-pattern.rb
require 'cgi'

# Safe URL decode function with error handling  
def safe_cgi_unescape(str)
  return str if str.nil? || str.empty?
  
  begin
    CGI.unescape(str)
  rescue ArgumentError
    # If CGI.unescape fails due to malformed encoding, return original string
    str
  end
end

def preact_iso_url_pattern_match(url, route, matches = nil)
  matches ||= { 'params' => {} }
  url = url.split('/').reject(&:empty?)
  route = (route || '').split('/').reject(&:empty?)

  (0...[url.length, route.length].max).each do |i|
    m, param, flag = route[i]&.match(/^(:?)(.*?)([+*?]?)$/)&.captures || ['', '', '']
    val = url[i]

    # segment match:
    next if m.empty? && param == val

    # /foo/* match
    if m.empty? && val && flag == '*'
      decoded_parts = url[i..].map { |part| safe_cgi_unescape(part) }
      matches['rest'] = '/' + decoded_parts.join('/')
      break
    end

    # segment mismatch / missing required field:
    return nil if m.empty? || (!val && flag != '?' && flag != '*')

    rest = flag == '+' || flag == '*'

    # rest (+/*) match:
    if rest
      decoded_parts = url[i..].map { |part| safe_cgi_unescape(part) }
      joined = decoded_parts.join('/')
      val = joined.empty? ? nil : joined
    # normal/optional field:
    elsif val
      val = safe_cgi_unescape(val)
    end

    matches['params'][param] = val
    matches[param] = val unless matches.key?(param)

    break if rest
  end

  matches
end

# Example usage:
# puts preact_iso_url_pattern_match("/foo/bar%20baz", "/foo/:param")
# puts preact_iso_url_pattern_match("/foo/bar/baz", "/foo/*")
# puts preact_iso_url_pattern_match("/foo", "/foo/:param?")
# puts preact_iso_url_pattern_match("/foo/bar", "/bar/:param")
# puts preact_iso_url_pattern_match('/users/test%40example.com/posts', '/users/:userId/posts')