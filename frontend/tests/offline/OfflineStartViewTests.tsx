import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as infernoUtils from 'inferno-test-utils';
import OfflineStartView from 'src/offline/OfflineStartView';
import Offline from 'src/offline/Offline';
import iocFactories from 'src/ioc';

QUnit.module('offline/OfflineStartView', hooks => {
    let offlineIocFactoryOverride;
    hooks.beforeEach(() => {
        this.offline = Object.create(Offline.prototype);
        offlineIocFactoryOverride = sinon.stub(iocFactories, 'offline').returns(this.offline);
    });
    hooks.afterEach(() => {
        offlineIocFactoryOverride.restore();
    });
    QUnit.test('confirm enabloi offline-tilan', assert => {
        const goOffline = sinon.stub(this.offline, 'enable').returns(Promise.resolve(1));
        const close = sinon.spy(OfflineStartView.prototype, 'close');
        //
        const rendered = infernoUtils.renderIntoDocument(<OfflineStartView/>);
        const confirmButton = infernoUtils.findRenderedDOMElementWithClass(
            rendered, 'nice-button-primary'
        ) as HTMLButtonElement;
        //
        confirmButton.click();
        //
        assert.ok(goOffline.called, 'Pitäisi enabloida offline-tilan');
        const done = assert.async();
        goOffline.firstCall.returnValue.then(() => {
            assert.ok(close.called, 'Pitäisi lopuksi sulkea viewin');
            close.restore();
            done();
        });
    });
});
