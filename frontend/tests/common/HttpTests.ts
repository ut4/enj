import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import UserState from 'src/user/UserState';

QUnit.module('common/Http', hooks => {
    const mockBaseUrl:string = 'http://smthng/';
    let fetchContainer: GlobalFetch = window;
    let mockResponse: {json: Function};
    let offlineHttp: OfflineHttp;
    let userState: UserState;
    let http: Http;
    hooks.beforeEach(() => {
        Http.pendingRequestCount = 0;
        mockResponse = {json: function () {}};
        offlineHttp = Object.create(OfflineHttp.prototype);
        userState = Object.create(UserState.prototype);
        http = new Http(fetchContainer, offlineHttp, userState, mockBaseUrl);
    });
    QUnit.test('get päivittää pendingRequestsCounterin arvon', assert => {
        sinon.stub(userState, 'isOffline').returns(Promise.resolve(false));
        const fetchStub = sinon.stub(fetchContainer, 'fetch').returns(Promise.resolve(mockResponse));
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
        promise.then(function () {
            assert.equal(Http.pendingRequestCount, initialCounterValue,
                'Pitäisi palauttaa counterin alkuperäiseen arvoon'
            );
            fetchStub.restore();
            done();
        });
    });
    QUnit.test('get kutsuu fetchiä baseUrlilla prefiksoituna', assert => {
        const mockResponseValue = {foo: 'bar'};
        sinon.stub(mockResponse, 'json').returns(mockResponseValue);
        const httpCallWatcher = sinon.stub(fetchContainer, 'fetch').returns(
            Promise.resolve(mockResponse)
        );
        const getCallUrl = 'foo/bar';
        const done = assert.async();
        http.get(getCallUrl).then(function (processedResponseValue) {
            const actualUrl = httpCallWatcher.firstCall.args[0];
            const expectedUrl = mockBaseUrl + getCallUrl;
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
            httpCallWatcher.restore();
            done();
        });
    });
    QUnit.test('post kutsuu fetchiä baseUrlilla prefiksoituna', assert => {
        sinon.stub(userState, 'isOffline').returns(Promise.resolve(false));
        const requestUrl = '/foo/bar';
        const requestData = {foo: 'bar'};
        const mockResponseData = 'qwe';
        sinon.stub(mockResponse, 'json').returns(mockResponseData);
        const httpCallWatcher = sinon.mock(fetchContainer);
        httpCallWatcher.expects('fetch').once()
            .withExactArgs(
                // Pitäisi prefiksoida urlin
                mockBaseUrl + requestUrl,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    // Pitäisi jsonifoida datan
                    body: JSON.stringify(requestData)
                }
            )
            .returns(Promise.resolve(mockResponse));
        const done = assert.async();
        http.post(requestUrl, requestData).then(function (result) {
            httpCallWatcher.verify();
            assert.deepEqual(result, mockResponseData);
            done();
        });
    });
    QUnit.test('post korvaa HTTP-kutsun offlineHandlerilla jos käyttäjä on offline', assert => {
        sinon.stub(userState, 'isOffline').returns(Promise.resolve(true));
        const httpCallWatcher = sinon.spy(fetchContainer, 'fetch');
        const requestQueuerWatcher = sinon.stub(offlineHttp, 'logRequestToSyncQueue');
        sinon.stub(offlineHttp, 'hasHandlerFor').returns(true);
        const requestUrl = '/baz/haz';
        const requestData = {baz: 'haz'};
        const mockHandlerResponse = 'rtyt';
        const mockOfflineHandlerWatcher = sinon.mock(offlineHttp);
        mockOfflineHandlerWatcher.expects('handle').once()
            .withExactArgs('POST', requestUrl, requestData)
            .returns(Promise.resolve(mockHandlerResponse));
        const done = assert.async();
        http.post(requestUrl, requestData).then(function (result) {
            assert.equal(httpCallWatcher.called, false,
                'Ei pitäisi tehdä HTTP-pyyntöä'
            );
            assert.ok(requestQueuerWatcher.calledOnce,
                'Pitäisi logata pyynnön syncQueueen'
            );
            assert.deepEqual(
                requestQueuerWatcher.firstCall.args,
                [{method: 'POST', url: requestUrl, data: requestData, response: mockHandlerResponse}],
                'Pitäisi logata pyynnön tiedot syncQueueen'
            );
            mockOfflineHandlerWatcher.verify();
            assert.deepEqual(result, mockHandlerResponse);
            httpCallWatcher.restore();
            done();
        });
    });
    QUnit.test('post palauttaa userState-modessa 454 Responsen jos handleria ei löydy', assert => {
        sinon.stub(userState, 'isOffline').returns(Promise.resolve(true));
        const requestQueuerWatcher = sinon.spy(offlineHttp, 'logRequestToSyncQueue');
        sinon.stub(offlineHttp, 'hasHandlerFor').returns(false);
        const done = assert.async();
        http.post('foo', null).then(null, function (result: Response) {
            assert.equal(requestQueuerWatcher.called, false);
            assert.equal(result.status, 454);
            done();
        });
    });
});