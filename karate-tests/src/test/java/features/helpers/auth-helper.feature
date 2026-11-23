@ignore
Feature: Helper reutilizable - registrar un usuario de prueba con email unico

  # Uso: * def auth = call read('classpath:features/helpers/auth-helper.feature')
  # Devuelve: token, userId, email, password, firstName, lastName
  Scenario: Registrar usuario unico y obtener token
    * def uid = java.util.UUID.randomUUID().toString().replace('-', '')
    * def email = 'qa.g11.' + uid + '@example.com'
    * def password = 'Passw0rd!G11'
    * def firstName = 'QA'
    * def lastName = 'Grupo11'
    Given url baseUrl
    And path 'users'
    And request { firstName: '#(firstName)', lastName: '#(lastName)', email: '#(email)', password: '#(password)' }
    When method post
    Then status 201
    And match response.token == '#string'
    * def token = response.token
    * def userId = response.user._id
