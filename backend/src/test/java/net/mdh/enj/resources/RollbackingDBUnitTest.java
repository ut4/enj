package net.mdh.enj.resources;

import org.junit.AfterClass;
import java.sql.SQLException;
import javax.sql.DataSource;

public class RollbackingDBUnitTest {

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
