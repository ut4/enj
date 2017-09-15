package net.mdh.enj.auth;

import net.mdh.enj.Mailer;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.SimpleMappers;
import net.mdh.enj.resources.AppConfigProvider;
import net.mdh.enj.resources.MockHashingProvider;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.BeforeClass;
import org.mockito.Mockito;

public class AuthControllerTestCase extends RollbackingDBJerseyTest {

    static TokenService tokenService;
    static HashingProvider mockHasherSpy;
    static Mailer mockMailer;
    static DbTestUtils utils;

    @BeforeClass
    public static void beforeClass() throws Exception {
        tokenService = new TokenService(AppConfigProvider.getInstance());
        mockHasherSpy = Mockito.spy(new MockHashingProvider());
        mockMailer = Mockito.mock(Mailer.class);
        utils = new DbTestUtils(rollbackingDSFactory);
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(AuthController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(AuthUserRepository.class).to(AuthUserRepository.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    bind(mockHasherSpy).to(HashingProvider.class);
                    bind(mockMailer).to(Mailer.class);
                    bind(tokenService).to(TokenService.class);
                    bind(AuthService.class).to(AuthService.class);
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                }
            });
    }

    AuthUser getUserFromDb(AuthUser user, boolean useUsernameAsFilterColumn) {
        return (AuthUser) utils.selectOneWhere(
            "SELECT * FROM `user` WHERE " + (!useUsernameAsFilterColumn ? "id = :id" : "username = :username"),
            new BeanPropertySqlParameterSource(user),
            new SimpleMappers.AuthUserMapper()
        );
    }

    AuthUser insertNewUser(String username, Long createdAt, int isActivated) {
        RegistrationCredentials credentials = this.getValidRegistrationCredentials(username);
        AuthUser testUser = new AuthUser();
        testUser.setUsername(credentials.getUsername());
        testUser.setEmail(credentials.getEmail());
        testUser.setCreatedAt(createdAt == null ? System.currentTimeMillis() / 1000L : createdAt);
        testUser.setPasswordHash("foo");
        testUser.setIsActivated(isActivated);
        testUser.setActivationKey(tokenService.generateRandomString(AuthService.ACTIVATION_KEY_LENGTH));
        utils.insertAuthUser(testUser);
        return testUser;
    }

    RegistrationCredentials getValidRegistrationCredentials() {
        return this.getValidRegistrationCredentials("myyrä");
    }
    RegistrationCredentials getValidRegistrationCredentials(String username) {
        RegistrationCredentials credentials = new RegistrationCredentials();
        credentials.setUsername(username);
        credentials.setEmail(username + "@mail.com");
        credentials.setPassword((username + "pass").toCharArray());
        return credentials;
    }
}
