import { AnyComponent, ComponentChildren, Context, VNode } from 'preact';

export const LocationProvider: {
	(props: {
		scope?: string | RegExp;
		/**
		 * Wrap the commit of a navigation (the history update plus the state
		 * change that drives the route re-render). Receives a `commit` callback;
		 * call it to perform the navigation. Run it inside e.g.
		 * `document.startViewTransition` so the browser captures the current route
		 * as the transition's old snapshot before the new route swaps in:
		 * `wrapNavigation={commit => document.startViewTransition(() => flushSync(commit))}`.
		 * For navigations to async/suspending routes, pair with the Router's
		 * `wrapUpdate` to resolve the transition once the content commits.
		 */
		wrapNavigation?: (commit: () => void) => void;
		children?: ComponentChildren;
	}): VNode;
	ctx: Context<LocationHook>;
};

type NestedArray<T> = Array<T | NestedArray<T>>;

interface KnownProps {
	path: string;
	query: Record<string, string>;
	params: Record<string, string>;
	default?: boolean;
	rest?: string;
	component?: AnyComponent;
}

interface ArbitraryProps {
	[prop: string]: any;
}

type MatchProps = KnownProps & ArbitraryProps;

/**
 * Check if a URL path matches against a URL path pattern.
 *
 * Warning: This is largely an internal API, it may change in the future
 * @param url - URL path (e.g. /user/12345)
 * @param route - URL pattern (e.g. /user/:id)
 */
export function exec(url: string, route: string, matches?: MatchProps): MatchProps

export function Router(props: {
	onRouteChange?: (url: string) => void;
	onLoadEnd?: (url: string) => void;
	onLoadStart?: (url: string) => void;
	/**
	 * Wrap the commit that swaps in a suspending route's content once it has
	 * loaded. Receives a `commit` callback that performs the swap; call it to
	 * apply the route. Useful for animating navigations to async routes, e.g.
	 * `wrapUpdate={commit => document.startViewTransition(commit)}`.
	 */
	wrapUpdate?: (commit: () => void) => void;
	children?: NestedArray<VNode>;
}): VNode;

interface LocationHook {
	url: string;
	path: string;
	searchParams: Record<string, string>;
	route: (url: string, replace?: boolean) => void;
}
export const useLocation: () => LocationHook;

interface RouteHook {
	path: string;
	searchParams: Record<string, string>;
	pathParams: Record<string, string>;
}
export const useRoute: () => RouteHook;

type RoutableProps =
	| { path: string; default?: false; }
	| { path?: never; default: true; }

export type RouteProps<Props> = RoutableProps & { component: AnyComponent<Props> };

export type RoutePropsForPath<Path extends string> = Path extends '*'
	? { params: {}; rest: string }

	: Path extends `:${infer placeholder}?/${infer rest}`
	? { [k in placeholder]?: string } & { params: RoutePropsForPath<rest>['params'] & { [k in placeholder]?: string } } & Omit<RoutePropsForPath<rest>, 'params'>

	: Path extends `:${infer placeholder}/${infer rest}`
	? { [k in placeholder]: string } & { params: RoutePropsForPath<rest>['params'] & { [k in placeholder]: string } } & Omit<RoutePropsForPath<rest>, 'params'>

	: Path extends `:${infer placeholder}?`
	? { [k in placeholder]?: string } & { params: { [k in placeholder]?: string } }

	: Path extends `:${infer placeholder}*`
	? { [k in placeholder]?: string } & { params: { [k in placeholder]?: string } }

	: Path extends `:${infer placeholder}+`
	? { [k in placeholder]: string } & { params: { [k in placeholder]: string } }

	: Path extends `:${infer placeholder}`
	? { [k in placeholder]: string } & { params: { [k in placeholder]: string } }

	: Path extends (`/${infer rest}` | `${infer _}/${infer rest}`)
	? RoutePropsForPath<rest>

	: { params: {} };

export function Route<Props>(props: RouteProps<Props> & Partial<Props>): VNode;

declare module 'preact' {
	// The code below automatically adds `path` and `default` as optional props for every component
	// (effectively reserving those names, so no component should use those names in its own props).
	// These declarations extend from `RouteableProps`, which is not allowed in modern TypeScript and
	// causes a TS2312 error.  However, the compiler does seems to honor the intent of this code, so
	// to avoid an API regression, let's ignore the error rather than loosening the type validation.
	namespace JSX {
		/** @ts-ignore */
		interface IntrinsicAttributes extends RoutableProps {}
	}
	/** @ts-ignore */
	interface Attributes extends RoutableProps {}
}
