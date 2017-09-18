package net.mdh.enj.auth;

import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.TextCodec;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import org.springframework.transaction.annotation.Transactional;
import net.mdh.enj.user.SelectFilters;
import net.mdh.enj.Application;
import net.mdh.enj.Mailer;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import javax.inject.Inject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class AuthService {

    static final int LOGIN_EXPIRATION = 5259600;        // ~2kk
    static final int ACTIVATION_KEY_EXPIRATION = 86400; // 24h
    static final int ACTIVATION_KEY_LENGTH = 32;

    private final TokenService tokenService;
    private final AuthUserRepository authUserRepository;
    private final HashingProvider hashingProvider;
    private final Mailer mailer;
    private static final Logger logger = LoggerFactory.getLogger(Application.class);

    @Inject
    AuthService(
        TokenService tokenService,
        AuthUserRepository authUserRepository,
        HashingProvider hashingProvider,
        Mailer mailer
    ) {
        this.tokenService = tokenService;
        this.authUserRepository = authUserRepository;
        this.hashingProvider = hashingProvider;
        this.mailer = mailer;
    }

    /**
     * Palauttaa käyttäjän tietokannasta, joka täsmää {credentials}eihin.
     */
    AuthUser getUser(Credentials credentials) {
        SelectFilters selectFilters = new SelectFilters();
        if (credentials instanceof LoginCredentials) {
            selectFilters.setUsername(((LoginCredentials) credentials).getUsername());
        } else if (credentials instanceof UpdateCredentials) {
            selectFilters.setId(((UpdateCredentials) credentials).getUserId());
        }
        AuthUser user = this.authUserRepository.selectOne(selectFilters);
        if (user == null || !this.hashingProvider.verify(
            credentials.getPassword(),
            user.getPasswordHash()
        )) {
            user = null;
        }
        return user;
    }

    /**
     * Tallentaa uuden JWT:n ja timestampin tietokantaan. Palauttaa uuden JWT:n.
     */
    String login(AuthUser user) {
        String tokenHash = this.tokenService.generateNew(user.getId());
        user.setLastLogin(System.currentTimeMillis() / 1000L);
        user.setCurrentToken(tokenHash);
        this.authUserRepository.update(user, new AuthUserRepository.UpdateColumn[]{
            AuthUserRepository.UpdateColumn.LAST_LOGIN,
            AuthUserRepository.UpdateColumn.CURRENT_TOKEN
        });
        return tokenHash;
    }

    /**
     * Poistaa JWT:n, ja lastLogin-timestampin tietokannasta.
     *
     * @throws RuntimeException Jos tietojen kirjoitus tietokantaan epäonnistuu.
     */
    void logout(String userId) {
        AuthUser cleared = new AuthUser();
        cleared.setId(userId);
        cleared.setLastLogin(null);
        cleared.setCurrentToken(null);
        if (this.authUserRepository.update(cleared, new AuthUserRepository.UpdateColumn[]{
            AuthUserRepository.UpdateColumn.LAST_LOGIN,
            AuthUserRepository.UpdateColumn.CURRENT_TOKEN,
        }) < 1) {
            throw new RuntimeException("Tietokantaan kirjoitus epäonnistui");
        }
    }

    /**
     * Lisää uuden käyttäjän tietokantaan uuden aktivointiavaimen kera, ja lähettää
     * aktivointilinkin sähköpostilla käyttäjälle. Hylkää transactionin mikäli
     * sähköpostin lähetys, tai tietojen kirjoitus tietokantaan epäonnistui.
     *
     * @throws RuntimeException Jos emailin lähetys, tai tietojen kirjoitus tietokantaan epäonnistuu.
     */
    @Transactional
    void register(RegistrationCredentials credentials) {
        // 1. Lisää käyttäjä
        AuthUser user = new AuthUser();
        user.setUsername(credentials.getUsername());
        user.setEmail(credentials.getEmail());
        user.setCreatedAt(System.currentTimeMillis() / 1000L);
        user.setPasswordHash(this.hashingProvider.hash(credentials.getPassword()));
        user.setIsActivated(0);
        user.setActivationKey(this.tokenService.generateRandomString(ACTIVATION_KEY_LENGTH));
        if (this.authUserRepository.insert(user) < 1) {
            throw new RuntimeException("Uuden käyttäjän kirjoittaminen tietokantaan epäonnistui");
        }
        // 2. Lähetä aktivointi-email
        String link = String.format(
            "https://foo.com/api/auth/activate?key=%s&email=%s",
            user.getActivationKey(),
            TextCodec.BASE64URL.encode(user.getEmail())
        );
        if (!this.mailer.sendMail(
                user.getEmail(),
                "Tilin aktivointi",
                String.format(
                    "Moi %s,<br><br>kiitos rekisteröitymisestä {appName}aan, tässä aktivointilinkki:" +
                    "<a href=\"%s\">%s</a>. Mukavia treenejä!",
                    user.getUsername(),
                    link,
                    link
                )
            )) {
            throw new RuntimeException("Aktivointimailin lähetys epäonnistui");
        }
        // Kaikki ok
    }

    /**
     * Aktivoi käyttäjän, tai heittää poikkeuksen jos email, tai aktivointiavain
     * ei ollut validi, tai avain oli liian vanha.
     */
    void activate(String base64email, String activationKey) {
        // Päivitettävät kentät
        AuthUser activated = new AuthUser();
        activated.setIsActivated(1);
        activated.setActivationKey(null);
        // WHERE-osioon tulevat kentät
        UpdateFilters filters = new UpdateFilters();
        filters.setEmail(TextCodec.BASE64URL.decodeToString(base64email));
        filters.setMinCreatedAt(System.currentTimeMillis() / 1000L - ACTIVATION_KEY_EXPIRATION);
        filters.setActivationKey(activationKey);
        activated.setFilters(filters);
        if (this.authUserRepository.update(
            activated,
            new AuthUserRepository.UpdateColumn[]{
                AuthUserRepository.UpdateColumn.IS_ACTIVATED,
                AuthUserRepository.UpdateColumn.ACTIVATION_KEY,
            },
            new AuthUserRepository.FilterColumn[]{
                AuthUserRepository.FilterColumn.EMAIL,
                AuthUserRepository.FilterColumn.MIN_CREATED_AT,
                AuthUserRepository.FilterColumn.ACTIVATION_KEY
            }
        ) < 1) {
            throw new RuntimeException("Käyttäjän aktivointi epäonnistui");
        }
    }

    /**
     * Päivittää käyttäjän {user} emailin, ja luo uuden salasanan mikäli se
     * vaihtui.
     */
    void updateCredentials(AuthUser user, UpdateCredentials newCredentials) {
        List<AuthUserRepository.UpdateColumn> cols = new ArrayList<>();
        // Aseta email aina
        user.setEmail(newCredentials.getEmail());
        cols.add(AuthUserRepository.UpdateColumn.EMAIL);
        // Luo uusi salasana vain, jos se vaihtui
        if (newCredentials.getNewPassword() != null &&
            !Arrays.equals(newCredentials.getNewPassword(), newCredentials.getPassword())) {
            user.setPasswordHash(this.hashingProvider.hash(newCredentials.getNewPassword()));
            cols.add(AuthUserRepository.UpdateColumn.PASSWORD_HASH);
        }
        newCredentials.nuke();
        if (this.authUserRepository.update(user, cols.toArray(
            new AuthUserRepository.UpdateColumn[cols.size()]
        )) < 1) {
            throw new RuntimeException("Tietojen päivitys epäonnistui");
        }
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
        this.authUserRepository.update(user, new AuthUserRepository.UpdateColumn[]{
            AuthUserRepository.UpdateColumn.LAST_LOGIN,
            AuthUserRepository.UpdateColumn.CURRENT_TOKEN
        });
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
