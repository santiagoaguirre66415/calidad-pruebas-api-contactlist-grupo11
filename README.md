# Proyecto Final – Calidad y Pruebas del Software (Grupo 11)

Pruebas funcionales y automatizadas de **Contact List API** (`https://thinking-tester-contact-list.herokuapp.com/`) con **Postman** y **Karate**.

## Integrantes

| Nombre | Rol |
|---|---|
| Santiago Aguirre Salinas | _por completar_ |
| Manuel Felipe Castellanos Calderón | _por completar_ |

## Resultado

15/15 casos pasaron · Karate 28/28 escenarios · Postman 43 requests / 77 aserciones sin fallos · **0 defectos confirmados**.

## Índice

| Entregable | Ubicación |
|---|---|
| 1. Análisis de la API | [docs/01-analisis-api.md](docs/01-analisis-api.md) |
| 2. Matriz de casos de prueba | [docs/02-matriz-casos-prueba.md](docs/02-matriz-casos-prueba.md) |
| 3. Particiones de equivalencia | [docs/03-particiones-equivalencia.md](docs/03-particiones-equivalencia.md) |
| 4. Colección Postman | [postman/](postman/) |
| 5. Proyecto Karate | [karate-tests/](karate-tests/) |
| 6. Reporte de bugs | [docs/04-reporte-bugs.md](docs/04-reporte-bugs.md) |
| 7. Informe final y reflexión | [docs/05-informe-final-y-reflexion.md](docs/05-informe-final-y-reflexion.md) |
| Evidencias (sin tokens) | [docs/evidencias/](docs/evidencias/) |

## Requisitos

- Java 17+ (probado con 21) y Maven 3.9+
- Node.js y newman (`npm install -g newman`) – opcional, para Postman por consola
- Postman (para importar la colección)

## Ejecutar Karate

```powershell
cd karate-tests
mvn clean test
```

Reporte HTML: `karate-tests/target/karate-reports/karate-summary.html`. Opcional: `-DbaseUrl=<url>` para cambiar la URL base.
Los logs y reportes enmascaran `Authorization`, `token` y `password` (`LogMasker`). Los archivos `target/**/*.karate-json.txt` contienen variables internas: no los compartas.

## Ejecutar Postman

1. Importar `postman/ContactList-Grupo11.postman_collection.json` y `postman/ContactList-Env.postman_environment.json`.
2. Seleccionar el entorno **ContactList-Env** y ejecutar la colección completa con el **Runner** (el orden se encadena con `pm.execution.setNextRequest`).

Por consola:

```powershell
cd postman
newman run ContactList-Grupo11.postman_collection.json -e ContactList-Env.postman_environment.json
```

No uses los reportes JSON de newman como evidencia: incluyen cabeceras con tokens.

## Seguridad y aislamiento

Cada ejecución crea usuarios con email único (`qa.g11.<uuid>@example.com`), opera solo sobre sus propios datos y elimina las cuentas al finalizar. No se almacenan tokens ni contraseñas reales.
