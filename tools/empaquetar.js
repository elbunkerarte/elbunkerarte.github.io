#!/usr/bin/env node
/**
 * Bundles the Apps Script project into ONE deployable file.
 *
 * Why: the Apps Script editor has no supported way to create 29 files
 * programmatically, but a single file can be written and saved reliably. The
 * repository keeps the readable multi-file layout; this produces the artefact
 * that is actually pasted into the editor.
 *
 * The HTML screens travel as a PLANTILLAS registry, which 20_web.gs already
 * knows how to read - so the bundled code and the repository code are the same
 * code, not two versions that can drift.
 *
 *   node tools/empaquetar.js            -> build/Codigo.gs
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const ORIGEN = path.join(RAIZ, 'apps-script');
const DESTINO = path.join(RAIZ, 'build');

function main() {
  if (!fs.existsSync(DESTINO)) fs.mkdirSync(DESTINO, { recursive: true });

  const archivosGs = fs.readdirSync(ORIGEN).filter((f) => f.endsWith('.gs')).sort();
  const archivosHtml = fs.readdirSync(ORIGEN).filter((f) => f.endsWith('.html')).sort();

  if (!archivosGs.length) throw new Error('No hay archivos .gs en apps-script/');
  if (!archivosHtml.length) throw new Error('No hay archivos .html en apps-script/');

  const partes = [];

  partes.push([
    '/**',
    ' * EL BUNKER - archivo unico de despliegue (GENERADO, no editar a mano).',
    ' *',
    ' * Fuente: apps-script/ en el repositorio. Regenerar con:',
    ' *     node tools/empaquetar.js',
    ' *',
    ' * Generado: ' + new Date().toISOString(),
    ' * Modulos: ' + archivosGs.length + ' .gs + ' + archivosHtml.length + ' .html',
    ' */',
    ''
  ].join('\n'));

  // --- HTML registry, first so it exists before anything reads it -----------
  partes.push('/** Pantallas HTML. Las lee hayRegistroPlantillas() en 20_web.gs. */');
  partes.push('var PLANTILLAS = {');
  partes.push(archivosHtml.map((f) => {
    const nombre = f.replace(/\.html$/, '');
    const contenido = fs.readFileSync(path.join(ORIGEN, f), 'utf8');
    return '  ' + JSON.stringify(nombre) + ': ' + JSON.stringify(contenido);
  }).join(',\n'));
  partes.push('};\n');

  // --- every .gs module, in filename order ---------------------------------
  for (const f of archivosGs) {
    const codigo = fs.readFileSync(path.join(ORIGEN, f), 'utf8');
    partes.push('\n// ' + '='.repeat(72));
    partes.push('// ' + f);
    partes.push('// ' + '='.repeat(72) + '\n');
    partes.push(codigo.trimEnd());
  }

  const bundle = partes.join('\n') + '\n';
  const salida = path.join(DESTINO, 'Codigo.gs');
  fs.writeFileSync(salida, bundle);

  // Parse check: a bundle that does not parse must never reach the editor.
  new (require('vm').Script)(bundle, { filename: 'Codigo.gs' });

  const manifiesto = fs.readFileSync(path.join(ORIGEN, 'appsscript.json'), 'utf8');
  fs.writeFileSync(path.join(DESTINO, 'appsscript.json'), manifiesto);

  console.log('build/Codigo.gs      ' + bundle.length.toLocaleString('es') + ' bytes');
  console.log('build/appsscript.json');
  console.log('  ' + archivosGs.length + ' modulos .gs, ' + archivosHtml.length + ' pantallas HTML');
  console.log('  sintaxis: OK');
}

main();
