const utils = {
    fakeSWScope: (cacheName: string) => {
        const scope = window;
        (scope as any).CACHE_NAME = cacheName;
        // monkeypatch CacheStorage.match
        scope.caches.match = (req: Request): Promise<any> =>
            scope.caches.open(cacheName).then(c => c.match(req));
        // Convenience methods
        (scope as any).putTestCache = (data: {url: string, value: any}) =>
            scope.caches.open(cacheName).then(c =>
                c.put(data.url, new Response(JSON.stringify(data.value)))
            );
        (scope as any).cleanTestCache = () =>
            scope.caches.delete(cacheName);
        return scope;
    },
    triggerEvent: (type: string, el: Element) => {
        const event = document.createEvent('HTMLEvents');
        event.initEvent(type, false, true);
        el.dispatchEvent(event);
    }
};

export default utils;
