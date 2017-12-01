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
}
