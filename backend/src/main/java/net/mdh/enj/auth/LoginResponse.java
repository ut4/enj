package net.mdh.enj.auth;

abstract class Responses {
    static class LoginResponse {
        private String tokenHash;
        public LoginResponse() {}
        public LoginResponse(String tokenHash) {
            this.setToken(tokenHash);
        }
        public void setToken(String tokenHash) {
            this.tokenHash = tokenHash;
        }
        public String getToken() {
            return tokenHash;
        }
    }
    static class Ok {
        private boolean ok;
        public Ok() {
            this.ok = true;
        }
        public boolean isOk() {
            return this.ok;
        }
        public void setOk(boolean ok) {
            this.ok = ok;
        }
    }
}
