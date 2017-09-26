package net.mdh.enj.exercise;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import net.mdh.enj.mapping.NoDupeRowMapper;
import net.mdh.enj.mapping.SubCollector;
import java.sql.SQLException;
import java.sql.ResultSet;
import javax.inject.Inject;
import java.util.List;

public class ExerciseRepository extends BasicRepository<Exercise> {

    private final static String TABLE_NAME = "exercise";

    @Inject
    public ExerciseRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }

    Exercise selectOne(SelectFilters filters) {
        return super.selectOne(filters, new ExerciseMapper());
    }

    List<Exercise> selectAll(SelectFilters filters) {
        return super.selectAll(filters, new ExerciseMapper());
    }

    /**
     * Luo Exercise-beaneja resultSet-rivin tiedoilla.
     */
    private static final class ExerciseMapper extends NoDupeRowMapper<Exercise> {

        private static final String ID_COL = "exerciseId";
        private final SubCollector<Exercise.Variant> variantCollector;

        ExerciseMapper() {
            super(ID_COL);
            this.variantCollector = new SubCollector<>(new ExerciseVariantMapper(), ID_COL);
        }

        @Override
        public Exercise doMapRow(ResultSet rs, int rowNum) throws SQLException {
            Exercise exercise = new Exercise();
            String id = rs.getString(ID_COL);
            exercise.setId(id);
            exercise.setName(rs.getString("exerciseName"));
            exercise.setUserId(rs.getString("exerciseUserId"));
            exercise.setVariants(this.variantCollector.collect(rs, rowNum, id));
            return exercise;
        }

        /**
         * Luo Variant-beaneja resultSet-rivin tiedoilla.
         */
        public static final class ExerciseVariantMapper extends NoDupeRowMapper<Exercise.Variant> {

            public ExerciseVariantMapper() {
                super("exerciseVariantId");
            }

            @Override
            public Exercise.Variant doMapRow(ResultSet rs, int rowNum) throws SQLException {
                Exercise.Variant variant = new Exercise.Variant();
                String id = rs.getString("exerciseVariantId");
                variant.setId(id);
                if (id != null) {
                    variant.setContent(rs.getString("exerciseVariantContent"));
                    variant.setExerciseId(rs.getString("exerciseId"));
                    variant.setUserId(rs.getString("exerciseVariantUserId"));
                } else {
                    variant.setContent(null);
                    variant.setExerciseId(null);
                    variant.setUserId(null);
                }
                return variant;
            }
        }
    }
}
