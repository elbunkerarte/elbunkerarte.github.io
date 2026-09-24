/**
 * EL BUNKER - Jury actions.
 *
 * A juror sees only what they need to score: code, artistic name and discipline.
 * No document number, no contact details, no other juror's marks - the spec is
 * explicit that jurors score independently before deliberating.
 */

function hojaDeJurado(alias) {
  var usuarios = leerHoja(HOJA.USUARIOS);
  for (var i = 0; i < usuarios.length; i++) {
    if (normalizarComparable(usuarios[i].email_o_alias) === normalizarComparable(alias)) {
      var m = String(usuarios[i].nota || '').match(/jurado\s*([123])/i);
      if (m) return 'JURADO_' + m[1];
    }
  }
  var n = String(alias || '').match(/([123])\s*$/);
  if (n) return 'JURADO_' + n[1];
  throw new Error('No se pudo determinar la hoja de este jurado. En _USUARIOS, la nota debe decir "jurado 1", "jurado 2" o "jurado 3".');
}

function accionListaEvaluacion(datos, sesion) {
  var miHoja = hojaDeJurado(sesion.alias);
  var yaEvaluados = {};
  leerHoja(miHoja).forEach(function (f) {
    if (f.code) yaEvaluados[normalizarComparable(f.code)] = f;
  });

  var filas = leerHoja(HOJA.REGISTRO).filter(function (r) {
    return normalizarTexto(r.code) && normalizarEstado(r.attendance_status) !== ESTADO.CONFIRMADO;
  });

  return {
    hoja: miHoja,
    rubrica: RUBRICA,
    escala: ESCALA,
    participantes: filas.map(function (r) {
      var previo = yaEvaluados[normalizarComparable(r.code)];
      return {
        code: r.code,
        artistic_name: r.artistic_name || '(sin nombre artistico)',
        discipline: projectGenre(r),
        participation_mode: r.participation_mode || 'SOLISTA',
        members_declared: Number(r.members_declared) || 1,
        presentation_format: r.presentation_format || '',
        song_name: r.song_name || '',
        attendance_status: r.attendance_status,
        audition_status: r.audition_status || '',
        evaluado: !!previo,
        total: previo ? previo.total : null,
        puntajes: previo ? {
          talento: previo.talento, performance: previo.performance,
          identidad: previo.identidad, repertorio: previo.repertorio,
          profesionalismo: previo.profesionalismo, presencia: previo.presencia,
          digital: previo.digital, proyecto: previo.proyecto
        } : null,
        observaciones: previo ? previo.observaciones : ''
      };
    })
  };
}

function accionGuardarEvaluacion(datos, sesion) {
  return conBloqueo(function () {
    var miHoja = hojaDeJurado(sesion.alias);
    var registro = buscarPorCodigo(datos.code);
    if (!registro) return { ok: false, error: 'Codigo no encontrado.' };

    // Only a performed audition can be scored.
    if (normalizarEstado(registro.audition_status) !== ESTADO.REALIZADA &&
        normalizarEstado(registro.attendance_status) !== ESTADO.REALIZADA &&
        !esVerdadero(datos.forzar)) {
      return { ok: false, error: 'Este participante aun no tiene la audicion marcada como REALIZADA.' };
    }

    var puntajes = {};
    RUBRICA.forEach(function (f) { puntajes[f.id] = datos[f.id]; });

    var calculo = calcularPuntajeJurado(puntajes);
    if (!calculo.valido) {
      return { ok: false, error: 'Faltan o son invalidos: ' + calculo.faltantes.join(', ') + '. Cada factor va de 1 a 10.',
               faltantes: calculo.faltantes };
    }

    var existentes = leerHoja(miHoja);
    var previo = existentes.filter(function (f) {
      return normalizarComparable(f.code) === normalizarComparable(datos.code);
    })[0];

    var fila = {
      code: registro.code,
      artistic_name: registro.artistic_name,
      discipline: projectGenre(registro),
      total: calculo.total,
      valido: 'TRUE',
      observaciones: String(datos.observaciones || '').slice(0, 900),
      evaluado_at: ahoraISO(),
      evaluado_by: sesion.alias
    };
    RUBRICA.forEach(function (f) { fila[f.id] = Number(puntajes[f.id]); });

    if (previo) {
      actualizarFila(miHoja, previo._fila, fila);
      // A correction must leave a trace: the spec demands it explicitly.
      registrar(sesion.alias, sesion.rol, 'EVALUACION_CORREGIDA', registro.code,
                'antes=' + previo.total + ' despues=' + calculo.total);
    } else {
      agregarFila(miHoja, fila);
      registrar(sesion.alias, sesion.rol, 'EVALUACION', registro.code, 'total=' + calculo.total);
    }

    return { code: registro.code, total: calculo.total, hoja: miHoja, corregida: !!previo };
  });
}
