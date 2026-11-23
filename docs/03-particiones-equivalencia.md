# Entregable 3 – Particiones de equivalencia

No se inventaron restricciones de longitud, formato o reglas de negocio. Cada partición se fundamenta en la documentación o en un comportamiento **observado** del servicio (marcado como *observado*).

## Campo 1 – `email` en el registro de usuario (`POST /users`)

| Partición | Tipo | Dato representativo | Justificación | Resultado | Caso |
|---|---|---|---|---|---|
| Email único, cadena válida | Válida | `qa.g11.<uuid>@example.com` | Cadena con formato de correo, no registrada | 201 + token | CP-001 |
| Email ausente | Inválida | Cuerpo sin `email` | Campo obligatorio omitido | 400 | CP-011a |
| Email `null` | Inválida | `"email": null` | Valor nulo en campo obligatorio (*observado:* «Expected a string but received a null») | 400 | CP-011b |

## Campo 2 – `lastName` en la creación de contactos (`POST /contacts`)

| Partición | Tipo | Dato representativo | Justificación | Resultado | Caso |
|---|---|---|---|---|---|
| Cadena no vacía | Válida | `"Perez"` | Valor presente | 201 | CP-002 |
| Ausente | Inválida | Sin `lastName` | Campo obligatorio omitido (*observado:* «Path `lastName` is required») | 400 | CP-006a |
| `null` | Inválida | `null` | Nulo equivale a ausencia de valor | 400 | CP-006b |
| Cadena vacía | Inválida | `""` | Valor presente pero vacío | 400 | CP-006c |

## Campo 3 – Identificador de contacto (`/contacts/{id}`)

| Partición | Tipo | Dato representativo | Justificación | Resultado | Caso |
|---|---|---|---|---|---|
| ID existente y propio | Válida | `_id` devuelto al crear | Recurso del usuario autenticado | 200 | CP-002…CP-005 |
| ID inexistente, formato ObjectId válido | Inválida | `507f1f77bcf86cd799439011` | 24 hex, no corresponde a ningún contacto | 404 | CP-007a-d |
| ID de otro usuario | Inválida (autorización) | `_id` de contacto de usuario 1 con token de usuario 2 | Recurso existente pero ajeno | 404 (*observado*) | CP-014a-c |
| ID eliminado | Inválida | `_id` ya borrado | Recurso que ya no existe | 404 | CP-005 |

> No se probaron IDs con formato inválido (p. ej. no hexadecimal): el enunciado asigna solo IDs de formato válido y el comportamiento no está documentado.

## Campo 4 – Cabecera `Authorization`

| Partición | Tipo | Dato representativo | Justificación | Resultado | Caso |
|---|---|---|---|---|---|
| Bearer token válido | Válida | Token del registro | Usuario autenticado | 200/201 | CP-001…CP-005 |
| Cabecera ausente | Inválida | Sin `Authorization` | Servicio protegido sin credencial | 401 | CP-013a-c |
| Token de usuario eliminado | Inválida | Token anterior a `DELETE /users/me` | Credencial ya no válida | 401 | CP-015 |

## Campo 5 – Tipos JSON en campos de contacto

| Partición | Tipo | Dato representativo | Resultado | Caso |
|---|---|---|---|---|
| `phone` string | Válida | `"8005551234"` | 201 | CP-002 |
| `phone` arreglo | Inválida | `["800","555"]` | 400 | CP-009a |
| `birthdate` string `YYYY-MM-DD` | Válida | `"1990-05-20"` | 201 | CP-002 |
| `birthdate` número | Inválida | `19900520` | 400 | CP-009b |

## Campo 6 – `email` de contacto en PATCH

| Partición | Tipo | Dato representativo | Resultado | Caso |
|---|---|---|---|---|
| Formato de correo válido | Válida | `maria.lopez@example.com` | 200 | CP-004 |
| Formato inválido | Inválida | `esto-no-es-un-email` | 400 (*observado:* «Email is invalid») | CP-012 |

## Campo 7 – Estructura/tipo del cuerpo de la petición

| Partición | Tipo | Dato representativo | Resultado | Caso |
|---|---|---|---|---|
| Objeto JSON | Válida | `{...}` | 201/200 | CP-002…CP-004 |
| Arreglo JSON (POST) | Inválida | `[{...}]` | 400 | CP-010a |
| Arreglo JSON (PATCH) | Inválida / no documentada | `[{...}]` | 200 sin cambios (O-1) | CP-010b |
| `application/xml` | Inválida | `<contact>…</contact>` | 400 | CP-010c |

## Campo 8 – Campos obligatorios en PUT (`firstName`)

| Partición | Tipo | Dato | Resultado | Caso |
|---|---|---|---|---|
| Todos los obligatorios presentes | Válida | PUT completo | 200 | CP-004 |
| `firstName` omitido | Inválida | Sin `firstName` | 400; contacto intacto | CP-008 |
