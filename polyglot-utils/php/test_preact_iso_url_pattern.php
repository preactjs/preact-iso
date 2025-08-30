<?php
/**
 * Test suite for preact-iso-url-pattern.php - ported from Go tests
 * Run with: php test_preact_iso_url_pattern.php
 */

require_once 'preact-iso-url-pattern.php';

class TestPreactIsoUrlPatternMatch {
    private $tests = 0;
    private $passed = 0;
    private $failed = 0;

    public function run() {
        echo "Running PHP tests for preact-iso-url-pattern...\n\n";

        // Run all test methods
        $methods = get_class_methods($this);
        foreach ($methods as $method) {
            if (strpos($method, 'test_') === 0) {
                $this->runTest($method);
            }
        }

        echo "\n" . str_repeat("=", 60) . "\n";
        echo "Test Results: {$this->passed} passed, {$this->failed} failed, {$this->tests} total\n";

        if ($this->failed > 0) {
            exit(1);
        }
        echo "All tests passed!\n";
    }

    private function runTest($methodName) {
        $this->tests++;
        try {
            $this->$methodName();
            $this->passed++;
            echo ".";
        } catch (Exception $e) {
            $this->failed++;
            echo "F";
            echo "\nFAILED: $methodName - " . $e->getMessage() . "\n";
        }
    }

    private function assertEqual($expected, $actual, $message = '') {
        // Use JSON comparison for deep equality check (works for arrays and objects)
        $expectedJson = json_encode($expected);
        $actualJson = json_encode($actual);

        if ($expectedJson !== $actualJson) {
            $expectedStr = json_encode($expected, JSON_PRETTY_PRINT);
            $actualStr = json_encode($actual, JSON_PRETTY_PRINT);
            throw new Exception("Expected:\n$expectedStr\nGot:\n$actualStr\n$message");
        }
    }

    private function assertNull($actual, $message = '') {
        if ($actual !== null) {
            $actualStr = json_encode($actual, JSON_PRETTY_PRINT);
            throw new Exception("Expected null, got:\n$actualStr\n$message");
        }
    }

    private function assertNotNull($actual, $message = '') {
        if ($actual === null) {
            throw new Exception("Expected non-null value, got null\n$message");
        }
    }

    // Test methods start here

    // Base route tests
    public function test_base_route_exact_match() {
        $result = preactIsoUrlPatternMatch("/", "/");
        $expected = ['params' => (object)[]];
        $this->assertEqual($expected, $result);
    }

    public function test_base_route_no_match() {
        $result = preactIsoUrlPatternMatch("/user/1", "/");
        $this->assertNull($result);
    }

    // Param route tests
    public function test_param_route_match() {
        $result = preactIsoUrlPatternMatch("/user/2", "/user/:id");
        $expected = ['params' => (object)['id' => '2'], 'id' => '2'];
        $this->assertEqual($expected, $result);
    }

    public function test_param_route_no_match() {
        $result = preactIsoUrlPatternMatch("/", "/user/:id");
        $this->assertNull($result);
    }

    // Rest segment tests
    public function test_rest_segment_match() {
        $result = preactIsoUrlPatternMatch("/user/foo", "/user/*");
        $expected = ['params' => (object)[], 'rest' => '/foo'];
        $this->assertEqual($expected, $result);
    }

    public function test_rest_segment_match_multiple_segments() {
        $result = preactIsoUrlPatternMatch("/user/foo/bar/baz", "/user/*");
        $expected = ['params' => (object)[], 'rest' => '/foo/bar/baz'];
        $this->assertEqual($expected, $result);
    }

    public function test_rest_segment_no_match() {
        $result = preactIsoUrlPatternMatch("/user", "/user/*");
        $this->assertNull($result);
    }

    public function test_rest_segment_no_match_different_case() {
        $result = preactIsoUrlPatternMatch("/", "/user/:id/*");
        $this->assertNull($result);
    }

    // Param route with rest segment
    public function test_param_with_rest_single_segment() {
        $result = preactIsoUrlPatternMatch("/user/2/foo", "/user/:id/*");
        $expected = ['params' => (object)['id' => '2'], 'id' => '2', 'rest' => '/foo'];
        $this->assertEqual($expected, $result);
    }

    public function test_param_with_rest_multiple_segments() {
        $result = preactIsoUrlPatternMatch("/user/2/foo/bar/bob", "/user/:id/*");
        $expected = ['params' => (object)['id' => '2'], 'id' => '2', 'rest' => '/foo/bar/bob'];
        $this->assertEqual($expected, $result);
    }

