package net.mdh.enj.resources;

import javax.sql.DataSource;
import java.sql.SQLException;
import org.junit.AfterClass;

public class RollbackingDBJerseyTest extends JerseyTestCase {

    protected final static RollbackingDataSourceFactory rollbackingDSFactory;
    protected final static DataSource rollbackingDataSource;

    static {
        rollbackingDSFactory = new RollbackingDataSourceFactory();
        rollbackingDataSource = rollbackingDSFactory.getDataSource();
    }

    @AfterClass
    public static void afterEach() throws SQLException {
        rollbackingDataSource.getConnection().rollback();
    }
}
