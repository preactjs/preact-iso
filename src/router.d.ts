import { AnyComponent, FunctionComponent, VNode } from 'preact';

export const LocationProvider: FunctionComponent;

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
	pathParams: Record<string, string>;
	searchParams: Record<string, string>;
	route: (url: string, replace?: boolean) => void;
}
export const useLocation: () => LocationHook;

interface RoutableProps {
	path?: string;
	default?: boolean;
}

export interface RouteProps<Props> extends RoutableProps {
	component: AnyComponent<Props>;
}

export function Route<Props>(props: RouteProps<Props> & Partial<Props>): VNode;

declare module 'preact' {
	namespace JSX {
		interface IntrinsicAttributes extends RoutableProps {}
	}
	interface Attributes extends RoutableProps {}
}
