# Entregable 6 – Reporte de bugs

## Resultado

**No se confirmaron defectos reales en la API.** Los 15 casos de prueba asignados (28 escenarios Karate y 43 requests Postman) obtuvieron el resultado esperado en la ejecución final. Conforme al enunciado, no se inventaron bugs para cumplir con la actividad.

| Total de defectos reportados | 0 |
|---|---|

## Problemas de la prueba (no son defectos de la API)

| ID | Caso | Descripción | Causa | Corrección |
|---|---|---|---|---|
| PT-001 | CP-015 (Karate) | En la primera ejecución falló `match response.token == '#notpresent'` tras el login con credenciales eliminadas. | El 401 del login llega con **cuerpo vacío**; Karate expone `response.token` como `null` (presente) y no como ausente. Era un error de la aserción del script. | Se cambió a `match response.token == null`. Re-ejecución: 28/28 escenarios pasan. |
| PT-002 | Exploración con `curl` | Varias peticiones de la exploración inicial devolvieron 400 con HTML «Bad Request». | El quoting de PowerShell eliminó las comillas del JSON enviado con `curl -d` (JSON malformado). Error del comando. | Se repitió la exploración enviando el cuerpo desde archivo (`--data-binary @archivo`). |
| PT-003 | Entorno | Un `DEBUG` de Apache HttpClient imprimía cabeceras con el token en consola. | Configuración de logging por defecto. | Se añadió `logback-test.xml` (nivel WARN) y `LogMasker` para enmascarar. |

## Observaciones (comportamientos no documentados; **no** son bugs confirmados)

| ID | Caso | Observación | Por qué no es un bug |
|---|---|---|---|
| O-1 | CP-010b | `PATCH /contacts/{id}` con un **arreglo JSON** como cuerpo responde **HTTP 200** sin modificar el contacto (en `POST` el mismo arreglo da 400). | La documentación no especifica el comportamiento ante cuerpos que no son objeto. El criterio exploratorio (sin 5xx y sin alterar datos) se cumple. Se registra como **oportunidad de mejora**: rechazar con 4xx. |
| O-2 | CP-011a | Durante la exploración manual, `POST /users` **sin email** respondió 400 con `{"message":"Email address is already in use"}` (mensaje poco claro; con `email:null` el mensaje es «Expected a string but received a null»). | El código HTTP es el esperado (400) y no hay regla documentada sobre el mensaje. Observado en una ejecución manual; las pruebas automáticas solo exigen 400 + `message` string. |
| O-3 | General | JSON malformado en el cuerpo devuelve una página HTML «Bad Request» en lugar de JSON. | Comportamiento no documentado; se registra como duda. |
| O-4 | CP-014 | Acceder a un contacto ajeno devuelve **404** (no 403). | Es una decisión de diseño plausible (no revelar existencia); la documentación no define 403. |

## Evidencias

- `docs/evidencias/karate-mvn-clean-test.log` (salida de `mvn clean test`, sin tokens).
- `docs/evidencias/karate-reports/karate-summary.html` (reporte HTML de Karate).
- `docs/evidencias/newman-run.txt` (salida de newman, sin tokens).
