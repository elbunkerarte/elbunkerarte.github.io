/**
 * Unit tests for the iteration-2 domain rules (pure core only).
 * One describe per rule of the iteration-2 brief.
 */
const { cargarCore } = require('./loader');
const { describe, it, expect, ejecutar } = require('./runner');

const C = cargarCore();

function validSubmission(extra) {
  return Object.assign({
    full_name: 'Maria Camila Restrepo', id_number: '1036448960', birth_date: '2002-05-14',
    adult_confirmation: true, neighborhood_sector: 'Aliadas del Sur', resides_in_sabaneta: 'SI',
    email: 'maria@example.com', whatsapp: '3012345678', participation_mode: 'Solista',
    artistic_name: 'MACA', genre_primary: 'R&B', audition_description: 'Tema propio',
    presentation_format: 'VOZ_PISTA', own_equipment: 'NO', track_uses: 'SI', track_method: 'ARCHIVO',
    availability_statement: true, accept_terms: true, accept_data_processing: true
  }, extra || {});
}

describe('Event data of iteration 2', () => {
  it('defaults to 23 October 2026 and the 18-30 range when no options are given', () => {
    expect(C.validarInscripcion(validSubmission()).eligibility_status).toBe('APTO');
    expect(C.validarInscripcion(validSubmission({ birth_date: '1996-10-23' })).eligibility_status).toBe('APTO');
    expect(C.validarInscripcion(validSubmission({ birth_date: '1996-10-24' })).eligibility_status).toBe('APTO');
    expect(C.validarInscripcion(validSubmission({ birth_date: '1995-10-22' })).eligibility_status).toBe('NO_CUMPLE');
    expect(C.validarInscripcion(validSubmission({ birth_date: '2008-10-24' })).eligibility_status).toBe('NO_CUMPLE');
  });
  it('answering NO to living in Sabaneta is NO_CUMPLE, not incomplete', () => {
    expect(C.validarInscripcion(validSubmission({ resides_in_sabaneta: 'NO' })).eligibility_status).toBe('NO_CUMPLE');
  });
  it('silence is not consent: unticked adult confirmation or availability makes it INCOMPLETO', () => {
    expect(C.validarInscripcion(validSubmission({ adult_confirmation: false })).eligibility_status).toBe('INCOMPLETO');
    expect(C.validarInscripcion(validSubmission({ availability_statement: '' })).eligibility_status).toBe('INCOMPLETO');
  });
  it('WhatsApp and image authorizations are optional and independent', () => {
    const r = C.validarInscripcion(validSubmission({ accept_whatsapp_operational: false, accept_image_voice: false }));
    expect(r.eligibility_status).toBe('APTO');
  });
  it('the generic discipline field is no longer required; mode and main genre are', () => {
    expect(C.validarInscripcion(validSubmission({ discipline: '' })).eligibility_status).toBe('APTO');
    expect(C.validarInscripcion(validSubmission({ participation_mode: '' })).eligibility_status).toBe('INCOMPLETO');
    expect(C.validarInscripcion(validSubmission({ genre_primary: '' })).eligibility_status).toBe('INCOMPLETO');
  });
});

describe('Schedule: 15:00 start, margin, contingency and 21:00 close', () => {
  it('reads times that a spreadsheet turned into dates', () => {
    expect(C.horaAMinutos('1899-12-30T15:00:00')).toBe(900);
    expect(C.horaAMinutos('2026-10-23 20:30')).toBe(1230);
    expect(C.horaAMinutos('15:00')).toBe(900);
    expect(C.horaAMinutos('25:00')).toBeNull();
    expect(C.horaAMinutos('')).toBeNull();
  });
  it('B-091..B-100 audition 19:30-20:00, the last block', () => {
    expect(C.horarioDeCodigo('B-091').ventana).toBe('19:30-20:00');
  });
  it('knows which phase of the day is running', () => {
    expect(C.currentBlock(14 * 60 + 59).phase).toBe('ANTES');
    expect(C.currentBlock(15 * 60).block_id).toBe(1);
    expect(C.currentBlock(19 * 60 + 59).block_id).toBe(10);
    expect(C.currentBlock(20 * 60).phase).toBe('MARGEN');
    expect(C.currentBlock(20 * 60 + 30).phase).toBe('CONTINGENCIA');
    expect(C.currentBlock(21 * 60).phase).toBe('CERRADO');
  });
  it('contingency capacity is computed against the 21:00 close', () => {
    const cola = [];
    for (let i = 0; i < 12; i++) cola.push({ code: 'B-0' + (10 + i), contingencia_desde: '2026-10-23T16:0' + (i % 10) });
    const plan = C.planificarContingencia(cola, { ahora_minutos: 20 * 60 + 30 });
    expect(plan.cierre).toBe('21:00');
    expect(plan.cupos_disponibles).toBe(7);           // 30 min / (3 + 1)
    expect(plan.fuera.length).toBe(5);
  });
});

