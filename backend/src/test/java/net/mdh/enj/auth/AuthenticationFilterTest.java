package net.mdh.enj.auth;

import org.junit.Test;
import org.junit.Assert;
import org.glassfish.jersey.test.JerseyTest;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.process.internal.RequestScoped;
import net.mdh.enj.resources.AppConfigProvider;
import net.mdh.enj.user.UserRepository;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.user.User;
import net.mdh.enj.AppConfig;
import org.mockito.Mockito;
import org.mockito.stubbing.Answer;
import org.mockito.invocation.InvocationOnMock;
import javax.ws.rs.core.Response;

public class AuthenticationFilterTest extends JerseyTest {

    private final String normalUrl = AuthenticationFilterTestController.TEST_URL + "/" +
                    AuthenticationFilterTestController.NORMAL_PATH;

    private final String whitelistedUrl = AuthenticationFilterTestController.TEST_URL + "/" +
                    AuthenticationFilterTestController.WHITELISTED_PATH;

    private UserRepository mockUserRepository;
    private TokenService spyingTokenService;

    public AuthenticationFilterTest() throws Exception {
        super();
        this.mockUserRepository = Mockito.mock(UserRepository.class);
        this.spyingTokenService = Mockito.spy(new TokenService(AppConfigProvider.getInstance()));
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(AuthenticationFilterTestController.class)
            .register(AuthenticationFilter.class)
            .register(ResponseFilter.class)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(RequestContext.class).to(RequestContext.class).in(RequestScoped.class);
                    bind(AppConfigProvider.getInstance()).to(AppConfig.class);
                    bind(AuthService.class).to(AuthService.class);
                    bind(mockUserRepository).to(UserRepository.class);
                    bind(spyingTokenService).to(TokenService.class);
                    bind(Mockito.mock(HashingProvider.class)).to(HashingProvider.class);
                }
            });
    }
    /**
     * Testaa, että filtteri hylkää pyynnön mikäli "Authentication"-header
     * puuttuu pyynnön headereista tai se ei ala merkkijonolla "Bearer ".
     */
    @Test
    public void hylkääPyynnönMikäliAuthenticationHeaderPuuttuu() {
        Response response = target(this.normalUrl).request().get();
        Assert.assertEquals(401, response.getStatus());
        Assert.assertEquals(AuthenticationFilter.MSG_LOGIN_REQUIRED, response.readEntity(String.class));
        Response response2 = target(this.normalUrl).request().header(AuthenticationFilter.AUTH_HEADER_NAME, "Bearer").get();
        Assert.assertEquals(401, response2.getStatus());
        Assert.assertEquals(AuthenticationFilter.MSG_LOGIN_REQUIRED, response2.readEntity(String.class));
    }
    /**
     * Testaa, että filtteri hylkää pyynnön mikäli "Authentication"-header
     * ei ole validi JsonWebToken.
     */
    @Test
    public void hylkääPyynnönMikäliAuthenticationHeaderEiOleValidi() {
        Response response = target(this.normalUrl).request().header(AuthenticationFilter.AUTH_HEADER_NAME, "Bearer foo").get();
        Assert.assertEquals(401, response.getStatus());
        Assert.assertEquals(AuthenticationFilter.MSG_LOGIN_REQUIRED, response.readEntity(String.class));
    }
    /**
     * Testaa että validaatio menee läpi jos Authentication-header on validi JWT.
     */
    @Test
    public void hyväksyyPyynnönJaAsettaaTokenSubjektinRequestContextiinMikäliHeaderOnValidi() throws Exception {
        String mockUuid = "uuid34";
        String testToken = this.spyingTokenService.generateNew(mockUuid);
        Response response = target(this.normalUrl).request().header(AuthenticationFilter.AUTH_HEADER_NAME, "Bearer " + testToken).get();
        Assert.assertEquals(200, response.getStatus());
        Assert.assertEquals(AuthenticationFilterTestController.NORMAL_RESPONSE + mockUuid, response.readEntity(String.class));
    }
    /**
     * Testaa, että uusii automaattisesti vanhentuneen tokenin.
     */
    @Test
    public void uusiiHeaderinVanhentuneenTokenin() throws Exception {
        String mockUuid = "uuid78";
        User userWithValidLogin = new User();
        userWithValidLogin.setId(mockUuid);
        userWithValidLogin.setLastLogin(System.currentTimeMillis() / 1000L - 100);
        Mockito.when(this.mockUserRepository.selectOne(Mockito.any())).thenReturn(userWithValidLogin);
        Mockito.when(this.mockUserRepository.updatePartial(Mockito.any(), Mockito.any())).thenReturn(1);
        ReturnValueCaptor<String> newTokenCaptor = new ReturnValueCaptor<>();
        Mockito.doAnswer(newTokenCaptor).when(spyingTokenService).generateNew(mockUuid);
        // Simuloi pyyntö, jossa vanhentunut token
        String expiredToken = this.spyingTokenService.generateNew(mockUuid, 0L);
        Response response = target(this.normalUrl)
            .request()
            .header(AuthenticationFilter.AUTH_HEADER_NAME, "Bearer " + expiredToken)
            .get();
        Assert.assertEquals(200, response.getStatus());
        String newToken = newTokenCaptor.getResult();
        userWithValidLogin.setCurrentToken(newToken);
        // Lisäytyikö uuden tokenin headeriin?
        Assert.assertEquals("Pitäisi uusia token, ja lisätä se responsen \"New-Token\"-headeriin",
            AuthenticationFilter.AUTH_TOKEN_PREFIX + newToken,
            response.getHeaderString(AuthenticationFilter.NEW_TOKEN_HEADER_NAME)
        );
        // Päivittikö uusi token myös tietokantaan?
        Mockito.verify(this.mockUserRepository, Mockito.times(1)).updatePartial(Mockito.eq(userWithValidLogin), Mockito.any());
        Assert.assertEquals(AuthenticationFilterTestController.NORMAL_RESPONSE + mockUuid, response.readEntity(String.class));
    }
    /**
     * Testaa että @PermitAll-annotaatio skippaa autentikoinnin.
     */
    @Test
    public void permitAllAnnotaatioOhittaaAutentikaation() {
        // Luo testidata
        Response response = target(this.whitelistedUrl).request().get();
        Assert.assertEquals(200, response.getStatus());
        Assert.assertEquals(AuthenticationFilterTestController.NORMAL_RESPONSE, response.readEntity(String.class));
    }

    public class ReturnValueCaptor<T> implements Answer {
        private T result = null;
        public T getResult() {
            return result;
        }
        @Override
        public T answer(InvocationOnMock invocationOnMock) throws Throwable {
            result = (T) invocationOnMock.callRealMethod();
            return result;
        }
    }
}
