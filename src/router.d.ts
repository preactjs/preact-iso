import { AnyComponent, ComponentChildren, FunctionComponent, VNode } from 'preact';

export function LocationProvider(props: {
	scope?: string | RegExp;
	children?: ComponentChildren;
}): VNode;

type NestedArray<T> = Array<T | NestedArray<T>>;

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
	| { path: string; default?: never; }
	| { path?: never; default: boolean; }

export type RouteProps<Props> = RoutableProps & { component: AnyComponent<Props> };

export function Route<Props>(props: RouteProps<Props> & Partial<Props>): VNode;

declare module 'preact' {
	namespace JSX {
		interface IntrinsicAttributes extends RoutableProps {}
	}
	interface Attributes extends RoutableProps {}
}
