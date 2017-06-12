package net.mdh.enj.resources;

import org.junit.After;
import javax.sql.DataSource;
import java.sql.SQLException;
import org.glassfish.jersey.test.JerseyTest;

public class RollbackingDBJerseyTest extends JerseyTest {

    protected final RollbackingDataSourceFactory rollbackingDSFactory;
    protected final DataSource rollbackingDataSource;

    public RollbackingDBJerseyTest() {
        this.rollbackingDSFactory = new RollbackingDataSourceFactory();
        this.rollbackingDataSource = this.rollbackingDSFactory.getDataSource();
    }

    @After
    public void afterEach() throws SQLException {
        this.rollbackingDataSource.getConnection().rollback();
    }
}
