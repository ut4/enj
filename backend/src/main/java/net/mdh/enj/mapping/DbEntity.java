package net.mdh.enj.mapping;

public abstract class DbEntity {
    protected int id;
    public void setId(int id) {
        this.id = id;
    }
    public int getId() {
        return this.id;
    }
}