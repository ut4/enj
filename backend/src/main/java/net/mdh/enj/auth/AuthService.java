package net.mdh.enj.auth;

import javax.inject.Inject;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import net.mdh.enj.user.SelectFilters;
import net.mdh.enj.Application;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;

public class AuthService {

    static final Integer LOGIN_EXPIRATION = 5259600; // ~2kk

    private final TokenService tokenService;
    private final AuthUserRepository authUserRepository;
    private final HashingProvider hashingProvider;
    private static final Logger logger = LoggerFactory.getLogger(Application.class);

    @Inject
    AuthService(
        TokenService tokenService,
        AuthUserRepository authUserRepository,
        HashingProvider hashingProvider
    ) {
        this.tokenService = tokenService;
        this.authUserRepository = authUserRepository;
        this.hashingProvider = hashingProvider;
    }

    /**
     * Palauttaa käyttäjän tietokannasta, joka täsmää {credentials}eihin.
     */
    AuthUser getUser(LoginCredentials credentials) {
        SelectFilters selectFilters = new SelectFilters();
        selectFilters.setUsername(credentials.getUsername());
        AuthUser user = this.authUserRepository.selectOne(selectFilters);
        if (user == null || !this.hashingProvider.verify(
            credentials.getPassword(),
            user.getPasswordHash()
        )) {
            user = null;
        }
        credentials.nuke();
        return user;
    }

    /**
     * Tallentaa uuden JWT:n ja timestampin tietokantaan. Palauttaa uuden JWT:n.
     */
    String login(AuthUser user) {
        String tokenHash = this.tokenService.generateNew(user.getId());
        user.setLastLogin(System.currentTimeMillis() / 1000L);
        user.setCurrentToken(tokenHash);
        this.authUserRepository.update(user);
        return tokenHash;
    }

    /**
     * Uusii tokenin jos se on vanhentunut (mutta validi), tai palauttaa sen
     * sellaisenaan jos uusimista ei tarvita. Palauttaa null, jos tokenin parsiminen
     * ei onnistunut, tai käyttäjän viimeisestä kirjautumisesta on yli 2kk.
     */
    TokenData parseOrRenewToken(String tokenHash) {
        try {
            Jws<Claims> parsed = this.tokenService.parse(tokenHash);
            return new TokenData(parsed.getBody().getSubject(), tokenHash);
        } catch (MalformedJwtException | SignatureException | UnsupportedJwtException e) {
            return null;
        } catch (ExpiredJwtException e) { // vanhentunut, mutta muutoin validi
            Claims claims = this.tokenService.getClaimsFromExpiredToken(tokenHash);
            if (claims == null) {
                return null;
            }
            String userId = claims.getSubject();
            String newTokenHash = this.renewToken(tokenHash, userId);
            if (newTokenHash == null) {
                return null;
            }
            return new TokenData(userId, newTokenHash);
        }
    }

    /**
     * Luo uuden tokenin, ja tallentaa sen tietokantaan, tai palauttaa null, jos
     * expiredToken ei täsmännyt viimeisimpään tietokantaan tallennettuun tokeniin,
     * tai käyttäjän viimeisimmästä kirjautumisesta on yli 2kk.
     */
    private String renewToken(String expiredToken, String userId) {
        SelectFilters filters = new SelectFilters();
        filters.setId(userId);
        filters.setCurrentToken(expiredToken);
        AuthUser user = this.authUserRepository.selectOne(filters);
        // id, tai token ei täsmännyt
        if (user == null || user.getLastLogin() == null) {
            return null;
        }
        // Kirjautuminen yli 2kk vanha, poista se tietokannasta kokonaan
        if (System.currentTimeMillis() / 1000L >= user.getLastLogin() + LOGIN_EXPIRATION) {
            this.invalidateLogin(user);
            return null;
        }
        // Kaikki ok, luo uusi token & tallenna se kantaan
        String tokenHash = this.tokenService.generateNew(user.getId());
        user.setCurrentToken(tokenHash);
        if (this.authUserRepository.updateToken(user) < 1) {
            logger.error("Uusitun tokenin tallennus epäonnistui");
            return null;
        }
        return tokenHash;
    }

    private void invalidateLogin(AuthUser user) {
        user.setLastLogin(null);
        user.setCurrentToken(null);
        this.authUserRepository.update(user);
    }

    // -------------------------------------------------------------------------

    static class TokenData {
        String userId;
        String signature;
        TokenData(String userId, String signature) {
            this.userId = userId;
            this.signature = signature;
        }
    }
}
