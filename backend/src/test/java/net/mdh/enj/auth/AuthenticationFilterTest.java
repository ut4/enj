package net.mdh.enj.auth;

import net.mdh.enj.Mailer;
import org.junit.Test;
import org.junit.Assert;
import org.glassfish.jersey.test.JerseyTest;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.process.internal.RequestScoped;
import net.mdh.enj.resources.AppConfigProvider;
import net.mdh.enj.api.RequestContext;
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

    private AuthUserRepository mockAuthUserRepository;
    private FixableTokenService spyingTokenService;

    public AuthenticationFilterTest() {
        super();
        this.mockAuthUserRepository = Mockito.mock(AuthUserRepository.class);
        this.spyingTokenService = Mockito.spy(new FixableTokenService(AppConfigProvider.getInstance()));
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
                    bind(mockAuthUserRepository).to(AuthUserRepository.class);
                    bind(spyingTokenService).to(TokenService.class);
                    bind(Mockito.mock(HashingProvider.class)).to(HashingProvider.class);
                    bind(Mockito.mock(Mailer.class)).to(Mailer.class);
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
    public void hyväksyyPyynnönJaAsettaaTokenSubjektinRequestContextiinMikäliHeaderOnValidi() {
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
    public void uusiiHeaderinVanhentuneenTokenin()  {
        String mockUuid = "uuid78";
        AuthUser userWithValidLogin = new AuthUser();
        userWithValidLogin.setId(mockUuid);
        userWithValidLogin.setLastLogin(System.currentTimeMillis() / 1000L);
        Mockito.when(this.mockAuthUserRepository.selectOne(Mockito.any())).thenReturn(userWithValidLogin);
        Mockito.when(this.mockAuthUserRepository.updateToken(Mockito.any())).thenReturn(1);
        ReturnValueCaptor<String> newTokenCaptor = new ReturnValueCaptor<>();
        Mockito.doAnswer(newTokenCaptor).when(spyingTokenService).generateNew(mockUuid);
        // Simuloi pyyntö, jossa vanhentunut token
        String expiredToken = this.spyingTokenService.generateNew(mockUuid, -2000L);
        Response response = target(this.normalUrl)
            .request()
            .header(AuthenticationFilter.AUTH_HEADER_NAME, "Bearer " + expiredToken)
            .get();
        Assert.assertEquals(200, response.getStatus());
        String newToken = newTokenCaptor.getResult();
        userWithValidLogin.setCurrentToken(newToken);
        // Lisäsikö uuden tokenin headeriin?
        Assert.assertEquals("Pitäisi uusia token, ja lisätä se responsen \"New-Token\"-headeriin",
            newToken,
            response.getHeaderString(AuthenticationFilter.NEW_TOKEN_HEADER_NAME)
        );
        // Päivittikö uuden tokenin myös tietokantaan?
        Mockito.verify(this.mockAuthUserRepository, Mockito.times(1)).updateToken(Mockito.eq(userWithValidLogin));
        Assert.assertEquals(AuthenticationFilterTestController.NORMAL_RESPONSE + mockUuid, response.readEntity(String.class));
    }
    @Test
    public void eiUusiTokeniaJosViimeisestäKirjautumisestaOnLiianKauan() {
        String mockUuid = "uuid79";
        AuthUser userWithInvalidLogin = new AuthUser();
        userWithInvalidLogin.setId(mockUuid);
        userWithInvalidLogin.setLastLogin(System.currentTimeMillis() / 1000L - AuthService.LOGIN_EXPIRATION - 10);
        Mockito.when(this.mockAuthUserRepository.selectOne(Mockito.any())).thenReturn(userWithInvalidLogin);
        Mockito.when(this.mockAuthUserRepository.updateToken(Mockito.any())).thenReturn(1);
        // Simuloi pyyntö, jossa vanhentunut token, ja vanhentunut kirjautuminen
        String expiredToken = this.spyingTokenService.generateNew(mockUuid, -2000L);
        Response response = target(this.normalUrl)
            .request()
            .header(AuthenticationFilter.AUTH_HEADER_NAME, "Bearer " + expiredToken)
            .get();
        Assert.assertEquals(401, response.getStatus());
        // Lisäsikö uuden tokenin headeriin?
        Assert.assertNull("Ei pitäisi uusia tokenia",
            response.getHeaderString(AuthenticationFilter.NEW_TOKEN_HEADER_NAME)
        );
        // Invalidoiko kirjautumisen?
        AuthUser invalidated = new AuthUser();
        invalidated.setId(userWithInvalidLogin.getId());
        invalidated.setLastLogin(null);
        invalidated.setCurrentToken(null);
        Mockito.verify(this.mockAuthUserRepository, Mockito.times(1)).update(Mockito.eq(invalidated), Mockito.any());
    }
    @Test
    public void eiUusiTokeniaJosSeEiOleValidiCurrentToken() {
        // Simuloi tilanne, jossa headerin tokeni ei täsmää tietokantaan tallennettuan
        // tokeniin (selectOne palauttaa null)
        Mockito.when(this.mockAuthUserRepository.selectOne(Mockito.any())).thenReturn(null);
        String expiredToken = this.spyingTokenService.generateNew("uuid80", -2000L);
        Response response = target(this.normalUrl)
            .request()
            .header(AuthenticationFilter.AUTH_HEADER_NAME, "Bearer " + expiredToken)
            .get();
        Assert.assertEquals(401, response.getStatus());
        // Lisäsikö uuden tokenin headeriin?
        Assert.assertNull("Ei pitäisi uusia tokenia",
            response.getHeaderString(AuthenticationFilter.NEW_TOKEN_HEADER_NAME)
        );
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
