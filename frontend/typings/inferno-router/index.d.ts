// Generated by dts-bundle v0.7.3
// Dependencies for this module:
//   ../../../../packages/inferno-router/inferno
//   ../../../../packages/inferno-router/inferno-component

declare module 'inferno-router' {
    /**
        * @module Inferno-Router
        */ /** TypeDoc Comment */
    import { VNode } from "inferno";
    import createRoutes, { IPlainRouteConfig } from "inferno-router/createRoutes";
    import IndexLink from "inferno-router/IndexLink";
    import IndexRoute from "inferno-router/IndexRoute";
    import Link from "inferno-router/Link";
    import match from "inferno-router/match";
    import Redirect from "inferno-router/Redirect";
    import Route from "inferno-router/Route";
    import Router from "inferno-router/Router";
    import RouterContext from "inferno-router/RouterContext";
    export { IndexLink, Redirect as IndexRedirect, IndexRoute, IPlainRouteConfig, Link, Redirect, Route, Router, RouterContext, VNode, createRoutes, match };
    const _default: {
            IndexLink: (props: any) => VNode;
            IndexRedirect: typeof Redirect;
            IndexRoute: typeof IndexRoute;
            Link: (props: any, {router}: {
                    router: any;
            }) => VNode;
            Redirect: typeof Redirect;
            Route: typeof Route;
            Router: typeof Router;
            RouterContext: typeof RouterContext;
            createRoutes: (routeConfig: IPlainRouteConfig[]) => VNode[];
            match: (routes: any, currentURL: any) => any;
    };
    export default _default;
}

declare module 'inferno-router/createRoutes' {
    /**
        * Helper function for parsing plain route configurations
        * based on react-router createRoutes handler.
        *
        * currently supported keys:
        * - path
        * - component
        * - childRoutes
        * - indexRoute
        *
        * Usage example:
        * const routes = createRoutes([
        *  {
        *    path        : '/',
        *    component   : App,
        *    indexRoute  : {
        *      component     : Home,
        *    },
        *    childRoutes : [
        *      {
        *        path : 'films/',
        *        component : Films,
        *        childRoutes : {
        *          path : 'detail/:id',
        *          component : FilmDetail,
        *        }
        *      },
        *      {
        *        path : '/*',
        *        component : NoMatch
        *      }
        *    ]
        *  }
        * ]);
        *
        * Usage on Router JSX
        * <Router history={browserHistory} children={routes} />
        */
    import { VNode } from "inferno";
    import Component from "inferno-component";
    import { IRouteHook } from "inferno-router/Route";
    export interface IPlainRouteConfig {
            path: string;
            component: Component<any, any>;
            indexRoute?: IPlainRouteConfig;
            childRoutes?: IPlainRouteConfig | IPlainRouteConfig[];
            children?: VNode | VNode[];
            onEnter?: IRouteHook;
            onLeave?: IRouteHook;
    }
    const _default: (routeConfig: IPlainRouteConfig[]) => VNode[];
    export default _default;
}

declare module 'inferno-router/IndexLink' {
    /**
        * @module Inferno-Router
        */ /** TypeDoc Comment */
    import { VNode } from "inferno";
    export default function IndexLink(props: any): VNode;
}

declare module 'inferno-router/IndexRoute' {
    /**
        * @module Inferno-Router
        */ /** TypeDoc Comment */
    import Route from "inferno-router/Route";
    export default class IndexRoute extends Route {
            constructor(props?: any, context?: any);
    }
}

declare module 'inferno-router/Link' {
    /**
        * @module Inferno-Router
        */ /** TypeDoc Comment */
    import { VNode } from "inferno";
    export default function Link(props: any, {router}: {
            router: any;
    }): VNode;
}

declare module 'inferno-router/match' {
    /**
        * Returns a node containing only the matched components
        * @param routes
        * @param currentURL
        * @returns {*}
        */
    export default function match(routes: any, currentURL: any): any;
    /**
        * Converts path to a regex, if a match is found then we extract params from it
        * @param end
        * @param routePath
        * @param pathToMatch
        * @returns {any}
        */
    export function matchPath(end: boolean, routePath: string, pathToMatch: string): any;
}

declare module 'inferno-router/Redirect' {
    /**
        * @module Inferno-Router
        */ /** TypeDoc Comment */
    import Route from "inferno-router/Route";
    export default class Redirect extends Route {
            constructor(props?: any, context?: any);
    }
}

declare module 'inferno-router/Route' {
    /**
        * @module Inferno-Router
        */ /** TypeDoc Comment */
    import { VNode } from "inferno";
    import Component from "inferno-component";
    export type IRouteHook = (props?: any, router?: any) => void;
    export interface IRouteProps {
            params?: any;
            onEnter?: IRouteHook;
            onLeave?: IRouteHook;
            path: string;
            children: Array<Component<any, any>>;
            component?: Component<any, any>;
            getComponent(nextState: any, callback: (error: any, comp: Component<any, any>) => void): void;
    }
    export default class Route extends Component<IRouteProps, any> {
            constructor(props?: IRouteProps, context?: any);
            componentWillMount(): void;
            onLeave(trigger?: boolean): void;
            onEnter(nextProps: any): void;
            getComponent(nextProps: any): void;
            componentWillUnmount(): void;
            componentWillReceiveProps(nextProps: IRouteProps): void;
            render(_args: IRouteProps): VNode | null;
    }
}

declare module 'inferno-router/Router' {
    /**
        * @module Inferno-Router
        */ /** TypeDoc Comment */
    import { VNode } from "inferno";
    import Component from "inferno-component";
    export interface IRouterProps {
            history?: any;
            children?: any;
            router: any;
            location: any;
            baseUrl?: any;
            component?: Component<any, any>;
            onUpdate?: any;
    }
    export default class Router extends Component<IRouterProps, any> {
            router: any;
            unlisten: any;
            constructor(props?: any, context?: any);
            componentWillMount(): void;
            componentWillReceiveProps(nextProps: any): void;
            componentWillUnmount(): void;
            routeTo(url: any): void;
            render(props: any): VNode | null;
    }
}

declare module 'inferno-router/RouterContext' {
    /**
        * @module Inferno-Router
        */ /** TypeDoc Comment */
    import Component from "inferno-component";
    import { IRouterProps } from "inferno-router/Router";
    export default class RouterContext extends Component<IRouterProps, any> {
            constructor(props?: any, context?: any);
            getChildContext(): {
                    router: any;
            };
            render(props: any): any;
    }
}

