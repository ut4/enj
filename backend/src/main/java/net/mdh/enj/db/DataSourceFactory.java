package net.mdh.enj.db;

import javax.sql.DataSource;

public interface DataSourceFactory {
    DataSource getDataSource();
}
