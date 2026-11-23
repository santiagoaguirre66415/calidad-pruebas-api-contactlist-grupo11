# Entregable 1 – Análisis de la API (Contact List API)

- **URL base:** `https://thinking-tester-contact-list.herokuapp.com/`
- **Documentación oficial:** <https://documenter.getpostman.com/view/4012288/TzK2bEa8>
- **Formato:** REST/JSON. Autenticación con token tipo Bearer (`Authorization: Bearer <TOKEN>`), obtenido al registrarse o al iniciar sesión.

> **Metodología y alcance.** El inventario se elaboró a partir de la documentación oficial y se **verificó de forma empírica** ejecutando peticiones reales contra la API. La columna *Verificado* indica si el servicio fue ejercitado por nuestras pruebas (Postman/Karate). Los servicios no ejecutados se listan por completitud, sin afirmar su comportamiento.

## Inventario de servicios

| Servicio | Método | Endpoint | Requiere autenticación | Verificado (código real observado) |
|---|---|---|---|---|
| Registrar usuario | POST | `/users` | No | Sí – 201 con `user` y `token`; 400 si falta/`null` el email |
| Iniciar sesión | POST | `/users/login` | No | Sí – 200 con `token` (credenciales válidas); 401 con credenciales eliminadas |
| Consultar perfil | GET | `/users/me` | Sí | Sí – 200; 401 sin token o con token invalidado |
| Actualizar usuario | PATCH | `/users/me` | Sí | No ejecutado (fuera de los 15 casos asignados) |
| Cerrar sesión | POST | `/users/logout` | Sí | No ejecutado |
| Eliminar usuario | DELETE | `/users/me` | Sí | Sí – 200 |
| Crear contacto | POST | `/contacts` | Sí | Sí – 201; 400 por validación; 401 sin token |
| Listar contactos | GET | `/contacts` | Sí | Sí – 200 (arreglo); 401 sin token |
| Consultar contacto | GET | `/contacts/{id}` | Sí | Sí – 200; 404 inexistente/ajeno |
| Actualizar contacto (total) | PUT | `/contacts/{id}` | Sí | Sí – 200; 400 sin `firstName`; 404 inexistente/ajeno |
| Actualizar contacto (parcial) | PATCH | `/contacts/{id}` | Sí | Sí – 200; 400 con email inválido; 404 inexistente |
| Eliminar contacto | DELETE | `/contacts/{id}` | Sí | Sí – 200; 404 inexistente/ajeno |

## Headers

| Header | Uso |
|---|---|
| `Content-Type: application/json` | En peticiones con cuerpo (POST/PUT/PATCH) |
| `Authorization: Bearer <TOKEN>` | En todos los servicios protegidos |

## Modelo de datos observado

- **Usuario:** `firstName`, `lastName`, `email`, `password` (entrada). En la respuesta: `_id`, `firstName`, `lastName`, `email`, `__v`; **no** se devuelve `password`.
- **Contacto:** `firstName` y `lastName` (obligatorios, observado en validaciones 400), `birthdate` (formato `YYYY-MM-DD`), `email`, `phone`, `street1`, `street2`, `city`, `stateProvince`, `postalCode`, `country`. La respuesta añade `_id`, `owner` (id del usuario) y `__v`.

## Códigos HTTP y formatos de error observados (reales)

| Situación | Código | Cuerpo |
|---|---|---|
| Creación exitosa (usuario/contacto) | 201 | Objeto creado |
| Lectura/actualización/eliminación exitosa | 200 | Objeto (DELETE de contacto/usuario: cuerpo vacío o sin datos relevantes) |
| Error de validación | 400 | JSON con `errors`, `_message`, `message` |
| Sin token / token inválido | 401 | `{"error":"Please authenticate."}` |
| Login con credenciales inexistentes | 401 | Cuerpo vacío |
| Contacto inexistente o de otro usuario | 404 | Cuerpo vacío |

## Dudas y oportunidades de mejora (reglas no documentadas)

1. No se documentan reglas de longitud, formato de teléfono ni de contraseña; **no se asumieron** en las pruebas.
2. El 404 devuelto al acceder a contactos de otro usuario no distingue entre «inexistente» y «no autorizado» (puede ser decisión de diseño para no filtrar información).
3. Ver observaciones adicionales en `docs/05-informe-final-y-reflexion.md` (sección *Observaciones*).
