package net.mdh.enj.program;

import net.mdh.enj.api.Responses;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.SimpleMappers;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.BeforeClass;
import org.junit.Assert;
import org.junit.Test;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;

public class ProgramControllerTest extends RollbackingDBJerseyTest {

    private static DbTestUtils utils;

    @BeforeClass
    public static void beforeClass() {
        utils = new DbTestUtils(rollbackingDSFactory);
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(ProgramController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(ProgramRepository.class).to(ProgramRepository.class);
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                }
            });
    }

    @Test
    public void POSTProgramInsertoiUudenOhjelmanTietokantaanKirjautuneelleKäyttäjälle() {
        // Luo testiohjelma. NOTE - ei userId:tä
        Program program = new Program();
        program.setName("test");
        program.setStart(123L);
        program.setEnd(456L);
        program.setDescription("...");
        //
        Response response = this.newPostRequest("program", program);
        Assert.assertEquals(200, response.getStatus());
        Responses.InsertResponse responseBody = response.readEntity(new GenericType<Responses.InsertResponse>() {});
        //
        Program actualProgram = (Program) utils.selectOneWhere(
            "SELECT * FROM program WHERE id = :id",
            new MapSqlParameterSource("id", responseBody.insertId),
            new SimpleMappers.ProgramMapper()
        );
        program.setId(responseBody.insertId);
        program.setUserId(TestData.TEST_USER_ID);
        Assert.assertEquals(program.toString(), actualProgram.toString());
    }
}
