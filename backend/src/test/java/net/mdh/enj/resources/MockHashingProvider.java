package net.mdh.enj.resources;

import net.mdh.enj.auth.HashingProvider;

public class MockHashingProvider implements HashingProvider {
    @Override
    public String gensalt() {
        return "";
    }
    @Override
    public String hash(char[] password) {
        return genMockHash(password);
    }
    public static String genMockHash(char[] password) {
        return String.valueOf(password) + "hash";
    }
    @Override
    public boolean verify(char[] plain, String hashed) {
        return String.valueOf(plain).equals(hashed);
    }
}
