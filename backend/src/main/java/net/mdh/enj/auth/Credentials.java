package net.mdh.enj.auth;

interface Credentials {
    char[] getPassword();
    void setPassword(char[] currentPassword);
    void nuke();
}
