package net.mdh.enj.resources;

public class RollbackingDBUnitTest {

    protected final static RollbackingDataSourceFactory rollbackingDSFactory;

    static {
        rollbackingDSFactory = RollbackingDataSourceFactory.getInstance();
    }
}
