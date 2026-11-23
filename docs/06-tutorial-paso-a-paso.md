# Tutorial: qué se hizo y cómo se hizo (guía para defender el proyecto)

Este documento explica **todo el proceso** de principio a fin, archivo por archivo, y cómo hacer cambios en vivo si la profesora los pide.

---

## 0. La idea en 30 segundos

Se probó la **Contact List API** (usuarios + contactos) con dos herramientas:

1. **Postman/newman**: una colección de 43 requests que se ejecutan en cadena.
2. **Karate (Java + Maven)**: 28 escenarios escritos en Gherkin.

Ambas ejecutan los **15 casos de prueba** asignados (CP-001 a CP-015) contra la API real, y los resultados se documentaron en la matriz. Flujo del proyecto:

> Analizar la API → Diseñar casos → Partición de equivalencia → Postman → Karate → Analizar resultados → Reportar bugs → Conclusiones

Resultado real: 15/15 pasaron, 0 bugs confirmados.

---

## 1. Preparación del entorno

Lo que se necesita: **Java 17+**, **Maven**, **Node.js** y **newman**.

En esta máquina ya estaban Java 21 y Node. Se instalaron:

```powershell
scoop install maven
npm install -g newman
```

Verificar:

```powershell
java -version
mvn -v
newman -v
```

> Si `mvn` no se reconoce en una terminal nueva: `$env:Path += ";D:\tecnologias\scoop\apps\maven\current\bin"`.

---

## 2. Paso 1 – Explorar la API antes de escribir pruebas

Antes de automatizar, se llamó a la API con `curl` para **ver qué responde de verdad**. Se creó un usuario desechable y se probó: crear contacto sin `lastName`, con `null`, con `""`, con tipos incorrectos, arreglo como cuerpo, XML, ID inexistente, sin token, borrar usuario y reintentar login.

Lo que se descubrió (y se usó para definir resultados esperados):

| Situación | Respuesta real |
|---|---|
| Registrar usuario / crear contacto | 201 |
| Falta un campo obligatorio, tipo incorrecto, email inválido | 400 con JSON `message` |
| Sin token o token inválido | 401 `{"error":"Please authenticate."}` |
| Contacto inexistente | 404 (cuerpo vacío) |
| Login tras borrar la cuenta | 401 (cuerpo vacío) |

**Por qué importa:** la regla del proyecto es *no inventar reglas*. Solo se afirma lo que está en la documentación o se observó.

> Error que ocurrió: en PowerShell, `curl -d '{"a":"b"}'` pierde las comillas y envía un JSON roto (la API responde 400 «Bad Request» en HTML). Solución: enviar el cuerpo desde un archivo con `--data-binary @archivo.json`.

---

## 3. Paso 2 – Diseño de casos y particiones (documentos)

- `docs/01-analisis-api.md`: tabla de endpoints, método, si requiere autenticación.
- `docs/02-matriz-casos-prueba.md`: ID, descripción, datos, esperado, resultado real, estado.
- `docs/03-particiones-equivalencia.md`: para cada campo se separan **datos válidos** e **inválidos** y se elige un dato representativo de cada grupo.

Ejemplo de partición (campo `lastName`):

| Partición | Dato | Resultado |
|---|---|---|
| Válida | `"Perez"` | 201 |
| Inválida: ausente | sin el campo | 400 |
| Inválida: null | `null` | 400 |
| Inválida: vacía | `""` | 400 |

Los casos exploratorios (CP-009 y CP-010) no tienen una regla documentada, así que su criterio fue: **no debe haber error 5xx y no debe alterarse/crearse información**.

---

## 4. Paso 3 – Proyecto Karate (`karate-tests/`)

### 4.1 Estructura

