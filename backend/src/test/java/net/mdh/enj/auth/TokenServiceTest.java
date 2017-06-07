package net.mdh.enj.auth;

import io.jsonwebtoken.ExpiredJwtException;
import org.junit.Test;
import org.junit.Assert;
import org.junit.Before;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.MockitoJUnitRunner;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;
import java.util.Date;

@RunWith(MockitoJUnitRunner.class)
public class TokenServiceTest {
    @Mock
    public JwtBuilder mockJwtBuilder;
    @Mock
    public JwtParser mockJwtParser;
    private TokenService tokenService;
    @Before
    public void beforeEach() {
        this.tokenService = new TokenService(mockJwtBuilder, mockJwtParser);
    }
    /**
     * Testaa, että isValid palauttaa true mikäli jwtParser.parseClaimsJws onnistuu
     * ilman poikkeusta.
     */
    @Test
    public void isValidPalauttaaTrueJosTokeninAvausOnnistuu() {
        Mockito.when(this.mockJwtParser.setSigningKey(Mockito.any(String.class))).thenReturn(this.mockJwtParser);
        //
        String expectedToken = "foo";
        boolean isValid = this.tokenService.isValid(expectedToken);
        //
        Mockito.verify(this.mockJwtParser, Mockito.times(1)).parseClaimsJws(expectedToken);
        Assert.assertTrue(isValid);
    }
    /**
     * Testaa, että isValid palauttaa false, jos tokenin avausyritys aiheuttaa poikkeuksen.
     */
    @Test
    public void isValidPalauttaaFalseJosTokeninAvausEiOnnistu() {
        String malformed = "a";
        String expired = "b";
        String invalid = "c";
        String unsupported = "d";
        Mockito.when(this.mockJwtParser.setSigningKey(Mockito.any(String.class))).thenReturn(this.mockJwtParser);
        Mockito.when(this.mockJwtParser.parseClaimsJws(malformed)).thenThrow(MalformedJwtException.class);
        Mockito.when(this.mockJwtParser.parseClaimsJws(expired)).thenThrow(ExpiredJwtException.class);
        Mockito.when(this.mockJwtParser.parseClaimsJws(invalid)).thenThrow(SignatureException.class);
        Mockito.when(this.mockJwtParser.parseClaimsJws(unsupported)).thenThrow(UnsupportedJwtException.class);
        //
        boolean malformedIsValid = this.tokenService.isValid(malformed);
        boolean expiredIsValid = this.tokenService.isValid(expired);
        boolean invalidIsValid = this.tokenService.isValid(invalid);
        boolean unsupportedIsValid = this.tokenService.isValid(unsupported);
        //
        Assert.assertFalse(malformedIsValid);
        Assert.assertFalse(expiredIsValid);
        Assert.assertFalse(invalidIsValid);
        Assert.assertFalse(unsupportedIsValid);
    }
    /**
     * Testaa, että generateNew luo tokenin asettaen sen "subject"-kentän arvok-
     * si passatun usernamen, ja "expired"-kentän arvoksi {epochNytMillisekunteina + TokenService.JWT_AGE_IN_MS}.
     */
    @Test
    public void generateNewLuoTokeninJaAsettaaSiihenArvot() {
        String testUsername = "afo";
        String expectedToken = "<token>";
        Mockito.when(this.mockJwtBuilder.setExpiration(Mockito.any())).thenReturn(this.mockJwtBuilder);
        Mockito.when(this.mockJwtBuilder.setSubject(Mockito.any())).thenReturn(this.mockJwtBuilder);
        Mockito.when(this.mockJwtBuilder.signWith(Mockito.any(), Mockito.any(String.class))).thenReturn(this.mockJwtBuilder);
        Mockito.when(this.mockJwtBuilder.compact()).thenReturn(expectedToken);
        //
        String actualToken = this.tokenService.generateNew(testUsername);
        //
        Mockito.verify(this.mockJwtBuilder, Mockito.times(1)).setSubject(testUsername);
        Mockito.verify(this.mockJwtBuilder, Mockito.times(1)).setExpiration(Mockito.argThat(actualExp ->
            // Eliminoi millisekuntien aiheuttaman epätarkkuuden, dow mon dd hh:mm:ss zzz yyyy
            actualExp.toString().equals(new Date(System.currentTimeMillis() + TokenService.JWT_AGE_IN_MS).toString())
        ));
        Mockito.verify(this.mockJwtBuilder, Mockito.times(1)).signWith(Mockito.any(SignatureAlgorithm.class), Mockito.any(String.class));
        Assert.assertEquals(expectedToken, actualToken);
    }
}
