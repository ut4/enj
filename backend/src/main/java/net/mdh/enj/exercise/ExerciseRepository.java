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

    /**
     * Palauttaa kaikki liikkeet tietokannasta "uusin ensin" -järjestyksessä.
     *
     * @return liikkeet
     */
    List<Exercise> selectAll() {
        return super.selectAll(
            String.format("SELECT * FROM %sView ORDER BY exerciseId DESC", TABLE_NAME),
            new ExerciseMapper()
        );
    }

    /**
     * Luo Exercise-beaneja resultSet-rivin tiedoilla.
     */
    public static final class ExerciseMapper extends NoDupeRowMapper<Exercise> {

        private static final String ID_COL = "exerciseId";
        private final SubCollector<Exercise.Variant> variantCollector;

        public ExerciseMapper() {
            super(ID_COL);
            this.variantCollector = new SubCollector<>(new ExerciseVariantMapper(), ID_COL);
        }

        @Override
        public Exercise doMapRow(ResultSet rs, int rowNum) throws SQLException {
            Exercise exercise = new Exercise();
            int id = rs.getInt(ID_COL);
            exercise.setId(id);
            exercise.setName(rs.getString("exerciseName"));
            exercise.setVariants(this.variantCollector.collect(rs, rowNum, id));
            return exercise;
        }

        /**
         * Luo Variant-beaneja resultSet-rivin tiedoilla.
         */
        public static final class ExerciseVariantMapper extends NoDupeRowMapper<Exercise.Variant> {

            ExerciseVariantMapper() {
                super("exerciseVariantId");
            }

            @Override
            public Exercise.Variant doMapRow(ResultSet rs, int rowNum) throws SQLException {
                Exercise.Variant variant = new Exercise.Variant();
                variant.setId(rs.getInt("exerciseVariantId"));
                variant.setContent(rs.getString("exerciseVariantContent"));
                variant.setExerciseId(rs.getInt("exerciseId"));
                return variant;
            }
        }
    }
}
