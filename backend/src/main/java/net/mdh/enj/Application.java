package net.mdh.enj;

import spark.Spark;

public class Application {
    public static void main(String[] args) {
        Spark.before((request, response) -> {
            response.header("Access-Control-Allow-Origin", "http://localhost:8080");
            response.type("application/json");
        });
        Spark.get("/api/workout", (req, res) ->
            "[{\"foo\": \"baz\"}]"
        );
    }
}
