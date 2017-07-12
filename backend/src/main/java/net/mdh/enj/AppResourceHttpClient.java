package net.mdh.enj;

import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.WebTarget;

/**
 * Luokka, jolla voi suorittaa HTTP-pyyntöjä ohjelmallisesti mihin tahansa applikaation kontrolleriin
 * esim. client.target("workout").request(MediaType.APPLICATION_JSON).get(String.class).
 */
public class AppResourceHttpClient implements HttpClient {
    private final WebTarget baseTarget;
    AppResourceHttpClient() {
        this.baseTarget = ClientBuilder.newClient().target(Application.BASE_URI);
    }
    @Override
    public WebTarget target(String path) {
        return this.baseTarget.path(path);
    }
}
