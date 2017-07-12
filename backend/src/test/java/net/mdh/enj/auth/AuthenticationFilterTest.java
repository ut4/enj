package net.mdh.enj.auth;

import org.junit.Test;
import org.junit.Assert;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.test.JerseyTest;
import javax.ws.rs.core.Response;

public class AuthenticationFilterTest extends JerseyTest {

    private final String normalUrl = AuthenticationFilterTestController.TEST_URL + "/" +
                    AuthenticationFilterTestController.NORMAL_PATH;

    private final String whitelistedUrl = AuthenticationFilterTestController.TEST_URL + "/" +
                    AuthenticationFilterTestController.WHITELISTED_PATH;

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(AuthenticationFilterTestController.class)
            .register(AuthenticationFilter.class)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(TokenService.class).to(TokenService.class);
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
        Response response2 = target(this.normalUrl).request().header(AuthenticationFilter.TOKEN_HEADER_NAME, "Bearer").get();
        Assert.assertEquals(401, response2.getStatus());
        Assert.assertEquals(AuthenticationFilter.MSG_LOGIN_REQUIRED, response2.readEntity(String.class));
    }
    /**
     * Testaa, että filtteri hylkää pyynnön mikäli "Authentication"-header
     * ei ole validi JsonWebToken.
     */
    @Test
    public void hylkääPyynnönMikäliAuthenticationHeaderEiOleValidi() {
        Response response = target(this.normalUrl).request().header(AuthenticationFilter.TOKEN_HEADER_NAME, "Bearer foo").get();
        Assert.assertEquals(401, response.getStatus());
        Assert.assertEquals(AuthenticationFilter.MSG_LOGIN_REQUIRED, response.readEntity(String.class));
    }
    /**
     * Testaa että validaatio menee läpi jos Authentication-header on validi JWT.
     */
    @Test
    public void hyväksyyPyynnönMikäliHeaderOnValidi() {
        String testToken = new TokenService().generateNew("someuser");
        Response response = target(this.normalUrl).request().header(AuthenticationFilter.TOKEN_HEADER_NAME, "Bearer " + testToken).get();
        Assert.assertEquals(200, response.getStatus());
        Assert.assertEquals(AuthenticationFilterTestController.NORMAL_RESPONSE, response.readEntity(String.class));
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
}
