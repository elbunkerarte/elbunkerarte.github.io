/**
 * EL BUNKER - Audit log and incidents.
 *
 * Personal data never goes into the log: only codes, ids and the shape of the
 * change. That keeps the audit trail useful without multiplying copies of
 * personal information, which the data-protection policy has to justify.
 */

function registrar(actor, rol, accion, entidad, detalle, origen) {
  try {
    agregarFila(HOJA.LOG, {
      at: ahoraISO(),
      actor: actor || 'anonimo',
      rol: rol || '',
      accion: accion,
      entidad: entidad || '',
      detalle: String(detalle === undefined ? '' : detalle).slice(0, 900),
      origen: origen || 'webapp'
    });
  } catch (e) {
    // Logging must never break the operation it is observing.
    console.error('No se pudo registrar en _LOG: ' + e.message);
  }
}

function registrarIncidente(codigo, tipo, descripcion, accion, responsable) {
  var id = nuevoId('INC');
  agregarFila(HOJA.INCIDENTES, {
    incidente_id: id,
    at: ahoraISO(),
    code: codigo || '',
    tipo: tipo,
    descripcion: String(descripcion || '').slice(0, 900),
    accion: String(accion || '').slice(0, 500),
    responsable: responsable || '',
    estado: 'ABIERTO'
  });
  registrar(responsable, '', 'INCIDENTE', codigo || '', tipo);
  return id;
}
