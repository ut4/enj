package net.mdh.enj.resources;

import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.DefaultTransactionDefinition;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.AppConfig;
import javax.sql.DataSource;

/**
 * Luokka, jonka getDataSource palauttaa SingleConnectionDataSource-singletonin,
 * ja starttaa samalla transaktion, joka taas tarkoittaa, että testien aikana
 * tietokantaan tapahtuneet muutokset peruuntuu automaattisesti (ellei kutsuta
 * erikseen commitTransactionIfStarted?).
 */
public class RollbackingDataSourceFactory implements DataSourceFactory {

    private static RollbackingDataSourceFactory instance;
    private static SingleConnectionDataSource dataSource;
    private DataSourceTransactionManager transactionManager;
    private TransactionStatus transactionStatus;

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
            AppConfig appConfig = AppConfigProvider.getInstance();
            dataSource = new SingleConnectionDataSource();
            dataSource.setDriverClassName("org.mariadb.jdbc.Driver");
            dataSource.setUrl(appConfig.dbUrl);
            dataSource.setUsername(appConfig.dbUsername);
            dataSource.setPassword(appConfig.dbPassword);
            startTransaction();
        }
        return dataSource;
    }
    void startTransaction() {
        transactionManager = new DataSourceTransactionManager(dataSource);
        DefaultTransactionDefinition def = new DefaultTransactionDefinition();
        def.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        transactionStatus = transactionManager.getTransaction(def);
    }
    void commitTransactionIfStarted() {
        if (transactionManager != null) {
            transactionManager.commit(transactionStatus);
        }
    }
}
