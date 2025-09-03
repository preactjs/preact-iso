// Test this file by running:
// npx tsc --noEmit test/node/pattern-match.test.ts

type RoutePropsNarrow<Re extends string> = Re extends '*'
	? { params: {}; rest: string }

	: Re extends `:${infer placeholder}?/${infer rest}`
	? { [k in placeholder]?: string } & { params: RoutePropsNarrow<rest>['params'] & { [k in placeholder]?: string } } & Omit<RoutePropsNarrow<rest>, 'params'>

	: Re extends `:${infer placeholder}/${infer rest}`
	? { [k in placeholder]: string } & { params: RoutePropsNarrow<rest>['params'] & { [k in placeholder]: string } } & Omit<RoutePropsNarrow<rest>, 'params'>

	: Re extends `:${infer placeholder}?`
	? { [k in placeholder]?: string } & { params: { [k in placeholder]?: string } }

	: Re extends `:${infer placeholder}*`
	? { [k in placeholder]?: string } & { params: { [k in placeholder]?: string } }

	: Re extends `:${infer placeholder}+`
	? { [k in placeholder]: string } & { params: { [k in placeholder]: string } }

	: Re extends `:${infer placeholder}`
	? { [k in placeholder]: string } & { params: { [k in placeholder]: string } }
	
	: Re extends (`/${infer rest}` | `${infer _}/${infer rest}`)
	? RoutePropsNarrow<rest>

	: { params: {} };

// Test utils

type isEqualsType<T, U> = T extends U ? U extends T ? true : false : false;
type isWeakEqualsType<T, U> = T extends U ? true : false;

// Type tests based on router-match.test.js cases

// Base route test
const test1: isEqualsType<
  RoutePropsNarrow<'/'> ,
	{ params: {} }
> = true;

const test1_1: isEqualsType<
  RoutePropsNarrow<'/'> ,
	{ arbitrary: {} }
> = false;

// Param route test
const test2: isEqualsType<
  RoutePropsNarrow<'/user/:id'> ,
  { params: { id: string }, id: string }
> = true;

const test2_weak: isWeakEqualsType<
  RoutePropsNarrow<'/user/:id'> ,
  { params: { id: string } }
> = true;

// Param rest segment test
const test3: isEqualsType<
  RoutePropsNarrow<'/user/*'> ,
  { params: {}, rest: string }
> = true;

const test3_1: isEqualsType<
  RoutePropsNarrow<'/*'> ,
  { params: {}, rest: string }
> = true;

const test3_2: isEqualsType<
  RoutePropsNarrow<'*'> ,
  { params: {}, rest: string }
> = true;

// Param route with rest segment test
const test4: isEqualsType<
  RoutePropsNarrow<'/user/:id/*'> ,
  { params: { id: string }, id: string, rest: string }
> = true;

// Optional param route test
const test5: isEqualsType<
  RoutePropsNarrow<'/user/:id?'> ,
	{ params: { id?: string }, id?: string }
> = true;

// Optional rest param route "/:x*" test
const test6: isEqualsType<
  RoutePropsNarrow<'/user/:id*'> ,
  { params: { id?: string }, id?: string }
> = true;

// rest param should not be present
const test6_error: isEqualsType<
  RoutePropsNarrow<'/user/:id*'> ,
  { params: { id: string }, rest: string }
> = false;

// Rest param route "/:x+" test
const test7: isEqualsType<
  RoutePropsNarrow<'/user/:id+'> ,
  { params: { id: string }, id: string }
> = true;

// rest param should not be present
const test7_error: isEqualsType<
  RoutePropsNarrow<'/user/:id+'>,
  { params: { id: string }, id: string, rest: string }
> = false;

// Handles leading/trailing slashes test
const test8: isEqualsType<
  RoutePropsNarrow<'/about-late/:seg1/:seg2/'> ,
  { params: { seg1: string; seg2: string }, seg1: string, seg2: string }
> = true;

// Multiple params test (from overwrite properties test)
const test9: isEqualsType<
  RoutePropsNarrow<'/:path/:query'> ,
  { params: { path: string; query: string }, path: string, query: string }
> = true;

// Empty route test
const test10: isEqualsType<
  RoutePropsNarrow<''> ,
  { params: {} }
> = true;
