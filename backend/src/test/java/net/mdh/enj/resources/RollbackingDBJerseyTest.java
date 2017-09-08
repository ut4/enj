package net.mdh.enj.resources;

import java.sql.SQLException;
import org.junit.AfterClass;

public class RollbackingDBJerseyTest extends JerseyTestCase {

    protected final static RollbackingDataSourceFactory rollbackingDSFactory;

    static {
        rollbackingDSFactory = RollbackingDataSourceFactory.getInstance();
    }

    @AfterClass
    public static void afterClass() throws SQLException {
        if (rollbackingDSFactory.isConnected()) {
            rollbackingDSFactory.getDataSource().getConnection().rollback();
        }
    }
}
