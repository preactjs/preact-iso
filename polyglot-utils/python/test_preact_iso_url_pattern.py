#!/usr/bin/env python3
"""Test suite for preact_iso_url_pattern.py - ported from Go tests"""

import unittest
from preact_iso_url_pattern import preact_iso_url_pattern_match


class TestPreactIsoUrlPatternMatch(unittest.TestCase):
    
    # Base route tests
    def test_base_route_exact_match(self):
        """Base route - exact match"""
        result = preact_iso_url_pattern_match("/", "/")
        expected = {'params': {}}
        self.assertEqual(result, expected)
    
    def test_base_route_no_match(self):
        """Base route - no match"""
        result = preact_iso_url_pattern_match("/user/1", "/")
        self.assertIsNone(result)
    
    # Param route tests
    def test_param_route_match(self):
        """Param route - match"""
        result = preact_iso_url_pattern_match("/user/2", "/user/:id")
        expected = {'params': {'id': '2'}, 'id': '2'}
        self.assertEqual(result, expected)
    
    def test_param_route_no_match(self):
        """Param route - no match"""
        result = preact_iso_url_pattern_match("/", "/user/:id")
        self.assertIsNone(result)
    
    # Rest segment tests
    def test_rest_segment_match(self):
        """Rest segment - match"""
        result = preact_iso_url_pattern_match("/user/foo", "/user/*")
        expected = {'params': {}, 'rest': '/foo'}
        self.assertEqual(result, expected)
    
    def test_rest_segment_match_multiple_segments(self):
        """Rest segment - match multiple segments"""
        result = preact_iso_url_pattern_match("/user/foo/bar/baz", "/user/*")
        expected = {'params': {}, 'rest': '/foo/bar/baz'}
        self.assertEqual(result, expected)
    
    def test_rest_segment_no_match(self):
        """Rest segment - no match"""
        result = preact_iso_url_pattern_match("/user", "/user/*")
        self.assertIsNone(result)
    
    def test_rest_segment_no_match_different_case(self):
        """Rest segment - no match different case"""
        result = preact_iso_url_pattern_match("/", "/user/:id/*")
        self.assertIsNone(result)
    
    # Param route with rest segment
    def test_param_with_rest_single_segment(self):
        """Param with rest - single segment"""
        result = preact_iso_url_pattern_match("/user/2/foo", "/user/:id/*")
        expected = {'params': {'id': '2'}, 'id': '2', 'rest': '/foo'}
        self.assertEqual(result, expected)
    
    def test_param_with_rest_multiple_segments(self):
        """Param with rest - multiple segments"""
        result = preact_iso_url_pattern_match("/user/2/foo/bar/bob", "/user/:id/*")
        expected = {'params': {'id': '2'}, 'id': '2', 'rest': '/foo/bar/bob'}
        self.assertEqual(result, expected)
    
    def test_param_with_rest_no_match(self):
        """Param with rest - no match"""
        result = preact_iso_url_pattern_match("/", "/user/:id/*")
        self.assertIsNone(result)
    
    # Optional param tests
    def test_optional_param_empty(self):
        """Optional param - empty"""
        result = preact_iso_url_pattern_match("/user", "/user/:id?")
        expected = {'params': {'id': None}, 'id': None}
        self.assertEqual(result, expected)
    
    def test_optional_param_no_match_base(self):
        """Optional param - no match base"""
        result = preact_iso_url_pattern_match("/", "/user/:id?")
        self.assertIsNone(result)
    
    # Optional rest param tests (/:x*)
    def test_optional_rest_param_empty(self):
        """Optional rest param - empty"""
        result = preact_iso_url_pattern_match("/user", "/user/:id*")
        expected = {'params': {'id': None}, 'id': None}
        self.assertEqual(result, expected)
    
    def test_optional_rest_param_with_segments(self):
        """Optional rest param - with segments"""
        result = preact_iso_url_pattern_match("/user/foo/bar", "/user/:id*")
        expected = {'params': {'id': 'foo/bar'}, 'id': 'foo/bar'}
        self.assertEqual(result, expected)
    
    def test_optional_param_no_match_base_duplicate(self):
        """Optional param - no match base duplicate"""
        result = preact_iso_url_pattern_match("/", "/user/:id*")
        self.assertIsNone(result)
    
    # Required rest param tests (/:x+)
    def test_required_rest_param_single_segment(self):
        """Required rest param - single segment"""
        result = preact_iso_url_pattern_match("/user/foo", "/user/:id+")
        expected = {'params': {'id': 'foo'}, 'id': 'foo'}
        self.assertEqual(result, expected)
    
    def test_required_rest_param_multiple_segments(self):
        """Required rest param - multiple segments"""
        result = preact_iso_url_pattern_match("/user/foo/bar", "/user/:id+")
        expected = {'params': {'id': 'foo/bar'}, 'id': 'foo/bar'}
        self.assertEqual(result, expected)
    
    def test_required_rest_param_empty_should_fail(self):
        """Required rest param - empty (should fail)"""
        result = preact_iso_url_pattern_match("/user", "/user/:id+")
        self.assertIsNone(result)
    
    def test_required_rest_param_root_mismatch(self):
        """Required rest param - root mismatch"""
        result = preact_iso_url_pattern_match("/", "/user/:id+")
        self.assertIsNone(result)
    
    # Leading/trailing slashes
    def test_leading_trailing_slashes(self):
        """Leading/trailing slashes"""
        result = preact_iso_url_pattern_match("/about-late/_SEGMENT1_/_SEGMENT2_/", "/about-late/:seg1/:seg2/")
        expected = {'params': {'seg1': '_SEGMENT1_', 'seg2': '_SEGMENT2_'}, 'seg1': '_SEGMENT1_', 'seg2': '_SEGMENT2_'}
        self.assertEqual(result, expected)
    
    # Additional tests that are not in test/node/router-match.test.js
    # URL encoding tests
    def test_url_encoded_param(self):
        """URL encoded param"""
        result = preact_iso_url_pattern_match("/foo/bar%20baz", "/foo/:param")
        expected = {'params': {'param': 'bar baz'}, 'param': 'bar baz'}
        self.assertEqual(result, expected)
    
    def test_url_encoded_email_in_param(self):
        """URL encoded email in param"""
        result = preact_iso_url_pattern_match("/users/test%40example.com/posts", "/users/:userId/posts")
        expected = {'params': {'userId': 'test@example.com'}, 'userId': 'test@example.com'}
        self.assertEqual(result, expected)
    
    # Complex rest segment with encoding
    def test_rest_segment_with_encoded_parts(self):
        """Rest segment with encoded parts"""
        result = preact_iso_url_pattern_match("/api/path/with%20spaces/and%2Fslashes", "/api/:path+")
        expected = {'params': {'path': 'path/with spaces/and/slashes'}, 'path': 'path/with spaces/and/slashes'}
        self.assertEqual(result, expected)
    
    # Edge cases
    def test_empty_route(self):
        """Empty route"""
        result = preact_iso_url_pattern_match("/foo", "")
        self.assertIsNone(result)
    
    def test_empty_url_with_param(self):
        """Empty url with param"""
        result = preact_iso_url_pattern_match("", "/:param")
        self.assertIsNone(result)
    
    def test_mixed_required_and_optional_params(self):
        """Mixed required and optional params"""
        result = preact_iso_url_pattern_match("/foo/bar", "/:required/:optional?")
        expected = {'params': {'required': 'foo', 'optional': 'bar'}, 'required': 'foo', 'optional': 'bar'}
        self.assertEqual(result, expected)
    
    def test_mixed_required_and_optional_params_missing_optional(self):
        """Mixed required and optional params - missing optional"""
        result = preact_iso_url_pattern_match("/foo", "/:required/:optional?")
        expected = {'params': {'required': 'foo', 'optional': None}, 'required': 'foo', 'optional': None}
        self.assertEqual(result, expected)
    
    # Test with pre-existing matches
    def test_pre_existing_matches_object(self):
        """Pre-existing matches object"""
        matches = {'params': {'existing': 'value'}}
        result = preact_iso_url_pattern_match("/foo/bar", "/:first/:second", matches)
        expected = {'params': {'existing': 'value', 'first': 'foo', 'second': 'bar'}, 'first': 'foo', 'second': 'bar'}
        self.assertEqual(result, expected)

    # Complex nested paths
    def test_complex_nested_path_with_multiple_params(self):
        """Complex nested path with multiple params"""
        result = preact_iso_url_pattern_match("/api/v1/users/123/posts/456/comments", "/api/:version/users/:userId/posts/:postId/comments")
        expected = {
            'params': {'version': 'v1', 'userId': '123', 'postId': '456'},
            'version': 'v1', 'userId': '123', 'postId': '456'
        }
        self.assertEqual(result, expected)
    
    def test_route_longer_than_url_required_param_missing(self):
        """Route longer than URL - required param missing"""
        result = preact_iso_url_pattern_match("/api", "/api/:version/:resource")
        self.assertIsNone(result)
    
    def test_route_longer_than_url_optional_param(self):
        """Route longer than URL - optional param"""
        result = preact_iso_url_pattern_match("/api", "/api/:version?")
        expected = {'params': {'version': None}, 'version': None}
        self.assertEqual(result, expected)
    
    def test_multiple_slashes_in_url_should_be_normalized(self):
        """Multiple slashes in URL should be normalized"""
        result = preact_iso_url_pattern_match("//user//123//", "/user/:id")
        expected = {'params': {'id': '123'}, 'id': '123'}
        self.assertEqual(result, expected)
    
    def test_route_with_multiple_slashes(self):
        """Route with multiple slashes"""
        result = preact_iso_url_pattern_match("/user/123", "//user//:id//")
        expected = {'params': {'id': '123'}, 'id': '123'}
        self.assertEqual(result, expected)

    def test_complex_url_encoding_in_rest_params(self):
        """Complex URL encoding in rest params"""
        result = preact_iso_url_pattern_match("/files/folder%2Fsubfolder/file%20name.txt", "/files/:path+")
        expected = {'params': {'path': 'folder/subfolder/file name.txt'}, 'path': 'folder/subfolder/file name.txt'}
        self.assertEqual(result, expected)
    
    def test_special_characters_encoded_in_url(self):
        """Special characters encoded in URL"""
        result = preact_iso_url_pattern_match("/search/query%3F%2B%23%26test", "/search/:query")
        expected = {'params': {'query': 'query?+#&test'}, 'query': 'query?+#&test'}
        self.assertEqual(result, expected)
    
    def test_unicode_characters_encoded(self):
        """Unicode characters encoded"""
        result = preact_iso_url_pattern_match("/user/Jos%C3%A9", "/user/:name")
        expected = {'params': {'name': 'José'}, 'name': 'José'}
        self.assertEqual(result, expected)

    def test_empty_segments_in_middle_of_url(self):
        """Empty segments in middle of URL"""
        result = preact_iso_url_pattern_match("/api//v1//users", "/api/v1/users")
        expected = {'params': {}}
        self.assertEqual(result, expected)
    
    def test_route_with_only_wildcards(self):
        """Route with only wildcards"""
        result = preact_iso_url_pattern_match("/anything/goes/here", "*")
        expected = {'params': {}, 'rest': '/anything/goes/here'}
        self.assertEqual(result, expected)
    

class TestUrlDecodingErrorHandling(unittest.TestCase):
    """Tests specifically for URL decoding error scenarios"""
    
    def test_malformed_percent_encoding_simple_param(self):
        """Test malformed percent encoding in simple param - should not crash"""
        # This should handle malformed encoding gracefully
        result = preact_iso_url_pattern_match("/user/test%", "/user/:id")
        # Should either work or return None, but not crash
        self.assertIsNotNone(result)
    
    def test_malformed_percent_encoding_rest_param(self):
        """Test malformed percent encoding in rest param - should not crash"""
        result = preact_iso_url_pattern_match("/files/test%/file", "/files/:path+")
        # Should either work or return None, but not crash
        self.assertIsNotNone(result)
    
    def test_invalid_unicode_sequence(self):
        """Test invalid unicode sequence - should not crash"""
        result = preact_iso_url_pattern_match("/user/test%C3", "/user/:id")
        # Should either work or return None, but not crash
        self.assertIsNotNone(result)


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)
