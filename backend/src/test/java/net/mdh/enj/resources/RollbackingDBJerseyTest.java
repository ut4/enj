package net.mdh.enj.resources;

import javax.sql.DataSource;
import java.sql.SQLException;
import org.junit.AfterClass;

public class RollbackingDBJerseyTest extends JerseyTestCase {

    protected final static RollbackingDataSourceFactory rollbackingDSFactory;
    protected final static DataSource rollbackingDataSource;

    static {
        rollbackingDSFactory = RollbackingDataSourceFactory.getInstance();
        rollbackingDataSource = rollbackingDSFactory.getDataSource();
    }

    @AfterClass
    public static void afterClass() throws SQLException {
        rollbackingDataSource.getConnection().rollback();
    }
}
