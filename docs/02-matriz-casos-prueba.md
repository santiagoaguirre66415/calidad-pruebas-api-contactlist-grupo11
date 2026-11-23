# Entregable 2 – Matriz de casos de prueba (Grupo 11)

Los casos se diseñaron antes de ejecutarse (estado inicial *Pendiente*). El estado final proviene de la **ejecución real** contra la API en vivo:

- **Karate:** `mvn clean test` → 28 escenarios (15 casos de prueba con sus variantes), 28 pasaron, 0 fallaron.
- **Postman/newman:** 43 requests, 77 aserciones, 0 fallos.

Referencias: `docs/evidencias/karate-mvn-clean-test.log`, `docs/evidencias/karate-reports/karate-summary.html`, `docs/evidencias/newman-run.txt`.

Convenciones: *Pasó* = el resultado real coincidió con el esperado. Para los casos **exploratorios** (CP-009, CP-010) el criterio esperado es «respuesta controlada (sin 5xx) y sin alterar/crear datos»; se documenta además el comportamiento real.

| ID | Tipo | Descripción | Datos de prueba | Resultado esperado | Resultado real observado | Estado |
|---|---|---|---|---|---|---|
| CP-001 | Positivo | Registrar usuario y consultar perfil con el token del registro | Email único (`qa.g11.<uuid>@example.com`), contraseña de prueba | POST `/users` 201 con `user` y `token`; GET `/users/me` 200 con datos coincidentes; sin `password` | 201 y 200; datos coinciden; sin `password` | Pasó |
| CP-002 | Positivo | Crear contacto con todos los campos y consultarlo | 11 campos completos | 201; GET posterior 200 con los mismos datos | 201 y 200; datos persistidos y `owner` = usuario | Pasó |
| CP-003 | Positivo | PATCH parcial conserva campos no enviados | Contacto completo; PATCH `{phone, city}` | 200; solo cambian `phone` y `city` | 200; resto de campos intactos | Pasó |
| CP-004 | Positivo | PUT completo persiste cambios | Contacto con los 11 campos modificados | 200; GET refleja los nuevos valores | 200; cambios persistidos | Pasó |
| CP-005 | Positivo | Eliminar contacto sin afectar a los demás | Dos contactos; DELETE del primero | DELETE 200; GET del eliminado 404; listado conserva el otro | 200, 404; listado con 1 elemento (el otro) | Pasó |
| CP-006a | Negativo | Crear contacto sin `lastName` (campo ausente) | `{firstName:"Juan"}` | 400, no se crea | 400 con `message`; no se creó | Pasó |
| CP-006b | Negativo | Crear contacto con `lastName: null` | `{firstName, lastName:null}` | 400 | 400 | Pasó |
| CP-006c | Negativo | Crear contacto con `lastName: ""` | `{firstName, lastName:""}` | 400 | 400 | Pasó |
| CP-007a | Negativo | GET de contacto inexistente (ObjectId válido) | `507f1f77bcf86cd799439011` | 404 | 404 | Pasó |
| CP-007b | Negativo | PUT de contacto inexistente | Idem + cuerpo válido | 404 | 404 | Pasó |
| CP-007c | Negativo | PATCH de contacto inexistente | Idem | 404 | 404 | Pasó |
| CP-007d | Negativo | DELETE de contacto inexistente | Idem | 404 | 404 | Pasó |
| CP-008 | Negativo | PUT sin `firstName` no modifica el original | PUT `{lastName, email, phone}` | 400; contacto sin cambios | 400; GET confirma datos originales | Pasó |
| CP-009a | Negativo (exploratorio) | `phone` como arreglo | `phone:["800","555"]` | Rechazo controlado (sin 5xx), sin crear | 400 (`Cast to string failed ... phone`); no se creó | Pasó |
| CP-009b | Negativo (exploratorio) | `birthdate` como número | `birthdate:19900520` | Rechazo controlado, sin crear | 400 (`Birthdate is invalid`); no se creó | Pasó |
| CP-010a | Negativo (exploratorio) | POST con arreglo JSON como cuerpo | `[{firstName,lastName}]` | Respuesta controlada, sin crear | 400 (faltan `firstName`/`lastName`); no se creó | Pasó |
| CP-010b | Negativo (exploratorio) | PATCH con arreglo JSON como cuerpo | `[{firstName:"Modificado"}]` | Sin 5xx y sin alterar datos | **200**, contacto **sin cambios** (ver Observación O-1) | Pasó |
| CP-010c | Negativo (exploratorio) | POST con `Content-Type: application/xml` | XML con firstName/lastName | Respuesta 4xx controlada, sin crear | 400; no se creó | Pasó |
| CP-011a | Negativo | Registrar usuario sin `email` (ausente) | `{firstName,lastName,password}` | 400, sin token | 400 con `message`; sin token | Pasó |
| CP-011b | Negativo | Registrar usuario con `email: null` | `email:null` | 400, sin token | 400 con `message`; sin token | Pasó |
| CP-012 | Negativo | PATCH con email de formato inválido | `{email:"esto-no-es-un-email"}` | 400; email original intacto | 400; GET confirma email original | Pasó |
| CP-013a | Seguridad | GET `/contacts` sin `Authorization` | — | 401 | 401 `{"error":...}` | Pasó |
| CP-013b | Seguridad | GET `/users/me` sin `Authorization` | — | 401 | 401 | Pasó |
| CP-013c | Seguridad | POST `/contacts` sin `Authorization` | cuerpo válido | 401 | 401 | Pasó |
| CP-014a | Seguridad | GET de contacto de otro usuario | Token de usuario 2, contacto de usuario 1 | Acceso denegado (no exitoso) | 404; propietario conserva el contacto | Pasó |
| CP-014b | Seguridad | PUT de contacto de otro usuario | Idem | Acceso denegado, sin modificar | 404; contacto intacto | Pasó |
| CP-014c | Seguridad | DELETE de contacto de otro usuario | Idem | Acceso denegado, sin eliminar | 404; contacto sigue existiendo | Pasó |
| CP-015 | Seguridad | Eliminar cuenta; token y credenciales dejan de funcionar | Usuario único creado por la prueba | DELETE 200; GET `/users/me` con token viejo 401; login 401 | 200, 401, 401 | Pasó |

## Resumen

| Métrica | Valor |
|---|---|
| Casos de prueba diseñados | 15 (5 positivos, 7 negativos, 3 de autenticación/seguridad) |
| Casos ejecutados en Postman | 15 de 15 |
| Casos automatizados en Karate | 15 de 15 |
| Pasó / Falló / Bloqueado | 15 / 0 / 0 |

> **Nota de trazabilidad (problema del script, no de la API):** en la primera ejecución de Karate, 1 escenario (CP-015) falló por una aserción incorrecta del script (`#notpresent` sobre un cuerpo 401 vacío cuyo `response.token` es `null`). Se corrigió la aserción y la ejecución final pasó 28/28. Ver `docs/04-reporte-bugs.md`.
