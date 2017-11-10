package net.mdh.enj;

import javax.ws.rs.ext.Provider;

/**
 * Koppaa kaikki applikaatiossa tapahtuneet poikkeukset, loggaa ne täydellisenä
 * konsoliin, ja palauttaa selaimeen vain tarvittavan määrän tietoa.
 */
@Provider
public class MainExceptionMapper extends AbstractExceptionMapper<Throwable> {}
