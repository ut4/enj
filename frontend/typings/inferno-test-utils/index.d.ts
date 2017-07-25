// Generated by dts-bundle v0.7.3
// Dependencies for this module:
//   ../../../../packages/inferno-test-utils/inferno
//   ../../../../packages/inferno-test-utils/inferno-component

declare module 'inferno-test-utils' {
    /**
        * @module Inferno-Test-Utils
        */ /** TypeDoc Comment */
    import { InfernoInput, VNode } from "inferno";
    import Component from "inferno-component";
    export function isVNode(instance: any): instance is VNode;
    export function isVNodeOfType(instance: VNode, type: string | Function): boolean;
    export function isDOMVNode(inst: VNode): boolean;
    export function isDOMVNodeOfType(instance: VNode, type: string): boolean;
    export function isFunctionalVNode(instance: VNode): boolean;
    export function isFunctionalVNodeOfType(instance: VNode, type: Function): boolean;
    export function isClassVNode(instance: VNode): boolean;
    export function isClassVNodeOfType(instance: VNode, type: Function): boolean;
    export function isComponentVNode(inst: VNode): boolean;
    export function isComponentVNodeOfType(inst: VNode, type: Function): boolean;
    export function isTextVNode(inst: VNode): boolean;
    export function isDOMElement(instance: any): boolean;
    export function isDOMElementOfType(instance: any, type: string): boolean;
    export function isRenderedClassComponent(instance: any): boolean;
    export function isRenderedClassComponentOfType(instance: any, type: Function): boolean;
    export class Wrapper extends Component<any, any> {
            render(): any;
            repaint(): Promise<void>;
    }
    export function renderIntoDocument(input: InfernoInput): Wrapper;
    export function findAllInRenderedTree(renderedTree: any, predicate: (vNode: VNode) => boolean): VNode[] | any;
    export function findAllInVNodeTree(vNodeTree: VNode, predicate: (vNode: VNode) => boolean): any;
    export function scryRenderedDOMElementsWithClass(renderedTree: any, classNames: string | string[]): Element[];
    export function scryRenderedDOMElementsWithTag(renderedTree: any, tagName: string): Element[];
    export function scryRenderedVNodesWithType(renderedTree: any, type: string | Function): VNode[];
    export function scryVNodesWithType(vNodeTree: VNode, type: string | Function): VNode[];
    export function findRenderedDOMElementWithClass(renderedTree: any, classNames: string | string[]): Element;
    export function findRenderedDOMElementWithTag(renderedTree: any, tagName: string): Element;
    export function findRenderedVNodeWithType(renderedTree: any, type: string | Function): VNode;
    export function findVNodeWithType(vNodeTree: VNode, type: string | Function): VNode;
    export function getTagNameOfVNode(inst: any): any;
    const _default: {
            Wrapper: typeof Wrapper;
            findAllInRenderedTree: (renderedTree: any, predicate: (vNode: VNode) => boolean) => any;
            findAllInVNodeTree: (vNodeTree: VNode, predicate: (vNode: VNode) => boolean) => any;
            findRenderedDOMElementWithClass: (renderedTree: any, classNames: string | string[]) => Element;
            findRenderedDOMElementWithTag: (renderedTree: any, tagName: string) => Element;
            findRenderedVNodeWithType: (renderedTree: any, type: string | Function) => VNode;
            findVNodeWithType: (vNodeTree: VNode, type: string | Function) => VNode;
            getTagNameOfVNode: (inst: any) => any;
            isClassVNode: (instance: VNode) => boolean;
            isClassVNodeOfType: (instance: VNode, type: Function) => boolean;
            isComponentVNode: (inst: VNode) => boolean;
            isComponentVNodeOfType: (inst: VNode, type: Function) => boolean;
            isDOMElement: (instance: any) => boolean;
            isDOMElementOfType: (instance: any, type: string) => boolean;
            isDOMVNode: (inst: VNode) => boolean;
            isDOMVNodeOfType: (instance: VNode, type: string) => boolean;
            isFunctionalVNode: (instance: VNode) => boolean;
            isFunctionalVNodeOfType: (instance: VNode, type: Function) => boolean;
            isRenderedClassComponent: (instance: any) => boolean;
            isRenderedClassComponentOfType: (instance: any, type: Function) => boolean;
            isTextVNode: (inst: VNode) => boolean;
            isVNode: (instance: any) => instance is VNode;
            isVNodeOfType: (instance: VNode, type: string | Function) => boolean;
            renderIntoDocument: (input: InfernoInput) => Wrapper;
            renderToSnapshot: (input: VNode) => any;
            scryRenderedDOMElementsWithClass: (renderedTree: any, classNames: string | string[]) => Element[];
            scryRenderedDOMElementsWithTag: (renderedTree: any, tagName: string) => Element[];
            scryRenderedVNodesWithType: (renderedTree: any, type: string | Function) => VNode[];
            scryVNodesWithType: (vNodeTree: VNode, type: string | Function) => VNode[];
            vNodeToSnapshot: (node: VNode) => any;
    };
    export default _default;
}

