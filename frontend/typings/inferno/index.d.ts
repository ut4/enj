// Generated by dts-bundle v0.7.3
// Dependencies for this module:
//   ../../../../packages/inferno/inferno-shared
//   ../../../../packages/inferno/inferno-vnode-flags

declare module 'inferno' {
    /**
        * @module Inferno
        */ /** TypeDoc Comment */
    import { NO_OP } from "inferno-shared";
    import { LifecycleClass as _LifecycleClass } from "inferno-shared";
    import _VNodeFlags from "inferno-vnode-flags";
    import { getFlagsForElementVnode, normalize as internal_normalize } from "inferno/core/normalization";
    import { options, Root as _Root } from "inferno/core/options";
    import { cloneVNode, createVNode, InfernoChildren, InfernoInput, Props, VNode } from "inferno/core/VNodes";
    import { isUnitlessNumber as internal_isUnitlessNumber } from "inferno/DOM/constants";
    import { linkEvent } from "inferno/DOM/events/linkEvent";
    import { patch as internal_patch } from "inferno/DOM/patching";
    import { componentToDOMNodeMap as internal_DOMNodeMap, createRenderer, findDOMNode, render } from "inferno/DOM/rendering";
    import { EMPTY_OBJ } from "inferno/DOM/utils";
    export const VNodeFlags: _VNodeFlags;
    export const Root: _Root;
    export const LifecycleClass: _LifecycleClass;
    const version: string | undefined;
    const _default: {
            EMPTY_OBJ: {};
            NO_OP: string;
            cloneVNode: (vNodeToClone: VNode, props?: Props | undefined, ..._children: InfernoChildren[]) => VNode;
            createRenderer: (parentDom?: any) => (lastInput: any, nextInput: any) => void;
            createVNode: (flags: number, type: string | Function | null, className?: string | null | undefined, children?: InfernoChildren, props?: Props | null | undefined, key?: any, ref?: ((node?: Element | null | undefined) => void | null) | undefined, noNormalise?: boolean | undefined) => any;
            findDOMNode: (ref: any) => any;
            getFlagsForElementVnode: (type: string) => number;
            internal_DOMNodeMap: Map<any, any>;
            internal_isUnitlessNumber: Set<string>;
            internal_normalize: (vNode: VNode) => void;
            internal_patch: (lastVNode: VNode, nextVNode: VNode, parentDom: Element, lifecycle: _LifecycleClass, context: Object, isSVG: boolean, isRecycling: boolean) => void;
            linkEvent: (data: any, event: any) => {
                    data: any;
                    event: any;
            } | null;
            options: {
                    afterMount: Function | null;
                    afterRender: Function | null;
                    afterUpdate: Function | null;
                    beforeRender: Function | null;
                    beforeUnmount: Function | null;
                    createVNode: Function | null;
                    findDOMNodeEnabled: boolean;
                    recyclingEnabled: boolean;
                    roots: _Root[];
            };
            render: (input: InfernoInput, parentDom: Element | Node | HTMLElement | DocumentFragment | SVGAElement | null) => InfernoChildren;
            version: string | undefined;
    };
    export default _default;
    export { EMPTY_OBJ, InfernoChildren, InfernoInput, NO_OP, Props, VNode, cloneVNode, createRenderer, createVNode, findDOMNode, getFlagsForElementVnode, internal_DOMNodeMap, internal_isUnitlessNumber, internal_normalize, internal_patch, linkEvent, options, render, version };
}

declare module 'inferno/core/normalization' {
    import { VNode } from "inferno/core/VNodes";
    export function normalizeVNodes(nodes: any[]): VNode[];
    export function getFlagsForElementVnode(type: string): number;
    export function normalize(vNode: VNode): void;
}

