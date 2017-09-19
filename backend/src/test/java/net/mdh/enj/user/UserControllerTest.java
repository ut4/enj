package net.mdh.enj.user;

import net.mdh.enj.api.Responses;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.SimpleMappers;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ResourceConfig;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.sql.SQLException;
import java.util.UUID;
import org.junit.BeforeClass;
import org.junit.Assert;
import org.junit.Test;

public class UserControllerTest extends RollbackingDBJerseyTest {

    private static DbTestUtils utils;

    @BeforeClass
    public static void beforeClass() throws SQLException {
        utils = new DbTestUtils(rollbackingDSFactory);
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(UserController.class)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(UserRepository.class).to(UserRepository.class);
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                }
            });
    }

    @Test
    public void GETUserMePalauttaaKirjautuneenKäyttäjänTiedot() {
        Response response = this.newGetRequest("user/me");
        User user = response.readEntity(new GenericType<User>() {});
        Assert.assertNotNull("Pitäisi palauttaa käyttäjä", user);
        Assert.assertNotNull(user.getUsername());
        Assert.assertNotNull(user.getEmail());
        Assert.assertEquals(TestData.TEST_USER_ID, user.getId());
    }

    @Test(expected = IllegalStateException.class)
    public void PUTUserMeHylkääPyynnönJosDataPuuttuuKokonaan() {
        this.newPutRequest("user/me", null);
    }

    @Test
    public void PUTUserMePäivittääYhdenKäyttäjänTiedotTietokantaan() {
        User userData = this.getTestUser();
        Assert.assertNull(userData.getIsMale());
        // Muuta jotain tietoja & lähetä pyyntö
        userData.setBodyWeight(userData.getBodyWeight() + 10);
        userData.setIsMale(0);
        userData.setSignature("fos");
        userData.setUsername("newUsername");
        userData.setEmail("new@mail.com");
        Response response = this.newPutRequest("user/me", userData);
        // Päivittyikö?
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("UpdateResponse.updateCount pitäisi olla 1", (Integer)1, responseBody.updateCount);
        User updatedData = this.getTestUser();
        Assert.assertEquals("Pitäisi päivittää bodyWeight (+10)", userData.getBodyWeight(),
            updatedData.getBodyWeight()
        );
        Assert.assertEquals("Pitäisi päivittää isMale (null -> 0)", userData.getIsMale(),
            updatedData.getIsMale()
        );
        Assert.assertEquals("Pitäisi päivittää signature (null -> \"fos\")", userData.getSignature(),
            updatedData.getSignature()
        );
        Assert.assertNotEquals("Ei pitäisi päivittää usernamea", userData.getUsername(),
            updatedData.getUsername()
        );
        Assert.assertNotEquals("Ei pitäisi päivittää emailia", userData.getEmail(),
            updatedData.getEmail()
        );
    }

    @Test
    public void PUTUserMeKäyttääAinaKirjautuneenKäyttäjänIdtä() {
        User user = this.getTestUser();
        //
        user.setId(UUID.randomUUID().toString());
        user.setBodyWeight(20.0);
        Response response = this.newPutRequest("user/me", user);
        // Assertoi, että päivitti tiedot kirjautuneelle käyttäjälle
        Assert.assertEquals(200, response.getStatus());
        User updateUser = this.getTestUser();
        Assert.assertEquals("Pitäisi asettaa userId:ksi kirjautuneen käyttäjän id",
            user.getBodyWeight(), updateUser.getBodyWeight()
        );
    }

    private User getTestUser() {
        return (User) utils.selectOneWhere(
            "SELECT * FROM `user` WHERE id = :id",
            new MapSqlParameterSource("id", TestData.TEST_USER_ID),
            new SimpleMappers.UserMapper()
        );
    }
}
