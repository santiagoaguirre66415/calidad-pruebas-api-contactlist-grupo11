// Generador de la coleccion Postman v2.1 (Grupo 11). Uso: node gen-postman.js <carpeta_salida>
const fs = require('fs');
const path = require('path');
const out = process.argv[2];

const BASE = '{{baseUrl}}';
const contactFull = {
  firstName: 'Juan', lastName: 'Perez', birthdate: '1990-05-20', email: 'juan.perez@example.com',
  phone: '8005551234', street1: 'Calle Falsa 123', street2: 'Apto 4', city: 'Quito',
  stateProvince: 'Pichincha', postalCode: '170101', country: 'EC'
};
const contact2 = { ...contactFull, firstName: 'Dos', email: 'dos@example.com' };
const J = (o) => JSON.stringify(o, null, 2);

// ---- snippets reutilizables de tests
const st = (code, label) => `pm.test("${label || 'Codigo HTTP ' + code}", function () { pm.response.to.have.status(${code}); });`;
const body400 = `pm.test("Respuesta de error con atributo message (string)", function () {
  const r = pm.response.json();
  pm.expect(r).to.have.property("message");
  pm.expect(r.message).to.be.a("string");
});`;
const noToken = `pm.test("Sin token ni _id en la respuesta", function () {
  const txt = pm.response.text();
  pm.expect(txt).to.not.include('"token"');
  pm.expect(txt).to.not.include('"_id"');
});`;
const getVerify = (name, expectKeysJs) => `${st(200)}
pm.test("${name}", function () {
  const r = pm.response.json();
  ${expectKeysJs}
});`;

// ---- definicion de requests (en orden de ejecucion)
const R = [];
const add = (folder, name, method, urlPath, o = {}) => R.push({ folder, name, method, urlPath, ...o });

const F1 = 'Usuarios', F2 = 'Contactos CRUD', F3 = 'Validaciones Negativas', F4 = 'Seguridad y Autenticacion';
const authH = [{ key: 'Authorization', value: 'Bearer {{token}}' }];
const auth2H = [{ key: 'Authorization', value: 'Bearer {{tokenUser2}}' }];
const regPre = (suffix) => `const uid = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
pm.environment.set("userEmail", "qa.g11." + uid + "@example.com");
pm.environment.set("userPassword", "Pw!" + uid);`;

// ---------- USUARIOS
add(F1, 'CP-001a Registrar usuario', 'POST', '/users', {
  pre: regPre(),
  body: '{\n  "firstName": "Ana",\n  "lastName": "Prueba",\n  "email": "{{userEmail}}",\n  "password": "{{userPassword}}"\n}',
  tests: `${st(201)}
pm.test("Estructura y tipos: user (object) y token (string)", function () {
  const r = pm.response.json();
  pm.expect(r).to.have.property("user").that.is.an("object");
  pm.expect(r.token).to.be.a("string").and.not.empty;
  pm.expect(r.user._id).to.be.a("string");
  pm.expect(r.user.firstName).to.eql("Ana");
  pm.expect(r.user.lastName).to.eql("Prueba");
  pm.expect(r.user.email).to.eql(pm.environment.get("userEmail"));
});
pm.test("La contrasena no se expone", function () { pm.expect(pm.response.json().user).to.not.have.property("password"); });
pm.environment.set("token", pm.response.json().token);
pm.environment.set("userId", pm.response.json().user._id);`
});
add(F1, 'CP-001b Consultar perfil con token del registro', 'GET', '/users/me', {
  headers: authH,
  tests: `${st(200)}
pm.test("Los datos coinciden con el registro y no hay password", function () {
  const r = pm.response.json();
  pm.expect(r._id).to.eql(pm.environment.get("userId"));
  pm.expect(r.firstName).to.eql("Ana");
  pm.expect(r.lastName).to.eql("Prueba");
  pm.expect(r.email).to.eql(pm.environment.get("userEmail"));
  pm.expect(r).to.not.have.property("password");
});`
});

