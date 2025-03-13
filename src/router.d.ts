import { AnyComponent, ComponentChildren, FunctionComponent, VNode } from 'preact';

export function LocationProvider(props: {
	scope?: string | RegExp;
	children?: ComponentChildren;
}): VNode;

type NestedArray<T> = Array<T | NestedArray<T>>;

/**
 * Check if a URL path matches against a URL path pattern.
 *
 * Warning: This is an internal API exported only for testing purpose. API could change in future.
 * @param url - URL path (e.g. /user/12345)
 * @param route - URL pattern (e.g. /user/:id)
 */
export function exec(url: string, route: string, matches?: {
	params: {
		[param: string]: string;
	};
	rest?: string;
	[props: string]: string;
}): {
	params: {
		[param: string]: string;
	},
	rest?: string;
	[propsOrParam: string]: string;
}

export function Router(props: {
	onRouteChange?: (url: string) => void;
	onLoadEnd?: (url: string) => void;
	onLoadStart?: (url: string) => void;
	children?: NestedArray<VNode>;
}): VNode;

interface LocationHook {
	url: string;
	path: string;
	pathParams: Record<string, string>;
	searchParams: Record<string, string>;
	route: (url: string, replace?: boolean) => void;
}
export const useLocation: () => LocationHook;

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
