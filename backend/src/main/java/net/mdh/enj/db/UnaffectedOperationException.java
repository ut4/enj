package net.mdh.enj.db;

/**
 * Poikkeus tilanteisiin, jossa tietokantaoperaatio ei kirjoittanut vaadittavaa
 * dataa eg. affectedRowCount <= requiredCount.
 */
public class UnaffectedOperationException extends RuntimeException {

    public UnaffectedOperationException(String message) {
        super(message);
    }

}