// ---------- CONTACTOS CRUD
add(F2, 'CP-002a Crear contacto con todos los campos', 'POST', '/contacts', {
  headers: authH, body: J(contactFull),
  tests: `${st(201)}
pm.test("Contacto creado con todos los campos y _id string", function () {
  const r = pm.response.json();
  const esperado = ${J(contactFull)};
  Object.keys(esperado).forEach(k => pm.expect(r[k], k).to.eql(esperado[k]));
  pm.expect(r._id).to.be.a("string");
  pm.expect(r.owner).to.eql(pm.environment.get("userId"));
});
pm.environment.set("contactId", pm.response.json()._id);`
});
add(F2, 'CP-002b Consultar contacto creado', 'GET', '/contacts/{{contactId}}', {
  headers: authH,
  tests: getVerify('La informacion se almaceno correctamente', `const esperado = ${J(contactFull)};
  Object.keys(esperado).forEach(k => pm.expect(r[k], k).to.eql(esperado[k]));
  pm.expect(r._id).to.eql(pm.environment.get("contactId"));`)
});
add(F2, 'CP-003a PATCH parcial (phone y city)', 'PATCH', '/contacts/{{contactId}}', {
  headers: authH, body: '{\n  "phone": "7005550000",\n  "city": "Guayaquil"\n}',
  tests: `${st(200)}
pm.test("Campos enviados actualizados", function () {
  const r = pm.response.json();
  pm.expect(r.phone).to.eql("7005550000");
  pm.expect(r.city).to.eql("Guayaquil");
});`
});
add(F2, 'CP-003b Verificar campos no enviados conservados', 'GET', '/contacts/{{contactId}}', {
  headers: authH,
  tests: getVerify('Campos no enviados conservan su valor original', `const original = ${J(contactFull)};
  ["firstName","lastName","birthdate","email","street1","street2","stateProvince","postalCode","country"].forEach(k => pm.expect(r[k], k).to.eql(original[k]));
  pm.expect(r.phone).to.eql("7005550000");
  pm.expect(r.city).to.eql("Guayaquil");`)
});
const putBody = { firstName: 'Maria', lastName: 'Lopez', birthdate: '1985-12-01', email: 'maria.lopez@example.com', phone: '9005559999', street1: 'Av. Siempre Viva 742', street2: 'Piso 2', city: 'Cuenca', stateProvince: 'Azuay', postalCode: '010101', country: 'EC' };
add(F2, 'CP-004a PUT completo', 'PUT', '/contacts/{{contactId}}', {
  headers: authH, body: J(putBody),
  tests: `${st(200)}
pm.test("Respuesta refleja los nuevos valores", function () {
  const r = pm.response.json(); const n = ${J(putBody)};
  Object.keys(n).forEach(k => pm.expect(r[k], k).to.eql(n[k]));
});`
});
add(F2, 'CP-004b Verificar persistencia del PUT', 'GET', '/contacts/{{contactId}}', {
  headers: authH,
  tests: getVerify('Los cambios del PUT se persistieron', `const n = ${J(putBody)};
  Object.keys(n).forEach(k => pm.expect(r[k], k).to.eql(n[k]));`)
});
add(F2, 'CP-005a Crear segundo contacto', 'POST', '/contacts', {
  headers: authH, body: J(contact2),
  tests: `${st(201)}
pm.environment.set("contactId2", pm.response.json()._id);
pm.environment.set("contact2", JSON.stringify(pm.response.json()));`
});
add(F2, 'CP-005b Eliminar primer contacto', 'DELETE', '/contacts/{{contactId}}', { headers: authH, tests: st(200) });
add(F2, 'CP-005c Contacto eliminado ya no existe', 'GET', '/contacts/{{contactId}}', { headers: authH, tests: st(404) });
add(F2, 'CP-005d Listado conserva el otro contacto', 'GET', '/contacts', {
  headers: authH,
  tests: `${st(200)}
pm.test("Listado es arreglo, sin el eliminado y con el contacto restante", function () {
  const r = pm.response.json();
  pm.expect(r).to.be.an("array").with.lengthOf(1);
  const ids = r.map(c => c._id);
  pm.expect(ids).to.not.include(pm.environment.get("contactId"));
  pm.expect(ids).to.include(pm.environment.get("contactId2"));
});`
});

// ---------- NEGATIVAS
[['a', 'campo ausente', { firstName: 'Juan' }], ['b', 'valor null', { firstName: 'Juan', lastName: null }], ['c', 'cadena vacia', { firstName: 'Juan', lastName: '' }]]
  .forEach(([s, d, b]) => add(F3, `CP-006${s} Crear contacto sin lastName (${d})`, 'POST', '/contacts', {
    headers: authH, body: J(b), tests: `${st(400)}\n${body400}\n${noToken}`
  }));
[['a', 'GET', null], ['b', 'PUT', { firstName: 'X', lastName: 'Y' }], ['c', 'PATCH', { firstName: 'X' }], ['d', 'DELETE', null]]
  .forEach(([s, m, b]) => add(F3, `CP-007${s} ${m} contacto inexistente`, m, '/contacts/{{nonExistentId}}', {
    headers: authH, body: b ? J(b) : undefined, tests: st(404)
  }));