```
karate-tests/
├── pom.xml
└── src/test/java/
    ├── karate-config.js
    ├── ContactListTest.java            (runner)
    ├── logback-test.xml                (controla el logging)
    ├── com/grupo11/calidad/LogMasker.java
    └── features/
        ├── users.feature               (CP-001, CP-011, CP-015)
        ├── contacts.feature            (CP-002..CP-010, CP-012)
        ├── security.feature            (CP-013, CP-014)
        └── helpers/
            ├── auth-helper.feature     (registra usuario único)
            ├── create-contact.feature  (crea un contacto)
            ├── list-contacts.feature
            └── delete-user.feature     (limpieza)
```

### 4.2 `pom.xml`
Declara Java 17 y la dependencia `io.karatelabs:karate-junit5:1.5.2` (la 1.5.x vive en `io.karatelabs`; la 1.4.1 es la última de `com.intuit.karate`). Usa `maven-surefire-plugin` para ejecutar la prueba y un `testResource` que apunta a `src/test/java` para que Karate encuentre los `.feature` y el `karate-config.js` junto al código.

### 4.3 `karate-config.js` (variables globales)
Define `baseUrl` (la URL de la API), `nonExistentId` (ObjectId válido inexistente `507f1f77bcf86cd799439011`) y registra el enmascarador de logs. Cualquier `.feature` usa `baseUrl` directamente.

### 4.4 `ContactListTest.java` (el runner)
```java
Results results = Runner.path("classpath:features")
        .tags("~@ignore")          // no ejecuta los helpers
        .outputCucumberJson(true)
        .parallel(1);              // un hilo: no saturar la API pública
assertEquals(0, results.getFailCount(), results.getErrorMessages());
```
`mvn clean test` ejecuta esta clase, y Karate genera el reporte HTML.

### 4.5 `LogMasker.java` (seguridad)
Implementa `HttpLogModifier` y reemplaza la cabecera `Authorization` por `Bearer <TOKEN_OCULTO>`, y `"token"`/`"password"` en JSON. `logback-test.xml` baja el log de Apache HttpClient para que no imprima cabeceras en consola.

### 4.6 Helpers y `call read()`
`auth-helper.feature` genera un email único con UUID, registra el usuario y devuelve `token`, `userId`, `email`, `password`:
```gherkin
* def auth = call read('classpath:features/helpers/auth-helper.feature')
* def token = auth.token
```
Así cada escenario tiene **su propio usuario** (aislamiento). Al terminar, un `configure afterScenario` llama a `delete-user.feature` y borra las cuentas creadas.

### 4.7 Dónde se ve cada concepto exigido

| Concepto | Dónde verlo |
|---|---|
| `Feature`, `Scenario` | Todos los `.feature`; p. ej. `CP-001` en `users.feature` |
| `Scenario Outline` + `Examples` | CP-006, CP-007, CP-009, CP-011, CP-013, CP-014 |
| `Given/When/Then/And` | Todos los escenarios |
| `match response contains` | CP-002, CP-003, CP-004 (`match response contains contactoBase`) |
| `match response ==` | `match response == '#[1]'` en CP-005 |
| Tipos (`#string`, `#object`, `#notpresent`, `#[1]`, `#regex`) | CP-001, CP-002, CP-005 |
| `call read()` | Background de `contacts.feature` y pasos de creación |
| `baseUrl` en `karate-config.js` | `karate-config.js` |

### 4.8 Ejemplo explicado: CP-006 (Scenario Outline)
```gherkin
Scenario Outline: CP-006 - Crear contacto sin lastName (<escenario>)
  Given path 'contacts'
  And header Authorization = 'Bearer ' + token
  And request <body>
  When method post
  Then status 400
  ...
  Examples:
    | escenario     | body                                  |
    | campo ausente | { firstName: 'Juan' }                 |
    | valor null    | { firstName: 'Juan', lastName: null } |
    | cadena vacia  | { firstName: 'Juan', lastName: '' }   |
```
Una sola definición → 3 ejecuciones (una por fila). Después verifica con GET que **no se creó** ningún contacto.

### 4.9 Ejecutar

