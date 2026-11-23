# Entregable 7 – Informe final de ejecución y reflexión (Grupo 11)

## 1. Resumen de ejecución

| Métrica | Resultado |
|---|---|
| Total de casos diseñados | 15 |
| Total de casos ejecutados | 15 (Postman y Karate) |
| Casos que pasaron | 15 |
| Casos que fallaron | 0 |
| Casos bloqueados | 0 |
| Total de defectos reportados | 0 (no se confirmaron defectos; ver `04-reporte-bugs.md`) |
| Karate (`mvn clean test`) | 28 escenarios (incluye variantes de Outline): 28 pasaron, 0 fallaron; ~52 s; `BUILD SUCCESS` |
| Postman (newman) | 43 requests, 77 aserciones, 0 fallos; ~8,6 s |

Entorno: Java 21, Maven 3.10.1, Karate 1.5.2, Newman 6.2.3, Node 24. API en vivo (Heroku). Fecha de ejecución: 2026-11-21.

Aislamiento y seguridad: cada escenario creó usuarios con email único (UUID/timestamp), operó solo sobre sus propios datos y eliminó las cuentas al terminar (`afterScenario` en Karate; request de limpieza en Postman). Los logs se enmascaran (`<TOKEN_OCULTO>`); se verificó que `docs/evidencias/` no contiene tokens.

## 2. Principales dificultades

1. **Dependencia Karate:** la versión 1.5.x se publica bajo `io.karatelabs` (la 1.4.1 es la última en `com.intuit.karate`); se ajustó el `pom.xml`.
2. **Fuga de tokens en logs:** el log DEBUG de Apache HttpClient imprimía cabeceras; se resolvió con `logback-test.xml` y un `HttpLogModifier` propio. Aun así, los archivos internos `*.karate-json.txt` de `target/` guardan variables en claro, por lo que `target/` no se versiona ni se copia a evidencias (solo los HTML).
3. **Quoting de PowerShell con `curl`** corrompió el JSON en la exploración inicial (PT-002).
4. **Aserción de Karate sobre cuerpo vacío** (PT-001).
5. **Falta de reglas documentadas:** para casos exploratorios (CP-009/010) y CP-014 se definieron criterios mínimos y verificables (sin 5xx, sin alterar datos, acceso denegado).
6. El enunciado `CLAUDE.md` estaba truncado; se completó con el PDF del proyecto.

## 3. Comparación Postman vs Karate

| Aspecto | Postman | Karate |
|---|---|---|
| Curva de aprendizaje | Baja, interfaz gráfica | Media: Gherkin + JS/Java |
| Escritura de pruebas | JavaScript en pestañas *Tests*/*Pre-request* | DSL declarativo legible (`match`, `#string`) |
| Encadenamiento | `pm.execution.setNextRequest()` (orden explícito) | Secuencia natural del escenario + `call read()` |
| Reutilización | Variables de entorno/colección | Helpers `.feature`, `Background`, `call read()` |
| Datos de prueba | Iteraciones/CSV | `Scenario Outline` + `Examples` |
| Reportes | Runner/newman (cli, html con reporter extra) | HTML nativo (`karate-summary.html`) |
| CI/CD | newman | Maven nativo |
| Uso ideal | Exploración manual y validación rápida | Regresión automatizada versionada |

## 4. Conclusiones

- La API se comportó de forma consistente con lo esperado en los 15 casos; **no se confirmaron defectos**. Se registraron 4 observaciones no documentadas como oportunidades de mejora (O-1…O-4).
- El diseño previo de casos y la partición de equivalencia permitieron cubrir validaciones, autorización y ciclo de vida de la cuenta con pocos casos.
- Verificar el estado posterior (GET tras un PATCH/PUT/DELETE o tras un rechazo) fue clave para detectar efectos colaterales.
- Ambas herramientas se complementan: Postman para explorar, Karate para regresión.

## 5. Preguntas de análisis y reflexión

**1. ¿Qué importancia tiene diseñar los casos de prueba antes de ejecutarlos?**
Fija el resultado esperado antes de ver la respuesta real, evitando sesgo (no «ajustar» la expectativa a lo que devuelve la API), asegura cobertura planificada y permite trazabilidad entre matriz, Postman y Karate.

**2. ¿Cómo aplicaron la técnica de partición de equivalencia?**
Se eligieron 8 campos/condiciones (email de registro, `lastName`, ID de contacto, `Authorization`, tipos JSON, email en PATCH, estructura del cuerpo, `firstName` en PUT), se definieron particiones válidas e inválidas con un dato representativo cada una y se relacionaron con los CP (ver `03-particiones-equivalencia.md`), sin inventar reglas de longitud o formato.

**3. ¿Qué ventajas encontraron al utilizar Postman?**
Rapidez para explorar endpoints, variables de entorno, scripts `pm.test`, encadenamiento con `setNextRequest` y ejecución en CLI con newman.

**4. ¿Qué ventajas encontraron al automatizar con Karate?**
Sintaxis legible (Gherkin), validaciones de estructura y tipos muy compactas, reutilización con `call read()`, datos parametrizados con `Scenario Outline`, reporte HTML nativo y ejecución con `mvn clean test`.

**5. ¿Cuál es la diferencia entre Scenario y Scenario Outline?**
`Scenario` ejecuta un único flujo con datos fijos; `Scenario Outline` ejecuta el mismo flujo una vez por cada fila de la tabla `Examples`, sustituyendo los `<placeholders>` (p. ej. CP-006 con tres filas).

**6. ¿Cuál es la diferencia entre `match response` y `match response contains`?**
`match response == {...}` exige igualdad exacta (mismas claves y valores); `match response contains {...}` solo exige que los campos indicados estén presentes con ese valor, tolerando campos adicionales como `_id`, `owner` o `__v`.

**7. ¿Qué casos fueron más difíciles de automatizar y por qué?**
CP-014 (requiere dos usuarios independientes y verificar el estado del propietario), CP-015 (flujo de varios pasos con precondición y limpieza), y CP-010 (exploratorio: cuerpo XML y arreglos, y respuestas vacías o no JSON). También el enmascarado de tokens en los logs.

**8. ¿Qué diferencia existe entre un caso de prueba fallido y un defecto de software?**
Un caso puede fallar por un error del script, de los datos o del entorno (como PT-001); solo es defecto cuando se confirma una discrepancia reproducible entre el comportamiento esperado, fundamentado en la documentación, y el del servicio.

**9. ¿Por qué es importante documentar los pasos para reproducir un bug?**
Permite a desarrollo reproducirlo sin ambigüedad, descartar errores de la prueba y verificar la corrección posteriormente.

**10. ¿Cuál es la diferencia entre severidad y prioridad?**
Severidad es el impacto técnico/funcional del defecto; prioridad es la urgencia con la que se debe corregir según el contexto de negocio. Un defecto grave en una función poco usada puede tener prioridad baja y viceversa.

**11. ¿Qué funcionalidades consideran que necesitan mayor cobertura?**
`PATCH /users/me` y `POST /users/logout` (no ejecutados), validación de contraseña y de formato de email en el registro, unicidad de email, límites de longitud, formato de `phone`/`birthdate`, JSON malformado, y manejo de tokens manipulados o expirados.

**12. ¿Qué nuevos casos de prueba proponen?**
Login con contraseña incorrecta y usuario inexistente; registro con email duplicado; token con firma inválida o manipulado; ID con formato no ObjectId; `PATCH /users/me`; `logout` y reutilización del token; creación de muchos contactos y paginación del listado; caracteres especiales/Unicode en campos; JSON malformado; y pruebas básicas de rendimiento.
