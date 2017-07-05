import RESTBackend  from 'src/common/RESTBackend';

interface credentials {
    username: string;
    password: string;
}

/**
 * Vastaa /api/auth -REST-pyynnöistä.
 */
class AuthBackend extends RESTBackend<any> {
    public login(credentials: credentials) {
        return this.post<Enj.API.LoginResponse>(credentials, '/login');
    }
}

export default AuthBackend;
