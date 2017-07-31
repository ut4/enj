// Generated by dts-bundle v0.7.3

declare module 'inferno-shared' {
    /**
        * @module Inferno-Shared
        */ /** TypeDoc Comment */
    export const NO_OP = "$NO_OP";
    export const ERROR_MSG = "a runtime error occured! Use Inferno in development environment to find the error.";
    export const isBrowser: boolean;
    export function toArray(children: any): any[];
    export const isArray: (arg: any) => arg is any[];
    export function isStatefulComponent(o: any): boolean;
    export function isStringOrNumber(o: any): o is string | number;
    export function isNullOrUndef(o: any): o is undefined | null;
    export function isInvalid(o: any): o is null | false | true | undefined;
    export function isFunction(o: any): o is Function;
    export function isString(o: any): o is string;
    export function isNumber(o: any): o is number;
    export function isNull(o: any): o is null;
    export function isTrue(o: any): o is true;
    export function isUndefined(o: any): o is undefined;
    export function isObject(o: any): o is object;
    export function throwError(message?: string): void;
    export function warning(message: string): void;
    export function combineFrom(first?: {} | null, second?: {} | null): object;
    export interface LifecycleClass {
            listeners: Array<() => void>;
            addListener(callback: Function): void;
            trigger(): void;
    }
    export function Lifecycle(): void;
}