add(F3, 'CP-008a PUT sin firstName', 'PUT', '/contacts/{{contactId2}}', {
  headers: authH, body: '{\n  "lastName": "Modificado",\n  "email": "modificado@example.com"\n}',
  tests: `${st(400)}\n${body400}`
});
add(F3, 'CP-008b Verificar contacto original intacto', 'GET', '/contacts/{{contactId2}}', {
  headers: authH,
  tests: getVerify('El contacto no fue modificado', `const orig = JSON.parse(pm.environment.get("contact2"));
  Object.keys(orig).forEach(k => pm.expect(r[k], k).to.eql(orig[k]));`)
});
add(F3, 'CP-009a Tipo incorrecto: phone como arreglo [Exploratorio]', 'POST', '/contacts', {
  headers: authH, body: '{\n  "firstName": "A",\n  "lastName": "B",\n  "phone": ["800", "555"]\n}',
  tests: `${st(400)}\n${body400}`
});
add(F3, 'CP-009b Tipo incorrecto: birthdate como numero [Exploratorio]', 'POST', '/contacts', {
  headers: authH, body: '{\n  "firstName": "A",\n  "lastName": "B",\n  "birthdate": 19900520\n}',
  tests: `${st(400)}\n${body400}`
});
add(F3, 'CP-010a POST con arreglo JSON como cuerpo [Exploratorio]', 'POST', '/contacts', {
  headers: authH, body: '[ { "firstName": "A", "lastName": "B" } ]', tests: `${st(400)}\n${body400}`
});
add(F3, 'CP-010b PATCH con arreglo JSON como cuerpo [Exploratorio]', 'PATCH', '/contacts/{{contactId2}}', {
  headers: authH, body: '[ { "firstName": "Modificado" } ]',
  tests: `pm.test("Respuesta controlada (sin error 5xx)", function () { pm.expect(pm.response.code).to.be.below(500); });
console.log("CP-010b HTTP", pm.response.code);`
});
add(F3, 'CP-010b2 Verificar contacto sin alteraciones tras PATCH con arreglo', 'GET', '/contacts/{{contactId2}}', {
  headers: authH,
  tests: getVerify('El contacto no fue alterado', `const orig = JSON.parse(pm.environment.get("contact2"));
  Object.keys(orig).forEach(k => pm.expect(r[k], k).to.eql(orig[k]));`)
});
add(F3, 'CP-010c POST con Content-Type application/xml [Exploratorio]', 'POST', '/contacts', {
  headers: [...authH, { key: 'Content-Type', value: 'application/xml' }], rawLang: 'xml',
  body: '<contact><firstName>A</firstName><lastName>B</lastName></contact>',
  tests: `pm.test("Respuesta controlada: error 4xx, sin 5xx", function () { pm.expect(pm.response.code).to.be.within(400, 499); });
console.log("CP-010c HTTP", pm.response.code);`
});
[['a', 'campo ausente', '{\n  "firstName": "QA",\n  "lastName": "G11",\n  "password": "{{userPassword}}"\n}'],
 ['b', 'valor null', '{\n  "firstName": "QA",\n  "lastName": "G11",\n  "email": null,\n  "password": "{{userPassword}}"\n}']]
  .forEach(([s, d, b]) => add(F3, `CP-011${s} Registrar usuario sin email (${d})`, 'POST', '/users', {
    body: b, tests: `${st(400)}\n${body400}\n${noToken}`
  }));
add(F3, 'CP-012a PATCH con email de formato invalido', 'PATCH', '/contacts/{{contactId2}}', {
  headers: authH, body: '{\n  "email": "esto-no-es-un-email"\n}', tests: `${st(400)}\n${body400}`
});
add(F3, 'CP-012b Verificar email original sin cambios', 'GET', '/contacts/{{contactId2}}', {
  headers: authH,
  tests: getVerify('El email no fue alterado', `const orig = JSON.parse(pm.environment.get("contact2"));
  pm.expect(r.email).to.eql(orig.email);
  Object.keys(orig).forEach(k => pm.expect(r[k], k).to.eql(orig[k]));`)
});

