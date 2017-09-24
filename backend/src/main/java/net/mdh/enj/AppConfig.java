package net.mdh.enj;

import java.io.IOException;
import java.util.Properties;

public class AppConfig {
    private final String appEnv;
    public final String appPublicUrl;
    public final String dbUrl;
    public final String dbUsername;
    public final String dbPassword;
    public final String authTokenSigningKey;
    final String mailHost;
    final String mailFromAddress;
    final String mailFromPersonal;
    /**
     * Lataa app.properties-tiedoston arvot itseensä.
     *
     * @throws RuntimeException Jos app.properties lukeminen epäonnistui, tai property oli virheellinen.
     */
    public AppConfig() {
        Properties props = new Properties();
        try {
            props.load(this.getClass().getClassLoader().getResourceAsStream("app.properties"));
        } catch (IOException e) {
            throw new RuntimeException("resources/app.properties:n lukeminen epäonnistui");
        }
        this.appEnv              = this.getValue("app.env", props);
        this.appPublicUrl        = this.getValue("app.publicUrl", props);
        this.dbUrl               = this.getValue("db.url", props);
        this.dbUsername          = this.getValue("db.username", props);
        this.dbPassword          = this.getValue("db.password", props);
        this.authTokenSigningKey = this.getValue("auth.tokenSigningKey", props);
        this.mailHost            = this.getValue("mail.host", props);
        this.mailFromAddress     = this.getValue("mail.fromAddress", props);
        this.mailFromPersonal    = this.getValue("mail.fromPersonal", props);
    }

    public boolean envIsProduction() {
        return this.appEnv.startsWith("prod");
    }

    private String getValue(String key, Properties props) {
        String value = props.getProperty(key);
        if (value == null) {
            throw new RuntimeException(key + "-propertyä ei määritelty @resources/app.properties");
        }
        return value;
    }
}
