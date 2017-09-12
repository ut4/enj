import RESTBackend  from 'src/common/RESTBackend';

/**
 * Vastaa /api/auth -REST-pyynnöistä.
 */
class AuthBackend extends RESTBackend<any> {
    public login(credentials: Enj.API.LoginCredentials) {
        return this.post<Enj.API.LoginResponse>(credentials, '/login', true);
    }
    public logout() {
        return this.post(null, '/logout');
    }
}

export default AuthBackend;
