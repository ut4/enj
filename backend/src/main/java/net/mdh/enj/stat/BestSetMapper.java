package net.mdh.enj.stat;

import org.springframework.jdbc.core.RowMapper;
import java.sql.SQLException;
import java.sql.ResultSet;

class BestSetMapper implements RowMapper<BestSetMapper.BestSet> {
    @Override
    public BestSet mapRow(ResultSet rs, int rowNum) throws SQLException {
        BestSet set = new BestSet();
        set.setStartWeight(rs.getDouble("startWeight"));
        set.setBestWeight(rs.getDouble("bestWeight"));
        set.setBestWeightReps(rs.getInt("bestWeightReps"));
        set.setTimesImproved(rs.getInt("timesImproved"));
        set.setExerciseName(rs.getString("exerciseName"));
        return set;
    }

    static class BestSet {
        private double startWeight; // Ensimmäinen ennätys
        private double bestWeight;  // Viimeisin ennätys
        private int bestWeightReps; // Viimeisimmän ennätyksen toistot
        private int timesImproved;
        private String exerciseName;

        public double getStartWeight() {
            return this.startWeight;
        }
        public void setStartWeight(double startWeight) {
            this.startWeight = startWeight;
        }

        public double getBestWeight() {
            return this.bestWeight;
        }
        public void setBestWeight(double bestWeight) {
            this.bestWeight = bestWeight;
        }

        public int getBestWeightReps() {
            return this.bestWeightReps;
        }
        public void setBestWeightReps(int bestWeightReps) {
            this.bestWeightReps = bestWeightReps;
        }

        public int getTimesImproved() {
            return this.timesImproved;
        }
        public void setTimesImproved(int timesImproved) {
            this.timesImproved = timesImproved;
        }

        public String getExerciseName() {
            return this.exerciseName;
        }
        public void setExerciseName(String exerciseName) {
            this.exerciseName = exerciseName;
        }

        @Override
        public String toString() {
            return "BestSet{" +
                "startWeight=" + this.getStartWeight() +
                ", bestWeight=" + this.getBestWeight() +
                ", bestWeightReps=" + this.getBestWeightReps() +
                ", timesImproved=" + this.getTimesImproved() +
                ", exerciseName=" + this.getExerciseName() +
            "}";
        }
    }
}
