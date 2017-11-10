package net.mdh.enj.db;

/**
 * Poikkeus tilanteisiin, jossa tietokantaoperaatio ei kirjoittanut vaadittavaa
 * dataa eg. affectedRowCount < requiredCount.
 */
public class IneffectualOperationException extends RuntimeException {

    public IneffectualOperationException(String message) {
        super(message);
    }

}
