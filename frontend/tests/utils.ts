const utils = {
    fakeSWScope: (cacheName: string) => {
        const scope = window;
        (<any>scope).CACHE_NAME = cacheName;
        // monkeypatch CacheStorage.match
        scope.caches.match = (req: Request): Promise<any> =>
            scope.caches.open(cacheName).then(c => c.match(req));
        // Convenience methods
        (<any>scope).putTestCache = (data: {url: string, value: any}) =>
            scope.caches.open(cacheName).then(c =>
                c.put(data.url, new Response(JSON.stringify(data.value)))
            );
        (<any>scope).cleanTestCache = () =>
            scope.caches.delete(cacheName);
        return scope;
    },
    triggerOnChange: (el: HTMLSelectElement) => {
        const event = document.createEvent('HTMLEvents');
        event.initEvent('change', false, true);
        el.dispatchEvent(event);
    }
};

export default utils;
