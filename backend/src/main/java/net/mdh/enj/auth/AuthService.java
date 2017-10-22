package net.mdh.enj.auth;

import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.TextCodec;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.ExpiredJwtException;
import net.mdh.enj.db.UnaffectedOperationException;
import net.mdh.enj.user.SelectFilters;
import net.mdh.enj.AppConfig;
import net.mdh.enj.Mailer;
import javax.inject.Inject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Suorittaa autentikointiin liittyvän raskaan työn.
 */
public class AuthService {

    static final int LOGIN_EXPIRATION = 5259600;        // ~2kk
    static final int TOKEN_EXPIRATION = 1800;           // 30min
    static final int ACTIVATION_KEY_EXPIRATION = 86400; // 24h
    static final int ACTIVATION_KEY_LENGTH = 32;
    static final String ERRORNAME_RESERVED_USERNAME = "reservedUsername";
    static final String ERRORNAME_RESERVED_EMAIL = "reservedEmail";

    private final TokenService tokenService;
    private final AuthUserRepository authUserRepository;
    private final HashingProvider hashingProvider;
    private final AppConfig appConfig;
    private final Mailer mailer;

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
     * @throws RuntimeException Jos tietojen kirjoitus tietokantaan epäonnistuu.
     */
    void logout(String userId) {
        AuthUser cleared = new AuthUser();
        cleared.setId(userId);
        cleared.setLastLogin(null);
        cleared.setCurrentToken(null);
        if (this.authUserRepository.updateLogin(cleared) < 1) {
            throw new UnaffectedOperationException("Tietokantaan kirjoitus epäonnistui");
        }
    }

    /**
     * Lisää uuden käyttäjän tietokantaan uuden aktivointiavaimen kera, ja lähettää
     * aktivointilinkin sähköpostilla käyttäjälle. Hylkää transactionin mikäli
     * sähköpostin lähetys, tai tietojen kirjoitus tietokantaan epäonnistui.
     *
     * @throws RuntimeException Jos emailin lähetys, tai tietojen kirjoitus tietokantaan epäonnistuu.
     */
    void register(RegistrationCredentials credentials, String successEmailTemplate) throws RuntimeException {
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
                throw new UnaffectedOperationException("Uuden käyttäjän kirjoittaminen tietokantaan epäonnistui");
            }
            // 2. Lähetä aktivointi-email
            String link = String.format(
                "%s/auth/activate?key=%s&email=%s",
                appConfig.appPublicUrl,
                user.getActivationKey(),
                TextCodec.BASE64URL.encode(user.getEmail())
            );
            if (!this.mailer.sendMail(
                user.getEmail(),
                user.getUsername(),
                "Tilin aktivointi",
                String.format(successEmailTemplate, user.getUsername(), link, link)
            )) {
                throw new RuntimeException("Aktivointimailin lähetys epäonnistui");
            }
        });
        // Kaikki ok
    }

    /**
     * Aktivoi käyttäjän, tai heittää poikkeuksen jos email, tai aktivointiavain
     * ei ollut validi, tai avain oli liian vanha. Palauttaa kirjautumislinkin.
     */
    String activate(String base64email, String activationKey) throws RuntimeException {
        // Päivitettävät kentät
        AuthUser activated = new AuthUser();
        activated.setIsActivated(1);
        activated.setActivationKey(null);
        activated.setUpdateColumns(new AuthUser.UpdateColumn[]{
            AuthUser.UpdateColumn.IS_ACTIVATED,
            AuthUser.UpdateColumn.ACTIVATION_KEY,
        });
        // WHERE-osioon tulevat kentät
        UpdateFilters filters = new UpdateFilters();
        filters.setEmail(TextCodec.BASE64URL.decodeToString(base64email));
        filters.setMinCreatedAt(System.currentTimeMillis() / 1000L - ACTIVATION_KEY_EXPIRATION);
        filters.setActivationKey(activationKey);
        activated.setFilters(filters);
        if (this.authUserRepository.update(activated) < 1) {
            throw new UnaffectedOperationException("Käyttäjän aktivointi epäonnistui");
        }
        return String.format("%s#/kirjaudu", appConfig.appPublicUrl.replace("/api", "/app"));
    }

    /**
     * Päivittää käyttäjän {user} emailin, ja luo uuden salasanan mikäli se
     * vaihtui.
     */
    List<String> updateCredentials(AuthUser user, UpdateCredentials newCredentials) {
        List<String> errors = new ArrayList<>();
        // Tsekkaa onko vaihtunut käyttäjänimi jo käytössä
        AuthUser reserved = this.getReservedCredentials(newCredentials, user);
        if (reserved != null) {
            if (reserved.getUsername().equals(newCredentials.getUsername())) {
                errors.add(ERRORNAME_RESERVED_USERNAME);
            }
            if (reserved.getEmail().equals(newCredentials.getEmail())) {
                errors.add(ERRORNAME_RESERVED_EMAIL);
            }
            return errors;
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
        if (this.authUserRepository.update(user) < 1) {
            throw new UnaffectedOperationException("Tietojen päivitys epäonnistui");
        }
        return errors;
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
    private String renewToken(String expiredToken, String userId) throws RuntimeException {
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
            throw new UnaffectedOperationException("Uusitun tokenin tallennus epäonnistui");
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
        System.out.println(filters);
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
