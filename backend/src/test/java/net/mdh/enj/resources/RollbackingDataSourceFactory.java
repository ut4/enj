package net.mdh.enj.resources;

import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
// Ettei autocommit false flushaisi tuloksia kesken kaiken..
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.AppConfig;

public class RollbackingDataSourceFactory implements DataSourceFactory {
    private static RollbackingDataSourceFactory instance;
    private static SingleConnectionDataSource dataSource;
    private RollbackingDataSourceFactory() {}
    static RollbackingDataSourceFactory getInstance() {
        if (instance == null) {
            instance = new RollbackingDataSourceFactory();
        }
        return instance;
    }
    @Override
    public DataSource getDataSource() {
        if (dataSource == null) {
            AppConfig appConfig = new AppConfig().selfload();
            dataSource = new RollbackingDS();
            dataSource.setDriverClassName("org.mariadb.jdbc.Driver");
            dataSource.setUrl(appConfig.getProperty("db.url"));
            dataSource.setUsername(appConfig.getProperty("db.username"));
            dataSource.setPassword(appConfig.getProperty("db.password"));
        }
        return dataSource;
    }
    private class RollbackingDS extends SingleConnectionDataSource {
        @Override
        public Connection getConnection() throws SQLException {
            Connection c = super.getConnection();
            c.setAutoCommit(false);
            return c;
        }
    }
}
