// Test this file by running:
// npx tsc --noEmit test/node/pattern-match.types.ts

import type { RoutePropsForPath } from '../../src/router.js';

// Test utils

type isEqualsType<T, U> = T extends U ? U extends T ? true : false : false;
type isWeakEqualsType<T, U> = T extends U ? true : false;

// Type tests based on router-match.test.js cases

// Base route test
const test1: isEqualsType<
  RoutePropsForPath<'/'> ,
	{ params: {} }
> = true;

const test1_1: isEqualsType<
  RoutePropsForPath<'/'> ,
	{ arbitrary: {} }
> = false;

// Param route test
const test2: isEqualsType<
  RoutePropsForPath<'/user/:id'> ,
  { params: { id: string }, id: string }
> = true;

const test2_weak: isWeakEqualsType<
  RoutePropsForPath<'/user/:id'> ,
  { params: { id: string } }
> = true;

// Param rest segment test
const test3: isEqualsType<
  RoutePropsForPath<'/user/*'> ,
  { params: {}, rest: string }
> = true;

const test3_1: isEqualsType<
  RoutePropsForPath<'/*'> ,
  { params: {}, rest: string }
> = true;

const test3_2: isEqualsType<
  RoutePropsForPath<'*'> ,
  { params: {}, rest: string }
> = true;

// Param route with rest segment test
const test4: isEqualsType<
  RoutePropsForPath<'/user/:id/*'> ,
  { params: { id: string }, id: string, rest: string }
> = true;

// Optional param route test
const test5: isEqualsType<
  RoutePropsForPath<'/user/:id?'> ,
	{ params: { id?: string }, id?: string }
> = true;

// Optional rest param route "/:x*" test
const test6: isEqualsType<
  RoutePropsForPath<'/user/:id*'> ,
  { params: { id?: string }, id?: string }
> = true;

// rest param should not be present
const test6_error: isEqualsType<
  RoutePropsForPath<'/user/:id*'> ,
  { params: { id: string }, rest: string }
> = false;

// Rest param route "/:x+" test
const test7: isEqualsType<
  RoutePropsForPath<'/user/:id+'> ,
  { params: { id: string }, id: string }
> = true;

// rest param should not be present
const test7_error: isEqualsType<
  RoutePropsForPath<'/user/:id+'>,
  { params: { id: string }, id: string, rest: string }
> = false;

// Handles leading/trailing slashes test
const test8: isEqualsType<
  RoutePropsForPath<'/about-late/:seg1/:seg2/'> ,
  { params: { seg1: string; seg2: string }, seg1: string, seg2: string }
> = true;

// Multiple params test (from overwrite properties test)
const test9: isEqualsType<
  RoutePropsForPath<'/:path/:query'> ,
  { params: { path: string; query: string }, path: string, query: string }
> = true;

// Empty route test
const test10: isEqualsType<
  RoutePropsForPath<''> ,
  { params: {} }
> = true;
