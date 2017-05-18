import Db from 'src/common/Db';

const SERVICE_WORKER_FILEPATH = 'sw-main.js';
const CLIENT_ID = 1;

type appStatus = 'offline' | 'online';
const appStatus = {
    OFFLINE: 'offline' as appStatus,
    ONLINE: 'online' as appStatus
};
type serviceWorkerState = 'installed' | 'activated';
const serviceWorkerState = {
    INSTALLED: 'installed' as serviceWorkerState,
    ACTIVATED: 'activated' as serviceWorkerState
};

class Offline {
    private db: Db;
    private serviceWorkerContainer: ServiceWorkerContainer;
    /**
     * @param {Db} db
     * @param {ServiceWorkerContainer=} serviceWorkerContainer esim. window.navigator.serviceWorker
     */
    public constructor(
        db: Db,
        serviceWorkerContainer?: ServiceWorkerContainer
    ) {
        this.db = db;
        this.serviceWorkerContainer = (
            // TODO checkkaa onko serviceworker navigaattorissa??
            serviceWorkerContainer || window.navigator.serviceWorker
        );
    }
    /**
     * @param {integer=} clientId
     * @return {Promise} -> ({boolean} isEnabled, {object} error)
     */
    public isEnabled(clientId?: number): Promise<boolean> {
        return this.db.network.get(clientId || CLIENT_ID).then(row =>
            row !== undefined && row.status === appStatus.OFFLINE
        );
    }
    /**
     * @param {integer=} clientId
     * @return {Promise} -> ({integer} numRows, {object} error)
     */
    public enable(clientId?: number): Promise<number> {
        // TODO - checkkaa isonline ensin?
        return (
        // == 1. Handlaa serviceworker =========================================
        this.serviceWorkerContainer.controller
            // ServiceWorker jo rekisteröity
            ? resolveWhenActive(this.serviceWorkerContainer.controller)
            // ServiceWorkeriä ei vielä rekisteröity (tai tarvitsee upgraden?)
            : this.serviceWorkerContainer.register(SERVICE_WORKER_FILEPATH)
                .then(registration => {
                    let serviceWorker;
                    if (registration.installing) {
                        serviceWorker = registration.installing;
                    } else if (registration.waiting) {
                        serviceWorker = registration.waiting;
                    } else if (registration.active) {
                        serviceWorker = registration.active;
                    }
                    if (!serviceWorker) {
                        return Promise.reject(new Error('idk wattodo, help?'));
                    }
                    return resolveWhenActive(serviceWorker);
                })
        // == 2. Päivitä selaintietokannan modeksi "offline" ===================
        ).then((serviceWorker: ServiceWorker) => {
            console.log(serviceWorker)
            serviceWorker.postMessage({
                action: 'setIsOnline',
                value: false
            });
            return setDbStatus(appStatus.OFFLINE, this.db, clientId);
        });
    }
    /**
     * @param {integer=} clientId
     * @return {Promise} -> ({integer} numRows, {Object} error)
     */
    public disable(clientId: number): Promise<number> {
        // TODO - checkkaa isoffline ensin?
        this.serviceWorkerContainer.controller.postMessage({
            action: 'setIsOnline',
            value: true
        });
        return setDbStatus(appStatus.ONLINE, this.db, clientId);
        // TODO synkkaa kaikki itemit jos yheys päällä, jos ei db.update.jokuflagi -> syncUsPlease
    }
    /**
     * @return {Promise} -> ({boolean} wasSucceful, {Object} error)
     */
    unregister(): Promise<boolean> {
        return this.serviceWorkerContainer.getRegistration()
            .then(registration => 
                registration.unregister()
            );
    };
    /**
     * @param {any} message
     * @return {Promise} -> ({any} resolvedValue, {any} rejectedValue)
     */
    public sendAsyncMessage(message: any): Promise<any> {
        // This wraps the message posting/response in a promise, which will resolve if the response doesn't
        // contain an error, and reject with the error if it does. If you'd prefer, it's possible to call
        // controller.postMessage() and set up the onmessage handler independently of a promise, but this is
        // a convenient wrapper.
        return new Promise((resolve, reject) => {
            var messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = event => {
                console.log('got', event.data);
                !event.data.error ? resolve(event.data) : reject(event.data);
            };
            // This sends the message data as well as transferring messageChannel.port2 to the service worker.
            // The service worker can then use the transferred port to reply via postMessage(), which
            // will in turn trigger the onmessage handler on messageChannel.port1.
            // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
            this.serviceWorkerContainer.controller.postMessage(
                message,
                [messageChannel.port2]
            );
        });
    }
    /**
     * @return {string} esim. r-0396805113351404
     */
    public getNewRandomId(): string {
        return 'r-' + Math.random().toFixed(16).substr(2);
    }
}

/**
 * @param {string} status
 * @param {Db} db
 * @param {integer=} clientId
 * @return {Promise} -> ({number} numRows, {Object} error)
 */
function setDbStatus(
    status: appStatus,
    db: Db,
    clientId?: number
): Promise<number> {
    return db.network.put({
        id: clientId || CLIENT_ID,
        status: status
    });
}

/**
 * @param {ServiceWorker} serviceWorker
 * @return {Promise} -> ({ServiceWorker} sw, void)
 */
function resolveWhenActive(serviceWorker: ServiceWorker): Promise<ServiceWorker> {
    if (serviceWorker.state === serviceWorkerState.ACTIVATED) {
        return Promise.resolve(serviceWorker);
    }
    // lisää fail timeout (jos ei resolvattu timeoutin sisällä -> reject)??
    return new Promise(resolve => {
        serviceWorker.addEventListener('statechange', e => {
            if ((<any>e.target).state === serviceWorkerState.ACTIVATED) {
                resolve(<ServiceWorker>e.target);
            }
        });
    });
}

export default Offline;
