package net.mdh.enj.auth;

public interface HashingProvider {
    String hash(char[] password);
    boolean verify(char[] plain, String hashed);
    String gensalt();
}
