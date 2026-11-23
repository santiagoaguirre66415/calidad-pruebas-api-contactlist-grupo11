@seguridad
Feature: Seguridad y autenticacion - acceso a endpoints protegidos (Contact List API)

  Background:
    * url baseUrl
    * def tokens = []
    * configure afterScenario =
      """
      function() {
        var ts = karate.get('tokens') || [];
        for (var i = 0; i < ts.length; i++) {
          karate.call('classpath:features/helpers/delete-user.feature', { token: ts[i] });
        }
      }
      """

  @autenticacion @CP-013
  Scenario Outline: CP-013<id> - <operacion> sin cabecera Authorization
    Given path <path>
    And request <body>
    When method <metodo>
    Then status 401
    And match response contains { error: '#string' }
    And match response._id == '#notpresent'

    Examples:
      | id | operacion        | metodo | path          | body                                   |
      | a  | GET /contacts    | get    | 'contacts'    | ''                                     |
      | b  | GET /users/me    | get    | 'users', 'me' | ''                                     |
      | c  | POST /contacts   | post   | 'contacts'    | { firstName: 'Sin', lastName: 'Token' } |

  @autenticacion @CP-014
  Scenario Outline: CP-014<id> - <operacion> sobre contacto de otro usuario autenticado
    # Usuario 1 (propietario) y usuario 2 (atacante), ambos creados por la prueba
    * def owner = call read('classpath:features/helpers/auth-helper.feature')
    * def other = call read('classpath:features/helpers/auth-helper.feature')
    * eval tokens.push(owner.token)
    * eval tokens.push(other.token)
    * def created = call read('classpath:features/helpers/create-contact.feature') { token: '#(owner.token)' }

    Given path 'contacts', created.contactId
    And header Authorization = 'Bearer ' + other.token
    And request <body>
    When method <metodo>
    * print 'CP-014<id> -> HTTP', responseStatus
    # Acceso denegado (401/403/404): lo importante es que NO sea exitoso
    Then assert responseStatus == 401 || responseStatus == 403 || responseStatus == 404

    # El contacto del propietario sigue existiendo y sin cambios
    Given path 'contacts', created.contactId
    And header Authorization = 'Bearer ' + owner.token
    When method get
    Then status 200
    And match response contains created.payload
    And match response.owner == owner.userId

    Examples:
      | id | operacion | metodo | body                                              |
      | a  | GET       | get    | ''                                                |
      | b  | PUT       | put    | { firstName: 'Hack', lastName: 'Intruso' }        |
      | c  | DELETE    | delete | ''                                                |
