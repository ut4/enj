package net.mdh.enj.db;

import javax.inject.Inject;
import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;
import net.mdh.enj.AppConfig;
import org.mariadb.jdbc.Driver;
import org.springframework.jdbc.datasource.SimpleDriverDataSource;

/**
 * Palauttaa tuotantoon (HikariCP), tai kehitykseen (Spring SimpleDriverDataSource)
 * sopivan DataSourcen riippuen app.properties:n app.env arvosta. Singleton, luodaan
 * HK2:n toimesta vain 1kpl.
 */
public class ConfigAwareDataSourceFactory implements DataSourceFactory {

    private final DataSource dataSource;

    @Inject
    ConfigAwareDataSourceFactory(AppConfig config) {
        if (config.envIsProduction()) {
            HikariDataSource ds = new HikariDataSource();
            ds.setJdbcUrl(config.dbUrl);
            ds.setUsername(config.dbUsername);
            ds.setPassword(config.dbPassword);
            this.dataSource = ds;
        } else {
            SimpleDriverDataSource ds = new SimpleDriverDataSource();
            ds.setDriver(new Driver());
            ds.setUrl(config.dbUrl);
            ds.setUsername(config.dbUsername);
            ds.setPassword(config.dbPassword);
            this.dataSource = ds;
        }
    }

    @Override
    public DataSource getDataSource() {
        return dataSource;
    }
}
