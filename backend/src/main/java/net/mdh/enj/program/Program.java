package net.mdh.enj.program;

import net.mdh.enj.mapping.DbEntity;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class Program extends DbEntity {
    @NotNull
    @Size(min = 2, max = 64)
    private String name;
    @NotNull
    @Min(1)
    private Long start;
    @NotNull
    @Min(1)
    private Long end;
    private String description;
    private String userId;

    public String getName() {
        return this.name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public String getUserId() {
        return this.userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Long getStart() {
        return this.start;
    }
    public void setStart(Long start) {
        this.start = start;
    }

    public Long getEnd() {
        return this.end;
    }
    public void setEnd(Long end) {
        this.end = end;
    }

    public String getDescription() {
        return this.description;
    }
    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public String toUpdateFields() {
        return "`name` = :name, `start` = :start, `end` = :end, description = :description";
    }

    @Override
    public boolean equals(Object obj) {
        return obj != null && obj instanceof Program && obj.toString().equals(this.toString());
    }

    @Override
    public String toString() {
        return "Program{" +
            "id=" + this.getId() +
            ", name=" + this.getName() +
            ", start=" + this.getStart() +
            ", end=" + this.getEnd() +
            ", description=" + this.getDescription() +
            ", userId=" + this.getUserId() +
        "}";
    }
}