describe('Participation mode and project shape', () => {
  it('normalizes the mode however it is typed', () => {
    expect(C.normalizeParticipationMode('Dúo')).toBe('DUO');
    expect(C.normalizeParticipationMode('agrupación')).toBe('AGRUPACION');
    expect(C.normalizeParticipationMode('Solista')).toBe('SOLISTA');
    expect(C.normalizeParticipationMode('orquesta')).toBe('');
  });
  it('a duo must have exactly 2 members and a group 3 to the maximum', () => {
    const duo = C.validarInscripcion(validSubmission({ participation_mode: 'DUO', members_declared: '3' }));
    expect(duo.errores.some(e => e.campo === 'members_declared')).toBe(true);
    const group = C.validarInscripcion(validSubmission({ participation_mode: 'AGRUPACION', members_declared: '16' }));
    expect(group.eligibility_status).toBe('INCOMPLETO');
    const ok = C.validarInscripcion(validSubmission({ participation_mode: 'AGRUPACION', members_declared: '5' }));
    expect(ok.eligibility_status).toBe('APTO');
  });
  it('a group must give its artistic name', () => {
    const r = C.validarInscripcion(validSubmission({ participation_mode: 'AGRUPACION', members_declared: '4', artistic_name: '' }));
    expect(r.errores.some(e => e.campo === 'artistic_name')).toBe(true);
  });
  it('conditional answers are required only when they apply', () => {
    expect(C.validarInscripcion(validSubmission({ track_uses: 'SI', track_method: '' })).eligibility_status).toBe('INCOMPLETO');
    expect(C.validarInscripcion(validSubmission({ track_uses: 'NO', track_method: '' })).eligibility_status).toBe('APTO');
    expect(C.validarInscripcion(validSubmission({ track_method: 'OTRO' })).eligibility_status).toBe('INCOMPLETO');
    expect(C.validarInscripcion(validSubmission({ presentation_format: 'OTRA' })).eligibility_status).toBe('INCOMPLETO');
    expect(C.validarInscripcion(validSubmission({ own_equipment: 'SI' })).eligibility_status).toBe('INCOMPLETO');
    expect(C.validarInscripcion(validSubmission({ own_equipment: 'SI', own_equipment_detail: 'Guitarra' })).eligibility_status).toBe('APTO');
  });
});

describe('Repeated group detection (group_match_key)', () => {
  it('the three spellings from the brief produce the same key', () => {
    const k = C.groupMatchKey('El Arte es La Solución');
    expect(C.groupMatchKey('El arte es la solucion')).toBe(k);
    expect(C.groupMatchKey('EL ARTE ES LA SOLUCIÓN')).toBe(k);
    expect(C.groupMatchKey('  El-Arte,  es la Solución! ')).toBe(k);
    expect(k).toBe('el arte es la solucion');
  });
  it('flags an earlier group with the same key, ignoring soloists and itself', () => {
    const existing = [
      { submission_id: 'S-1', participation_mode: 'SOLISTA', artistic_name: 'Los Parceros' },
      { submission_id: 'S-2', participation_mode: 'AGRUPACION', group_display_name: 'Los Parceros', group_match_key: 'los parceros' }
    ];
    const m = C.detectGroupMatch({ submission_id: 'S-3', group_match_key: C.groupMatchKey('LOS PARCEROS') }, existing);
    expect(m.match).toBe(true);
    expect(m.ref).toBe('S-2');
    const self = C.detectGroupMatch({ submission_id: 'S-2', group_match_key: 'los parceros' }, existing);
    expect(self.match).toBe(false);
  });
  it('group numbers are never reused, even with gaps', () => {
    expect(C.nextGroupNumber([{ group_code: 'GRP-001' }, { group_code: 'GRP-007' }, { group_code: '' }])).toBe(8);
    expect(C.formatGroupCode(8)).toBe('GRP-008');
  });
});

