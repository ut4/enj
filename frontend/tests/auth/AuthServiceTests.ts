import QUnit from 'qunitjs';
import sinon from 'sinon';
import AuthBackend from 'src/auth/AuthBackend';
import UserState from 'src/user/UserState';
import AuthService from 'src/auth/AuthService';

QUnit.module('auth/AuthService', hooks => {
    let shallowAuthBackend: AuthBackend;
    let shallowUserState: UserState;
    let authService: AuthService;
    hooks.beforeEach(() => {
        shallowAuthBackend = Object.create(AuthBackend.prototype);
        shallowUserState = Object.create(UserState.prototype);
        authService = new AuthService(shallowAuthBackend, shallowUserState);
    });
    QUnit.test('login postaa credentiansit backendiin, ja tallentaa tokenin selaintietokantaan', assert => {
        const mockLoginResponse = {token: 'tkn'} as Enj.API.LoginResponse;
        const loginCallWatch = sinon.stub(shallowAuthBackend, 'login').returns(Promise.resolve(mockLoginResponse));
        const userStateUpdateWatch = sinon.stub(shallowUserState, 'setToken').returns(Promise.resolve());
        //
        const testCredentials = {username:'fyy', password: 'bars'};
        //
        const done = assert.async();
        authService.login(testCredentials).then(() => {
            // Backend POST
            assert.ok(loginCallWatch.calledOnce, 'Pitäisi POSTata dataa backendiin');
            assert.deepEqual(loginCallWatch.firstCall.args, [testCredentials], 'Pitäisi postata lomakkeen tiedot backendiin');
            // Userstaten päivitys
            assert.ok(userStateUpdateWatch.calledAfter(loginCallWatch), 'Pitäisi päivittää token');
            assert.deepEqual(userStateUpdateWatch.firstCall.args, [mockLoginResponse.token], 'Pitäisi tallentaa token');
            done();
        });
    });
    QUnit.test('logout postaa logout-pyynnön backendiin, ja poistaa tokenin selaintietokannasta', assert => {
        const logoutCallWatch = sinon.stub(shallowAuthBackend, 'logout').returns(Promise.resolve(undefined));
        const tokenClearWatch = sinon.stub(shallowUserState, 'setToken').returns(Promise.resolve());
        //
        const testCredentials = {username:'fyy', password: 'bars'};
        //
        const done = assert.async();
        authService.logout().then(() => {
            assert.ok(logoutCallWatch.calledOnce, 'Pitäisi POSTata logout-pyyntö backendiin');
            assert.ok(tokenClearWatch.calledAfter(logoutCallWatch), 'Pitäisi päivittää token');
            assert.deepEqual(tokenClearWatch.firstCall.args, [''], 'Pitäisi clearata token');
            done();
        });
    });
    QUnit.test('deleteUser lähettää pyynnön backendiin, ja poistaa tokenin selaintietokannasta', assert => {
        const deleteCallWatch = sinon.stub(shallowAuthBackend, 'delete').returns(Promise.resolve({ok: true}));
        const tokenClearWatch = sinon.stub(shallowUserState, 'setToken').returns(Promise.resolve());
        //
        const mockTestUser = {id: 'fos'} as any;
        //
        const done = assert.async();
        authService.deleteUser(mockTestUser).then(() => {
            assert.ok(deleteCallWatch.calledOnce, 'Pitäisi lähettää DELETE-pyyntö backendiin');
            assert.deepEqual(deleteCallWatch.firstCall.args, [mockTestUser]);
            assert.ok(tokenClearWatch.calledAfter(deleteCallWatch), 'Pitäisi päivittää token');
            assert.deepEqual(tokenClearWatch.firstCall.args, [''], 'Pitäisi clearata token');
            done();
        });
    });
});