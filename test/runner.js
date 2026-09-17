/** Minimal zero-dependency test runner: describe / it / expect, with a summary. */
const suites = [];
let actual = null;

function describe(nombre, fn) {
  actual = { nombre, pruebas: [] };
  suites.push(actual);
  fn();
  actual = null;
}

function it(nombre, fn) {
  if (!actual) throw new Error('it() fuera de describe()');
  actual.pruebas.push({ nombre, fn });
}

class FalloAssercion extends Error {}

function expect(valor) {
  return {
    toBe(esperado) {
      if (valor !== esperado) {
        throw new FalloAssercion(`esperaba ${JSON.stringify(esperado)}, recibio ${JSON.stringify(valor)}`);
      }
    },
    toEqual(esperado) {
      const a = JSON.stringify(valor);
      const b = JSON.stringify(esperado);
      if (a !== b) throw new FalloAssercion(`esperaba ${b}, recibio ${a}`);
    },
    toBeCloseTo(esperado, precision = 2) {
      const delta = Math.abs(valor - esperado);
      const limite = Math.pow(10, -precision) / 2;
      if (!(delta < limite)) {
        throw new FalloAssercion(`esperaba ~${esperado} (+-${limite}), recibio ${valor}`);
      }
    },
    toBeTruthy() {
      if (!valor) throw new FalloAssercion(`esperaba un valor verdadero, recibio ${JSON.stringify(valor)}`);
    },
    toBeFalsy() {
      if (valor) throw new FalloAssercion(`esperaba un valor falso, recibio ${JSON.stringify(valor)}`);
    },
    toBeNull() {
      if (valor !== null) throw new FalloAssercion(`esperaba null, recibio ${JSON.stringify(valor)}`);
    },
    toHaveLength(n) {
      if (!valor || valor.length !== n) {
        throw new FalloAssercion(`esperaba longitud ${n}, recibio ${valor ? valor.length : 'undefined'}`);
      }
    },
    toContain(item) {
      if (!valor || valor.indexOf(item) === -1) {
        throw new FalloAssercion(`esperaba que contuviera ${JSON.stringify(item)}`);
      }
    }
  };
}

function ejecutar() {
  let pasadas = 0;
  const fallos = [];

  for (const suite of suites) {
    const lineas = [];
    for (const prueba of suite.pruebas) {
      try {
        prueba.fn();
        pasadas++;
        lineas.push(`    \x1b[32m✓\x1b[0m ${prueba.nombre}`);
      } catch (err) {
        fallos.push({ suite: suite.nombre, prueba: prueba.nombre, error: err.message });
        lineas.push(`    \x1b[31m✗ ${prueba.nombre}\x1b[0m\n        ${err.message}`);
      }
    }
    console.log(`\n  \x1b[1m${suite.nombre}\x1b[0m`);
    lineas.forEach((l) => console.log(l));
  }

  const total = pasadas + fallos.length;
  console.log(`\n${'─'.repeat(64)}`);
  if (fallos.length === 0) {
    console.log(`\x1b[32m  ${pasadas}/${total} pruebas OK\x1b[0m`);
  } else {
    console.log(`\x1b[31m  ${fallos.length} FALLOS de ${total} pruebas\x1b[0m`);
    fallos.forEach((f) => console.log(`   - ${f.suite} > ${f.prueba}: ${f.error}`));
  }
  console.log(`${'─'.repeat(64)}\n`);
  return fallos.length;
}

module.exports = { describe, it, expect, ejecutar };
