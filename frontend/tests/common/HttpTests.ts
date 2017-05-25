import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import UserState from 'src/user/UserState';

QUnit.module('common/Http', hooks => {
    const mockBaseUrl:string = 'http://smthng/';
    hooks.beforeEach(() => {
        Http.pendingRequestCount = 0;
        this.mockResponse = {json: function () {}};
        this.offlineHttp = Object.create(OfflineHttp.prototype);
        this.userState = Object.create(UserState.prototype);
        this.fetchContainer = window;
        this.http = new Http(this.fetchContainer, this.offlineHttp, this.userState, mockBaseUrl);
    });
    QUnit.test('get päivittää pendingRequestsCounterin arvon', assert => {
        sinon.stub(this.userState, 'isOffline').returns(Promise.resolve(false));
        const fetchStub = sinon.stub(this.fetchContainer, 'fetch').returns(Promise.resolve(this.mockResponse));
        const initialCounterValue = Http.pendingRequestCount;
        // == GET =====
        this.http.get('foo');
        assert.equal(Http.pendingRequestCount, initialCounterValue + 1,
            'Pitäisi suurentaa counteria yhdellä'
        );
        // == POST ====
        const promise = this.http.post('foo', {});
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
        sinon.stub(this.mockResponse, 'json').returns(mockResponseValue);
        const httpCallWatcher = sinon.stub(this.fetchContainer, 'fetch').returns(
            Promise.resolve(this.mockResponse)
        );
        const getCallUrl = 'foo/bar';
        const done = assert.async();
        this.http.get(getCallUrl).then(function (processedResponseValue) {
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
        sinon.stub(this.userState, 'isOffline').returns(Promise.resolve(false));
        const requestUrl = '/foo/bar';
        const requestData = {foo: 'bar'};
        const mockResponseData = 'qwe';
        sinon.stub(this.mockResponse, 'json').returns(mockResponseData);
        const httpCallWatcher = sinon.mock(this.fetchContainer);
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
            .returns(Promise.resolve(this.mockResponse));
        const done = assert.async();
        this.http.post(requestUrl, requestData).then(function (result) {
            httpCallWatcher.verify();
            assert.deepEqual(result, mockResponseData);
            done();
        });
    });
    QUnit.test('post korvaa HTTP-kutsun offlineHandlerilla jos käyttäjä on userState', assert => {
        sinon.stub(this.userState, 'isOffline').returns(Promise.resolve(true));
        const httpCallWatcher = sinon.spy(this.fetchContainer, 'fetch');
        const requestQueuerWatcher = sinon.stub(this.offlineHttp, 'logRequestToSyncQueue');
        sinon.stub(this.offlineHttp, 'hasHandlerFor').returns(true);
        const requestUrl = '/baz/haz';
        const requestData = {baz: 'haz'};
        const mockHandlerResponse = 'rtyt';
        const mockOfflineHandlerWatcher = sinon.mock(this.offlineHttp);
        mockOfflineHandlerWatcher.expects('handle').once()
            .withExactArgs(requestUrl, requestData)
            .returns(Promise.resolve(mockHandlerResponse));
        const done = assert.async();
        this.http.post(requestUrl, requestData).then(function (result) {
            assert.equal(httpCallWatcher.called, false,
                'Ei pitäisi tehdä HTTP-pyyntöä'
            );
            assert.ok(requestQueuerWatcher.calledOnce,
                'Pitäisi logata pyynnön syncQueueen'
            );
            assert.deepEqual(
                requestQueuerWatcher.firstCall.args,
                [requestUrl, requestData],
                'Pitäisi logata pyynnön tiedot syncQueueen'
            );
            mockOfflineHandlerWatcher.verify();
            assert.deepEqual(result, mockHandlerResponse);
            httpCallWatcher.restore();
            done();
        });
    });
    QUnit.test('post palauttaa userState-modessa 454 Responsen jos handleria ei löydy', assert => {
        sinon.stub(this.userState, 'isOffline').returns(Promise.resolve(true));
        const requestQueuerWatcher = sinon.spy(this.offlineHttp, 'logRequestToSyncQueue');
        sinon.stub(this.offlineHttp, 'hasHandlerFor').returns(false);
        const done = assert.async();
        this.http.post().then(null, function (result: Response) {
            assert.equal(requestQueuerWatcher.called, false);
            assert.equal(result.status, 454);
            done();
        });
    });
});