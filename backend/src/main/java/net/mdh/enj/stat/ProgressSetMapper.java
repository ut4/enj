package net.mdh.enj.stat;

import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

class ProgressSetMapper implements RowMapper<ProgressSetMapper.ProgressSet> {
    @Override
    public ProgressSet mapRow(ResultSet rs, int rowNum) throws SQLException {
        ProgressSet set = new ProgressSet();
        set.setWeight(rs.getDouble("weight"));
        set.setReps(rs.getInt("reps"));
        set.setCalculatedResult(rs.getDouble("calculatedResult"));
        set.setLiftedAt(rs.getLong("liftedAt"));
        set.setExerciseName(rs.getString("exerciseName"));
        return set;
    }

    static class ProgressSet {

        private double weight;
        private int reps;
        private double calculatedResult;
        private long liftedAt;
        private String exerciseName;

        public double getWeight() {
            return this.weight;
        }
        public void setWeight(double weight) {
            this.weight = weight;
        }

        public int getReps() {
            return this.reps;
        }
        public void setReps(int reps) {
            this.reps = reps;
        }

        public double getCalculatedResult() {
            return this.calculatedResult;
        }
        public void setCalculatedResult(double calculatedResult) {
            this.calculatedResult = calculatedResult;
        }

        public long getLiftedAt() {
            return this.liftedAt;
        }
        public void setLiftedAt(long liftedAt) {
            this.liftedAt = liftedAt;
        }

        public String getExerciseName() {
            return this.exerciseName;
        }
        public void setExerciseName(String exerciseName) {
            this.exerciseName = exerciseName;
        }

        @Override
        public String toString() {
            return "ProgressSet{" +
                "weight=" + this.getWeight() +
                ", reps=" + this.getReps() +
                ", calculatedResult=" + this.getCalculatedResult() +
                ", liftedAt=" + this.getLiftedAt() +
                ", exerciseName=" + this.getExerciseName() +
            "}";
        }
    }
}
