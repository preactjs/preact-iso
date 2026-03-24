/// <reference types="navigation-api-types" />
import { Component } from 'preact';

export interface AugmentedComponent extends Component<any, any> {
	__v: VNode;
	__c: (error: Promise<void>, suspendingVNode: VNode) => void;
}

export interface VNode<P = any> extends preact.VNode<P> {
	__c: AugmentedComponent;
	__e?: Element | Text;
	__u: number;
	__h: boolean;
	__v?: VNode<P>;
	__k: Array<VNode<any>> | null;
}

export {}