// ---------- SEGURIDAD
const unauth = `${st(401)}
pm.test("Respuesta de error con atributo error (string)", function () { pm.expect(pm.response.json().error).to.be.a("string"); });`;
add(F4, 'CP-013a GET /contacts sin Authorization', 'GET', '/contacts', { tests: unauth });
add(F4, 'CP-013b GET /users/me sin Authorization', 'GET', '/users/me', { tests: unauth });
add(F4, 'CP-013c POST /contacts sin Authorization', 'POST', '/contacts', { body: '{\n  "firstName": "Sin",\n  "lastName": "Token"\n}', tests: unauth });
add(F4, 'CP-014-setup Registrar usuario 2', 'POST', '/users', {
  pre: `const uid = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
pm.environment.set("userEmail2", "qa.g11.u2." + uid + "@example.com");`,
  body: '{\n  "firstName": "Otro",\n  "lastName": "Usuario",\n  "email": "{{userEmail2}}",\n  "password": "Pw!{{$timestamp}}"\n}',
  tests: `${st(201)}\npm.environment.set("tokenUser2", pm.response.json().token);`
});
const denied = `pm.test("Acceso denegado (401, 403 o 404), nunca exitoso", function () { pm.expect([401, 403, 404]).to.include(pm.response.code); });
console.log("HTTP", pm.response.code);`;
add(F4, 'CP-014a GET contacto de otro usuario', 'GET', '/contacts/{{contactId2}}', { headers: auth2H, tests: denied });
add(F4, 'CP-014b PUT contacto de otro usuario', 'PUT', '/contacts/{{contactId2}}', { headers: auth2H, body: '{\n  "firstName": "Hack",\n  "lastName": "Intruso"\n}', tests: denied });
add(F4, 'CP-014c DELETE contacto de otro usuario', 'DELETE', '/contacts/{{contactId2}}', { headers: auth2H, tests: denied });
add(F4, 'CP-014d Propietario conserva su contacto intacto', 'GET', '/contacts/{{contactId2}}', {
  headers: authH,
  tests: getVerify('El contacto sigue existiendo y sin cambios', `const orig = JSON.parse(pm.environment.get("contact2"));
  Object.keys(orig).forEach(k => pm.expect(r[k], k).to.eql(orig[k]));`)
});
add(F4, 'CP-015a Eliminar cuenta de usuario', 'DELETE', '/users/me', { headers: authH, tests: st(200) });
add(F4, 'CP-015b Token anterior deja de funcionar', 'GET', '/users/me', { headers: authH, tests: unauth });
add(F4, 'CP-015c Login con credenciales eliminadas', 'POST', '/users/login', {
  body: '{\n  "email": "{{userEmail}}",\n  "password": "{{userPassword}}"\n}',
  tests: `${st(401)}
pm.test("Sin token en la respuesta", function () { pm.expect(pm.response.text()).to.not.include("token"); });`
});
add(F4, 'Cleanup Eliminar usuario 2', 'DELETE', '/users/me', { headers: auth2H, tests: st(200, 'Usuario 2 de prueba eliminado (limpieza)') });

// ---- encadenamiento con pm.execution.setNextRequest
R.forEach((r, i) => {
  const next = R[i + 1] ? JSON.stringify(R[i + 1].name) : 'null';
  r.tests = `${r.tests}\n// Encadenamiento\npm.execution.setNextRequest(${next});`;
});

// ---- construir coleccion
const mkItem = (r) => {
  const item = {
    name: r.name,
    event: [
      ...(r.pre ? [{ listen: 'prerequest', script: { type: 'text/javascript', exec: r.pre.split('\n') } }] : []),
      { listen: 'test', script: { type: 'text/javascript', exec: r.tests.split('\n') } }
    ],
    request: {
      method: r.method,
      header: [...(r.headers || [])],
      url: { raw: BASE + r.urlPath, host: ['{{baseUrl}}'], path: r.urlPath.replace(/^\//, '').split('/') }
    }
  };
  if (r.body !== undefined) {
    const hasCT = (r.headers || []).some(h => h.key === 'Content-Type');
    if (!hasCT) item.request.header.push({ key: 'Content-Type', value: 'application/json' });
    item.request.body = { mode: 'raw', raw: r.body, options: { raw: { language: r.rawLang || 'json' } } };
  }
  return item;
};
const folders = [F1, F2, F3, F4].map(f => ({ name: f, item: R.filter(r => r.folder === f).map(mkItem) }));
const collection = {
  info: {
    name: 'ContactList-Grupo11',
    description: 'Coleccion Postman del Grupo 11 - Contact List API. Cubre CP-001 a CP-015. Ejecutar completa con el Runner (orden encadenado con pm.execution.setNextRequest) o con newman.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  item: folders
};
const env = {
  id: 'contactlist-g11-env', name: 'ContactList-Env', _postman_variable_scope: 'environment',
  values: [
    ['baseUrl', 'https://thinking-tester-contact-list.herokuapp.com'], ['nonExistentId', '507f1f77bcf86cd799439011'],
    ['token', ''], ['tokenUser2', ''], ['userId', ''], ['userEmail', ''], ['userPassword', ''], ['userEmail2', ''],
    ['contactId', ''], ['contactId2', ''], ['contact2', '']
  ].map(([key, value]) => ({ key, value, type: key.toLowerCase().includes('token') || key === 'userPassword' ? 'secret' : 'default', enabled: true }))
};
fs.writeFileSync(path.join(out, 'ContactList-Grupo11.postman_collection.json'), JSON.stringify(collection, null, 2));
fs.writeFileSync(path.join(out, 'ContactList-Env.postman_environment.json'), JSON.stringify(env, null, 2));
console.log('requests:', R.length);
