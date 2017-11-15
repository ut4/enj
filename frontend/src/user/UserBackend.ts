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
    /**
     * Lähettää kuvan {fileData} backendiin tallennettavaksi. Palauttaa käyttäjä-
     * entiteetin, jonka base64ProfilePic-arvona skaalattu kuva-data.
     */
    public uploadProfilePic(fileData: FormData): Promise<Enj.API.User> {
        return this.http.sendFile<Enj.API.User>(this.completeUrl('/profile-pic'), fileData);
    }
}

export default UserBackend;
