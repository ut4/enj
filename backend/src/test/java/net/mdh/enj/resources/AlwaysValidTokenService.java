package net.mdh.enj.resources;

import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.DefaultClaims;
import io.jsonwebtoken.impl.DefaultJws;
import net.mdh.enj.auth.TokenService;

/*
 * TokenService-implementaatio, jonka .parse(<token>)-metodi palauttaa validin
 * token-datan jokaisella kerralla.
 */
public class AlwaysValidTokenService extends TokenService {
    public AlwaysValidTokenService() {
        super(null, null);
    }
    public Jws<Claims> parse(String token) {
        Claims mockClaims = new DefaultClaims();
        mockClaims.setSubject(String.valueOf(TestData.TEST_USER_ID));
        return new DefaultJws<>(
            null,       // header
            mockClaims, // body
            null        // signature
        );
    }
}
