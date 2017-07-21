import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import UserState from 'src/user/UserState';
const testBaseUrl:string = 'http://smthng/api/v2/';

QUnit.module('common/Http', hooks => {
    let fetchContainer: GlobalFetch = window;
    let mockResponse: {status: number, json: Function};
    let offlineHttp: OfflineHttp;
    let userState: UserState;
    let http: Http;
    hooks.beforeEach(() => {
        Http.pendingRequestCount = 0;
        mockResponse = {status: 200, json: () => Promise.resolve('foo')};
        offlineHttp = Object.create(OfflineHttp.prototype);
        userState = Object.create(UserState.prototype);
        http = new Http(fetchContainer, offlineHttp, userState, testBaseUrl);
    });
    QUnit.test('get päivittää pendingRequestsCounterin arvon', assert => {
        sinon.stub(userState, 'isOffline').returns(Promise.resolve(false));
        const fetchCallWatch = sinon.stub(fetchContainer, 'fetch').returns(Promise.resolve(mockResponse));
        const initialCounterValue = Http.pendingRequestCount;
        // == GET =====
        http.get('foo');
        assert.equal(Http.pendingRequestCount, initialCounterValue + 1,
            'Pitäisi suurentaa counteria yhdellä'
        );
        // == POST ====
        const promise = http.post('foo', {});
        assert.equal(Http.pendingRequestCount, initialCounterValue + 2,
            'Pitäisi suurentaa counteria edelleen yhdellä'
        );
        const done = assert.async();
        promise.then(() => {
            assert.equal(Http.pendingRequestCount, initialCounterValue,
                'Pitäisi palauttaa counterin alkuperäiseen arvoon'
            );
            fetchCallWatch.restore();
            done();
        });
    });
    QUnit.test('get kutsuu fetchiä baseUrlilla prefiksoituna', assert => {
        const mockResponseValue = {foo: 'bar'};
        sinon.stub(mockResponse, 'json').returns(mockResponseValue);
        const fetchCallWatch = sinon.stub(fetchContainer, 'fetch').returns(
            Promise.resolve(mockResponse)
        );
        const getCallUrl = 'foo/bar';
        const done = assert.async();
        http.get(getCallUrl).then(processedResponseValue => {
            const actualUrl = fetchCallWatch.firstCall.args[0].url;
            const expectedUrl = testBaseUrl + getCallUrl;
            assert.equal(
                actualUrl,
                expectedUrl,
                'Pitäsi tehdä GET HTTP-pyynnön baseUrlilla prefiksoituna'
            );
            assert.deepEqual(
                processedResponseValue,
                mockResponseValue,
                'Pitäisi resolvata response.json():nin arvon'
            );
            fetchCallWatch.restore();
            done();
        });
    });
    QUnit.test('get ajaa interceptorit', assert => {
        mockResponse.status = 500;
        const fetchCallWatch = sinon.stub(fetchContainer, 'fetch').returns(Promise.resolve(mockResponse));
        const requestInterceptor = sinon.spy();
        const responseErrorInterceptor = sinon.spy();
        http.interceptors.push(new class InterceptorClass {
            request(req) { return requestInterceptor(req); }
            responseError(res) { return responseErrorInterceptor(res); }
        });
        //
        const done = assert.async();
        http.get('foo').then(null, () => {
            assert.ok(
                requestInterceptor.calledOnce,
                'Pitäisi kutsua pre-interceptoria'
            );
            assert.ok(
                requestInterceptor.firstCall.args[0] instanceof Request,
                'Pitäisi passata pre-interceptorille window.Request-instanssin'
            );
            assert.ok(
                responseErrorInterceptor.calledOnce,
                'Pitäisi kutsua post-interceptoria'
            );
            assert.deepEqual(
                responseErrorInterceptor.firstCall.args[0],
                mockResponse,
                'Pitäisi passata post-interceptorille fetchin palauttaman arvon'
            );
            fetchCallWatch.restore();
            done();
        });
    });
    QUnit.test('post kutsuu fetchiä baseUrlilla prefiksoituna', assert => {
        sinon.stub(userState, 'isOffline').returns(Promise.resolve(false));
        const requestUrl = '/foo/bar';
        const requestData = {foo: 'bar'};
        const mockResponseData = 'qwe';
        sinon.stub(mockResponse, 'json').returns(mockResponseData);
        const fetchCallWatch = sinon.mock(fetchContainer);
        fetchCallWatch.expects('fetch').once()
            .withExactArgs(new Request(
                // Pitäisi prefiksoida url
                testBaseUrl + requestUrl,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    // Pitäisi jsonifoida datan
                    body: JSON.stringify(requestData)
                }
            ))
            .returns(Promise.resolve(mockResponse));
        const done = assert.async();
        http.post(requestUrl, requestData).then(result => {
            fetchCallWatch.verify();
            assert.deepEqual(result, mockResponseData);
            done();
        });
    });
    QUnit.test('post ajaa interceptorit', assert => {
        mockResponse.status = 500;
        sinon.stub(userState, 'isOffline').returns(Promise.resolve(false));
        const fetchCallWatch = sinon.stub(fetchContainer, 'fetch').returns(Promise.resolve(mockResponse));
        const requestInterceptor = sinon.spy();
        const responseErrorInterceptor = sinon.spy();
        http.interceptors.push({
            request: requestInterceptor,
            responseError: responseErrorInterceptor
        });
        //
        const done = assert.async();
        http.post('foo', {foo: 'bar'}).then(null, () => {
            assert.ok(
                requestInterceptor.calledOnce,
                'Pitäisi kutsua pre-interceptoria'
            );
            assert.ok(
                requestInterceptor.firstCall.args[0] instanceof Request,
                'Pitäisi passata pre-interceptorille window.Request-instanssin'
            );
            assert.ok(
                responseErrorInterceptor.calledOnce,
                'Pitäisi kutsua post-interceptoria'
            );
            assert.deepEqual(
                responseErrorInterceptor.firstCall.args[0],
                mockResponse,
                'Pitäisi passata post-interceptorille fetchin palauttaman arvon'
            );
            fetchCallWatch.restore();
            done();
        });
    });
    QUnit.test('post korvaa HTTP-kutsun offlineHandlerilla jos käyttäjä on offline', assert => {
        sinon.stub(userState, 'isOffline').returns(Promise.resolve(true));
        const fetchCallWatch = sinon.spy(fetchContainer, 'fetch');
        const requestUrl = 'baz/haz';
        const requestData = {baz: 'haz'};
        const mockHandlerResponseData = '{"j":"son"}';
        const mockOfflineHandlerWatcher = sinon.mock(offlineHttp);
        mockOfflineHandlerWatcher.expects('handle').once()
            .withExactArgs(requestUrl, {method:'POST', data: requestData})
            .returns(Promise.resolve(new Response(mockHandlerResponseData)));
        const done = assert.async();
        http.post(requestUrl, requestData).then(result => {
            assert.ok(fetchCallWatch.notCalled, 'Ei pitäisi tehdä HTTP-pyyntöä');
            mockOfflineHandlerWatcher.verify();
            assert.deepEqual(result, JSON.parse(mockHandlerResponseData));
            fetchCallWatch.restore();
            done();
        });
    });
    QUnit.test('post suorittaa HTTP-pyynnön käyttäjän offline-tilasta huolimatta, jos skipOfflineCheck = true', assert => {
        sinon.stub(userState, 'isOffline').returns(Promise.resolve(true));
        const offlineHandlerCallSpy = sinon.spy(offlineHttp, 'handle');
        const fetchCallStub = sinon.stub(fetchContainer, 'fetch').returns(new Response('{"o":0}'));
        const done = assert.async();
        http.post('foo', {foo: 'bar'}, true).then(() => {
            assert.ok(fetchCallStub.calledOnce, 'Pitäisi tehdä HTTP-pyynnön');
            assert.ok(offlineHandlerCallSpy.notCalled, 'Ei pitäisi ohjata offline-handerille');
            done();
        });
    });
});