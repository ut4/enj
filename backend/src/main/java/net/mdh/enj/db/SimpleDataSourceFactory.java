package net.mdh.enj.db;

import javax.inject.Inject;
import net.mdh.enj.AppConfig;
import org.springframework.jdbc.datasource.SimpleDriverDataSource;
import org.mariadb.jdbc.Driver;

/**
 * Palauttaa SimpleDriverDataSourcen, johon configuroitu MariaDB-driver. Luo
 * yhden DataSource-instanssin -per instanssi.
 */
public class SimpleDataSourceFactory implements DataSourceFactory {

    private final AppConfig appConfig;
    private SimpleDriverDataSource dataSourceSingleton;

    @Inject
    SimpleDataSourceFactory(AppConfig config) {
        this.appConfig = config;
    }

    @Override
    public SimpleDriverDataSource getDataSource() {
        if (this.dataSourceSingleton == null) {
            this.dataSourceSingleton = new SimpleDriverDataSource();
            this.dataSourceSingleton.setDriver(new Driver());
            this.dataSourceSingleton.setUrl(appConfig.getProperty("db.url"));
            this.dataSourceSingleton.setUsername(appConfig.getProperty("db.username"));
            this.dataSourceSingleton.setPassword(appConfig.getProperty("db.password"));
        }
        return this.dataSourceSingleton;
    }
}
