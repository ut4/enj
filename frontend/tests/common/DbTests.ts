import QUnit from 'qunitjs';
import Db from 'src/common/Db';

QUnit.module('common/Db', hooks => {
    hooks.beforeEach(() => {
        this.db = new Db();
    });
    QUnit.test('constructor määrittelee scheman', assert => {
        assert.ok(this.db.hasOwnProperty('userState'));
        assert.ok(this.db.hasOwnProperty('syncQueue'));
    });
});