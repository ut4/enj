import QUnit from 'qunitjs';
import sinon from 'sinon';
import Db from 'src/common/Db';
import UserState from 'src/user/UserState';
import AuthHttpInterceptors from 'src/auth/AuthHttpInterceptors';

QUnit.module('auth/AuthHttpInterceptors', hooks => {
    let userState: UserState;
    let mockHistory: any;
    let authInterceptor: AuthHttpInterceptors;
    hooks.beforeEach(() => {
        userState = new UserState(new Db());
        mockHistory = {replace: sinon.spy(), location: {pathname: 'fus', search: '?ro'}};
        authInterceptor = new AuthHttpInterceptors(userState, mockHistory);
    });
    QUnit.test('.setup asettaa tokenin UserStatelta, hurrdurr', assert => {
        sinon.stub(userState, 'getState').returns(Promise.resolve({token: 'fo'}));
        const done = assert.async();
        authInterceptor.setup().then(() => {
            assert.equal(authInterceptor.token, 'fo', 'Pitäisi asettaa tokeniksi userState.token');
            done();
        });
    });
    QUnit.test('.request lisää tokenin pyynnön headereihin, jos se on asetettu', assert => {
        // Token asetettu
        authInterceptor.token = 'dfg';
        const req = new Request('foo');
        authInterceptor.request(req);
        assert.ok(req.headers.has('Authorization'), 'Pitäisi lisätä header');
        assert.equal(req.headers.get('Authorization'), 'Bearer dfg', 'Pitäisi asettaa token headeriin');
        // Tokenia ei asetettu
        authInterceptor.token = '';
        const req2 = new Request('bar');
        authInterceptor.request(req2);
        assert.notOk(req2.headers.has('Authorization'), 'Ei pitäisi asettaa headeria');
    });
    QUnit.test('.response päivittää headereissa saadun uuden tokenin selaintietokantaan', assert => {
        const tokenUpdateStub = sinon.stub(userState, 'setToken');
        const normalResponse = new Response('foo');
        const mockNewToken = 'berber';
        const responseWithNewToken = new Response('foo', {headers: {'new-token': mockNewToken}});
        const responseWithNewTokenCased = new Response('foo', {headers: {'New-Token': mockNewToken}});
        authInterceptor.response(normalResponse);
        assert.ok(tokenUpdateStub.notCalled, 'Ei pitäisi tehdä mitään, jos responsessa ei ole uutta tokenia');
        authInterceptor.response(responseWithNewToken);
        assert.ok(tokenUpdateStub.calledOnce, 'Pitäisi päivittää uusi token selaintietokantaan');
        authInterceptor.response(responseWithNewTokenCased);
        assert.deepEqual(tokenUpdateStub.firstCall.args,
            [mockNewToken],
            'Pitäisi päivittää headerissa saatu uusi token selaintietokantaan'
        );
        assert.ok(tokenUpdateStub.calledTwice, 'Pitäisi vastaanottaa myös Pascal-Case\'d token');
    });
    QUnit.test('.responseError ohjaa käyttäjän kirjautumissivulle, jos backend palauttaa 401 && url != auth/login', assert => {
        const res = new FakeResponse('auth/login', 401);
        authInterceptor.responseError(res as any);
        assert.ok(mockHistory.replace.notCalled, 'Ei pitäisi ohjata kirjautumissivulle, koska url = auth/login');
        //
        const res2 = new FakeResponse('foo/bar', 500);
        authInterceptor.responseError(res2 as any);
        assert.ok(mockHistory.replace.notCalled, 'Ei pitäisi ohjata kirjautumissivulle, koska status != 401');
        //
        const tokenClearStub = sinon.stub(userState, 'setToken');
        const res3 = new FakeResponse('foo/bar', 401);
        authInterceptor.responseError(res3 as any);
        assert.ok(tokenClearStub.calledOnce, 'Pitäisi poistaa selaintietokantaan tallennettu token');
        assert.ok(mockHistory.replace.calledOnce, 'Pitäisi ohjata kirjautumissivulle');
        assert.deepEqual(mockHistory.replace.firstCall.args,
            [`/kirjaudu?returnTo=${mockHistory.location.pathname}${mockHistory.location.search}&from=401`],
            'Pitäisi passata kirjautumis-urliin parametrit'
        );
    });
    QUnit.test('UserState-tilaaja päivittää tokenin arvon', assert => {
        sinon.stub(userState, 'getState').returns(Promise.resolve({token: ''}));
        sinon.stub((userState as any).db.userState, 'put').returns(Promise.resolve(1));
        const tokenBefore = authInterceptor.token;
        // Simuloi userStaten muutos
        const done = assert.async();
        userState.setToken('foo').then(() => {
            //
            assert.equal(authInterceptor.token, 'foo');
            assert.notEqual(authInterceptor.token, tokenBefore);
            done();
        });
    });
    class FakeResponse {
        url: string;
        status: number;
        public constructor(url, status) {
            this.url = url;
            this.status = status;
        }
    }
});