    public function test_param_with_rest_no_match() {
        $result = preactIsoUrlPatternMatch("/", "/user/:id/*");
        $this->assertNull($result);
    }

    // Optional param tests
    public function test_optional_param_empty() {
        $result = preactIsoUrlPatternMatch("/user", "/user/:id?");
        $expected = ['params' => (object)['id' => null], 'id' => null];
        $this->assertEqual($expected, $result);
    }

    public function test_optional_param_no_match_base() {
        $result = preactIsoUrlPatternMatch("/", "/user/:id?");
        $this->assertNull($result);
    }

    // Optional rest param tests (/:x*)
    public function test_optional_rest_param_empty() {
        $result = preactIsoUrlPatternMatch("/user", "/user/:id*");
        $expected = ['params' => (object)['id' => null], 'id' => null];
        $this->assertEqual($expected, $result);
    }

    public function test_optional_rest_param_with_segments() {
        $result = preactIsoUrlPatternMatch("/user/foo/bar", "/user/:id*");
        $expected = ['params' => (object)['id' => 'foo/bar'], 'id' => 'foo/bar'];
        $this->assertEqual($expected, $result);
    }

    public function test_optional_param_no_match_base_duplicate() {
        $result = preactIsoUrlPatternMatch("/", "/user/:id*");
        $this->assertNull($result);
    }

    // Required rest param tests (/:x+)
    public function test_required_rest_param_single_segment() {
        $result = preactIsoUrlPatternMatch("/user/foo", "/user/:id+");
        $expected = ['params' => (object)['id' => 'foo'], 'id' => 'foo'];
        $this->assertEqual($expected, $result);
    }

    public function test_required_rest_param_multiple_segments() {
        $result = preactIsoUrlPatternMatch("/user/foo/bar", "/user/:id+");
        $expected = ['params' => (object)['id' => 'foo/bar'], 'id' => 'foo/bar'];
        $this->assertEqual($expected, $result);
    }

    public function test_required_rest_param_empty_should_fail() {
        $result = preactIsoUrlPatternMatch("/user", "/user/:id+");
        $this->assertNull($result);
    }

    public function test_required_rest_param_root_mismatch() {
        $result = preactIsoUrlPatternMatch("/", "/user/:id+");
        $this->assertNull($result);
    }

    // Leading/trailing slashes
    public function test_leading_trailing_slashes() {
        $result = preactIsoUrlPatternMatch("/about-late/_SEGMENT1_/_SEGMENT2_/", "/about-late/:seg1/:seg2/");
        $expected = ['params' => (object)['seg1' => '_SEGMENT1_', 'seg2' => '_SEGMENT2_'], 'seg1' => '_SEGMENT1_', 'seg2' => '_SEGMENT2_'];
        $this->assertEqual($expected, $result);
    }

    // Additional tests that are not in test/node/router-match.test.js
    // URL encoding tests
    public function test_url_encoded_param() {
        $result = preactIsoUrlPatternMatch("/foo/bar%20baz", "/foo/:param");
        $expected = ['params' => (object)['param' => 'bar baz'], 'param' => 'bar baz'];
        $this->assertEqual($expected, $result);
    }

    public function test_url_encoded_email_in_param() {
        $result = preactIsoUrlPatternMatch("/users/test%40example.com/posts", "/users/:userId/posts");
        $expected = ['params' => (object)['userId' => 'test@example.com'], 'userId' => 'test@example.com'];
        $this->assertEqual($expected, $result);
    }

    // Complex rest segment with encoding
    public function test_rest_segment_with_encoded_parts() {
        $result = preactIsoUrlPatternMatch("/api/path/with%20spaces/and%2Fslashes", "/api/:path+");
        $expected = ['params' => (object)['path' => 'path/with spaces/and/slashes'], 'path' => 'path/with spaces/and/slashes'];
        $this->assertEqual($expected, $result);
    }

    // Edge cases
    public function test_empty_route() {
        $result = preactIsoUrlPatternMatch("/foo", "");
        $this->assertNull($result);
    }

    public function test_empty_url_with_param() {
        $result = preactIsoUrlPatternMatch("", "/:param");
        $this->assertNull($result);
    }

    public function test_mixed_required_and_optional_params() {
        $result = preactIsoUrlPatternMatch("/foo/bar", "/:required/:optional?");
        $expected = ['params' => (object)['required' => 'foo', 'optional' => 'bar'], 'required' => 'foo', 'optional' => 'bar'];
        $this->assertEqual($expected, $result);
    }

