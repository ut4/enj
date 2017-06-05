package net.mdh.enj;

import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import java.io.IOException;
import java.net.URI;

public class Application {
    /**
     * REST-APIn loppusijoituspaikka
     */
    public static final String BASE_URI = "http://localhost:4567/api/";
    /**
     * Starttaa applikaation osoitteessa BASE_URI käyttäen Grizzly-serveriä.
     *
     * @return server
     */
    public static HttpServer startServer() {
        // Rekisteröi sorsat & configuroi jersey
        final ResourceConfig applicationConfig = new ResourceConfig();
        applicationConfig.packages("net.mdh.enj");
        applicationConfig.register(new InjectionBinder());
        // Now you can expect validation errors to be sent to the client.
        applicationConfig.property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true);
        // Luo & käynnistä serveri
        return GrizzlyHttpServerFactory.createHttpServer(
            URI.create(BASE_URI),
            applicationConfig
        );
    }
    /**
     * @param args
     * @throws java.io.IOException
     */
    public static void main(String[] args) throws IOException {
        HttpServer server = Application.startServer();
        System.out.println(String.format("Jersey app started with WADL available at "
                + "%sapplication.wadl\nHit enter to stop it...", BASE_URI));
        System.in.read();
        server.stop();
    }
}
