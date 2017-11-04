package net.mdh.enj.auth;

import io.jsonwebtoken.Jwts;
import net.mdh.enj.AppConfig;
import java.util.Date;

/**
 * Lisää generateNew:iin vain testeissä tarvittavan age-parametrin.
 */
class FixableTokenService extends TokenService {

    FixableTokenService(AppConfig appConfig) {
        super(Jwts::builder, Jwts::parser, appConfig);
    }

    String generateNew(String userId, Long age) {
        return this.jwtBuilderFactory.get()
            .setSubject(userId)
            .setExpiration(new Date(System.currentTimeMillis() + age))
            .signWith(SIGNATURE_ALGO, JWT_KEY)
            .compact();
    }
}