    public function test_mixed_required_and_optional_params_missing_optional() {
        $result = preactIsoUrlPatternMatch("/foo", "/:required/:optional?");
        $expected = ['params' => (object)['required' => 'foo', 'optional' => null], 'required' => 'foo', 'optional' => null];
        $this->assertEqual($expected, $result);
    }

    // Test with pre-existing matches
    public function test_pre_existing_matches_object() {
        $matches = ['params' => (object)['existing' => 'value']];
        $result = preactIsoUrlPatternMatch("/foo/bar", "/:first/:second", $matches);
        $expected = ['params' => (object)['existing' => 'value', 'first' => 'foo', 'second' => 'bar'], 'first' => 'foo', 'second' => 'bar'];
        $this->assertEqual($expected, $result);
    }


    // Complex nested paths
    public function test_complex_nested_path_with_multiple_params() {
        $result = preactIsoUrlPatternMatch("/api/v1/users/123/posts/456/comments", "/api/:version/users/:userId/posts/:postId/comments");
        $expected = [
            'params' => (object)['version' => 'v1', 'userId' => '123', 'postId' => '456'],
            'version' => 'v1', 'userId' => '123', 'postId' => '456'
        ];
        $this->assertEqual($expected, $result);
    }

    public function test_route_longer_than_url_required_param_missing() {
        $result = preactIsoUrlPatternMatch("/api", "/api/:version/:resource");
        $this->assertNull($result);
    }

    public function test_route_longer_than_url_optional_param() {
        $result = preactIsoUrlPatternMatch("/api", "/api/:version?");
        $expected = ['params' => (object)['version' => null], 'version' => null];
        $this->assertEqual($expected, $result);
    }

    public function test_multiple_slashes_in_url_should_be_normalized() {
        $result = preactIsoUrlPatternMatch("//user//123//", "/user/:id");
        $expected = ['params' => (object)['id' => '123'], 'id' => '123'];
        $this->assertEqual($expected, $result);
    }

    public function test_route_with_multiple_slashes() {
        $result = preactIsoUrlPatternMatch("/user/123", "//user//:id//");
        $expected = ['params' => (object)['id' => '123'], 'id' => '123'];
        $this->assertEqual($expected, $result);
    }


    // Additional URL encoding tests
    public function test_complex_url_encoding_in_rest_params() {
        $result = preactIsoUrlPatternMatch("/files/folder%2Fsubfolder/file%20name.txt", "/files/:path+");
        $expected = ['params' => (object)['path' => 'folder/subfolder/file name.txt'], 'path' => 'folder/subfolder/file name.txt'];
        $this->assertEqual($expected, $result);
    }

    public function test_special_characters_encoded_in_url() {
        $result = preactIsoUrlPatternMatch("/search/query%3F%2B%23%26test", "/search/:query");
        $expected = ['params' => (object)['query' => 'query?+#&test'], 'query' => 'query?+#&test'];
        $this->assertEqual($expected, $result);
    }



    public function test_unicode_characters_encoded() {
        $result = preactIsoUrlPatternMatch("/user/Jos%C3%A9", "/user/:name");
        $expected = ['params' => (object)['name' => 'José'], 'name' => 'José'];
        $this->assertEqual($expected, $result);
    }

    public function test_empty_segments_in_middle_of_url() {
        $result = preactIsoUrlPatternMatch("/api//v1//users", "/api/v1/users");
        $expected = ['params' => (object)[]];
        $this->assertEqual($expected, $result);
    }

    public function test_route_with_only_wildcards() {
        $result = preactIsoUrlPatternMatch("/anything/goes/here", "*");
        $expected = ['params' => (object)[], 'rest' => '/anything/goes/here'];
        $this->assertEqual($expected, $result);
    }

    // URL decoding error handling tests
    public function test_malformed_percent_encoding_simple_param() {
        // Test malformed percent encoding in simple param - should not crash
        $result = preactIsoUrlPatternMatch("/user/test%", "/user/:id");
        // Should either work or return null, but not crash
        $this->assertNotNull($result);
    }

    public function test_malformed_percent_encoding_rest_param() {
        // Test malformed percent encoding in rest param - should not crash
        $result = preactIsoUrlPatternMatch("/files/test%/file", "/files/:path+");
        // Should either work or return null, but not crash
        $this->assertNotNull($result);
    }

    public function test_invalid_unicode_sequence() {
        // Test invalid unicode sequence - should not crash
        $result = preactIsoUrlPatternMatch("/user/test%C3", "/user/:id");
        // Should either work or return null, but not crash
        $this->assertNotNull($result);
    }
}

// Run tests if this file is executed directly
if (php_sapi_name() === 'cli') {
    $test = new TestPreactIsoUrlPatternMatch();
    $test->run();
}
?>
