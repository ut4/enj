import QUnit from 'qunitjs';
import IocContainer from 'src/common/IocContainer';

class TestClass {
    public foo: string;
    public constructor() {
        this.foo = 'bar';
    }
}

QUnit.module('common/IocContainer', hooks => {
    hooks.beforeEach(() => {
        this.container = new IocContainer();
    });
    QUnit.test('memoize cachettaa ja palauttaa itemin', assert => {
        const factory = () => new TestClass();
        const item = this.container.memoize('key', factory);
        item.foo = 'baz';
        const shouldBeSameItem = this.container.memoize('key', factory);
        assert.ok(shouldBeSameItem == item);
        assert.equal(shouldBeSameItem.foo, item.foo);
    });
});