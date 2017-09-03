package net.mdh.enj.auth;

import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.impl.DefaultClock;
import net.mdh.enj.AppConfig;
import javax.inject.Inject;
import java.util.Date;

public class TokenService {
    private final byte[] JWT_KEY;
    /**
     * Aika, jonka token on validi luomisen jälkeen. Yksikkö millisekunteina.
     */
    static final long JWT_AGE_IN_MS = 10; // 15min
    private final SignatureAlgorithm SIGNATURE_ALGO = SignatureAlgorithm.HS512; // HMAC using SHA-512
    private final JwtBuilder jwtBuilder;
    private final JwtParser jwtParser;

    @Inject
    TokenService(AppConfig appConfig) throws Exception {
        this(Jwts.builder(), Jwts.parser(), appConfig);
    }
    TokenService(JwtBuilder jwtBuilder, JwtParser jwtParser, AppConfig appConfig) throws Exception {
        String secretKeyConfigValue = appConfig.getProperty("auth.tokenSigningKey");
        if (secretKeyConfigValue == null) {
            throw new Exception("auth.tokenSigningKey configuration property not found.");
        }
        this.JWT_KEY = secretKeyConfigValue.getBytes();
        this.jwtBuilder = jwtBuilder;
        this.jwtParser = jwtParser;
    }

    /**
     * Generoi uuden, {this.SIGNATURE_ALGO}:lla signeeratun JsonWebToken subjek-
     * tilla {username}, joka on voimassa {TokenService.JWT_AGE_IN_MS} millise-
     * kuntia.
     *
     * @param userId "subject"-kentän arvo
     * @return Signattu JWT
     */
    String generateNew(String userId) {
        return this.generateNew(userId, null);
    }
    String generateNew(String userId, Long age) {
        return this.jwtBuilder
            .setSubject(userId)
            .setExpiration(new Date(System.currentTimeMillis() + (age == null ? JWT_AGE_IN_MS: age)))
            .signWith(SIGNATURE_ALGO, JWT_KEY)
            .compact();
    }

    /**
     * @param token Token, josta claimsit halutaan lukea
     * @return Token-data, tai null jos token ei ollut validi
     */
    Jws<Claims> parse(String token) throws MalformedJwtException, ExpiredJwtException,
        SignatureException, UnsupportedJwtException {
        return this.jwtParser.setSigningKey(JWT_KEY).parseClaimsJws(token);
    }
    Jws<Claims> parseExpired(String token) throws MalformedJwtException,
        SignatureException, UnsupportedJwtException {
        this.jwtParser.setClock(() -> new Date(1));
        Jws<Claims> jws = this.jwtParser.setSigningKey(JWT_KEY).parseClaimsJws(token);
        this.jwtParser.setClock(DefaultClock.INSTANCE);
        return jws;
    }

    /**
     * @param token Validoitava token
     * @return Onko validi
     */
    boolean isValid(String token) {
        try {
            this.parse(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
