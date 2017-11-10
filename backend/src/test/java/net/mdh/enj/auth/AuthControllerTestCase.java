package net.mdh.enj.auth;

import net.mdh.enj.Mailer;
import net.mdh.enj.AppConfig;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.SimpleMappers;
import net.mdh.enj.resources.AppConfigProvider;
import net.mdh.enj.resources.MockHashingProvider;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import net.mdh.enj.resources.ControllerTestExceptionMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import java.util.Collections;
import org.junit.BeforeClass;
import org.mockito.Mockito;
import org.junit.After;

public class AuthControllerTestCase extends RollbackingDBJerseyTest {

    final HashingProvider mockHasherSpy;
    final AppConfig appConfig;
    Mailer mockMailer;
    static TokenService mockTokenService;
    static DbTestUtils utils;
    static String mockActivationKey = String.join("", Collections.nCopies(
        AuthService.ACTIVATION_KEY_LENGTH, "a"
    ));

    AuthControllerTestCase() {
        mockHasherSpy = Mockito.spy(new MockHashingProvider());
        appConfig = AppConfigProvider.getInstance();
        mockMailer = Mockito.mock(Mailer.class);
    }

    @BeforeClass
    public static void beforeClass() {
        mockTokenService = Mockito.mock(TokenService.class);
        utils = new DbTestUtils(rollbackingDSFactory);
    }

    @After
    public void afterEach() {
        mockMailer = Mockito.mock(Mailer.class);
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(AuthController.class)
            .register(ControllerTestExceptionMapper.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(AuthUserRepository.class).to(AuthUserRepository.class);
                    bind(AccountManager.class).to(AccountManager.class);
                    bind(appConfig).to(AppConfig.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    bind(mockHasherSpy).to(HashingProvider.class);
                    bind(mockMailer).to(Mailer.class);
                    bind(mockTokenService).to(TokenService.class);
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
        testUser.setActivationKey(mockActivationKey);
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
