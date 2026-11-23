package com.grupo11.calidad;

import com.intuit.karate.http.HttpLogModifier;

/**
 * Enmascara datos sensibles (token, password, cabecera Authorization) en los logs
 * y en el reporte HTML de Karate. Solo afecta al logging, no a las validaciones.
 */
public class LogMasker implements HttpLogModifier {

    public static final LogMasker INSTANCE = new LogMasker();

    private static final String TOKEN_JSON = "(\"token\"\\s*:\\s*)\"[^\"]*\"";
    private static final String PASSWORD_JSON = "(\"password\"\\s*:\\s*)\"[^\"]*\"";

    @Override
    public boolean enableForUri(String uri) {
        return true;
    }

    @Override
    public String uri(String uri) {
        return uri;
    }

    @Override
    public String header(String header, String value) {
        if (header != null && header.equalsIgnoreCase("Authorization")) {
            return "Bearer <TOKEN_OCULTO>";
        }
        return value;
    }

    @Override
    public String request(String uri, String request) {
        return mask(request);
    }

    @Override
    public String response(String uri, String response) {
        return mask(response);
    }

    private static String mask(String body) {
        if (body == null) {
            return null;
        }
        return body
                .replaceAll(TOKEN_JSON, "$1\"<TOKEN_OCULTO>\"")
                .replaceAll(PASSWORD_JSON, "$1\"<PASSWORD_OCULTO>\"");
    }
}
