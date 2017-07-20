import QUnit from 'qunitjs';
import sinon from 'sinon';
import AuthBackend from 'src/auth/AuthBackend';
import UserState from 'src/user/UserState';
import AuthService from 'src/auth/AuthService';

QUnit.module('auth/AuthService', hooks => {
    let authBackendStub: AuthBackend;
    let userStateStub: UserState;
    let authService: AuthService;
    hooks.beforeEach(() => {
        authBackendStub = Object.create(AuthBackend.prototype);
        userStateStub = Object.create(UserState.prototype);
        authService = new AuthService(authBackendStub, userStateStub);
    });
    QUnit.test('login postaa credentiansit backendiin, ja tallentaa tokenin selaintietokantaan', assert => {
        const mockLoginResponse = {token: 'tkn'} as Enj.API.LoginResponse;
        const loginCallWatch = sinon.stub(authBackendStub, 'login').returns(Promise.resolve(mockLoginResponse));
        const userStateUpdateWatch = sinon.stub(userStateStub, 'setToken').returns(Promise.resolve());
        //
        const testCredentials = {username:'fyy', password: 'bars'};
        //
        const done = assert.async();
        authService.login(testCredentials).then(() => {
            // Backend POST
            assert.ok(loginCallWatch.calledOnce, 'Pitäisi postata dataa backendiin');
            assert.deepEqual(loginCallWatch.firstCall.args, [testCredentials], 'Pitäisi postata lomakkeen tiedot backendiin');
            // Userstaten päivitys
            assert.ok(userStateUpdateWatch.calledAfter(loginCallWatch), 'Pitäisi päivittää token');
            assert.deepEqual(userStateUpdateWatch.firstCall.args, [mockLoginResponse.token], 'Pitäisi tallentaa token');
            done();
        });
    });
});