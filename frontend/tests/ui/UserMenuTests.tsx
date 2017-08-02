import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as infernoUtils from 'inferno-test-utils';
import UserState from 'src/user/UserState';
import UserMenu from 'src/ui/UserMenu';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';
const mockToken: string = utils.getValidToken();

QUnit.module('ui/UserMenu', hooks => {
    let userStateIocFactoryOverride;
    let shallowUserState: UserState;
    hooks.beforeEach(() => {
        shallowUserState = Object.create(UserState.prototype);
        (shallowUserState as any).subscribers = [];
        userStateIocFactoryOverride = sinon.stub(iocFactories, 'userState').returns(shallowUserState);
    });
    hooks.afterEach(() => {
        userStateIocFactoryOverride.restore();
    });
    QUnit.test('mount näyttää vain kirjautumislinkin, jos käyttäjä ei kirjautunut+online', assert => {
        const onMountUserStateRead = sinon.stub(shallowUserState, 'getState').returns(Promise.resolve({
            isOffline: false,
            token: ''
        } as Enj.OfflineDbSchema.UserStateRecord));
        //
        const rendered = infernoUtils.renderIntoDocument(<UserMenu/>);
        // Assertoi initial tila
        assertOnlyLogInItemIsVisible();
        // Assertoi thenin jälkeinen tila
        const done = assert.async();
        onMountUserStateRead.firstCall.returnValue.then(() => {
            assertOnlyLogInItemIsVisible();
            done();
        });
        function assertOnlyLogInItemIsVisible() {
            const visibleUserMenuListItems = getVisibleUserMenuItems(rendered);
            assert.equal(visibleUserMenuListItems.length, 1);
            assert.equal(visibleUserMenuListItems[0].children[0].innerHTML, 'Kirjaudu sisään');
        }
    });
    QUnit.test('mount näyttää vain "go-online"-linkin, jos käyttäjä offline', assert => {
        const onMountUserStateRead = sinon.stub(shallowUserState, 'getState').returns(Promise.resolve({
            isOffline: true,
            // Tämän ei pitäisi vaikuttaa, käyttäjä ei voi olla kirjautunut ja offline samaan aikaan
            token: mockToken
        } as Enj.OfflineDbSchema.UserStateRecord));
        //
        const rendered = infernoUtils.renderIntoDocument(<UserMenu/>);
        //
        const done = assert.async();
        onMountUserStateRead.firstCall.returnValue.then(() => {
            const visibleUserMenuListItems = getVisibleUserMenuItems(rendered);
            assert.equal(visibleUserMenuListItems.length, 1);
            assert.equal(visibleUserMenuListItems[0].children[0].innerHTML, 'Go online');
            done();
        });
    });
    QUnit.test('mount näyttää profiili+"go-offline"-linkit jos käyttäjä kirjaunut+online', assert => {
        const onMountUserStateRead = sinon.stub(shallowUserState, 'getState').returns(Promise.resolve({
            isOffline: false,
            token: mockToken
        } as Enj.OfflineDbSchema.UserStateRecord));
        //
        const rendered = infernoUtils.renderIntoDocument(<UserMenu/>);
        //
        const done = assert.async();
        onMountUserStateRead.firstCall.returnValue.then(() => {
            const visibleUserMenuListItems = getVisibleUserMenuItems(rendered);
            assert.equal(visibleUserMenuListItems.length, 3);
            assert.ok(visibleUserMenuListItems.some(el => /Profiili/.test(el.innerHTML)));
            assert.ok(visibleUserMenuListItems.some(el => /Kirjaudu ulos/.test(el.innerHTML)));
            assert.ok(visibleUserMenuListItems.some(el => /Go offline/.test(el.innerHTML)));
            done();
        });
    });
    QUnit.test('Offline-staten tilaaja mutatoi komponentin statea', assert => {
        const onMountUserStateRead = sinon.stub(shallowUserState, 'getState').returns(Promise.resolve({
            isOffline: false,
            token: mockToken
        } as Enj.OfflineDbSchema.UserStateRecord));
        const subscribeRegistration = sinon.spy(shallowUserState, 'subscribe');
        //
        const rendered = infernoUtils.renderIntoDocument(<UserMenu/>);
        //
        const done = assert.async();
        onMountUserStateRead.firstCall.returnValue.then(() => {
            const visibleMenuItemsBefore = getVisibleUserMenuItems(rendered);
            assert.ok(visibleMenuItemsBefore.some(el => /Go offline/.test(el.innerHTML)));
            assert.ok(visibleMenuItemsBefore.some(el => /Profiili/.test(el.innerHTML)));
            // Simuloi offline-tilan muutos isEnabled false -> true
            const actualSubscribeFn = subscribeRegistration.firstCall.args[0];
            actualSubscribeFn({
                isOffline: true, // <----------- Tämä muuttuu false -> true
                token: mockToken
            } as Enj.OfflineDbSchema.UserStateRecord);
            const visibleMenuItemsAfter = getVisibleUserMenuItems(rendered);
            assert.notOk(visibleMenuItemsAfter.some(el => /Go offline/.test(el.innerHTML)));
            assert.notOk(visibleMenuItemsAfter.some(el => /Profiili/.test(el.innerHTML)));
            assert.ok(visibleMenuItemsAfter.some(el => /Go online/.test(el.innerHTML)));
            done();
        });
    });
    QUnit.test('Muutos UserState.token arvossa triggeröi komponentin staten päivittymisen', assert => {
        const onMountUserStateRead = sinon.stub(shallowUserState, 'getState').returns(Promise.resolve({
            isOffline: false,
            token: ''
        } as Enj.OfflineDbSchema.UserStateRecord));
        const subscribeRegistration = sinon.spy(shallowUserState, 'subscribe');
        //
        const rendered = infernoUtils.renderIntoDocument(<UserMenu/>);
        //
        const done = assert.async();
        onMountUserStateRead.firstCall.returnValue.then(() => {
            const visibleMenuItemsBefore = getVisibleUserMenuItems(rendered);
            assert.equal(visibleMenuItemsBefore[0].children[0].innerHTML, 'Kirjaudu sisään');
            // Simuloi userStaten-tilan muutos token '' -> <validToken>
            const actualSubscribeFn = subscribeRegistration.firstCall.args[0];
            actualSubscribeFn({
                isOffline: false,
                token: mockToken // <----------- Tämä muuttuu '' -> <token>
            } as Enj.OfflineDbSchema.UserStateRecord);
            const visibleMenuItemsAfter = getVisibleUserMenuItems(rendered);
            assert.notEqual(visibleMenuItemsAfter[0].children[0].innerHTML, 'Kirjaudu sisään');
            done();
        });
    });
    function getVisibleUserMenuItems(rendered): Array<Element> {
        return infernoUtils.scryRenderedDOMElementsWithTag(rendered, 'li');
    }
});
