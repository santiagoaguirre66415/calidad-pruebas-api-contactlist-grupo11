@ignore
Feature: Helper reutilizable - listar contactos del usuario autenticado

  Scenario: Listar contactos
    Given url baseUrl
    And path 'contacts'
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response == '#array'
