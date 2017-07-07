import RESTBackend  from 'src/common/RESTBackend';

/**
 * Vastaa /api/auth -REST-pyynnöistä.
 */
class AuthBackend extends RESTBackend<any> {
    public login(credentials: Enj.API.LoginCredentials) {
        return this.post<Enj.API.LoginResponse>(credentials, '/login');
    }
}

export default AuthBackend;
