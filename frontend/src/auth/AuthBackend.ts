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
    public updateCredentials(credentials: Enj.API.Credentials) {
        return this.update(credentials, '/credentials');
    }
}

export default AuthBackend;
