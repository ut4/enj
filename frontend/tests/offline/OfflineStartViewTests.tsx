import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import OfflineStartView from 'src/offline/OfflineStartView';
import Offline from 'src/offline/Offline';
import UserBackend from 'src/user/UserBackend';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

QUnit.module('offline/OfflineStartView', hooks => {
    let shallowOffline: Offline;
    let offlineIocFactoryOverride;
    let shallowUserBackend;
    let userBackendIocFactoryOverride;
    let fakeHistory: {goBack: sinon.SinonSpy};
    let historyIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        shallowOffline = Object.create(Offline.prototype);
        offlineIocFactoryOverride = sinon.stub(iocFactories, 'offline').returns(shallowOffline);
        shallowUserBackend = Object.create(UserBackend.prototype);
        userBackendIocFactoryOverride = sinon.stub(iocFactories, 'userBackend').returns(shallowUserBackend);
        fakeHistory = {goBack: sinon.spy()};
        historyIocOverride = sinon.stub(iocFactories, 'history').returns(fakeHistory);
    });
    hooks.afterEach(() => {
        offlineIocFactoryOverride.restore();
        userBackendIocFactoryOverride.restore();
        historyIocOverride.restore();
    });
    QUnit.test('näyttää viestin jos käyttäjän selain ei tue serviceworker-API:a', assert => {
        sinon.stub(shallowOffline, 'isSupported').returns(false);
        //
        const rendered = itu.renderIntoDocument(<OfflineStartView/>);
        assert.strictEqual(utils.findButtonByContent(rendered, 'Aloita offline-tila'), undefined);
        //
        assert.equal(itu.findRenderedDOMElementWithTag(rendered, 'h2').textContent, 'Hrmh..');
    });
    QUnit.test('confirm enabloi offline-tilan', assert => {
        sinon.stub(shallowOffline, 'isSupported').returns(true);
        sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve('mockUser'));
        const goOfflineStub = sinon.stub(shallowOffline, 'enable').returns(Promise.resolve(1));
        //
        const rendered = itu.renderIntoDocument(<OfflineStartView/>);
        const confirmStub = sinon.spy(itu.findRenderedVNodeWithType(rendered, OfflineStartView).children, 'confirm');
        //
        const confirmButton = utils.findButtonByContent(rendered, 'Aloita offline-tila');
        confirmButton.click();
        //
        const done = assert.async();
        confirmStub.firstCall.returnValue.then(() => {
            assert.ok(goOfflineStub.calledOnce, 'Pitäisi enabloida offline-tilan');
            assert.ok(fakeHistory.goBack.calledAfter(goOfflineStub), 'Pitäisi lopuksi ohjata käyttäjä takaisin');
            done();
        });
    });
    QUnit.test('confirm ei enabloi offline-tilaa, jos käyttäjä ei ole kirjautunut', assert => {
        sinon.stub(shallowOffline, 'isSupported').returns(true);
        sinon.stub(shallowUserBackend, 'get').returns(Promise.reject(new Error('fus')));
        const goOfflineSpy = sinon.spy(shallowOffline, 'enable');
        //
        const rendered = itu.renderIntoDocument(<OfflineStartView/>);
        const confirmStub = sinon.spy(itu.findRenderedVNodeWithType(rendered, OfflineStartView).children, 'confirm');
        //
        const confirmButton = utils.findButtonByContent(rendered, 'Aloita offline-tila');
        confirmButton.click();
        //
        const done = assert.async();
        confirmStub.firstCall.returnValue.then(() => {
            assert.ok(goOfflineSpy.notCalled, 'Ei pitäisi enabloida offline-tilaa');
            done();
        });
    });
});
