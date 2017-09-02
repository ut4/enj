import * as itu from 'inferno-test-utils';

const utils = {
    fakeSWScope: (cacheName: string) => {
        const scope: any = window;
        scope.CACHE_NAME = cacheName;
        // monkeypatch CacheStorage.match
        scope.caches.match = (req: Request): Promise<any> =>
            scope.caches.open(cacheName).then(c => c.match(req));
        // Convenience methods
        scope.putTestCache = (data: {url: string, value: any}) =>
            scope.caches.open(cacheName).then(c =>
                c.put(data.url, new Response(JSON.stringify(data.value)))
            );
        scope.cleanTestCache = () =>
            scope.caches.delete(cacheName);
        scope.skipWaiting = () => null;
        return scope;
    },
    triggerEvent: (type: string, el: Element) => {
        const event = document.createEvent('HTMLEvents');
        event.initEvent(type, false, true);
        el.dispatchEvent(event);
    },
    findButtonByContent: (rendered, content: string): HTMLButtonElement => {
        return findButton(rendered, btn => btn.textContent === content);
    },
    findButtonByAttribute: (rendered, attribute: string, content: string): HTMLButtonElement => {
        return findButton(rendered, btn => btn.getAttribute(attribute) === content);
    },
    getValidToken: (): string => '<header>.eyJzdWIiOjF9.<sig>'//btoa(JSON.stringify({sub: 1}));
};

function findButton(rendered, predicate: Function): HTMLButtonElement {
    const allButtons = itu.scryRenderedDOMElementsWithTag(rendered, 'button');
    return Array.from(allButtons).find(el => predicate(el)) as HTMLButtonElement;
}

const validationTestUtils = {
    isSubmitButtonClickable(rendered) {
        return utils.findButtonByContent(rendered, 'Ok').disabled === false;
    },
    getRenderedValidationErrors(rendered) {
        return itu.scryRenderedDOMElementsWithClass(rendered, 'text-error');
    }
};

export default utils;
export { validationTestUtils };