declare module 'inferno/core/options' {
    /**
        * @module Inferno
        */ /** TypeDoc Comment */
    import { LifecycleClass } from "inferno-shared";
    import { InfernoInput } from "inferno/core/VNodes";
    export interface Root {
            dom: Element | SVGAElement;
            input: InfernoInput;
            lifecycle: LifecycleClass;
    }
    export const options: {
            afterMount: null | Function;
            afterRender: null | Function;
            afterUpdate: null | Function;
            beforeRender: null | Function;
            beforeUnmount: null | Function;
            createVNode: null | Function;
            findDOMNodeEnabled: boolean;
            recyclingEnabled: boolean;
            roots: Root[];
    };
}

declare module 'inferno/core/VNodes' {
    export type InfernoInput = VNode | null | string | number;
    export type Ref = (node?: Element | null) => void | null;
    export type InfernoChildren = string | number | boolean | undefined | VNode | Array<string | number | VNode> | null;
    export type Type = string | null | Function;
    export interface Props {
            children?: InfernoChildren;
            ref?: Ref;
            key?: any;
            className?: string;
            [k: string]: any;
    }
    export interface Refs {
            onComponentDidMount?: (domNode: Element) => void;
            onComponentWillMount?(): void;
            onComponentShouldUpdate?(lastProps: any, nextProps: any): boolean;
            onComponentWillUpdate?(lastProps: any, nextProps: any): void;
            onComponentDidUpdate?(lastProps: any, nextProps: any): void;
            onComponentWillUnmount?(domNode: Element): void;
    }
    export interface VNode {
            children: InfernoChildren;
            dom: Element | null;
            className: string | null;
            flags: number;
            key: any;
            props: Props | null;
            ref: Ref;
            type: Type;
            parentVNode?: VNode;
    }
    /**
        * Creates virtual node
        * @param {number} flags
        * @param {string|Function|null} type
        * @param {string|null=} className
        * @param {object=} children
        * @param {object=} props
        * @param {*=} key
        * @param {object|Function=} ref
        * @param {boolean=} noNormalise
        * @returns {VNode} returns new virtual node
        */
    export function createVNode(flags: number, type: Type, className?: string | null, children?: InfernoChildren, props?: Props | null, key?: any, ref?: Ref, noNormalise?: boolean): any;
    export function directClone(vNodeToClone: VNode): VNode;
    /**
        * Clones given virtual node by creating new instance of it
        * @param {VNode} vNodeToClone virtual node to be cloned
        * @param {Props=} props additional props for new virtual node
        * @param {...*} _children new children for new virtual node
        * @returns {VNode} new virtual node
        */
    export function cloneVNode(vNodeToClone: VNode, props?: Props, ..._children: InfernoChildren[]): VNode;
    export function createVoidVNode(): VNode;
    export function createTextVNode(text: string | number, key: any): VNode;
    export function isVNode(o: VNode): boolean;
}

declare module 'inferno/DOM/constants' {
    /**
        * @module Inferno
        */ /** TypeDoc Comment */
    export const xlinkNS = "http://www.w3.org/1999/xlink";
    export const xmlNS = "http://www.w3.org/XML/1998/namespace";
    export const svgNS = "http://www.w3.org/2000/svg";
    export const strictProps: Set<string>;
    export const booleanProps: Set<string>;
    export const namespaces: Map<string, string>;
    export const isUnitlessNumber: Set<string>;
    export const skipProps: Set<string>;
    export const delegatedEvents: Set<string>;
}

declare module 'inferno/DOM/events/linkEvent' {
    /**
      * Links given data to event as first parameter
      * @param {*} data data to be linked, it will be available in function as first parameter
      * @param {Function} event Function to be called when event occurs
      * @returns {{data: *, event: Function}}
      */
    export function linkEvent(data: any, event: any): {
        data: any;
        event: any;
    } | null;
}

