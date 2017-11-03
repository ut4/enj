package net.mdh.enj;

import net.mdh.enj.auth.ResponseFilter;
import net.mdh.enj.sync.SyncRouteCollector;
import net.mdh.enj.auth.AuthenticationFilter;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.jersey.jackson.JacksonFeature;
import org.glassfish.jersey.server.ResourceConfig;
import java.io.IOException;
import java.net.URI;

public class Application {
    /**
     * REST-APIn loppusijoituspaikka
     */
    static final String BASE_URI = "http://localhost:4567/api/";
    /**
     * Starttaa applikaation osoitteessa {Application.BASE_URI} käyttäen Grizzly
     * HTTP-serveriä.
     */
    public static void main(String[] args) throws IOException, InterruptedException {
        // Lataa & validoi app.properties
        AppConfig appProperties = new AppConfig();
        // Rekisteröi sorsat & configuroi jersey
        final ResourceConfig applicationConfig = new ResourceConfig();
        applicationConfig.packages("net.mdh.enj");
        applicationConfig.register(JacksonFeature.class);
        applicationConfig.register(CORSEnabler.class);
        applicationConfig.register(AuthenticationFilter.class);
        applicationConfig.register(ResponseFilter.class);
        applicationConfig.register(SyncRouteCollector.class);
        applicationConfig.register(new InjectionBinder(appProperties));
        applicationConfig.property(ServerProperties.WADL_FEATURE_DISABLE, true);
        applicationConfig.property(ServerProperties.METAINF_SERVICES_LOOKUP_DISABLE, true);
        if (!appProperties.envIsProduction()) {
            applicationConfig.property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true);
        }
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
