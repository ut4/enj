package net.mdh.enj.program;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import javax.inject.Inject;

public class ProgramWorkoutRepository extends BasicRepository<Program.Workout> {

    private final static String TABLE_NAME = "programWorkout";

    @Inject
    public ProgramWorkoutRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }
}
