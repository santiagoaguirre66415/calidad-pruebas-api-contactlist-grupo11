@ignore
Feature: Helper de limpieza - eliminar el usuario de prueba (DELETE /users/me)

  # Se invoca desde afterScenario para no dejar datos de prueba en el servicio publico.
  Scenario: Eliminar usuario de prueba
    Given url baseUrl
    And path 'users', 'me'
    And header Authorization = 'Bearer ' + token
    When method delete
