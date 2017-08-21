import Http  from 'src/common/Http';
import UserState from 'src/user/UserState';

/**
 * Vastaa /api/user REST-pyynnöistä.
 */
class UserBackend {
    private http: Http;
    private userState: UserState;
    constructor(http: Http, userState: UserState) {
        this.http = http;
        this.userState = userState;
    }
    /**
     * Palauttaa käyttäjän backendistä.
     */
    public get(userId?: AAGUID): Promise<Enj.API.UserRecord> {
        return (!userId
            ? this.userState.getUserId()
            : Promise.resolve(userId)).then(
                userId => ({weight: 70, isMale: true}),
                () => null
            );
    }
}

export default UserBackend;
