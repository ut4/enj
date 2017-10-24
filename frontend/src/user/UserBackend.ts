import Http  from 'src/common/Http';
import RESTBackend from 'src/common/RESTBackend';
import UserState from 'src/user/UserState';

/**
 * Vastaa /api/user REST-pyynnöistä.
 */
class UserBackend extends RESTBackend<Enj.API.User> {
    public constructor(http, urlNamespace) {
        super(http, urlNamespace);
    }
    /**
     * Disabled.
     */
    public insert(data, url?): Promise<any> {
        throw new Error('Disabled');
    }
    /**
     * Hakee kirjautuneen käyttäjän tiedot backendistä.
     */
    public get(url?: string): Promise<Enj.API.User> {
        return super.get('/me' + (url || ''));
    }
    /**
     * Disabled.
     */
    public delete(data, url?): Promise<any> {
        throw new Error('Disabled');
    }
    /**
     * Disabled.
     */
    public getAll(url?): Promise<any> {
        throw new Error('Disabled');
    }
}

export default UserBackend;
