package net.mdh.enj.exercise;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import net.mdh.enj.mapping.NoDupeRowMapper;
import net.mdh.enj.mapping.SubCollector;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import java.sql.SQLException;
import java.sql.ResultSet;
import javax.inject.Inject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ExerciseRepository extends BasicRepository<Exercise> {

    private final static String TABLE_NAME = "exercise";
    private final List<String> baseFilters;

    @Inject
    public ExerciseRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
        this.baseFilters = Arrays.asList(
            "(exerciseUserId IS NULL OR exerciseUserId = :userId)",
            "(exerciseVariantUserId IS NULL OR exerciseVariantUserId = :userId)"
        );
    }

    /**
     * Palauttaa käyttäjän {userId} liikkeen {id}.
     */
    Exercise selectOne(String exerciseId, String userId) {
        List<String> filters = new ArrayList<>(this.baseFilters);
        filters.add("exerciseId = :id");
        return super.selectOne(
            this.newSelectQ(String.join(" AND ", filters)),
            new MapSqlParameterSource("id", exerciseId).addValue("userId", userId),
            new ExerciseMapper()
        );
    }

    /**
     * Palauttaa kaikki globaalit, sekä {userId}-käyttäjälle kuuluvat liikkeet.
     */
    List<Exercise> selectAll(String userId) {
        return super.selectAll(
            this.newSelectQ(String.join(" AND ", this.baseFilters)),
            new MapSqlParameterSource("userId", userId),
            new ExerciseMapper()
        );
    }

    /**
     * Päivittää liikkeen {exercise} tietokantaan, ja palauttaa päivitettyjen
     * rivien lukumäärän.
     */
    int update(Exercise exercise) {
        return super.update(
            String.format("UPDATE %s SET `name` = :name WHERE id = :id AND userId = :userId", TABLE_NAME),
            exercise
        );
    }

    private String newSelectQ(String where) {
        return String.format("SELECT * FROM %sView WHERE (%s)", TABLE_NAME, where);
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
