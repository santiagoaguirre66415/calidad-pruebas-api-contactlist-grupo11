function fn() {
  // Entorno: mvn clean test -Dkarate.env=dev (por defecto 'dev')
  var env = karate.env || 'dev';
  karate.log('karate.env =', env);

  var config = {
    env: env,
    // URL base de Contact List API (sin barra final). Se puede sobreescribir con -DbaseUrl=...
    baseUrl: karate.properties['baseUrl'] || 'https://thinking-tester-contact-list.herokuapp.com',
    // ObjectId de 24 hex con formato valido pero inexistente (CP-007)
    nonExistentId: '507f1f77bcf86cd799439011'
  };

  karate.configure('connectTimeout', 30000);
  karate.configure('readTimeout', 60000);

  // Seguridad: enmascara Authorization, "token" y "password" en logs y reportes HTML
  karate.configure('logModifier', Java.type('com.grupo11.calidad.LogMasker').INSTANCE);

  return config;
}
