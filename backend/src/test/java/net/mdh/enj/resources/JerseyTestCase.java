package net.mdh.enj.resources;

import net.mdh.enj.HttpClient;
import net.mdh.enj.auth.AuthenticationFilter;
import org.glassfish.jersey.server.validation.ValidationError;
import org.glassfish.jersey.test.JerseyTest;
import javax.ws.rs.client.Invocation.Builder;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.client.Entity;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.Comparator;
import java.util.List;

public class JerseyTestCase extends JerseyTest implements HttpClient {
    protected Response newPostRequest(String url, Object data) {
        return this.newRequest(url, "POST", data, null);
    }
    protected Response newPostRequest(String url, Object data, Consumer<Builder> additionalSetup) {
        return this.newRequest(url, "POST", data, additionalSetup);
    }
    protected Response newPutRequest(String url, Object data) {
        return this.newRequest(url, "PUT", data, null);
    }
    protected Response newDeleteRequest(String url) {
        return this.newRequest(url, "DELETE", null, null);
    }
    private Response newRequest(String url, String method, Object data, Consumer<Builder> additionalSetup) {
        Builder builder = target(url).request(MediaType.APPLICATION_JSON_TYPE);
        if (additionalSetup != null) {
            additionalSetup.accept(builder);
        }
        return builder.method(method, Entity.json(data));
    }
    protected Response newGetRequest(String url) {
        return this.newGetRequest(url, null);
    }
    protected Response newGetRequest(String url, Function<WebTarget, WebTarget> additionalSetup) {
        WebTarget target = target(url);
        if (additionalSetup != null) {
            target = additionalSetup.apply(target);
        }
        return target.request().header(AuthenticationFilter.AUTH_HEADER_NAME, TestData.MOCK_AUTH_HEADER).get();
    }
    protected List<ValidationError> getValidationErrors(Response response) {
        List<ValidationError> errors = response.readEntity(new GenericType<List<ValidationError>>() {});
        errors.sort(Comparator.comparing(ValidationError::getPath));// aakkosjärjestykseen
        return errors;
    }
}
