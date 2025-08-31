#!/usr/bin/env ruby
# Test suite for preact-iso-url-pattern.rb - ported from Go tests

require 'minitest/autorun'
require_relative 'preact-iso-url-pattern'

class TestPreactIsoUrlPatternMatch < Minitest::Test

  # Base route tests
  def test_base_route_exact_match
    # Base route - exact match
    result = preact_iso_url_pattern_match("/", "/")
    expected = { 'params' => {} }
    assert_equal expected, result
  end

  def test_base_route_no_match
    # Base route - no match
    result = preact_iso_url_pattern_match("/user/1", "/")
    assert_nil result
  end

  # Param route tests
  def test_param_route_match
    # Param route - match
    result = preact_iso_url_pattern_match("/user/2", "/user/:id")
    expected = { 'params' => { 'id' => '2' }, 'id' => '2' }
    assert_equal expected, result
  end

  def test_param_route_no_match
    # Param route - no match
    result = preact_iso_url_pattern_match("/", "/user/:id")
    assert_nil result
  end

  # Rest segment tests
  def test_rest_segment_match
    # Rest segment - match
    result = preact_iso_url_pattern_match("/user/foo", "/user/*")
    expected = { 'params' => {}, 'rest' => '/foo' }
    assert_equal expected, result
  end

  def test_rest_segment_match_multiple_segments
    # Rest segment - match multiple segments
    result = preact_iso_url_pattern_match("/user/foo/bar/baz", "/user/*")
    expected = { 'params' => {}, 'rest' => '/foo/bar/baz' }
    assert_equal expected, result
  end

  def test_rest_segment_no_match
    # Rest segment - no match
    result = preact_iso_url_pattern_match("/user", "/user/*")
    assert_nil result
  end

  def test_rest_segment_no_match_different_case
    # Rest segment - no match different case
    result = preact_iso_url_pattern_match("/", "/user/:id/*")
    assert_nil result
  end

  # Param route with rest segment
  def test_param_with_rest_single_segment
    # Param with rest - single segment
    result = preact_iso_url_pattern_match("/user/2/foo", "/user/:id/*")
    expected = { 'params' => { 'id' => '2' }, 'id' => '2', 'rest' => '/foo' }
    assert_equal expected, result
  end

  def test_param_with_rest_multiple_segments
    # Param with rest - multiple segments
    result = preact_iso_url_pattern_match("/user/2/foo/bar/bob", "/user/:id/*")
    expected = { 'params' => { 'id' => '2' }, 'id' => '2', 'rest' => '/foo/bar/bob' }
    assert_equal expected, result
  end

  def test_param_with_rest_no_match
    # Param with rest - no match
    result = preact_iso_url_pattern_match("/", "/user/:id/*")
    assert_nil result
  end

  # Optional param tests
  def test_optional_param_empty
    # Optional param - empty
    result = preact_iso_url_pattern_match("/user", "/user/:id?")
    expected = { 'params' => { 'id' => nil }, 'id' => nil }
    assert_equal expected, result
  end

  def test_optional_param_no_match_base
    # Optional param - no match base
    result = preact_iso_url_pattern_match("/", "/user/:id?")
    assert_nil result
  end

  # Optional rest param tests (/:x*)
  def test_optional_rest_param_empty
    # Optional rest param - empty
    result = preact_iso_url_pattern_match("/user", "/user/:id*")
    expected = { 'params' => { 'id' => nil }, 'id' => nil }
    assert_equal expected, result
  end

  def test_optional_rest_param_with_segments
    # Optional rest param - with segments
    result = preact_iso_url_pattern_match("/user/foo/bar", "/user/:id*")
    expected = { 'params' => { 'id' => 'foo/bar' }, 'id' => 'foo/bar' }
    assert_equal expected, result
  end

  def test_optional_param_no_match_base_duplicate
    # Optional param - no match base duplicate
    result = preact_iso_url_pattern_match("/", "/user/:id*")
    assert_nil result
  end

  # Required rest param tests (/:x+)
  def test_required_rest_param_single_segment
    # Required rest param - single segment
    result = preact_iso_url_pattern_match("/user/foo", "/user/:id+")
    expected = { 'params' => { 'id' => 'foo' }, 'id' => 'foo' }
    assert_equal expected, result
  end

  def test_required_rest_param_multiple_segments
    # Required rest param - multiple segments
    result = preact_iso_url_pattern_match("/user/foo/bar", "/user/:id+")
    expected = { 'params' => { 'id' => 'foo/bar' }, 'id' => 'foo/bar' }
    assert_equal expected, result
  end

  def test_required_rest_param_empty_should_fail
    # Required rest param - empty (should fail)
    result = preact_iso_url_pattern_match("/user", "/user/:id+")
    assert_nil result
  end

  def test_required_rest_param_root_mismatch
    # Required rest param - root mismatch
    result = preact_iso_url_pattern_match("/", "/user/:id+")
    assert_nil result
  end

  # Leading/trailing slashes
  def test_leading_trailing_slashes
    # Leading/trailing slashes
    result = preact_iso_url_pattern_match("/about-late/_SEGMENT1_/_SEGMENT2_/", "/about-late/:seg1/:seg2/")
    expected = { 'params' => { 'seg1' => '_SEGMENT1_', 'seg2' => '_SEGMENT2_' }, 'seg1' => '_SEGMENT1_', 'seg2' => '_SEGMENT2_' }
    assert_equal expected, result
  end

  # Additional tests that are not in test/node/router-match.test.js
  # URL encoding tests
  def test_url_encoded_param
    # URL encoded param
    result = preact_iso_url_pattern_match("/foo/bar%20baz", "/foo/:param")
    expected = { 'params' => { 'param' => 'bar baz' }, 'param' => 'bar baz' }
    assert_equal expected, result
  end

  def test_url_encoded_email_in_param
    # URL encoded email in param
    result = preact_iso_url_pattern_match("/users/test%40example.com/posts", "/users/:userId/posts")
    expected = { 'params' => { 'userId' => 'test@example.com' }, 'userId' => 'test@example.com' }
    assert_equal expected, result
  end

  # Complex rest segment with encoding
  def test_rest_segment_with_encoded_parts
    # Rest segment with encoded parts
    result = preact_iso_url_pattern_match("/api/path/with%20spaces/and%2Fslashes", "/api/:path+")
    expected = { 'params' => { 'path' => 'path/with spaces/and/slashes' }, 'path' => 'path/with spaces/and/slashes' }
    assert_equal expected, result
  end

  # Edge cases
  def test_empty_route
    # Empty route
    result = preact_iso_url_pattern_match("/foo", "")
    assert_nil result
  end

  def test_empty_url_with_param
    # Empty url with param
    result = preact_iso_url_pattern_match("", "/:param")
    assert_nil result
  end

  def test_mixed_required_and_optional_params
    # Mixed required and optional params
    result = preact_iso_url_pattern_match("/foo/bar", "/:required/:optional?")
    expected = { 'params' => { 'required' => 'foo', 'optional' => 'bar' }, 'required' => 'foo', 'optional' => 'bar' }
    assert_equal expected, result
  end

  def test_mixed_required_and_optional_params_missing_optional
    # Mixed required and optional params - missing optional
    result = preact_iso_url_pattern_match("/foo", "/:required/:optional?")
    expected = { 'params' => { 'required' => 'foo', 'optional' => nil }, 'required' => 'foo', 'optional' => nil }
    assert_equal expected, result
  end

  # Test with pre-existing matches
  def test_pre_existing_matches_object
    # Pre-existing matches object
    matches = { 'params' => { 'existing' => 'value' } }
    result = preact_iso_url_pattern_match("/foo/bar", "/:first/:second", matches)
    expected = { 'params' => { 'existing' => 'value', 'first' => 'foo', 'second' => 'bar' }, 'first' => 'foo', 'second' => 'bar' }
    assert_equal expected, result
  end

  # Complex nested paths
  def test_complex_nested_path_with_multiple_params
    # Complex nested path with multiple params
    result = preact_iso_url_pattern_match("/api/v1/users/123/posts/456/comments", "/api/:version/users/:userId/posts/:postId/comments")
    expected = {
      'params' => { 'version' => 'v1', 'userId' => '123', 'postId' => '456' },
      'version' => 'v1', 'userId' => '123', 'postId' => '456'
    }
    assert_equal expected, result
  end

  def test_route_longer_than_url_required_param_missing
    # Route longer than URL - required param missing
    result = preact_iso_url_pattern_match("/api", "/api/:version/:resource")
    assert_nil result
  end

  def test_route_longer_than_url_optional_param
    # Route longer than URL - optional param
    result = preact_iso_url_pattern_match("/api", "/api/:version?")
    expected = { 'params' => { 'version' => nil }, 'version' => nil }
    assert_equal expected, result
  end


  def test_multiple_slashes_in_url_should_be_normalized
    # Multiple slashes in URL should be normalized
    result = preact_iso_url_pattern_match("//user//123//", "/user/:id")
    expected = { 'params' => { 'id' => '123' }, 'id' => '123' }
    assert_equal expected, result
  end

  def test_route_with_multiple_slashes
    # Route with multiple slashes
    result = preact_iso_url_pattern_match("/user/123", "//user//:id//")
    expected = { 'params' => { 'id' => '123' }, 'id' => '123' }
    assert_equal expected, result
  end

  def test_rest_param_with_single_character
    # Rest param with single character
    result = preact_iso_url_pattern_match("/a/b", "/:x+")
    expected = { 'params' => { 'x' => 'a/b' }, 'x' => 'a/b' }
    assert_equal expected, result
  end

  def test_complex_url_encoding_in_rest_params
    # Complex URL encoding in rest params
    result = preact_iso_url_pattern_match("/files/folder%2Fsubfolder/file%20name.txt", "/files/:path+")
    expected = { 'params' => { 'path' => 'folder/subfolder/file name.txt' }, 'path' => 'folder/subfolder/file name.txt' }
    assert_equal expected, result
  end

  def test_special_characters_encoded_in_url
    # Special characters encoded in URL
    result = preact_iso_url_pattern_match("/search/query%3F%2B%23%26test", "/search/:query")
    expected = { 'params' => { 'query' => 'query?+#&test' }, 'query' => 'query?+#&test' }
    assert_equal expected, result
  end

  def test_unicode_characters_encoded
    # Unicode characters encoded
    result = preact_iso_url_pattern_match("/user/Jos%C3%A9", "/user/:name")
    expected = { 'params' => { 'name' => 'José' }, 'name' => 'José' }
    assert_equal expected, result
  end

  def test_empty_segments_in_middle_of_url
    # Empty segments in middle of URL
    result = preact_iso_url_pattern_match("/api//v1//users", "/api/v1/users")
    expected = { 'params' => {} }
    assert_equal expected, result
  end

  def test_route_with_only_wildcards
    # Route with only wildcards
    result = preact_iso_url_pattern_match("/anything/goes/here", "*")
    expected = { 'params' => {}, 'rest' => '/anything/goes/here' }
    assert_equal expected, result
  end

end

class TestUrlDecodingErrorHandling < Minitest::Test
  # Tests specifically for URL decoding error scenarios

  def test_malformed_percent_encoding_simple_param
    # Test malformed percent encoding in simple param - should not crash
    # This should handle malformed encoding gracefully
    result = preact_iso_url_pattern_match("/user/test%", "/user/:id")
    # Should either work or return nil, but not crash
    refute_nil result
  end

  def test_malformed_percent_encoding_rest_param
    # Test malformed percent encoding in rest param - should not crash
    result = preact_iso_url_pattern_match("/files/test%/file", "/files/:path+")
    # Should either work or return nil, but not crash
    refute_nil result
  end

  def test_invalid_unicode_sequence
    # Test invalid unicode sequence - should not crash
    result = preact_iso_url_pattern_match("/user/test%C3", "/user/:id")
    # Should either work or return nil, but not crash
    refute_nil result
  end
end

# Run tests if this file is executed directly
if __FILE__ == $0
  puts "Running Ruby tests for preact-iso-url-pattern..."
end
