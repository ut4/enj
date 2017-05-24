import QUnit from 'qunitjs';
import sinon from 'sinon';
import UserState from 'src/user/UserState';

QUnit.module('user/UserState', hooks => {
    hooks.beforeEach(() => {
        this.mockSessionStorage = Object.create(window.sessionStorage.__proto__);
        this.userState = new UserState(this.mockSessionStorage);
    });
    QUnit.test('maybeIsLoggedIn palauttaa false jos tietoa ei ole sessionStoragessa', assert => {
        assert.equal(this.userState.maybeIsLoggedIn(), false);
    });
    QUnit.test('maybeIsLoggedIn palauttaa true jos storagesta löytyy sessio', assert => {
        this.mockSessionStorage.enjSession = '1';
        assert.equal(this.userState.maybeIsLoggedIn(), true);
    });
    QUnit.test('setMaybeIsLoggedIn(true) kirjoittaa merkinnän storageen', assert => {
        assert.equal(this.userState.maybeIsLoggedIn(), false);
        assert.equal(this.mockSessionStorage.enjSession, undefined);
        //
        this.userState.setMaybeIsLoggedIn(true);
        //
        assert.equal(this.userState.maybeIsLoggedIn(), true);
        assert.equal(this.mockSessionStorage.enjSession, '1');
    });
    QUnit.test('setMaybeIsLoggedIn(false) poistaa merkinnän storagesta', assert => {
        this.mockSessionStorage.enjSession = '1';
        assert.equal(this.userState.maybeIsLoggedIn(), true);
        const remove = sinon.stub(this.mockSessionStorage, 'removeItem');
        //
        this.userState.setMaybeIsLoggedIn(false);
        //
        assert.ok(remove.called);
        assert.deepEqual(remove.firstCall.args, ['enjSession']);
    });
    QUnit.test('setMaybeIsLoggedIn(true) kirjoittaa merkinnän storageen', assert => {
        assert.equal(this.userState.maybeIsLoggedIn(), false);
        assert.equal(this.mockSessionStorage.enjSession, undefined);
        //
        this.userState.setMaybeIsLoggedIn(true);
        //
        assert.equal(this.userState.maybeIsLoggedIn(), true);
        assert.equal(this.mockSessionStorage.enjSession, '1');
    });
    QUnit.test('setMaybeIsLoggedIn tiedottaa muutoksesta subsribeFn:lle', assert => {
        const subsriberFn = sinon.spy();
        this.userState.subscribe(subsriberFn);
        //
        this.userState.setMaybeIsLoggedIn(true);
        sinon.stub(this.mockSessionStorage, 'removeItem');
        this.userState.setMaybeIsLoggedIn(false);
        //
        assert.ok(subsriberFn.calledTwice);
        assert.deepEqual(subsriberFn.firstCall.args, [true]);
        assert.deepEqual(subsriberFn.secondCall.args, [false]);
    });
});