```powershell
cd karate-tests
mvn clean test
```
Reporte: `karate-tests/target/karate-reports/karate-summary.html`.

Ejecutar **un solo caso** (probado):
```powershell
mvn test "-Dkarate.options=--tags @CP-003"
```
(Las etiquetas `@CP-001`… están en cada escenario.) Después de esto, vuelve a correr `mvn clean test` completo para regenerar el reporte entero.

### 4.10 Problema real que apareció
CP-015 falló la primera vez: `match response.token == '#notpresent'`. El login con credenciales eliminadas devuelve **cuerpo vacío**, y Karate ve `response.token` como `null` (presente), no ausente. Era un **error del script**, no de la API → se cambió a `match response.token == null`. Esto ilustra la diferencia entre *caso fallido* y *defecto*.

---

## 5. Paso 4 – Colección Postman (`postman/`)

### 5.1 Archivos
- `ContactList-Grupo11.postman_collection.json`: la colección v2.1.
- `ContactList-Env.postman_environment.json`: variables (`baseUrl`, `token`, `tokenUser2`, `contactId`, `contactId2`, `nonExistentId`, `userEmail`, …). Los tokens y la contraseña van vacíos y marcados como `secret`.
- `generador/gen-postman.js`: script Node que **genera** los dos JSON (para no escribir 43 requests a mano).

### 5.2 Carpetas
1. **Usuarios** (CP-001)
2. **Contactos CRUD** (CP-002 a CP-005)
3. **Validaciones Negativas** (CP-006 a CP-012)
4. **Seguridad y Autenticacion** (CP-013, CP-014, CP-015 + limpieza)

### 5.3 Cómo funciona el encadenamiento
Cada request termina con `pm.execution.setNextRequest("nombre del siguiente")`, de modo que el Runner sigue un orden exacto. El primer request genera un email único (pre-request script) y guarda `token`/`userId` con `pm.environment.set`; los siguientes los reutilizan con `{{token}}`.

Flujo: registrar → perfil → crear contacto → consultarlo → PATCH → verificar → PUT → verificar → crear 2º contacto → borrar 1º → verificar 404 → listar → negativos → seguridad → borrar cuenta → limpieza.

Ejemplo de test dentro de un request:
```javascript
pm.test("Codigo HTTP 201", function () { pm.response.to.have.status(201); });
pm.test("Estructura y tipos", function () {
  const r = pm.response.json();
  pm.expect(r.token).to.be.a("string").and.not.empty;
});
pm.environment.set("token", pm.response.json().token);
pm.execution.setNextRequest("CP-001b Consultar perfil con token del registro");
```

### 5.4 Ejecutar
En Postman: importar los dos JSON, elegir el entorno **ContactList-Env** y correr la colección con el **Runner**. Por consola:

```powershell
cd postman
newman run ContactList-Grupo11.postman_collection.json -e ContactList-Env.postman_environment.json
```
Resultado: 43 requests, 77 aserciones, 0 fallos.

### 5.5 Regenerar la colección tras editar el script
```powershell
node postman\generador\gen-postman.js postman
```

---

## 6. Paso 5 – Resultados, matriz y bugs

- La columna **Estado** de la matriz salió de la ejecución real (no se inventó nada).
- **Bugs:** ninguno confirmado. Se documentaron **observaciones** (comportamientos no documentados), por ejemplo `PATCH` con arreglo JSON → 200 sin cambios. No se reportan como bug porque la documentación no define esa regla.
- **Evidencias** en `docs/evidencias/`: log de Maven, salida de newman y reportes HTML de Karate, todos sin tokens.

---

## 7. Cómo hacer cambios si la profesora los pide

### A. Cambiar el resultado esperado de un caso (Karate)
Editar el `Then status` del escenario, por ejemplo en CP-007 (`contacts.feature`) cambiar `Then status 404` a otro código, y correr `mvn test "-Dkarate.options=--tags @CP-007"`. Fallará si la API no devuelve eso (así se ve un caso fallido).

