package net.mdh.enj.auth;

import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.impl.TextCodec;
import io.jsonwebtoken.impl.DefaultClaims;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.mdh.enj.JsonMapperProvider;
import net.mdh.enj.AppConfig;
import javax.inject.Inject;
import java.io.IOException;
import java.util.function.Supplier;
import java.security.SecureRandom;
import java.util.Date;
import java.util.Map;

public class TokenService {

    private final Supplier<JwtParser> jwtParserFactory;
    private final ObjectMapper objectMapper;
    private static final String AB = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final SecureRandom random = new SecureRandom();

    final byte[] JWT_KEY;
    final static long JWT_AGE_IN_MS = AuthService.TOKEN_EXPIRATION * 1000;
    final SignatureAlgorithm SIGNATURE_ALGO = SignatureAlgorithm.HS512; // HMAC using SHA-512
    final Supplier<JwtBuilder> jwtBuilderFactory;

    @Inject
    TokenService(AppConfig appConfig) {
        this(Jwts::builder, Jwts::parser, appConfig);
    }
    TokenService(
        Supplier<JwtBuilder> jwtBuilderFactory,
        Supplier<JwtParser> jwtParserFactory,
        AppConfig appConfig
    ) {
        this.JWT_KEY = appConfig.authTokenSigningKey.getBytes();
        this.objectMapper = JsonMapperProvider.getInstance();
        this.jwtBuilderFactory = jwtBuilderFactory;
        this.jwtParserFactory = jwtParserFactory;
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
        return this.jwtBuilderFactory.get()
            .setSubject(userId)
            .setExpiration(new Date(System.currentTimeMillis() + JWT_AGE_IN_MS))
            .signWith(SIGNATURE_ALGO, JWT_KEY)
            .compact();
    }

    /**
     * https://stackoverflow.com/a/157202
     */
    String generateRandomString(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(AB.charAt(random.nextInt(AB.length())));
        }
        return sb.toString();
    }

    /**
     * @param token Token, josta claimsit halutaan lukea
     * @return Token-data, tai null jos token ei ollut validi
     */
    Jws<Claims> parse(String token) throws MalformedJwtException, ExpiredJwtException,
        SignatureException, UnsupportedJwtException {
        return this.jwtParserFactory.get().setSigningKey(JWT_KEY).parseClaimsJws(token);
    }

    Claims getClaimsFromExpiredToken(String expiredButValidToken) throws RuntimeException {
        try {
            return new DefaultClaims(this.objectMapper.readValue(
                TextCodec.BASE64URL.decodeToString(expiredButValidToken.split("\\.")[1]),
                Map.class
            ));
        } catch (IOException e) {
            throw new RuntimeException("JWT:n lukeminen epäonnistui");
        }
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
