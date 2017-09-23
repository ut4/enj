package net.mdh.enj;

import java.util.Properties;
import javax.inject.Inject;
import javax.mail.Message;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.InternetAddress;
import java.io.UnsupportedEncodingException;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;

/**
 * Lähettää HTML-muotoisia sähköposteja.
 */
public class Mailer {

    private final String host;
    private final String fromAddress;
    private final String fromPersonal;
    private final String charset = "UTF-8";
    private final String contentType = "text/html; charset=" + this.charset;
    private static final Logger logger = LoggerFactory.getLogger(Application.class);

    @Inject
    Mailer(AppConfig appConfig)  {
        this.host = appConfig.mailHost;
        this.fromAddress = appConfig.mailFromAddress;
        this.fromPersonal = appConfig.mailFromPersonal;
    }

    /**
     * Lähettää viestin {content} paketoituna <!DOCTYPE html><html><head>...-
     * markupiin osoitteeseen {to}.
     *
     * @return Onnistuiko mailin lähetys, true = kyllä, false = ei.
     */
    public boolean sendMail(String to, String subject, String content) {
        return this.sendMail(to, subject, content, true);
    }

    /**
     * Lähettää viestin {content} osoitteeseen {to}.
     */
    public boolean sendMail(String to, String subject, String content, boolean wrapContentToDefaultTemplate) {
        try {
            Session emailSession = this.getSession();
            Message msg = new MimeMessage(emailSession);
            msg.setFrom(new InternetAddress(this.fromAddress, this.fromPersonal));
            msg.addRecipient(Message.RecipientType.TO, new InternetAddress(to));
            msg.setSubject(subject);
            msg.setContent(
                wrapContentToDefaultTemplate ? this.newHtmlTemplate(content) : content,
                this.contentType
            );
            Transport.send(msg);
            return true;
        } catch (MessagingException | UnsupportedEncodingException e) {
            logger.error(e.getLocalizedMessage());
            return false;
        }
    }

    private Session getSession() {
        Properties properties = new Properties();
        properties.setProperty("mail.smtp.host", this.host);
        properties.setProperty("mail.mime.charset", this.charset);
        return Session.getInstance(properties, null);
    }

    private String newHtmlTemplate(String content) {
        return "<!DOCTYPE html>\n" +
            "<html>\n" +
            "    <head>\n" +
            "        <meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\">\n" +
            "    </head>\n" +
            "    <body bgcolor=\"#ffffff\" text=\"#000000\">\n" +
            "        " + content + "\n" +
            "    </body>\n" +
            "</html>";
    }
}
