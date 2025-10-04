// Import preact here so TypeScript knows we are trying to augment it
import "preact";

declare module "preact" {
	interface Component {
		__v: VNode;
		__c: (error: Promise<void>, suspendingVNode: VNode) => void;
		__z: Array<Element | Text> | null; // Suspended DOM nodes to resume hydration with
	}

	// Use this interface to extend the VNode type with internal properties
	interface VNode<P = {}> {
		__: VNode | null; // Parent
		__c: Component | null;
		__e?: Element | Text;
		__u: number;
		__h: boolean;
		__v?: VNode<P>;
		__k: Array<VNode<any>> | null;
	}

	// Use this interface to override VNode property types
	interface InternalVNode extends VNode {
		type: VNode["type"] & { _forwarded?: boolean };
		props: VNode["props"] & { ref?: any };
	}

	interface Options {
		__b: (vnode: InternalVNode) => void;
		__e: (error: any, newVNode: InternalVNode, oldVNode: InternalVNode) => void;
	}
}
