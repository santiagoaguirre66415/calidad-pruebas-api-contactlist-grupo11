@usuarios
Feature: Usuarios - registro, perfil y eliminacion de cuenta (Contact List API)

  Background:
    * url baseUrl
    * def tokens = []
    # Limpieza: elimina las cuentas de prueba creadas en cada escenario
    * configure afterScenario =
      """
      function() {
        var ts = karate.get('tokens') || [];
        for (var i = 0; i < ts.length; i++) {
          karate.call('classpath:features/helpers/delete-user.feature', { token: ts[i] });
        }
      }
      """

  @positivo @CP-001
  Scenario: CP-001 - Registrar usuario y consultar su perfil con el token del registro
    * def uid = java.util.UUID.randomUUID().toString().replace('-', '')
    * def email = 'qa.g11.' + uid + '@example.com'
    * def nuevo = { firstName: 'Ana', lastName: 'Prueba', email: '#(email)', password: 'Passw0rd!G11' }
    Given path 'users'
    And request nuevo
    When method post
    Then status 201
    # Validacion de estructura y tipos del registro
    And match response contains { user: '#object', token: '#string' }
    And match response.user contains { _id: '#string', firstName: 'Ana', lastName: 'Prueba' }
    And match response.user.email == email
    And match response.user.password == '#notpresent'
    * def token = response.token
    * eval tokens.push(token)

    # Consulta del perfil con el token obtenido en el registro
    Given path 'users', 'me'
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response contains { _id: '#string', firstName: 'Ana', lastName: 'Prueba', email: '#(email)' }
    And match response._id == '#notnull'
    And match response.password == '#notpresent'

  @negativo @CP-011
  Scenario Outline: CP-011 - Registrar usuario sin email (<escenario>)
    Given path 'users'
    And request <body>
    When method post
    Then status 400
    And match response contains { message: '#string' }
    And match response.token == '#notpresent'

    Examples:
      | escenario      | body                                                               |
      | campo ausente  | { firstName: 'QA', lastName: 'G11', password: 'Passw0rd!G11' }      |
      | valor null     | { firstName: 'QA', lastName: 'G11', email: null, password: 'Passw0rd!G11' } |

  @autenticacion @CP-015
  Scenario: CP-015 - Eliminar cuenta y verificar que token y credenciales dejan de funcionar
    * def auth = call read('classpath:features/helpers/auth-helper.feature')
    * def token = auth.token

    # Precondicion: el login funciona antes de eliminar la cuenta
    Given path 'users', 'login'
    And request { email: '#(auth.email)', password: '#(auth.password)' }
    When method post
    Then status 200
    And match response.token == '#string'

    # Eliminacion de la cuenta
    Given path 'users', 'me'
    And header Authorization = 'Bearer ' + token
    When method delete
    Then status 200

    # El token anterior deja de funcionar
    Given path 'users', 'me'
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 401
    And match response contains { error: '#string' }

    # No se puede iniciar sesion con las credenciales eliminadas
    Given path 'users', 'login'
    And request { email: '#(auth.email)', password: '#(auth.password)' }
    When method post
    Then status 401
    # El 401 de login llega con cuerpo vacio: no hay token en la respuesta
    And match response.token == null
