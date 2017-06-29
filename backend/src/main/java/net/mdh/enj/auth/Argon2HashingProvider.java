package net.mdh.enj.auth;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;

public class Argon2HashingProvider implements HashingProvider {
    // Number of iterations
    private final int hashIterations = 2;
    // Memory usage to in kibibytes
    private final int hashMemory = 65536;
    // Number of threads and compute lanes
    private final int hashParallelism = 1;

    private final Argon2 argon2;

    public Argon2HashingProvider() {
        this.argon2 = Argon2Factory.create();
    }
    @Override
    public String gensalt() {
        throw new UnsupportedOperationException("Not implemented");
    }
    @Override
    public String hash(char[] password) {
        return argon2.hash(hashIterations, hashMemory, hashParallelism, password);
    }
    @Override
    public boolean verify(char[] plain, String hashed) {
        return this.argon2.verify(hashed, plain);
    }
}
