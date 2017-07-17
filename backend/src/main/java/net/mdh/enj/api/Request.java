package net.mdh.enj.api;

/**
 * Sisältää REST-pyyntöihin liittyvät vakiot.
 */
public interface Request {
    String AUTH_HEADER_NAME = "Authorization";
    String AUTH_TOKEN_PREFIX = "Bearer ";
    String AUTH_USER_ID = "userId";
}
