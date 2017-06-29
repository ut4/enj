package net.mdh.enj.resources;

import net.mdh.enj.auth.HashingProvider;

public class MockHashingProvider implements HashingProvider {
    @Override
    public String gensalt() {
        return "";
    }
    @Override
    public String hash(char[] password) {
        return "";
    }
    @Override
    public boolean verify(char[] plain, String hashed) {
        return String.valueOf(plain).equals(hashed);
    }
}
