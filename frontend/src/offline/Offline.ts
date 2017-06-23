import UserState from 'src/user/UserState';

const SERVICE_WORKER_FILEPATH = 'sw-main.js';

type serviceWorkerState = 'installed' | 'activated';
const serviceWorkerState = {
    INSTALLED: 'installed' as serviceWorkerState,
    ACTIVATED: 'activated' as serviceWorkerState
};

/**
 * Vastaa ServiceWorkerin asennuksesta ja päivityksestä, ja isOffline tilan
 * päivityksestä UserState:en.
 */
class Offline {
    private userState: UserState;
    private serviceWorkerContainer: ServiceWorkerContainer;
    public utils: {getNextId: (collection: Array<Object>, key?: string) => number};
    /**
     * @param {UserState} userState
     * @param {ServiceWorkerContainer=} serviceWorkerContainer esim. window.navigator.serviceWorker
     */
    public constructor(
        userState: UserState,
        serviceWorkerContainer?: ServiceWorkerContainer
    ) {
        this.userState = userState;
        this.serviceWorkerContainer = (
            // TODO checkkaa onko serviceworker navigaattorissa??
            serviceWorkerContainer || window.navigator.serviceWorker
        );
        this.utils = {
            getNextId: (collection: Array<Object>, key: string = 'id'): number =>
                collection.length ? Math.max(...collection.map(item => item[key])) + 1 : 1
        };
    }
    /**
     * Rekisteröi tai uudelleenaktivoi Service workerin, ja asettaa
     * UserState/indexedDb:n isOffline-tilaksi true.
     *
     * @return {Promise} -> ({integer} wasSuccesful, {object} error)
     */
    public enable(): Promise<number> {
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
            serviceWorker.postMessage({
                action: 'setIsOnline',
                value: false
            });
            return this.userState.setIsOffline(true);
        });
    }
    /**
     * Lähettää Service workerille tiedon tilan muutoksesta sekä asettaa
     * UserState/indexedDb:n isOffline-tilaksi false.
     *
     * @return {Promise} -> ({integer} wasSuccesful, {Object} error)
     */
    public disable(): Promise<number> {
        this.serviceWorkerContainer.controller.postMessage({
            action: 'setIsOnline',
            value: true
        });
        return this.userState.setIsOffline(false);
    }
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
