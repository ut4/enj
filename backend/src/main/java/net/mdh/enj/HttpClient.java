package net.mdh.enj;

import javax.ws.rs.client.WebTarget;

public interface HttpClient {
    WebTarget target(String path);
}
