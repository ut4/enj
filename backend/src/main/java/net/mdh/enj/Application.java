package net.mdh.enj;

import net.mdh.enj.auth.AuthenticationFilter;
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
    private static final String BASE_URI = "http://localhost:4567/api/";
    /**
     * Starttaa applikaation osoitteessa {Application.BASE_URI} käyttäen Grizzly
     * HTTP-serveriä.
     */
    public static void main(String[] args) throws IOException, InterruptedException {
        // Rekisteröi sorsat & configuroi jersey
        final ResourceConfig applicationConfig = new ResourceConfig();
        applicationConfig.packages("net.mdh.enj");
        applicationConfig.register(CORSEnabler.class);
        applicationConfig.register(AuthenticationFilter.class);
        applicationConfig.register(new InjectionBinder());
        applicationConfig.property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true);
        // Luo & käynnistä serveri
        HttpServer server = GrizzlyHttpServerFactory.createHttpServer(
            URI.create(BASE_URI),
            applicationConfig,
            false
        );
        Runtime.getRuntime().addShutdownHook(
            new Thread(server::shutdownNow)
        );
        server.start();
        System.out.println(String.format("Jersey app started at %s.\n" +
                "Hit Ctrl+C to stop it...", BASE_URI));
        Thread.currentThread().join();
    }
}
