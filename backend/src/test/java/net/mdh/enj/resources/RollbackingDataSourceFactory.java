package net.mdh.enj.resources;

import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
// Jotta autocommit false ei flushaisi tuloksia kesken kaiken..
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import net.mdh.enj.db.DataSourceFactory;

public class RollbackingDataSourceFactory implements DataSourceFactory {
    private static SingleConnectionDataSource dataSource;
    @Override
    public DataSource getDataSource() {
        if (RollbackingDataSourceFactory.dataSource == null) {
            RollbackingDataSourceFactory.dataSource = new InMemoryDS();
            RollbackingDataSourceFactory.dataSource.setDriverClassName("org.mariadb.jdbc.Driver");
            RollbackingDataSourceFactory.dataSource.setUrl("jdbc:mariadb://localhost:3306/test");
            RollbackingDataSourceFactory.dataSource.setUsername("root");
            RollbackingDataSourceFactory.dataSource.setPassword("test");
        }
        return RollbackingDataSourceFactory.dataSource;
    }
    private class InMemoryDS extends SingleConnectionDataSource {
        @Override
        public Connection getConnection() throws SQLException {
            Connection c = super.getConnection();
            c.setAutoCommit(false);
            return c;
        }
    }
}
