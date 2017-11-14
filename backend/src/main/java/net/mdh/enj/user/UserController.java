package net.mdh.enj.user;

import io.jsonwebtoken.impl.TextCodec;
import net.mdh.enj.api.RequestContext;
import static net.mdh.enj.api.Responses.InsertResponse;
import static net.mdh.enj.api.Responses.UpdateResponse;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataParam;
import javax.validation.constraints.NotNull;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import java.awt.image.BufferedImage;
import java.awt.RenderingHints;
import java.awt.Graphics2D;
import java.awt.Transparency;
import javax.validation.Valid;
import javax.imageio.ImageIO;
import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Vastaa /api/user REST-pyynnöistä
 */
@Path("user")
@Produces(MediaType.APPLICATION_JSON)
public class UserController {

    private final UserRepository userRepository;
    private final RequestContext requestContext;
    private final Map<String, String> VALID_MIMES;

    @Inject
    public UserController(UserRepository userRepository, RequestContext requestContext) {
        this.userRepository = userRepository;
        this.requestContext = requestContext;
        this.VALID_MIMES = new HashMap<>();
        this.VALID_MIMES.put("image/bmp", "bmp");
        this.VALID_MIMES.put("image/gif", "gif");
        this.VALID_MIMES.put("image/ico", "ico");
        this.VALID_MIMES.put("image/jpeg", "jpg");
        this.VALID_MIMES.put("image/png", "png");
        this.VALID_MIMES.put("image/tif", "tiff");
    }

    /**
     * Palauttaa kirjautuneen käyttäjän tiedot.
     */
    @GET
    @Path("/me")
    public User get() {
        SelectFilters filters = new SelectFilters();
        filters.setId(this.requestContext.getUserId());
        return this.userRepository.selectOne(filters);
    }

    /**
     * Päivittää kirjautuneen käyttäjän tiedot beanin {user}, datalla.
     */
    @PUT
    @Path("/me")
    @Consumes(MediaType.APPLICATION_JSON)
    public UpdateResponse update(@Valid User user) {
        // Yliaja id:ksi aina kirjautuneen käyttäjän id.
        user.setId(this.requestContext.getUserId());
        return new UpdateResponse(this.userRepository.update(user, "id = :id"));
    }

    /**
     * Vastaanottaa käyttäjän lähettämän kuvan, skaalaa sen pienemmäksi, ja
     * tallentaa sen base64-datan tietokantaan.
     */
    @POST
    @Path("/profile-pic")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public InsertResponse uploadProfilePic(@NotNull @FormDataParam("file") FormDataBodyPart body) {
        String extension = this.VALID_MIMES.get(body.getMediaType().toString());
        // 1. Validoi MIME
        if (extension == null) {
            throw new BadRequestException("Not valid MIME-type");
        }
        String base64ScaledImage;
        // 2. Lue & skaalaa & base64-enkoodaa data
        try (InputStream is = body.getValueAs(InputStream.class)) {
            BufferedImage scaled = this.makeScaledImage(ImageIO.read(is));
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(scaled, extension, baos);
            base64ScaledImage = TextCodec.BASE64.encode(baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
        // 3. Tallenna tietokantaan
        User user = new User(){ @Override public String toUpdateFields() {
            return "base64ProfilePic = :base64ProfilePic";
        }};
        user.setBase64ProfilePic(base64ScaledImage);
        user.setId(this.requestContext.getUserId());
        this.userRepository.update(user, "id = :id");
        // 4. Profit
        return new InsertResponse(1, "-");
    }

    private BufferedImage makeScaledImage(BufferedImage uploaded) {
        int width = uploaded.getWidth();
        int height = uploaded.getHeight();
        int PROFILE_PIC_WIDTH = 134;
        int PROFILE_PIC_HEIGHT = 140;
        double scale = Math.min((double)PROFILE_PIC_WIDTH/width, (double)PROFILE_PIC_HEIGHT/height);
        return this.getScaledInstance(uploaded, (int)(width*scale), (int)(height*scale));
    }

    // https://stackoverflow.com/questions/7951290/re-sizing-an-image-without-losing-quality#answer-7951324
    private BufferedImage getScaledInstance(BufferedImage img, int targetWidth, int targetHeight) {
        int type = img.getTransparency() == Transparency.OPAQUE ? BufferedImage.TYPE_INT_RGB : BufferedImage.TYPE_INT_ARGB;
        BufferedImage ret = img;
        int w = img.getWidth();
        int h = img.getHeight();
        do {
            if (w > targetWidth) {
                w /= 2;
                if (w < targetWidth) {
                    w = targetWidth;
                }
            }
            if (h > targetHeight) {
                h /= 2;
                if (h < targetHeight) {
                    h = targetHeight;
                }
            }
            BufferedImage tmp = new BufferedImage(w, h, type);
            Graphics2D g2 = tmp.createGraphics();
            g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g2.drawImage(ret, 0, 0, w, h, null);
            g2.dispose();
            ret = tmp;
        } while (w != targetWidth || h != targetHeight);
        return ret;
    }
}
