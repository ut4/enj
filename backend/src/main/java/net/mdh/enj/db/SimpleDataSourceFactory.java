package net.mdh.enj.db;

import javax.inject.Singleton;
import javax.sql.DataSource;
import org.springframework.jdbc.datasource.SimpleDriverDataSource;
import org.mariadb.jdbc.Driver;

/**
 * Palauttaa SimpleDriverDataSourcen, johon configuroitu MariaDB-driver. Luo
 * yhden dataSource-instanssin -per instanssi.
 */
@Singleton
public class SimpleDataSourceFactory implements DataSourceFactory {

    private SimpleDriverDataSource dataSource;

    public void setDatasorce(DataSource datasorce) {
        this.dataSource = (SimpleDriverDataSource) datasorce;
    }

    @Override
    public SimpleDriverDataSource getDataSource() {
        if (this.dataSource == null) {
            this.dataSource = new SimpleDriverDataSource();
            this.dataSource.setDriver(new Driver());
            this.dataSource.setUrl("jdbc:mariadb://localhost:3306/test");
            this.dataSource.setUsername("root");
            this.dataSource.setPassword("test");
        }
        return this.dataSource;
    }
}