### B. Agregar un dato a un Scenario Outline
Añadir una fila a `Examples`, p. ej. en CP-006:
```
| solo espacios | { firstName: 'Juan', lastName: ' ' } |
```

### C. Agregar un escenario nuevo
En `contacts.feature`:
```gherkin
@negativo @CP-016
Scenario: CP-016 - Crear contacto sin firstName
  Given path 'contacts'
  And header Authorization = 'Bearer ' + token
  And request { lastName: 'Perez' }
  When method post
  Then status 400
```
(El `Background` ya crea el usuario y `token`.)

### D. Probar login con contraseña incorrecta (caso nuevo sugerido)
En `users.feature`:
```gherkin
Scenario: CP-016 - Login con contraseña incorrecta
  * def auth = call read('classpath:features/helpers/auth-helper.feature')
  * eval tokens.push(auth.token)
  Given path 'users', 'login'
  And request { email: '#(auth.email)', password: 'incorrecta' }
  When method post
  Then status 401
```

### E. Cambiar la URL base
`karate-config.js` (`baseUrl`) o por consola: `mvn test -DbaseUrl=https://otra-url`. En Postman, cambiar `baseUrl` en el entorno.

### F. Ver qué responde realmente un request en Karate
Agregar `* print response` o `* print responseStatus` tras `When method ...` (así se hizo en CP-009/010).

### G. Agregar un request en Postman
Duplicar uno parecido, cambiar método/URL/body, añadir tests y, para mantener la cadena, ajustar el `setNextRequest` del anterior. Para persistir el cambio en el repo: *Export* de la colección. (O editar `gen-postman.js` y regenerar.)

### H. Mostrar un caso fallido a propósito
Cambiar un esperado (p. ej. CP-013 `Then status 200`), ejecutar y mostrar el reporte HTML con el escenario en rojo; luego revertir.

---

## 8. Preguntas probables y respuestas cortas

| Pregunta | Respuesta |
|---|---|
| ¿Por qué un usuario nuevo por escenario? | Aislamiento: ninguna prueba depende de otra ni toca datos ajenos; se eliminan al terminar. |
| ¿Por qué no hay bugs? | Porque todos los resultados coincidieron con lo esperado; no se inventan bugs. Hay observaciones documentadas. |
| ¿Qué es `contains` vs `==`? | `==` exige igualdad exacta; `contains` solo comprueba los campos indicados. |
| ¿Cómo se ocultan los tokens? | `LogMasker` + `logback-test.xml`; la evidencia se revisó buscando `eyJ` (inicio de un JWT) y no hay ninguno. |
| ¿Cómo se encadena en Postman? | `pm.execution.setNextRequest("nombre")` al final de cada test. |
| ¿Cómo se relaciona Karate con la matriz? | El ID `CP-0xx` está en el título y en una etiqueta (`@CP-0xx`) de cada escenario. |
| ¿Qué falló en el camino? | CP-015 por una aserción del script (no bug de la API); el quoting de `curl` en PowerShell; el log DEBUG que mostraba tokens. |
| ¿Cómo se ejecuta todo? | `mvn clean test` (Karate) y `newman run ...` (Postman). |
| ¿Por qué parallel(1)? | Para no sobrecargar una API pública compartida. |
| ¿Qué es un caso exploratorio? | Uno sin resultado esperado documentado; se observa el comportamiento y se exige respuesta controlada (sin 5xx, sin alterar datos). |

---

## 9. Antes de presentar (checklist)

1. `cd karate-tests; mvn clean test` → debe terminar en `BUILD SUCCESS`.
2. Abrir `target/karate-reports/karate-summary.html`.
3. `cd postman; newman run ...` → 0 fallos.
4. Completar los nombres de integrantes en `README.md`.
5. No subir `target/` (ya está en `.gitignore`) ni reportes JSON de newman (contienen tokens).
