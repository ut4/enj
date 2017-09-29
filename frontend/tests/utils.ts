import * as itu from 'inferno-test-utils';
import ValidatingComponent from 'src/ui/ValidatingComponent';

const utils = {
    fakeSWScope(cacheName: string) {
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
    triggerEvent(type: string, el: Element) {
        const event = document.createEvent('HTMLEvents');
        event.initEvent(type, false, true);
        el.dispatchEvent(event);
    },
    setInputValue(value: any, el: Element) {
        (el as any).value = value;
        utils.triggerEvent('input', el);
    },
    setDropdownIndex(index: number, el: HTMLSelectElement) {
        el.selectedIndex = index;
        utils.triggerEvent('change', el);
    },
    findButtonByContent(rendered, content: string): HTMLButtonElement {
        return findElement<HTMLButtonElement>(rendered, 'button', btn => btn.textContent === content);
    },
    findButtonByAttribute(rendered, attribute: string, content: string): HTMLButtonElement {
        return findElement<HTMLButtonElement>(rendered, 'button', btn => btn.getAttribute(attribute) === content);
    },
    findInputByName(rendered, name: string): HTMLInputElement {
        return this.findElementByAttribute(rendered, 'input', 'name', name);
    },
    getInputs(rendered): Array<HTMLInputElement> {
        return itu.scryRenderedDOMElementsWithTag(rendered, 'input') as Array<HTMLInputElement>;
    },
    findElementByAttribute<T extends Element>(rendered, tag: string, attribute: string, content: string): T {
        return findElement<T>(rendered, tag, btn => btn.getAttribute(attribute) === content);
    },
    selectDatepickerDate(date: number, triggerEl: HTMLInputElement) {
        triggerEl.click();
        utils.triggerEvent('mousedown', document.querySelector(
            `[name="${triggerEl.name}"] + div [data-pika-day="${date}"]`
        ));
    },
    getValidToken: (): string => '<header>.eyJzdWIiOjF9.<sig>'//btoa(JSON.stringify({sub: 1}));
};

function findElement<T extends Element>(rendered, tag: string, predicate: Function): T {
    const allButtons = itu.scryRenderedDOMElementsWithTag(rendered, tag);
    return Array.from(allButtons).find(el => predicate(el)) as T;
}

interface ConcreteValidatingComponent {
    new (...args: any[]): ValidatingComponent<any, any>;
}

const validationTestUtils = {
    isSubmitButtonClickable(rendered) {
        return (
            itu.findRenderedDOMElementWithClass(rendered, 'nice-button-primary') as HTMLButtonElement
        ).disabled === false;
    },
    getRenderedValidationErrors(rendered) {
        return itu.scryRenderedDOMElementsWithClass(rendered, 'text-error');
    },
    isValid(rendered, Component: ConcreteValidatingComponent) {
        const cmp = itu.findRenderedVNodeWithType(rendered, Component).children as any;
        return cmp.state.validity;
    }
};

export default utils;
export { validationTestUtils };
