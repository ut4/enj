package net.mdh.enj.auth;

interface Credentials {
    String getUsername();
    void setUsername(String username);
    char[] getPassword();
    void setPassword(char[] currentPassword);
    void nuke();
}