describe('Group members: individual authorization', () => {
  const opts = { fecha_evento: '2026-10-23', edad_minima: 18, firma_obligatoria: true };
  const member = (extra) => Object.assign({
    full_name: 'Juan Perez', id_number: '1020304050', birth_date: '2000-01-01', artistic_role: 'Guitarra',
    adult_confirmation: true, accept_terms: true, accept_data_processing: true,
    signature_png: 'data:image/png;base64,iVBORw0KGgo='
  }, extra || {});
  it('a complete adult member with signature is AUTORIZADO', () => {
    expect(C.validateMember(member(), opts).status).toBe('AUTORIZADO');
  });
  it('a minor is NO CUMPLE', () => {
    expect(C.validateMember(member({ birth_date: '2010-01-01' }), opts).status).toBe('NO CUMPLE');
  });
  it('without signature, terms or data consent it is INCOMPLETO', () => {
    expect(C.validateMember(member({ signature_png: '' }), opts).status).toBe('INCOMPLETO');
    expect(C.validateMember(member({ accept_terms: false }), opts).status).toBe('INCOMPLETO');
    expect(C.validateMember(member({ accept_data_processing: '' }), opts).status).toBe('INCOMPLETO');
  });
  it('the signature can be switched off by configuration', () => {
    expect(C.validateMember(member({ signature_png: '' }), Object.assign({}, opts, { firma_obligatoria: false })).status).toBe('AUTORIZADO');
  });
});

describe('Test data and privacy helpers', () => {
  it('recognizes seed rows by any of their markers', () => {
    expect(C.isTestData({ source: 'seed' })).toBe(true);
    expect(C.isTestData({ client_submission_id: 'SEED-12' })).toBe(true);
    expect(C.isTestData({ email: 'prueba3@ejemplo-bunker.test' })).toBe(true);
    expect(C.isTestData({ source: 'web', email: 'x@gmail.com' })).toBe(false);
  });
  it('suggests the intended domain for common typos but never corrects silently', () => {
    expect(C.suggestEmailDomain('ana@gmaik.com')).toBe('ana@gmail.com');
    expect(C.suggestEmailDomain('ana@gmial.com')).toBe('ana@gmail.com');
    expect(C.suggestEmailDomain('ana@hotmial.com')).toBe('ana@hotmail.com');
    expect(C.suggestEmailDomain('ana@gmail.com')).toBe('');
    expect(C.suggestEmailDomain('ana@corporacion.org.co')).toBe('');
  });
  it('masks ID numbers, e-mails and phones for the direction role', () => {
    expect(C.maskIdNumber('1.036.448.960')).toBe('******8960');
    expect(C.maskEmail('maria.restrepo@gmail.com')).toBe('m***@gmail.com');
    expect(C.maskPhone('+57 301 234 5678')).toBe('*** *** 5678');
  });
});

