package net.mdh.enj.program;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import javax.inject.Inject;

public class ProgramRepository extends BasicRepository<Program> {

    private final static String TABLE_NAME = "program";

    @Inject
    public ProgramRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }
}
