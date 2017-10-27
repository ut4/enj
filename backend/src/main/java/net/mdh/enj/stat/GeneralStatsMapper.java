package net.mdh.enj.stat;

import org.springframework.jdbc.core.RowMapper;
import java.sql.SQLException;
import java.sql.ResultSet;

class GeneralStatsMapper implements RowMapper<GeneralStatsMapper.GeneralStats> {

    @Override
    public GeneralStats mapRow(ResultSet rs, int rowNum) throws SQLException {
        int totalWorkoutCount = rs.getInt("totalWorkoutCount");
        if (totalWorkoutCount < 1) {
            return null;
        }
        GeneralStats item = new GeneralStats();
        item.setTotalWorkoutCount(totalWorkoutCount);
        item.setTotalWorkoutTime(rs.getLong("totalWorkoutTime"));
        item.setAverageWorkoutTime(rs.getInt("averageWorkoutTime"));
        item.setLongestWorkoutTime(rs.getInt("longestWorkoutTime"));
        item.setShortestWorkoutTime(rs.getInt("shortestWorkoutTime"));
        item.setTotalSetCount(rs.getInt("totalSetCount"));
        item.setTotalLifted(rs.getInt("totalLifted"));
        item.setTotalReps(rs.getInt("totalReps"));
        return item;
    }

    static class GeneralStats {
        private int totalWorkoutCount;
        private long totalWorkoutTime;
        private int averageWorkoutTime;
        private int longestWorkoutTime;
        private int shortestWorkoutTime;
        private int totalSetCount;
        private double totalLifted;
        private int totalTotalReps;

        public int getTotalWorkoutCount() {
            return this.totalWorkoutCount;
        }
        public void setTotalWorkoutCount(int totalWorkoutCount) {
            this.totalWorkoutCount = totalWorkoutCount;
        }

        public long getTotalWorkoutTime() {
            return this.totalWorkoutTime;
        }
        public void setTotalWorkoutTime(long totalWorkoutTime) {
            this.totalWorkoutTime = totalWorkoutTime;
        }

        public int getAverageWorkoutTime() {
            return this.averageWorkoutTime;
        }
        public void setAverageWorkoutTime(int averageWorkoutTime) {
            this.averageWorkoutTime = averageWorkoutTime;
        }

        public int getLongestWorkoutTime() {
            return this.longestWorkoutTime;
        }
        public void setLongestWorkoutTime(int longestWorkoutTime) {
            this.longestWorkoutTime = longestWorkoutTime;
        }

        public int getShortestWorkoutTime() {
            return this.shortestWorkoutTime;
        }
        public void setShortestWorkoutTime(int shortestWorkoutTime) {
            this.shortestWorkoutTime = shortestWorkoutTime;
        }

        public int getTotalSetCount() {
            return this.totalSetCount;
        }
        public void setTotalSetCount(int totalSetCount) {
            this.totalSetCount = totalSetCount;
        }

        public double getTotalLifted() {
            return this.totalLifted;
        }
        public void setTotalLifted(double totalLifted) {
            this.totalLifted = totalLifted;
        }

        public int getTotalReps() {
            return this.totalTotalReps;
        }
        public void setTotalReps(int totalTotalReps) {
            this.totalTotalReps = totalTotalReps;
        }

        @Override
        public String toString() {
            return "GeneralStats{" +
                "totalWorkoutCount=" + totalWorkoutCount +
                ", totalWorkoutTime=" + totalWorkoutTime +
                ", averageWorkoutTime=" + averageWorkoutTime +
                ", longestWorkoutTime=" + longestWorkoutTime +
                ", shortestWorkoutTime=" + shortestWorkoutTime +
                ", totalSetCount=" + totalSetCount +
                ", totalLifted=" + totalLifted +
                ", totalTotalReps=" + totalTotalReps +
            '}';
        }
    }
}
