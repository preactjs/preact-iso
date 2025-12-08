import { AnyComponent, ComponentChildren, Context, VNode } from 'preact';

export const LocationProvider: {
	(props: { scope?: string | RegExp; children?: ComponentChildren; }): VNode;
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
	children?: NestedArray<VNode>;
}): VNode;

interface LocationHook {
	url: string;
	path: string;
	query: Record<string, string>;
	route: (url: string, replace?: boolean) => void;
}
export const useLocation: () => LocationHook;

interface RouteHook {
	path: string;
	query: Record<string, string>;
	params: Record<string, string>;
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
