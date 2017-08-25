package net.mdh.enj.exercise;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import javax.inject.Inject;

public class ExerciseVariantRepository extends BasicRepository<Exercise.Variant> {

    private final static String TABLE_NAME = "exerciseVariant";

    @Inject
    public ExerciseVariantRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }
}
