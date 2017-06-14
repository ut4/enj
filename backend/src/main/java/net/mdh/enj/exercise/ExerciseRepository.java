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
     * Palauttaa kaikki liikkeet tietokannasta "uusin ensin" -järjestuksessä.
     *
     * @return liikkeet
     */
    List<Exercise> selectAll() {
        return super.selectAll(
            String.format("SELECT * FROM %sView ORDER BY id DESC", TABLE_NAME),
            new ExerciseMapper()
        );
    }

    /**
     * Luo Exercise-beaneja resultSet-rivin tiedoilla.
     */
    private final class ExerciseMapper extends NoDupeRowMapper<Exercise> {

        private final SubCollector<Exercise.Variant> variantCollector;

        ExerciseMapper() {
            super("id");
            this.variantCollector = new SubCollector<>(new ExerciseVariantMapper(), "id");
        }

        @Override
        public Exercise doMapRow(ResultSet rs, int rowNum) throws SQLException {
            Exercise exercise = new Exercise();
            int id = rs.getInt("id");
            exercise.setId(id);
            exercise.setName(rs.getString("name"));
            exercise.setVariants(this.variantCollector.collect(rs, rowNum, id));
            return exercise;
        }

        /**
         * Luo Variant-beaneja resultSet-rivin tiedoilla.
         */
        private final class ExerciseVariantMapper extends NoDupeRowMapper<Exercise.Variant> {

            ExerciseVariantMapper() {
                super("variantId");
            }

            @Override
            public Exercise.Variant doMapRow(ResultSet rs, int rowNum) throws SQLException {
                Exercise.Variant variant = new Exercise.Variant();
                variant.setId(rs.getInt("variantId"));
                variant.setContent(rs.getString("variantContent"));
                variant.setExerciseId(rs.getInt("id"));
                return variant;
            }
        }
    }
}
