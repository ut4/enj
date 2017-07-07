import QUnit from 'qunitjs';
import sinon from 'sinon';
import AuthBackend from 'src/auth/AuthBackend';
import UserState from 'src/user/UserState';
import AuthService from 'src/auth/AuthService';

QUnit.module('auth/AuthService', hooks => {
    let authBackendStub: AuthBackend;
    let localStorageStub: Storage;
    let userStateStub: UserState;
    let authService: AuthService;
    hooks.beforeEach(() => {
        authBackendStub = Object.create(AuthBackend.prototype);
        localStorageStub = Object.create(window.localStorage.__proto__);
        userStateStub = Object.create(UserState.prototype);
        authService = new AuthService(authBackendStub, localStorageStub, userStateStub);
    });
    QUnit.test('login postaa credentiansit backendiin, tallentaa tokenin, ja päivittää userStaten', assert => {
        const mockToken = {token: 'tkn'} as Enj.API.LoginResponse;
        const loginCallWatch = sinon.stub(authBackendStub, 'login').returns(Promise.resolve(mockToken));
        const tokenSaveWatch = sinon.stub(localStorageStub, 'setItem');
        const userStateUpdateWatch = sinon.stub(userStateStub, 'setMaybeIsLoggedIn').returns(Promise.resolve());
        //
        const testCredentials = {username:'fyy', password: 'bars'};
        //
        const done = assert.async();
        authService.login(testCredentials).then(() => {
            // Backend POST
            assert.ok(loginCallWatch.calledOnce, 'Pitäisi postata dataa backendiin');
            assert.deepEqual(loginCallWatch.firstCall.args, [testCredentials], 'Pitäisi postata lomakkeen tiedot backendiin');
            // Tokenin tallennus
            assert.ok(tokenSaveWatch.calledAfter(loginCallWatch), 'Pitäisi tallentaa token');
            assert.deepEqual(tokenSaveWatch.firstCall.args, ['enj_token', 'tkn'], 'Pitäisi tallentaa token oikein');
            // Userstaten päivitys
            assert.ok(userStateUpdateWatch.calledAfter(tokenSaveWatch), 'Pitäisi päivittää käyttäjän tila');
            assert.deepEqual(userStateUpdateWatch.firstCall.args, [true], 'Pitäisi päivittää userIsMaybeLoggedIn -> true');
            done();
        });
    });
});