/**
 * Loads site/config.json and fills the page.
 *
 * Everything legal, every link and every date comes from that one file, so the
 * organisation changes them without touching code - which is an explicit
 * requirement of the brief. Values still marked PENDIENTE DE COMPLETAR are
 * rendered as a visible warning instead of being silently printed.
 */
(function () {
  var CONFIG = null;

  function esPendiente(v) {
    return !v || String(v).indexOf('PENDIENTE') === 0;
  }

  function pintarValor(v) {
    return esPendiente(v)
      ? '<span class="pendiente">PENDIENTE DE COMPLETAR</span>'
      : String(v).replace(/[<>]/g, '');
  }

  function aplicar(raiz) {
    (raiz || document).querySelectorAll('[data-cfg]').forEach(function (el) {
      var valor = leerRuta(CONFIG, el.dataset.cfg);
      el.innerHTML = pintarValor(valor);
    });

    (raiz || document).querySelectorAll('[data-enlace]').forEach(function (el) {
      var url = leerRuta(CONFIG, el.dataset.enlace);
      if (esPendiente(url)) {
        el.removeAttribute('href');
        el.setAttribute('aria-disabled', 'true');
        el.style.opacity = '.55';
        el.style.cursor = 'not-allowed';
        var d = el.querySelector('.d');
        if (d) d.innerHTML = '<span class="pendiente">Enlace pendiente de publicar</span>';
      } else {
        el.href = url;
      }
    });
  }

  function leerRuta(objeto, ruta) {
    return ruta.split('.').reduce(function (o, k) {
      return (o === null || o === undefined) ? undefined : o[k];
    }, objeto);
  }

  fetch('config.json', { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (c) { CONFIG = c; aplicar(); document.body.classList.add('cargado'); })
    .catch(function (e) {
      console.error('No se pudo cargar config.json:', e);
      document.querySelectorAll('[data-cfg]').forEach(function (el) {
        el.innerHTML = '<span class="pendiente">SIN CONFIGURAR</span>';
      });
    });
})();
