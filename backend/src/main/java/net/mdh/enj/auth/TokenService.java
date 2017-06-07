package net.mdh.enj.auth;

import io.jsonwebtoken.Jwts;
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
    private final SignatureAlgorithm SIGNATURE_ALGO = SignatureAlgorithm.HS512;
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
     * @param username "subject"-kentän arvo
     * @return Signattu JWT
     */
    public String generateNew(String username) {
        return this.jwtBuilder
            .setSubject(username)
            .setExpiration(new Date(System.currentTimeMillis() + JWT_AGE_IN_MS))
            .signWith(SIGNATURE_ALGO, JWT_KEY)
            .compact();
    }

    /**
     * Palauttaa tiedon, onko {token} validi.
     *
     * @param token Validoitava token
     * @return Onko validi
     */
    public boolean isValid(String token) {
        try {
            this.jwtParser.setSigningKey(JWT_KEY).parseClaimsJws(token);
            return true;
        } catch (MalformedJwtException | ExpiredJwtException | SignatureException | UnsupportedJwtException e) {
            // TODOLOGGER
        }
        return false;
    }
}
