package net.mdh.enj.mapping;

public abstract class DbEntity {
    protected String id;
    public void setId(String id) {
        this.id = id;
    }
    public String getId() {
        return this.id;
    }
    /**
     * UPDATE-kyselyn fields/columns, esim. "foo = :foo, bar = someBeanProperty"
     */
    public abstract String toUpdateFields();
}