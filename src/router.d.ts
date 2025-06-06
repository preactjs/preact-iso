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

export function Route<Props>(props: RouteProps<Props> & Partial<Props>): VNode;

declare module 'preact' {
	namespace JSX {
		interface IntrinsicAttributes extends RoutableProps {}
	}
	interface Attributes extends RoutableProps {}
}
