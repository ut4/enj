import QUnit from 'qunitjs';
import sinon from 'sinon';

QUnit.module('foo', () => {
    QUnit.test('afoo', assert => {
        var s = sinon.spy();
        s();
        assert.ok(s.called);
    });
});
