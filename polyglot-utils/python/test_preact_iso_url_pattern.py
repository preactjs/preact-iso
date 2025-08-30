#!/usr/bin/env python3
"""Test suite for preact_iso_url_pattern.py - ported from Go tests"""

import unittest
from preact_iso_url_pattern import preact_iso_url_pattern_match


class TestPreactIsoUrlPatternMatch(unittest.TestCase):
    
    def test_base_route_exact_match(self):
        """Base route - exact match"""
        result = preact_iso_url_pattern_match("/", "/")
        expected = {'params': {}}
        self.assertEqual(result, expected)
    
    def test_base_route_no_match(self):
        """Base route - no match"""
        result = preact_iso_url_pattern_match("/user/1", "/")
        self.assertIsNone(result)
    
    def test_param_route_match(self):
        """Param route - match"""
        result = preact_iso_url_pattern_match("/user/2", "/user/:id")
        expected = {'params': {'id': '2'}, 'id': '2'}
        self.assertEqual(result, expected)
    
    def test_param_route_no_match(self):
        """Param route - no match"""
        result = preact_iso_url_pattern_match("/", "/user/:id")
        self.assertIsNone(result)
    
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
    
    def test_optional_param_empty(self):
        """Optional param - empty"""
        result = preact_iso_url_pattern_match("/user", "/user/:id?")
        expected = {'params': {'id': None}, 'id': None}
        self.assertEqual(result, expected)
    
    def test_optional_param_no_match_base(self):
        """Optional param - no match base"""
        result = preact_iso_url_pattern_match("/", "/user/:id?")
        self.assertIsNone(result)
    
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
    
    def test_leading_trailing_slashes(self):
        """Leading/trailing slashes"""
        result = preact_iso_url_pattern_match("/about-late/_SEGMENT1_/_SEGMENT2_/", "/about-late/:seg1/:seg2/")
        expected = {'params': {'seg1': '_SEGMENT1_', 'seg2': '_SEGMENT2_'}, 'seg1': '_SEGMENT1_', 'seg2': '_SEGMENT2_'}
        self.assertEqual(result, expected)
    
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
    
    def test_rest_segment_with_encoded_parts(self):
        """Rest segment with encoded parts"""
        result = preact_iso_url_pattern_match("/api/path/with%20spaces/and%2Fslashes", "/api/:path+")
        expected = {'params': {'path': 'path/with spaces/and/slashes'}, 'path': 'path/with spaces/and/slashes'}
        self.assertEqual(result, expected)
    
    def test_empty_route(self):
        """Empty route"""
        result = preact_iso_url_pattern_match("/foo", "")
        self.assertIsNone(result)
    
    def test_empty_url_with_param(self):
        """Empty url with param"""
        result = preact_iso_url_pattern_match("", "/:param")
        self.assertIsNone(result)
    
    def test_multiple_optional_params(self):
        """Multiple optional params"""
        result = preact_iso_url_pattern_match("/foo", "/:a?/:b?/:c?")
        expected = {'params': {'a': 'foo', 'b': None, 'c': None}, 'a': 'foo', 'b': None, 'c': None}
        self.assertEqual(result, expected)
    
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
    
    def test_pre_existing_matches_object(self):
        """Pre-existing matches object"""
        matches = {'params': {'existing': 'value'}}
        result = preact_iso_url_pattern_match("/foo/bar", "/:first/:second", matches)
        expected = {'params': {'existing': 'value', 'first': 'foo', 'second': 'bar'}, 'first': 'foo', 'second': 'bar'}
        self.assertEqual(result, expected)
    
    def test_anonymous_wildcard_rest(self):
        """Anonymous wildcard rest"""
        result = preact_iso_url_pattern_match("/static/css/main.css", "/static/*")
        expected = {'params': {}, 'rest': '/css/main.css'}
        self.assertEqual(result, expected)
    
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
    
    def test_empty_string_should_be_handled_as_undefined_for_optional_rest(self):
        """Empty string should be handled as undefined for optional rest"""
        result = preact_iso_url_pattern_match("/user", "/user/:id*")
        expected = {'params': {'id': None}, 'id': None}
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
    
    def test_special_characters_in_param_names(self):
        """Special characters in param names"""
        result = preact_iso_url_pattern_match("/user/123", "/user/:user_id")
        expected = {'params': {'user_id': '123'}, 'user_id': '123'}
        self.assertEqual(result, expected)
    
    def test_param_with_numbers(self):
        """Param with numbers"""
        result = preact_iso_url_pattern_match("/api/v1", "/api/:version1")
        expected = {'params': {'version1': 'v1'}, 'version1': 'v1'}
        self.assertEqual(result, expected)
    
    def test_rest_param_with_single_character(self):
        """Rest param with single character"""
        result = preact_iso_url_pattern_match("/a/b", "/:x+")
        expected = {'params': {'x': 'a/b'}, 'x': 'a/b'}
        self.assertEqual(result, expected)
    
    def test_complex_url_encoding_in_rest_params(self):
        """Complex URL encoding in rest params"""
        result = preact_iso_url_pattern_match("/files/folder%2Fsubfolder/file%20name.txt", "/files/:path+")
        expected = {'params': {'path': 'folder/subfolder/file name.txt'}, 'path': 'folder/subfolder/file name.txt'}
        self.assertEqual(result, expected)
    
    def test_question_mark_in_url_not_query_param(self):
        """Question mark in URL (not query param)"""
        result = preact_iso_url_pattern_match("/search/what%3F", "/search/:query")
        expected = {'params': {'query': 'what?'}, 'query': 'what?'}
        self.assertEqual(result, expected)
    
    def test_plus_sign_in_url(self):
        """Plus sign in URL"""
        result = preact_iso_url_pattern_match("/math/1%2B1", "/math/:expression")
        expected = {'params': {'expression': '1+1'}, 'expression': '1+1'}
        self.assertEqual(result, expected)
    
    def test_hash_in_url_encoded(self):
        """Hash in URL (encoded)"""
        result = preact_iso_url_pattern_match("/tag/%23javascript", "/tag/:name")
        expected = {'params': {'name': '#javascript'}, 'name': '#javascript'}
        self.assertEqual(result, expected)
    
    def test_ampersand_in_url(self):
        """Ampersand in URL"""
        result = preact_iso_url_pattern_match("/search/cats%26dogs", "/search/:query")
        expected = {'params': {'query': 'cats&dogs'}, 'query': 'cats&dogs'}
        self.assertEqual(result, expected)
    
    def test_unicode_characters(self):
        """Unicode characters"""
        result = preact_iso_url_pattern_match("/user/José", "/user/:name")
        expected = {'params': {'name': 'José'}, 'name': 'José'}
        self.assertEqual(result, expected)
    
    def test_unicode_characters_encoded(self):
        """Unicode characters encoded"""
        result = preact_iso_url_pattern_match("/user/Jos%C3%A9", "/user/:name")
        expected = {'params': {'name': 'José'}, 'name': 'José'}
        self.assertEqual(result, expected)
    
    def test_very_long_param(self):
        """Very long param"""
        long_content = 'a' * 1000
        result = preact_iso_url_pattern_match(f"/data/{long_content}", "/data/:content")
        expected = {'params': {'content': long_content}, 'content': long_content}
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
    
    def test_multiple_consecutive_optional_params(self):
        """Multiple consecutive optional params"""
        result = preact_iso_url_pattern_match("/a/b", "/:first?/:second?/:third?/:fourth?")
        expected = {
            'params': {'first': 'a', 'second': 'b', 'third': None, 'fourth': None},
            'first': 'a', 'second': 'b', 'third': None, 'fourth': None
        }
        self.assertEqual(result, expected)
    
    def test_zero_width_param_names_edge_case(self):
        """Zero-width param names (edge case)"""
        result = preact_iso_url_pattern_match("/test", "/:?")
        expected = {'params': {'': 'test'}, '': 'test'}
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
