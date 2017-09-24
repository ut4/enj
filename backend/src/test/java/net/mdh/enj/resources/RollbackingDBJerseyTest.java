package net.mdh.enj.resources;

public class RollbackingDBJerseyTest extends JerseyTestCase {

    protected final static RollbackingDataSourceFactory rollbackingDSFactory;

    static {
        rollbackingDSFactory = RollbackingDataSourceFactory.getInstance();
    }
}
