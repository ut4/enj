package net.mdh.enj.auth;

public interface HashingProvider {
    public String hash(char[] password);
    public boolean verify(char[] plain, String hashed);
    public String gensalt();
}
