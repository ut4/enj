import QUnit from 'qunitjs';
import sinon from 'sinon';
import Db from 'src/common/Db';
import UserState from 'src/user/UserState';

QUnit.module('user/UserState', hooks => {
    hooks.beforeEach(() => {
        this.db = new Db();
        this.userState = new UserState(this.db);
        this.subscribeFn = sinon.spy();
        this.userState.subscribe(this.subscribeFn);
    });
    QUnit.test('maybeIsLoggedIn palauttaa false jos tietoa ei ole indexedDb:ssä', assert => {
        const done = assert.async();
        sinon.stub(this.db.userState, 'get').returns(Promise.resolve(undefined));
        this.userState.maybeIsLoggedIn().then(isIt => {
            assert.equal(isIt, false);
            done();
        });
    });
    QUnit.test('maybeIsLoggedIn palauttaa false jos indexedDb:n userState.maybeIsLoggedIn == false', assert => {
        const done = assert.async();
        sinon.stub(this.db.userState, 'get').returns(Promise.resolve({
            isOffline: 'irrelevant',
            maybeIsLoggedIn: false
        }));
        this.userState.maybeIsLoggedIn().then(isIt => {
            assert.equal(isIt, false);
            done();
        });
    });
    QUnit.test('maybeIsLoggedIn palauttaa false aina, kun indexedDb:n userState.isOffline == true', assert => {
        const done = assert.async();
        sinon.stub(this.db.userState, 'get').returns(Promise.resolve({
            isOffline: true,
            maybeIsLoggedIn: true
        }));
        this.userState.maybeIsLoggedIn().then(isIt => {
            assert.equal(isIt, false);
            done();
        });
    });
    QUnit.test('maybeIsLoggedIn palauttaa true jos indexedDb:n userState.maybeIsLoggedIn == true', assert => {
        const done = assert.async();
        sinon.stub(this.db.userState, 'get').returns(Promise.resolve({
            isOffline: 'irrelevant',
            maybeIsLoggedIn: true
        }));
        this.userState.maybeIsLoggedIn().then(isIt => {
            assert.equal(isIt, true);
            done();
        });
    });
    QUnit.test('setMaybeIsLoggedIn(true) kirjoittaa merkinnän storageen ja tiedottaa muutoksesta subscribeFn:lle', assert => {
        const done = assert.async();
        const succesfulDbUpdate = 1;
        const dbUpdate = sinon.stub(this.db.userState, 'put').returns(Promise.resolve(succesfulDbUpdate));
        this.userState.setMaybeIsLoggedIn(true).then(() => {
            assert.ok(dbUpdate.calledOnce);
            assert.equal(dbUpdate.firstCall.args[0].maybeIsLoggedIn, true);
            assert.ok(this.subscribeFn.calledOnce);
            assert.deepEqual(this.subscribeFn.firstCall.args, dbUpdate.firstCall.args);
            done()
        });
    });
    QUnit.test('setMaybeIsLoggedIn(false) kirjoittaa merkinnän storageen ja tiedottaa muutoksesta subscribeFn:lle', assert => {
        const done = assert.async();
        const succesfulDbUpdate = 1;
        const dbUpdate = sinon.stub(this.db.userState, 'put').returns(Promise.resolve(succesfulDbUpdate));
        this.userState.setMaybeIsLoggedIn(false).then(() => {
            assert.ok(dbUpdate.calledOnce);
            assert.equal(dbUpdate.firstCall.args[0].maybeIsLoggedIn, false);
            assert.ok(this.subscribeFn.calledOnce);
            assert.deepEqual(this.subscribeFn.firstCall.args, dbUpdate.firstCall.args);
            done()
        });
    });
    QUnit.test('isOffline palauttaa false jos tietoa ei ole indexedDb:ssä', assert => {
        const done = assert.async();
        sinon.stub(this.db.userState, 'get').returns(Promise.resolve(undefined));
        this.userState.isOffline().then(isIt => {
            assert.equal(isIt, false);
            done();
        });
    });
    QUnit.test('isOffline palauttaa false jos indexedDb:n userState.isOffline == false', assert => {
        const done = assert.async();
        sinon.stub(this.db.userState, 'get').returns(Promise.resolve({
            isOffline: false,
            maybeIsLoggedIn: 'irrelevant'
        }));
        this.userState.isOffline().then(isIt => {
            assert.equal(isIt, false);
            done();
        });
    });
    QUnit.test('isOffline palauttaa true jos indexedDb:n userState.isOffline == true', assert => {
        const done = assert.async();
        sinon.stub(this.db.userState, 'get').returns(Promise.resolve({
            isOffline: true,
            maybeIsLoggedIn: 'irrelevant'
        }));
        this.userState.isOffline().then(isIt => {
            assert.equal(isIt, true);
            done();
        });
    });
    QUnit.test('setIsOffline(true) kirjoittaa merkinnän storageen ja tiedottaa muutoksesta subscribeFn:lle', assert => {
        const done = assert.async();
        const succesfulDbUpdate = 1;
        const dbUpdate = sinon.stub(this.db.userState, 'put').returns(Promise.resolve(succesfulDbUpdate));
        this.userState.setIsOffline(true).then(() => {
            assert.ok(dbUpdate.calledOnce);
            assert.equal(dbUpdate.firstCall.args[0].isOffline, true);
            assert.ok(this.subscribeFn.calledOnce);
            assert.deepEqual(this.subscribeFn.firstCall.args, dbUpdate.firstCall.args);
            done()
        });
    });
    QUnit.test('setIsOffline(false) kirjoittaa merkinnän storageen ja tiedottaa muutoksesta subscribeFn:lle', assert => {
        const done = assert.async();
        const succesfulDbUpdate = 1;
        const dbUpdate = sinon.stub(this.db.userState, 'put').returns(Promise.resolve(succesfulDbUpdate));
        this.userState.setIsOffline(false).then(() => {
            assert.ok(dbUpdate.calledOnce);
            assert.equal(dbUpdate.firstCall.args[0].isOffline, false);
            assert.ok(this.subscribeFn.calledOnce);
            assert.deepEqual(this.subscribeFn.firstCall.args, dbUpdate.firstCall.args);
            done()
        });
    });
});
