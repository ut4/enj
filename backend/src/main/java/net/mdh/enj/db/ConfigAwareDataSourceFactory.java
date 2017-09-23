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
        String env = config.getProperty("app.env");
        String jdbcUrl = config.getProperty("db.url");
        String username = config.getProperty("db.username");
        String password = config.getProperty("db.password");
        String message = "-propertyä ei määritelty @resources/app.properties";
        if (env == null) {
            throw new RuntimeException("app.env" + message);
        }
        if (jdbcUrl == null) {
            throw new RuntimeException("db.url" + message);
        }
        if (username == null) {
            throw new RuntimeException("db.username" + message);
        }
        if (password == null) {
            throw new RuntimeException("app.password" + message);
        }
        if (env.startsWith("prod")) {
            HikariDataSource ds = new HikariDataSource();
            ds.setJdbcUrl(jdbcUrl);
            ds.setUsername(username);
            ds.setPassword(password);
            this.dataSource = ds;
        } else {
            SimpleDriverDataSource ds = new SimpleDriverDataSource();
            ds.setDriver(new Driver());
            ds.setUrl(jdbcUrl);
            ds.setUsername(username);
            ds.setPassword(password);
            this.dataSource = ds;
        }
    }

    @Override
    public DataSource getDataSource() {
        return dataSource;
    }
}
