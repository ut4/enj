package net.mdh.enj.workout;

import javax.validation.constraints.Min;

/**
 * Treenientiteetti (/api/workout)
 */
public class Workout {
    private int id;
    @Min(value = 1)
    private long start;
    private long end;
    private String notes;

    public int getId() {
        return this.id;
    }
    public void setId(int id) {
        this.id = id;
    }

    public long getStart() {
        return this.start;
    }
    public void setStart(long start) {
        this.start = start;
    }

    public long getEnd() {
        return this.end;
    }
    public void setEnd(long end) {
        this.end = end;
    }

    public String getNotes() {
        return this.notes;
    }
    public void setNotes(String notes) {
        this.notes = notes;
    }

    @Override
    public String toString() {
        return "[" +
            "id=" + this.getId() +
            ", start=" + this.getStart() +
            ", end=" + this.getEnd() +
            ", notes=" + this.getNotes() +
        "]";
    }
}
