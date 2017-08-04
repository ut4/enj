import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as infernoUtils from 'inferno-test-utils';
import OfflineStartView from 'src/offline/OfflineStartView';
import Offline from 'src/offline/Offline';
import iocFactories from 'src/ioc';

QUnit.module('offline/OfflineStartView', hooks => {
    let shallowOffline: Offline;
    let offlineIocFactoryOverride;
    hooks.beforeEach(() => {
        shallowOffline = Object.create(Offline.prototype);
        offlineIocFactoryOverride = sinon.stub(iocFactories, 'offline').returns(shallowOffline);
    });
    hooks.afterEach(() => {
        offlineIocFactoryOverride.restore();
    });
    QUnit.test('confirm enabloi offline-tilan', assert => {
        const goOffline = sinon.stub(shallowOffline, 'enable').returns(Promise.resolve(1));
        const close = sinon.spy(OfflineStartView.prototype, 'close');
        //
        const rendered = infernoUtils.renderIntoDocument(<OfflineStartView/>);
        const confirmButton = infernoUtils.findRenderedDOMElementWithClass(
            rendered, 'nice-button-primary'
        ) as HTMLButtonElement;
        //
        confirmButton.click();
        //
        assert.ok(goOffline.calledOnce, 'Pitäisi enabloida offline-tilan');
        const done = assert.async();
        goOffline.firstCall.returnValue.then(() => {
            assert.ok(close.calledOnce, 'Pitäisi lopuksi sulkea viewin');
            close.restore();
            done();
        });
    });
});
