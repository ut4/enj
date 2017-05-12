
QUnit.module('foo', () => {
    QUnit.test('afoo', assert => {
        var s = sinon.spy();
        s();
        assert.ok(s.called);
    });
});
