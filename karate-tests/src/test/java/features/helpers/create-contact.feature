@ignore
Feature: Helper reutilizable - crear un contacto de prueba

  # Uso: * def created = call read('classpath:features/helpers/create-contact.feature') { token: '#(token)', contact: { firstName: 'X' } }
  # 'contact' es opcional y se fusiona sobre los valores por defecto.
  # Devuelve: contactId, payload (lo enviado) y response (lo recibido).
  Scenario: Crear contacto
    * def defaults = { firstName: 'Juan', lastName: 'Perez', birthdate: '1990-05-20', email: 'juan.perez@example.com', phone: '8005551234', street1: 'Calle Falsa 123', street2: 'Apto 4', city: 'Quito', stateProvince: 'Pichincha', postalCode: '170101', country: 'EC' }
    * def payload = karate.merge(defaults, karate.get('contact', {}))
    Given url baseUrl
    And path 'contacts'
    And header Authorization = 'Bearer ' + token
    And request payload
    When method post
    Then status 201
    * def contactId = response._id
