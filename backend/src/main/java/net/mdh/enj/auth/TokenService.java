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
import java.util.Date;

public class TokenService {
    private static final String JWT_KEY = "foobar";
    /**
     * Aika, jonka token on validi luomisen jälkeen. Yksikkö millisekunteina.
     */
    public static final long JWT_AGE_IN_MS = 900000; // 15min
    private final SignatureAlgorithm SIGNATURE_ALGO = SignatureAlgorithm.HS512; // HMAC using SHA-512
    private final JwtBuilder jwtBuilder;
    private final JwtParser jwtParser;

    public TokenService() {
        this.jwtBuilder = Jwts.builder();
        this.jwtParser = Jwts.parser();
    }
    public TokenService(JwtBuilder jwtBuilder, JwtParser jwtParser) {
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
    public String generateNew(Integer userId) {
        return this.jwtBuilder
            .setSubject(String.valueOf(userId))
            .setExpiration(new Date(System.currentTimeMillis() + JWT_AGE_IN_MS))
            .signWith(SIGNATURE_ALGO, JWT_KEY)
            .compact();
    }

    /**
     * @param token Token, josta claimsit halutaan lukea
     * @return Token-data, tai null jos token ei ollut validi
     */
    public Jws<Claims> parse(String token) {
        try {
            return this.jwtParser.setSigningKey(JWT_KEY).parseClaimsJws(token);
        } catch (MalformedJwtException | ExpiredJwtException | SignatureException | UnsupportedJwtException e) {
            // TODOLOGGER
            return null;
        }
    }

    /**
     * @param token Validoitava token
     * @return Onko validi
     */
    public boolean isValid(String token) {
        return this.parse(token) != null;
    }
}