declare module 'inferno/DOM/patching' {
    /**
        * @module Inferno
        */ /** TypeDoc Comment */
    import { LifecycleClass } from "inferno-shared";
    import { VNode } from "inferno/core/VNodes";
    export function patch(lastVNode: VNode, nextVNode: VNode, parentDom: Element, lifecycle: LifecycleClass, context: Object, isSVG: boolean, isRecycling: boolean): void;
    export function patchElement(lastVNode: VNode, nextVNode: VNode, parentDom: Element | null, lifecycle: LifecycleClass, context: Object, isSVG: boolean, isRecycling: boolean): void;
    export function patchComponent(lastVNode: any, nextVNode: any, parentDom: any, lifecycle: LifecycleClass, context: any, isSVG: boolean, isClass: boolean, isRecycling: boolean): boolean;
    export function patchText(lastVNode: VNode, nextVNode: VNode): void;
    export function patchVoid(lastVNode: VNode, nextVNode: VNode): void;
    export function patchNonKeyedChildren(lastChildren: any, nextChildren: any, dom: any, lifecycle: LifecycleClass, context: Object, isSVG: boolean, isRecycling: boolean): void;
    export function patchKeyedChildren(a: VNode[], b: VNode[], dom: any, lifecycle: LifecycleClass, context: any, isSVG: boolean, isRecycling: boolean): void;
    export function isAttrAnEvent(attr: string): boolean;
    export function patchProp(prop: any, lastValue: any, nextValue: any, dom: Element, isSVG: boolean, hasControlledValue: boolean): void;
    export function patchEvent(name: string, lastValue: any, nextValue: any, dom: any): void;
}

declare module 'inferno/DOM/rendering' {
    import { InfernoChildren, InfernoInput } from "inferno/core/VNodes";
    export const componentToDOMNodeMap: Map<any, any>;
    /**
        * When inferno.options.findDOMNOdeEnabled is true, this function will return DOM Node by component instance
        * @param ref Component instance
        * @returns {*|null} returns dom node
        */
    export function findDOMNode(ref: any): any;
    /**
        * Renders virtual node tree into parent node.
        * @param {VNode | null | string | number} input vNode to be rendered
        * @param parentDom DOM node which content will be replaced by virtual node
        * @returns {InfernoChildren} rendered virtual node
        */
    export function render(input: InfernoInput, parentDom: Element | SVGAElement | DocumentFragment | null | HTMLElement | Node): InfernoChildren;
    export function createRenderer(parentDom?: any): (lastInput: any, nextInput: any) => void;
}

declare module 'inferno/DOM/utils' {
    /**
        * @module Inferno
        */ /** TypeDoc Comment */
    import { LifecycleClass } from "inferno-shared";
    import { Props, VNode } from "inferno/core/VNodes";
    export const EMPTY_OBJ: {};
    export function createClassComponentInstance(vNode: VNode, Component: any, props: Props, context: Object, isSVG: boolean, lifecycle: LifecycleClass): any;
    export function replaceLastChildAndUnmount(lastInput: any, nextInput: any, parentDom: any, lifecycle: LifecycleClass, context: Object, isSVG: boolean, isRecycling: boolean): void;
    export function replaceVNode(parentDom: any, dom: any, vNode: any, lifecycle: LifecycleClass, isRecycling: any): void;
    export function createFunctionalComponentInput(vNode: VNode, component: any, props: Props, context: Object): any;
    export function setTextContent(dom: any, text: string | number): void;
    export function updateTextContent(dom: any, text: string | number): void;
    export function appendChild(parentDom: any, dom: any): void;
    export function insertOrAppend(parentDom: any, newNode: any, nextNode: any): void;
    export function documentCreateElement(tag: any, isSVG: boolean): Element;
    export function replaceWithNewNode(lastNode: any, nextNode: any, parentDom: any, lifecycle: LifecycleClass, context: Object, isSVG: boolean, isRecycling: boolean): void;
    export function replaceChild(parentDom: any, nextDom: any, lastDom: any): void;
    export function removeChild(parentDom: Element, dom: Element): void;
    export function removeAllChildren(dom: Element, children: any, lifecycle: LifecycleClass, isRecycling: boolean): void;
    export function removeChildren(dom: Element | null, children: any, lifecycle: LifecycleClass, isRecycling: boolean): void;
    export function isKeyed(lastChildren: VNode[], nextChildren: VNode[]): boolean;
}