describe('Video link accessibility', () => {
  it('recognizes each accepted provider', () => {
    expect(C.classifyVideoUrl('https://youtu.be/dQw4w9WgXcQ').provider).toBe('youtube');
    expect(C.classifyVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3').id).toBe('dQw4w9WgXcQ');
    expect(C.classifyVideoUrl('https://youtube.com/shorts/abcdefghijk').provider).toBe('youtube');
    expect(C.classifyVideoUrl('https://vimeo.com/123456789').provider).toBe('vimeo');
    expect(C.classifyVideoUrl('https://drive.google.com/file/d/1AbCdEfGhIjKlMn/view?usp=sharing').id).toBe('1AbCdEfGhIjKlMn');
    expect(C.classifyVideoUrl('https://drive.google.com/open?id=1AbCdEfGhIjKlMn').provider).toBe('drive');
    expect(C.classifyVideoUrl('https://drive.google.com/drive/folders/1AbCdEfGhIjKlMn').provider).toBe('drive_folder');
    expect(C.classifyVideoUrl('https://www.instagram.com/reel/xyz/').provider).toBe('instagram');
    expect(C.classifyVideoUrl('https://www.tiktok.com/@a/video/1').provider).toBe('tiktok');
    expect(C.classifyVideoUrl('https://soundcloud.com/a/b').provider).toBe('other');
    expect(C.classifyVideoUrl('lo tengo en el celular').provider).toBe('invalid');
  });
  it('probes YouTube through oEmbed and Drive without following the login redirect', () => {
    expect(C.videoProbeRequest('https://youtu.be/dQw4w9WgXcQ').url.indexOf('https://www.youtube.com/oembed')).toBe(0);
    const drive = C.videoProbeRequest('https://drive.google.com/file/d/1AbCdEfGhIjKlMn/view');
    expect(drive.followRedirects).toBe(false);
    expect(C.videoProbeRequest('https://www.instagram.com/reel/xyz/')).toBeNull();
  });
  it('turns HTTP answers into operator-readable statuses', () => {
    expect(C.interpretVideoProbe('youtube', 200).status).toBe('ACCESIBLE');
    expect(C.interpretVideoProbe('youtube', 401).status).toBe('NO ACCESIBLE');
    expect(C.interpretVideoProbe('youtube', 404).status).toBe('NO ACCESIBLE');
    expect(C.interpretVideoProbe('drive', 302, 'https://accounts.google.com/ServiceLogin?continue=x').status).toBe('NO ACCESIBLE');
    expect(C.interpretVideoProbe('drive', 200, '', '<meta property="og:title" content="video.mp4">').status).toBe('ACCESIBLE');
    expect(C.interpretVideoProbe('other', 403).status).toBe('NO ACCESIBLE');
    expect(C.interpretVideoProbe('instagram', 0).status).toBe('NO VERIFICABLE');
  });
  it('decides without a request for empty, malformed and social-network links', () => {
    expect(C.videoStatusWithoutProbe('').status).toBe('SIN VIDEO');
    expect(C.videoStatusWithoutProbe('mi video').status).toBe('NO ACCESIBLE');
    expect(C.videoStatusWithoutProbe('https://www.tiktok.com/@a/video/1').status).toBe('NO VERIFICABLE');
    expect(C.videoStatusWithoutProbe('https://youtu.be/dQw4w9WgXcQ')).toBeNull();
  });
});

describe('Backing tracks', () => {
  it('names the file B-XXX_NOMBREARTISTICO_NOMBRECANCION.ext', () => {
    expect(C.trackFileName('b-007', 'La Nena Güera', 'Canción de día!', 'MP3')).toBe('B-007_LA_NENA_GUERA_CANCION_DE_DIA.mp3');
    expect(C.trackFileName('B-010', '', '', 'wav')).toBe('B-010_SIN_NOMBRE_SIN_CANCION.wav');
  });
  it('detects the real audio type from the first bytes', () => {
    const ascii = (s) => s.split('').map(ch => ch.charCodeAt(0));
    expect(C.detectAudioType(ascii('ID3').concat(new Array(9).fill(0)))).toBe('mp3');
    expect(C.detectAudioType(ascii('RIFF').concat([0, 0, 0, 0]).concat(ascii('WAVE')))).toBe('wav');
    expect(C.detectAudioType([0, 0, 0, 0].concat(ascii('ftypM4A ')))).toBe('m4a');
    expect(C.detectAudioType(ascii('OggS').concat(new Array(8).fill(0)))).toBe('ogg');
    expect(C.detectAudioType(ascii('fLaC').concat(new Array(8).fill(0)))).toBe('flac');
    expect(C.detectAudioType(ascii('MZ').concat(new Array(10).fill(0)))).toBe('');
  });
  it('refuses wrong formats, oversized files and disguised files before touching Drive', () => {
    const mp3Head = [0x49, 0x44, 0x33, 3, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(C.validateTrackUpload('pista.exe', 1000, mp3Head).ok).toBe(false);
    expect(C.validateTrackUpload('pista.mp3', 16 * 1024 * 1024, mp3Head, { max_mb: 15 }).ok).toBe(false);
    expect(C.validateTrackUpload('pista.mp3', 1000, [77, 90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).ok).toBe(false);
    expect(C.validateTrackUpload('pista.mp3', 1000, mp3Head).ok).toBe(true);
  });
});

describe('Drawn signatures', () => {
  it('accepts only PNG data URLs', () => {
    expect(C.parsePngDataUrl('data:image/png;base64,iVBORw0KGgo=').ok).toBe(true);
    expect(C.parsePngDataUrl('data:image/jpeg;base64,/9j/').ok).toBe(false);
    expect(C.isPngBytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])).toBe(true);
    expect(C.isPngBytes([-119, 80, 78, 71, 13, 10, 26, 10])).toBe(true);
    expect(C.bytesToHex([-1, 0, 16])).toBe('ff0010');
  });
});

describe('Check-in flow: access -> check-in -> pre-queue -> audition -> exit', () => {
  it('follows CHECK-IN -> PRECOLA -> EN AUDICION -> REALIZADA', () => {
    expect(C.aplicarTransicion('CHECK-IN', 'PRECOLA').ok).toBe(true);
    expect(C.aplicarTransicion('PRECOLA', 'EN AUDICION').ok).toBe(true);
    expect(C.aplicarTransicion('EN AUDICION', 'REALIZADA').ok).toBe(true);
  });
  it('someone on stage can only finish (or become an incident)', () => {
    expect(C.aplicarTransicion('EN AUDICION', 'NO SHOW').ok).toBe(false);
    expect(C.aplicarTransicion('EN AUDICION', 'CONTINGENCIA').ok).toBe(false);
  });
  it('tolerates the ways operators type the new states', () => {
    expect(C.normalizarEstado('en_audicion')).toBe('EN AUDICION');
    expect(C.normalizarEstado('En audición')).toBe('EN AUDICION');
    expect(C.normalizarEstado('pre-cola')).toBe('PRECOLA');
  });
  it('the close leaves whoever is on stage alone and closes everyone pending', () => {
    const r = C.cerrarJornada([
      { code: 'B-001', attendance_status: 'EN AUDICION' },
      { code: 'B-002', attendance_status: 'PRECOLA' },
      { code: 'B-003', attendance_status: 'REALIZADA' }
    ]);
    expect(r.total).toBe(1);
    expect(r.cambios[0].code).toBe('B-002');
  });
});

describe('Selection: top 8 and minuted committee decisions', () => {
  function artist(code, score) {
    const p = {}; ['talento', 'performance', 'identidad', 'repertorio', 'profesionalismo', 'presencia', 'digital', 'proyecto']
      .forEach(k => { p[k] = score; });
    return { code, artistic_name: code, audition_status: 'REALIZADA',
             tarjetas: [1, 2, 3].map(j => ({ jurado: j, puntajes: p })) };
  }
  const list = [];
  for (let i = 1; i <= 7; i++) list.push(artist('B-00' + i, 10 - i * 0.5));
  list.push(artist('B-008', 5), artist('B-009', 5), artist('B-010', 3));

  it('selects 8 by default', () => {
    const r = C.seleccionarTop(list.slice(0, 7).concat([artist('B-011', 4), artist('B-012', 2)]));
    expect(r.top).toHaveLength(8);
  });
  it('an exact tie at the cut is left for the committee, never invented', () => {
    const r = C.seleccionarTop(list);
    expect(r.requiere_comite).toBe(true);
    expect(r.empates_sin_resolver.map(a => a.code).sort()).toEqual(['B-008', 'B-009']);
  });
  it('the minuted decision orders exactly the tied artists and closes the tie', () => {
    const r = C.seleccionarTop(list, { deliberacion: { deliberation_id: 'ACTA-1', codes_in_order: ['B-009', 'B-008'] } });
    expect(r.requiere_comite).toBe(false);
    expect(r.top[7].code).toBe('B-009');
    expect(r.deliberacion_aplicada).toBe('ACTA-1');
  });
  it('a decision about a different set of artists does not apply', () => {
    const r = C.seleccionarTop(list, { deliberacion: { deliberation_id: 'ACTA-2', codes_in_order: ['B-009', 'B-010'] } });
    expect(r.requiere_comite).toBe(true);
    expect(r.deliberacion_descartada.indexOf('ACTA-2')).toBe(0);
  });
});

describe('Source hygiene', () => {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(__dirname, '..', 'apps-script');
  it('no source file contains raw combining marks (regex ranges must use \\u escapes)', () => {
    const offenders = fs.readdirSync(dir).filter(f => /\.(gs|html)$/.test(f))
      .filter(f => /[̀-ͯ]/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
    expect(offenders).toEqual([]);
  });
});

process.exit(ejecutar());
