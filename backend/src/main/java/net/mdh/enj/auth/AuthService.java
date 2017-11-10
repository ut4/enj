package net.mdh.enj.auth;

import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.TextCodec;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.ExpiredJwtException;
import net.mdh.enj.api.FrontendFacingErrorException;
import net.mdh.enj.db.IneffectualOperationException;
import net.mdh.enj.user.SelectFilters;
import net.mdh.enj.Application;
import net.mdh.enj.AppConfig;
import net.mdh.enj.Mailer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.inject.Inject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Suorittaa autentikointiin liittyvän raskaan työn.
 */
public class AuthService {

    static final int LOGIN_EXPIRATION = 5259600;           // ~2kk
    static final int TOKEN_EXPIRATION = 1800;              // 30min
    static final int ACTIVATION_KEY_EXPIRATION = 86400;    // 24h
    static final int PASSWORD_RESET_KEY_EXPIRATION = 1800; // 30min
    static final int ACTIVATION_KEY_LENGTH = 64;
    static final int PASSWORD_RESET_KEY_LENGTH = 64;
    static final String ERRORNAME_RESERVED_USERNAME = "reservedUsername";
    static final String ERRORNAME_RESERVED_EMAIL = "reservedEmail";
    static final String ERRORNAME_USER_NOT_FOUND = "userNotFound";
    static final String ERRORNAME_MAIL_FAILURE = "mailFailure";

    private final TokenService tokenService;
    private final AuthUserRepository authUserRepository;
    private final HashingProvider hashingProvider;
    private final AppConfig appConfig;
    private final Mailer mailer;

    private static final Logger logger = LoggerFactory.getLogger(Application.class);

    @Inject
    AuthService(
        TokenService tokenService,
        AuthUserRepository authUserRepository,
        HashingProvider hashingProvider,
        AppConfig appConfig,
        Mailer mailer
    ) {
        this.tokenService = tokenService;
        this.authUserRepository = authUserRepository;
        this.hashingProvider = hashingProvider;
        this.appConfig = appConfig;
        this.mailer = mailer;
    }

