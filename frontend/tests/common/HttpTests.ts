import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import UserState from 'src/user/UserState';
const testBaseUrl:string = 'http://smthng/api/v2/';

QUnit.module('common/Http', hooks => {
    let fetchContainer: GlobalFetch;
    let mockResponse: {status: number, json: Function};
    let shallowOfflineHttp: OfflineHttp;
    let shallowUserState: UserState;
    let http: Http;
    hooks.beforeEach(() => {
        Http.pendingRequestCount = 0;
        mockResponse = {status: 200, json: () => Promise.resolve('foo')};
        shallowOfflineHttp = Object.create(OfflineHttp.prototype);
        shallowUserState = Object.create(UserState.prototype);
        fetchContainer = {fetch: () => null};
        http = new Http(fetchContainer, shallowOfflineHttp, shallowUserState, testBaseUrl);
    });
    QUnit.test('get päivittää pendingRequestsCounterin arvon', assert => {
        sinon.stub(shallowUserState, 'isOffline').returns(Promise.resolve(false));
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
            done();
        });
    });
    QUnit.test('get ajaa interceptorit', assert => {
        const badResponse = JSON.parse(JSON.stringify(mockResponse));
        badResponse.status = 500;
        const fetchCallWatch = sinon.stub(fetchContainer, 'fetch');
        fetchCallWatch.onFirstCall().returns(Promise.resolve(mockResponse));
        fetchCallWatch.onSecondCall().returns(Promise.resolve(badResponse));
        const requestInterceptor = sinon.spy();
        const responseInterceptor = sinon.spy();
        const responseErrorInterceptor = sinon.spy();
        http.interceptors.push(new class InterceptorClass {
            request(req) { return requestInterceptor(req); }
            response(res) { return responseInterceptor(res); }
            responseError(res) { return responseErrorInterceptor(res); }
        });
        //
        const done = assert.async();
        http.get('foo').then(() => {
            assert.ok(requestInterceptor.calledOnce,
                'Pitäisi kutsua request-interceptoria'
            );
            assert.ok(requestInterceptor.firstCall.args[0] instanceof Request,
                'Pitäisi passata request-interceptorille window.Request-instanssin'
            );
            assert.ok(responseInterceptor.calledOnce,
                'Pitäisi kutsua response-interceptoria'
            );
            assert.deepEqual(responseInterceptor.firstCall.args[0], mockResponse,
                'Pitäisi passata response-interceptorille fetchin palauttaman arvon'
            );
            requestInterceptor.reset();
            return http.get('bar');
        }).then(null, () => {
            assert.ok(requestInterceptor.calledOnce,
                'Pitäisi kutsua request-interceptoria'
            );
            assert.ok(requestInterceptor.firstCall.args[0] instanceof Request,
                'Pitäisi passata request-interceptorille window.Request-instanssin'
            );
            assert.ok(responseErrorInterceptor.calledOnce,
                'Pitäisi kutsua responseError-interceptoria'
            );
            assert.deepEqual(responseErrorInterceptor.firstCall.args[0], badResponse,
                'Pitäisi passata responseError-interceptorille fetchin palauttaman arvon'
            );
            done();
        });
    });
    QUnit.test('sendRequest kutsuu fetchiä', assert => {
        sinon.stub(shallowUserState, 'isOffline').returns(Promise.resolve(false));
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
                    method: 'BOST',
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
        (http as any).sendRequest(requestUrl, 'BOST', requestData).then(result => {
            fetchCallWatch.verify();
            assert.deepEqual(result, mockResponseData);
            done();
        });
    });
    QUnit.test('sendRequest ajaa interceptorit', assert => {
        const badResponse = JSON.parse(JSON.stringify(mockResponse));
        badResponse.status = 500;
        sinon.stub(shallowUserState, 'isOffline').returns(Promise.resolve(false));
        const fetchCallWatch = sinon.stub(fetchContainer, 'fetch');
        fetchCallWatch.onFirstCall().returns(Promise.resolve(badResponse));
        fetchCallWatch.onSecondCall().returns(Promise.resolve(mockResponse));
        const requestInterceptor = sinon.spy();
        const responseInterceptor = sinon.spy();
        const responseErrorInterceptor = sinon.spy();
        http.interceptors.push({
            request: requestInterceptor,
            response: responseInterceptor,
            responseError: responseErrorInterceptor
        });
        //
        const done = assert.async();
        (http as any).sendRequest('foo', 'POST', {foo: 'bar'}).then(null, () => {
            assert.ok(requestInterceptor.calledOnce,
                'Pitäisi kutsua request-interceptoria'
            );
            assert.ok(requestInterceptor.firstCall.args[0] instanceof Request,
                'Pitäisi passata request-interceptorille window.Request-instanssin'
            );
            assert.ok(responseErrorInterceptor.calledOnce,
                'Pitäisi kutsua responseError-interceptoria'
            );
            assert.deepEqual(responseErrorInterceptor.firstCall.args[0], badResponse,
                'Pitäisi passata responseError-interceptorille fetchin palauttaman arvon'
            );
            requestInterceptor.reset();
            return (http as any).sendRequest('foo', 'POST', {foo: 'bar'});
        }).then(() => {
            assert.ok(requestInterceptor.calledOnce,
                'Pitäisi kutsua request-interceptoria'
            );
            assert.ok(requestInterceptor.firstCall.args[0] instanceof Request,
                'Pitäisi passata request-interceptorille window.Request-instanssin'
            );
            assert.ok(responseInterceptor.calledOnce,
                'Pitäisi kutsua response-interceptoria'
            );
            assert.deepEqual(responseInterceptor.firstCall.args[0], mockResponse,
                'Pitäisi passata response-interceptorille fetchin palauttaman arvon'
            );
            done();
        });
    });
    QUnit.test('sendRequest korvaa HTTP-kutsun offlineHandlerilla jos käyttäjä on offline', assert => {
        sinon.stub(shallowUserState, 'isOffline').returns(Promise.resolve(true));
        const fetchCallWatch = sinon.spy(fetchContainer, 'fetch');
        const requestUrl = 'baz/haz';
        const requestData = {foo: 'bar'};
        const mockHandlerResponseData = '{"j":"son"}';
        const mockOfflineHandlerWatcher = sinon.mock(shallowOfflineHttp);
        mockOfflineHandlerWatcher.expects('handle').once()
            .withExactArgs(requestUrl, {method: 'BOST', data: requestData})
            .returns(Promise.resolve(new Response(mockHandlerResponseData)));
        const done = assert.async();
        (http as any).sendRequest(requestUrl, 'BOST', requestData).then(result => {
            assert.ok(fetchCallWatch.notCalled, 'Ei pitäisi tehdä HTTP-pyyntöä');
            mockOfflineHandlerWatcher.verify();
            assert.deepEqual(result, JSON.parse(mockHandlerResponseData));
            done();
        });
    });
    QUnit.test('sendRequest suorittaa HTTP-pyynnön käyttäjän offline-tilasta huolimatta, jos skipOfflineCheck = true', assert => {
        sinon.stub(shallowUserState, 'isOffline').returns(Promise.resolve(true));
        const offlineHandlerCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const fetchCallStub = sinon.stub(fetchContainer, 'fetch').returns(new Response('{"o":0}'));
        const done = assert.async();
        (http as any).sendRequest('foo', 'POST', {foo: 'bar'}, true).then(() => {
            assert.ok(fetchCallStub.calledOnce, 'Pitäisi tehdä HTTP-pyyntö');
            assert.ok(offlineHandlerCallSpy.notCalled, 'Ei pitäisi ohjata offline-handerille');
            done();
        });
    });
    QUnit.test('post lähettää POST HTTP-pyynnön', assert => {
        const request = sinon.stub(http, 'sendRequest').returns(Promise.resolve('fo'));
        const url = 'foo';
        const data = {foo: 'bar'};
        //
        const done = assert.async();
        http.post(url, data).then(() => {
            assert.ok(request.calledOnce, 'Pitäisi lähettää HTTP-pyyntö');
            assert.deepEqual(request.firstCall.args, [
                url, 'POST', data, undefined // 0 = url, 1 = method, 2 = data, 3 = forceRequest/skipOfflineCheck
            ], 'Pitäisi lähettää nämä tiedot');
            done();
        });
    });
    QUnit.test('put lähettää PUT HTTP-pyynnön', assert => {
        const request = sinon.stub(http, 'sendRequest').returns(Promise.resolve('fo'));
        const url = 'foo';
        const data = {foo: 'bar'};
        //
        const done = assert.async();
        http.put(url, data).then(() => {
            assert.ok(request.calledOnce, 'Pitäisi lähettää HTTP-pyyntö');
            assert.deepEqual(request.firstCall.args, [
                url, 'PUT', data, undefined // 0 = url, 1 = method, 2 = data, 3 = forceRequest/skipOfflineCheck
            ], 'Pitäisi lähettää nämä tiedot');
            done();
        });
    });
    QUnit.test('delete lähettää DELETE HTTP-pyynnön ilman bodyä', assert => {
        const request = sinon.stub(http, 'sendRequest').returns(Promise.resolve('fo'));
        const url = 'foo';
        //
        const done = assert.async();
        http.delete(url).then(() => {
            assert.ok(request.calledOnce, 'Pitäisi lähettää HTTP-pyyntö');
            assert.deepEqual(request.firstCall.args, [
                url, 'DELETE', null, undefined // 0 = url, 1 = method, 2 = data, 3 = forceRequest/skipOfflineCheck
            ], 'Pitäisi lähettää nämä tiedot');
            done();
        });
    });
});