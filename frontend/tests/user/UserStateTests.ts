import QUnit from 'qunitjs';
import sinon from 'sinon';
import Db from 'src/common/Db';
import UserState from 'src/user/UserState';
import utils from 'tests/utils';
const mockToken: string = utils.getValidToken();

QUnit.module('user/UserState', hooks => {
    hooks.beforeEach(() => {
        this.db = new Db();
        this.userState = new UserState(this.db);
        this.subscribeFn = sinon.spy();
        this.userState.subscribe(this.subscribeFn);
    });
    QUnit.test('maybeIsLoggedIn palauttaa false jos indexedDb:ssä ei ole dataa', assert => {
        const done = assert.async();
        sinon.stub(this.db.userState, 'get').returns(Promise.resolve(undefined));
        this.userState.maybeIsLoggedIn().then(isIt => {
            assert.equal(isIt, false);
            done();
        });
    });
    QUnit.test('maybeIsLoggedIn palauttaa false jos indexedDb:n userState.token == \'\'', assert => {
        const done = assert.async();
        sinon.stub(this.db.userState, 'get').returns(Promise.resolve({
            isOffline: 'irrelevant',
            token: ''
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
            token: mockToken
        }));
        this.userState.maybeIsLoggedIn().then(isIt => {
            assert.equal(isIt, false);
            done();
        });
    });
    QUnit.test('maybeIsLoggedIn palauttaa true jos indexedDb:n userState.token on validi token', assert => {
        const done = assert.async();
        sinon.stub(this.db.userState, 'get').returns(Promise.resolve({
            isOffline: 'irrelevant',
            token: mockToken
        }));
        this.userState.maybeIsLoggedIn().then(isIt => {
            assert.equal(isIt, true);
            done();
        });
    });
    QUnit.test('setToken() kirjoittaa merkinnän storageen ja tiedottaa muutoksesta subscribeFn:lle', assert => {
        const done = assert.async();
        const succesfulDbUpdate = 1;
        const dbUpdate = sinon.stub(this.db.userState, 'put').returns(Promise.resolve(succesfulDbUpdate));
        this.userState.setToken(mockToken).then(() => {
            assert.ok(dbUpdate.calledOnce);
            const actualNewData = dbUpdate.firstCall.args[0];
            assert.equal(actualNewData.token, mockToken);
            assert.equal(actualNewData.id, 1, 'Pitäisi aina sisällyttää päivitettävään dataan id-vakio 1');
            assert.ok(this.subscribeFn.calledOnce);
            assert.deepEqual(this.subscribeFn.firstCall.args, dbUpdate.firstCall.args);
            done();
        });
    });
    QUnit.test('isOffline palauttaa false jos indexedDb:ssä ei ole dataa', assert => {
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
            token: 'irrelevant'
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
            token: 'irrelevant'
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
            const actualNewData = dbUpdate.firstCall.args[0];
            assert.equal(actualNewData.isOffline, true);
            assert.equal(actualNewData.id, 1, 'Pitäisi aina sisällyttää päivitettävään dataan id-vakio 1');
            assert.ok(this.subscribeFn.calledOnce);
            assert.deepEqual(this.subscribeFn.firstCall.args, dbUpdate.firstCall.args);
            done();
        });
    });
    QUnit.test('setIsOffline(false) kirjoittaa merkinnän storageen ja tiedottaa muutoksesta subscribeFn:lle', assert => {
        const done = assert.async();
        const succesfulDbUpdate = 1;
        const dbUpdate = sinon.stub(this.db.userState, 'put').returns(Promise.resolve(succesfulDbUpdate));
        this.userState.setIsOffline(false).then(() => {
            assert.ok(dbUpdate.calledOnce);
            const actualNewData = dbUpdate.firstCall.args[0];
            assert.equal(actualNewData.isOffline, false);
            assert.equal(actualNewData.id, 1, 'Pitäisi aina sisällyttää päivitettävään dataan id-vakio 1');
            assert.ok(this.subscribeFn.calledOnce);
            assert.deepEqual(this.subscribeFn.firstCall.args, dbUpdate.firstCall.args);
            done();
        });
    });
});
