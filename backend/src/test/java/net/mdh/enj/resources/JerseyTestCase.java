package net.mdh.enj.resources;

import net.mdh.enj.HttpClient;
import org.glassfish.jersey.test.JerseyTest;
import javax.ws.rs.client.Invocation.Builder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.function.Consumer;

public class JerseyTestCase extends JerseyTest implements HttpClient {
    protected Response newPostRequest(String url, Object data) {
        return this.newPostRequest(url, data, null);
    }
    protected Response newPostRequest(String url, Object data, Consumer<Builder> additionalSetup) {
        Builder builder = target(url).request(MediaType.APPLICATION_JSON_TYPE);
        if (additionalSetup != null) {
            additionalSetup.accept(builder);
        }
        return builder.post(Entity.json(data));
    }
}
