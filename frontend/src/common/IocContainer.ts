
class IocContainer {
    public cache: Object;
    public constructor() {
        this.cache = {};
    }
    public memoize(key: string, fn: Function) {
        if (!this.cache.hasOwnProperty(key)) {
            this.cache[key] = fn();
        }
        return this.cache[key];
    }
}

export default IocContainer;
