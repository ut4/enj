package net.mdh.enj.resources;

import org.junit.After;
import java.sql.SQLException;
import javax.sql.DataSource;

public class RollbackingDBUnitTest {

    protected final RollbackingDataSourceFactory rollbackingDSFactory;
    protected final DataSource rollbackingDataSource;

    public RollbackingDBUnitTest() {
        this.rollbackingDSFactory = new RollbackingDataSourceFactory();
        this.rollbackingDataSource = this.rollbackingDSFactory.getDataSource();
    }

    @After
    public void afterEach() throws SQLException {
        this.rollbackingDataSource.getConnection().rollback();
    }
}
