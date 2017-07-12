package net.mdh.enj.resources;

import net.mdh.enj.HttpClient;
import org.glassfish.jersey.test.JerseyTest;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class JerseyTestCase extends JerseyTest implements HttpClient {
    protected Response newPostRequest(String url, Object data) {
        return target(url)
            .request(MediaType.APPLICATION_JSON_TYPE)
            .post(Entity.json(data));
    }
}