    /**
     * Palauttaa käyttäjän tietokannasta, joka täsmää {credentials}eihin.
     */
    AuthUser getUser(Credentials credentials) {
        SelectFilters selectFilters = new SelectFilters();
        if (credentials instanceof UpdateCredentials) {
            selectFilters.setId(((UpdateCredentials) credentials).getUserId());
        } else {
            selectFilters.setUsername(credentials.getUsername());
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
        this.authUserRepository.updateLogin(user);
        return tokenHash;
    }

    /**
     * Poistaa JWT:n, ja lastLogin-timestampin tietokannasta.
     *
     * @throws IneffectualOperationException Jos tietojen kirjoitus tietokantaan epäonnistuu.
     */
    void logout(String userId) {
        AuthUser cleared = new AuthUser();
        cleared.setId(userId);
        cleared.setLastLogin(null);
        cleared.setCurrentToken(null);
        if (this.authUserRepository.updateLogin(cleared) < 1) {
            throw new IneffectualOperationException("Tietokantaan kirjoitus epäonnistui");
        }
    }

    /**
     * Lisää uuden käyttäjän tietokantaan uuden aktivointiavaimen kera, ja lähettää
     * aktivointilinkin sähköpostilla käyttäjälle. Hylkää transactionin mikäli
     * sähköpostin lähetys, tai tietojen kirjoitus tietokantaan epäonnistui.
     *
     * @throws FrontendFacingErrorException Jos emailin lähetys, tai tietojen kirjoitus tietokantaan epäonnistuu.
     */
    void register(RegistrationCredentials credentials, String successEmailTemplate) throws FrontendFacingErrorException {
        // 1. Lisää käyttäjä
        AuthUser user = new AuthUser();
        user.setUsername(credentials.getUsername());
        user.setEmail(credentials.getEmail());
        user.setCreatedAt(System.currentTimeMillis() / 1000L);
        user.setPasswordHash(this.hashingProvider.hash(credentials.getPassword()));
        user.setIsActivated(0);
        user.setActivationKey(this.tokenService.generateRandomString(ACTIVATION_KEY_LENGTH));
        this.authUserRepository.runInTransaction(() -> {
            if (this.authUserRepository.insert(user) < 1) {
                throw new IneffectualOperationException("Uuden käyttäjän kirjoittaminen tietokantaan epäonnistui");
            }
            // 2. Lähetä aktivointi-email
            String link = String.format(
                "%s/auth/activate?key=%s&email=%s",
                appConfig.appPublicBackendUrl,
                user.getActivationKey(),
                TextCodec.BASE64URL.encode(user.getEmail())
            );
            if (!this.mailer.sendMail(
                user.getEmail(),
                user.getUsername(),
                "Tilin aktivointi",
                String.format(successEmailTemplate, user.getUsername(), link, link)
            )) {
                throw new FrontendFacingErrorException(ERRORNAME_MAIL_FAILURE);
            }
        });
        // Kaikki ok
    }

    /**
     * Aktivoi käyttäjän, tai heittää poikkeuksen jos email, tai aktivointiavain
     * ei ollut validi, tai avain oli liian vanha. Palauttaa kirjautumislinkin.
     */
    String activate(String base64email, String activationKey) throws IneffectualOperationException {
        // Päivitettävät kentät
        AuthUser activated = new AuthUser();
        activated.setIsActivated(1);
        activated.setActivationKey(null);
        activated.setUpdateColumns(
            AuthUser.UpdateColumn.IS_ACTIVATED,
            AuthUser.UpdateColumn.ACTIVATION_KEY
        );
        // WHERE-osioon tulevat kentät
        UpdateFilters filters = new UpdateFilters();
        filters.setEmail(TextCodec.BASE64URL.decodeToString(base64email));
        filters.setMinCreatedAt(System.currentTimeMillis() / 1000L - ACTIVATION_KEY_EXPIRATION);
        filters.setActivationKey(activationKey);
        activated.setFilters(filters);
        if (this.authUserRepository.update(activated) < 1) {
            throw new IneffectualOperationException("Käyttäjän aktivointi epäonnistui");
        }
        return String.format("%s#/kirjaudu", appConfig.appPublicFrontendUrl);
    }

    /**
     * Luo random-avaimen salasanan palautusta varten, päivittää sen tietokantaan,
     * ja lähettää sen lopuksi sähköpostilla käyttäjälle.
     *
     * @throws FrontendFacingErrorException Jos käyttäjää ei löyty, tai mailin lähetys epäonnistuu
     */
    void handlePasswordResetRequest(EmailCredentials credentials, String successEmailTemplate) throws FrontendFacingErrorException {
        // 1. Hae käyttäjä tietokannasta
        SelectFilters selectFilters = new SelectFilters();
        selectFilters.setEmail(credentials.getEmail());
        AuthUser user = this.authUserRepository.selectOne(selectFilters);
        if (user == null) {
            throw new FrontendFacingErrorException(ERRORNAME_USER_NOT_FOUND, 400);
        }
        // 2. Tallenna resetointi-avain tietokantaan
        AuthUser newData = new AuthUser();
        newData.setPasswordResetKey(this.tokenService.generateRandomString(PASSWORD_RESET_KEY_LENGTH));
        newData.setPasswordResetTime(System.currentTimeMillis() / 1000L);
        newData.setUpdateColumns(
            AuthUser.UpdateColumn.PASSWORD_RESET_KEY,
            AuthUser.UpdateColumn.PASSWORD_RESET_TIME
        );
        UpdateFilters filters = new UpdateFilters();
        filters.setEmail(credentials.getEmail());
        newData.setFilters(filters);
        this.authUserRepository.runInTransaction(() -> {
            if (this.authUserRepository.update(newData) < 1) {
                throw new IneffectualOperationException("Salasanan resetointiavaimen kirjoitus epäonnistui");
            }
            // 3. Lähetä salasanan palautuslinkki-email
            String link = String.format(
                "%s#/tili/uusi-salasana/%s/%s",
                appConfig.appPublicFrontendUrl,
                newData.getPasswordResetKey(),
                TextCodec.BASE64URL.encode(user.getEmail())
            );
            if (!this.mailer.sendMail(
                user.getEmail(),
                user.getUsername(),
                "Salasanan palautus",
                String.format(successEmailTemplate, user.getUsername(), link, link)
            )) {
                throw new FrontendFacingErrorException(ERRORNAME_MAIL_FAILURE);
            }
        });
        // Kaikki ok
    }

    /**
     * Luo uuden salasanan käyttäjälle, jos pyynnön passwordResetKey täsmää
     * tietokantaan tallennettuun avaimeen, ja avain ei ole liian vanha (oletus
     * 30min).
     *
     * @throws FrontendFacingErrorException Jos passwordResetKey + email ei löydy tietokannasta tai key on liian vanha
     */
    void resetPassword(NewPasswordCredentials credentials) throws FrontendFacingErrorException {
        // 1. Hae salasanan palautusta pyytänyt käyttäjä tietokannasta
        SelectFilters selectFilters = new SelectFilters();
        selectFilters.setEmail(credentials.getEmail());
        selectFilters.setPasswordResetKey(credentials.getPasswordResetKey());
        AuthUser requester = this.authUserRepository.selectOne(selectFilters);
        FrontendFacingErrorException e = new FrontendFacingErrorException(ERRORNAME_USER_NOT_FOUND, 400);
        if (requester == null) {
            logger.warn("Yritettiin resetoida salasana väärällä emaililla ja avaimella");
            throw e;
        }
        if (!requester.getEmail().equals(credentials.getEmail())) {
            logger.warn("Yritettiin resetoida salasana väärällä emaililla");
            throw e;
        }
        if (requester.getPasswordResetKey() == null ||
            !requester.getPasswordResetKey().equals(credentials.getPasswordResetKey())) {
            logger.warn("Yritettiin resetoida salasana väärällä avaimella");
            throw e;
        }
        if (requester.getPasswordResetTime() == null ||
            System.currentTimeMillis() / 1000L > requester.getPasswordResetTime() + PASSWORD_RESET_KEY_EXPIRATION) {
            logger.warn("Yritettiin resetoida salasana vanhentuneella avaimella");
            throw e;
        }
        // 2. Aseta uusi salasana & tyhjennä passwordResetKey|Time
        AuthUser newData = new AuthUser();
        newData.setId(requester.getId());
        newData.setPasswordHash(this.hashingProvider.hash(credentials.getNewPassword()));
        newData.setPasswordResetKey(null);
        newData.setPasswordResetTime(null);
        newData.setUpdateColumns(
            AuthUser.UpdateColumn.PASSWORD_HASH,
            AuthUser.UpdateColumn.PASSWORD_RESET_KEY,
            AuthUser.UpdateColumn.PASSWORD_RESET_TIME
        );
        this.authUserRepository.update(newData);
    }

    /**
     * Päivittää käyttäjän {user} emailin, ja luo uuden salasanan mikäli se
     * vaihtui.
     */
    void updateCredentials(AuthUser user, UpdateCredentials newCredentials) {
        // Tsekkaa onko vaihtunut käyttäjänimi jo käytössä
        AuthUser reserved = this.getReservedCredentials(newCredentials, user);
        if (reserved != null) {
            List<String> errors = new ArrayList<>();
            if (reserved.getUsername().equals(newCredentials.getUsername())) {
                errors.add(ERRORNAME_RESERVED_USERNAME);
            }
            if (reserved.getEmail().equals(newCredentials.getEmail())) {
                errors.add(ERRORNAME_RESERVED_EMAIL);
            }
            throw new FrontendFacingErrorException(String.join("\",\"", errors), 400);
        }
        // Aseta käyttäjänimi & email aina
        List<AuthUser.UpdateColumn> cols = new ArrayList<>();
        user.setUsername(newCredentials.getUsername());
        cols.add(AuthUser.UpdateColumn.USERNAME);
        user.setEmail(newCredentials.getEmail());
        cols.add(AuthUser.UpdateColumn.EMAIL);
        // Luo uusi salasana vain jos se vaihtui
        if (newCredentials.getNewPassword() != null &&
            !Arrays.equals(newCredentials.getNewPassword(), newCredentials.getPassword())) {
            user.setPasswordHash(this.hashingProvider.hash(newCredentials.getNewPassword()));
            cols.add(AuthUser.UpdateColumn.PASSWORD_HASH);
        }
        newCredentials.nuke();
        user.setUpdateColumns(cols.toArray(new AuthUser.UpdateColumn[cols.size()]));
        this.authUserRepository.update(user);
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
        } catch (ExpiredJwtException e) { // vanhentunut, mutta muutoin validi
            Claims claims = this.tokenService.getClaimsFromExpiredToken(tokenHash);
            String userId = claims.getSubject();
            return new TokenData(userId, this.renewToken(tokenHash, userId));
        }
        // MalformedJwtException | SignatureException | UnsupportedJwtException heitetään
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
        // token ei täsmännyt, tai tokenin viittaamaa käyttäjää ei oltu aktivoitu
        if (user == null || user.getLastLogin() == null) {
            throw new SignatureException("Access-token virheellinen");
        }
        // Kirjautuminen yli 2kk vanha, poista se tietokannasta kokonaan
        if (System.currentTimeMillis() / 1000L >= user.getLastLogin() + LOGIN_EXPIRATION) {
            this.invalidateLogin(user);
            throw new ExpiredJwtException(null, null, "Refresh-token vanhentui");
        }
        // Kaikki ok, luo uusi token & tallenna se kantaan
        String tokenHash = this.tokenService.generateNew(user.getId());
        user.setCurrentToken(tokenHash);
        if (this.authUserRepository.updateToken(user) < 1) {
            throw new IneffectualOperationException("Uusitun tokenin tallennus epäonnistui");
        }
        return tokenHash;
    }

    /**
     * Päivittää tietokantaan käyttäjän lastLogin-, ja currentToken-kenttien
     * arvoiksi NULL.
     */
    private void invalidateLogin(AuthUser user) {
        user.setLastLogin(null);
        user.setCurrentToken(null);
        this.authUserRepository.updateLogin(user);
    }

    /**
     * Palauttaa käyttäjän tietokannasta, jonka username tai email on sama kuin
     * newCredentials-arvo, ja se eroaa currentCredentials-arvosta.
     */
    private AuthUser getReservedCredentials(
        UpdateCredentials newCredentials,
        AuthUser currentCredentials
    ) {
        SelectFilters filters = new SelectFilters() {
            @Override
            public String toSql() {
                return super.toSql().replace(" AND ", " OR ");
            }
        };
        if (!newCredentials.getUsername().equals(currentCredentials.getUsername())) {
            filters.setUsername(newCredentials.getUsername());
        }
        if (!newCredentials.getEmail().equals(currentCredentials.getEmail())) {
            filters.setEmail(newCredentials.getEmail());
        }
        if (filters.getUsername() == null && filters.getEmail() == null) {
            return null;
        }
        filters.setIsActivated(null);
        return this.authUserRepository.selectOne(filters);
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
