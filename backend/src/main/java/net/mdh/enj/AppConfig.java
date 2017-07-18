package net.mdh.enj;

import java.io.IOException;
import java.util.Properties;

public class AppConfig extends Properties {
    /**
     * Lataa applikaation configuraatiot itseensä, ja palautuu :D
     */
    public AppConfig selfload() {
        try {
            this.load(this.getClass().getClassLoader().getResourceAsStream("app.properties"));
        } catch (IOException e) {
            // TODOLOGGER
        }
        return this;
    }
}
