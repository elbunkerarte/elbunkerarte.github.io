/**
 * Loads the Apps Script core files into a Node VM context.
 *
 * There is exactly ONE copy of the domain logic: the .gs files that get
 * deployed. The tests run that same text, so a passing suite says something
 * about the deployed code and not about a parallel re-implementation.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', 'apps-script');

/** Only the pure files. Anything touching SpreadsheetApp is out of scope here. */
const ARCHIVOS_CORE = [
  '01_core_validacion.gs',
  '02_core_codigos.gs',
  '03_core_agenda.gs',
  '04_core_rubrica.gs',
  '05_core_estados.gs'
];

function cargarCore() {
  const contexto = vm.createContext({ console, Date, Math, JSON, isFinite, Number, String, Array, Object, RegExp, parseInt, parseFloat });
  for (const archivo of ARCHIVOS_CORE) {
    const codigo = fs.readFileSync(path.join(RAIZ, archivo), 'utf8');
    try {
      vm.runInContext(codigo, contexto, { filename: archivo });
    } catch (err) {
      throw new Error(`Error cargando ${archivo}: ${err.message}`);
    }
  }
  return contexto;
}

module.exports = { cargarCore, ARCHIVOS_CORE };
