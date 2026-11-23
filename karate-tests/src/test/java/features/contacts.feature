@contactos
Feature: Contactos - CRUD y validaciones negativas (Contact List API)

  Background:
    * url baseUrl
    # Reutilizacion del registro/autenticacion: un usuario unico por escenario (aislamiento de datos)
    * def auth = call read('classpath:features/helpers/auth-helper.feature')
    * def token = auth.token
    * def tokens = [ '#(auth.token)' ]
    * def contactoBase = { firstName: 'Juan', lastName: 'Perez', birthdate: '1990-05-20', email: 'juan.perez@example.com', phone: '8005551234', street1: 'Calle Falsa 123', street2: 'Apto 4', city: 'Quito', stateProvince: 'Pichincha', postalCode: '170101', country: 'EC' }
    * configure afterScenario =
      """
      function() {
        var ts = karate.get('tokens') || [];
        for (var i = 0; i < ts.length; i++) {
          karate.call('classpath:features/helpers/delete-user.feature', { token: ts[i] });
        }
      }
      """

  # ---------------------------------------------------------------- POSITIVOS
  @positivo @CP-002
  Scenario: CP-002 - Crear contacto con todos los campos y verificar persistencia
    Given path 'contacts'
    And header Authorization = 'Bearer ' + token
    And request contactoBase
    When method post
    Then status 201
    And match response contains contactoBase
    And match response._id == '#string'
    And match response.owner == auth.userId
    * def contactId = response._id

    # Consulta posterior
    Given path 'contacts', contactId
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response contains contactoBase
    And match response contains { _id: '#(contactId)', owner: '#(auth.userId)' }
    And match response.phone == '#string'
    And match response.birthdate == '#regex \\d{4}-\\d{2}-\\d{2}'

  @positivo @CP-003
  Scenario: CP-003 - PATCH parcial conserva los campos no enviados
    * def created = call read('classpath:features/helpers/create-contact.feature') { token: '#(token)' }
    * def contactId = created.contactId
    * def cambios = { phone: '7005550000', city: 'Guayaquil' }
    Given path 'contacts', contactId
    And header Authorization = 'Bearer ' + token
    And request cambios
    When method patch
    Then status 200
    And match response contains cambios

    # Verificacion: lo enviado cambia y el resto conserva sus valores originales
    * def esperado = karate.merge(created.payload, cambios)
    Given path 'contacts', contactId
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response contains esperado
    And match response.firstName == created.payload.firstName
    And match response.email == created.payload.email

  @positivo @CP-004
  Scenario: CP-004 - PUT completo persiste los cambios
    * def created = call read('classpath:features/helpers/create-contact.feature') { token: '#(token)' }
    * def contactId = created.contactId
    * def nuevo = { firstName: 'Maria', lastName: 'Lopez', birthdate: '1985-12-01', email: 'maria.lopez@example.com', phone: '9005559999', street1: 'Av. Siempre Viva 742', street2: 'Piso 2', city: 'Cuenca', stateProvince: 'Azuay', postalCode: '010101', country: 'EC' }
    Given path 'contacts', contactId
    And header Authorization = 'Bearer ' + token
    And request nuevo
    When method put
    Then status 200
    And match response contains nuevo

    Given path 'contacts', contactId
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response contains nuevo
    And match response._id == contactId

  @positivo @CP-005
  Scenario: CP-005 - Eliminar contacto sin afectar a los demas
    * def c1 = call read('classpath:features/helpers/create-contact.feature') { token: '#(token)', contact: { firstName: 'Uno' } }
    * def c2 = call read('classpath:features/helpers/create-contact.feature') { token: '#(token)', contact: { firstName: 'Dos' } }
    Given path 'contacts', c1.contactId
    And header Authorization = 'Bearer ' + token
    When method delete
    Then status 200

    # El eliminado ya no existe
    Given path 'contacts', c1.contactId
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 404

    # El listado conserva solo al otro contacto
    Given path 'contacts'
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response == '#[1]'
    And match response[*]._id contains c2.contactId
    And match response[*]._id !contains c1.contactId
    And match response[0] contains { firstName: 'Dos' }

  # ---------------------------------------------------------------- NEGATIVOS
  @negativo @CP-006
  Scenario Outline: CP-006 - Crear contacto sin lastName (<escenario>)
    Given path 'contacts'
    And header Authorization = 'Bearer ' + token
    And request <body>
    When method post
    Then status 400
    And match response contains { message: '#string' }
    And match response._id == '#notpresent'

    # No se creo ningun contacto
    Given path 'contacts'
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response == '#[0]'

    Examples:
      | escenario     | body                                      |
      | campo ausente | { firstName: 'Juan' }                     |
      | valor null    | { firstName: 'Juan', lastName: null }     |
      | cadena vacia  | { firstName: 'Juan', lastName: '' }       |

  @negativo @CP-007
  Scenario Outline: CP-007<id> - <metodo> sobre contacto inexistente (ObjectId valido)
    Given path 'contacts', nonExistentId
    And header Authorization = 'Bearer ' + token
    And request <body>
    When method <metodo>
    Then status 404

    Examples:
      | id | metodo | body                                  |
      | a  | get    | ''                                    |
      | b  | put    | { firstName: 'X', lastName: 'Y' }     |
      | c  | patch  | { firstName: 'X' }                    |
      | d  | delete | ''                                    |

  @negativo @CP-008
  Scenario: CP-008 - PUT sin firstName no modifica el contacto original
    * def created = call read('classpath:features/helpers/create-contact.feature') { token: '#(token)' }
    * def contactId = created.contactId
    * def sinFirstName = karate.filterKeys(created.payload, ['lastName', 'email', 'phone'])
    * set sinFirstName.lastName = 'Modificado'
    Given path 'contacts', contactId
    And header Authorization = 'Bearer ' + token
    And request sinFirstName
    When method put
    Then status 400
    And match response contains { message: '#string' }

    Given path 'contacts', contactId
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response contains created.payload

  @negativo @exploratorio @CP-009
  Scenario Outline: CP-009 - Tipos JSON incorrectos (<escenario>) [Exploratorio]
    Given path 'contacts'
    And header Authorization = 'Bearer ' + token
    And request <body>
    When method post
    * print 'CP-009 <escenario> -> HTTP', responseStatus, 'respuesta:', response
    Then status 400
    And match response contains { message: '#string' }

    # El contacto invalido no debe haberse persistido
    Given path 'contacts'
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response == '#[0]'

    Examples:
      | escenario                | body                                                          |
      | phone como arreglo       | { firstName: 'A', lastName: 'B', phone: ['800', '555'] }      |
      | birthdate como numero    | { firstName: 'A', lastName: 'B', birthdate: 19900520 }        |

  @negativo @exploratorio @CP-010
  Scenario: CP-010a - POST con arreglo JSON como cuerpo [Exploratorio]
    Given path 'contacts'
    And header Authorization = 'Bearer ' + token
    And request [ { firstName: 'A', lastName: 'B' } ]
    When method post
    * print 'CP-010a -> HTTP', responseStatus, 'respuesta:', response
    Then status 400
    And match response contains { message: '#string' }
    * def listado = call read('classpath:features/helpers/list-contacts.feature') { token: '#(token)' }
    And match listado.response == '#[0]'

  @negativo @exploratorio @CP-010
  Scenario: CP-010b - PATCH con arreglo JSON como cuerpo no altera el contacto [Exploratorio]
    * def created = call read('classpath:features/helpers/create-contact.feature') { token: '#(token)' }
    Given path 'contacts', created.contactId
    And header Authorization = 'Bearer ' + token
    And request [ { firstName: 'Modificado' } ]
    When method patch
    * print 'CP-010b -> HTTP', responseStatus, 'respuesta:', response
    # Criterio exploratorio: respuesta controlada (sin error 5xx) y sin alterar datos
    Then assert responseStatus < 500

    Given path 'contacts', created.contactId
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response contains created.payload

  @negativo @exploratorio @CP-010
  Scenario: CP-010c - POST con Content-Type application/xml [Exploratorio]
    Given path 'contacts'
    And header Authorization = 'Bearer ' + token
    And header Content-Type = 'application/xml'
    And request '<contact><firstName>A</firstName><lastName>B</lastName></contact>'
    When method post
    * print 'CP-010c -> HTTP', responseStatus
    # Criterio exploratorio: respuesta controlada (sin 5xx) y sin crear datos
    Then assert responseStatus >= 400 && responseStatus < 500
    * def listado = call read('classpath:features/helpers/list-contacts.feature') { token: '#(token)' }
    And match listado.response == '#[0]'

  @negativo @CP-012
  Scenario: CP-012 - PATCH con email de formato invalido no altera el contacto
    * def created = call read('classpath:features/helpers/create-contact.feature') { token: '#(token)' }
    Given path 'contacts', created.contactId
    And header Authorization = 'Bearer ' + token
    And request { email: 'esto-no-es-un-email' }
    When method patch
    Then status 400
    And match response contains { message: '#string' }

    Given path 'contacts', created.contactId
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response.email == created.payload.email
    And match response contains created.payload
