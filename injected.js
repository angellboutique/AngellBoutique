    // Carrusel de las cards portada (3 fotos en PC, deslizable con puntitos en móvil)
    function initBagGallery() {
      document.querySelectorAll(".bag-gallery-row").forEach(function(gallery) {
        var card = gallery.closest(".bag-card");
        var dots = card ? card.querySelectorAll(".bag-dot") : [];
        if (!gallery.dataset.bound) {
          gallery.dataset.bound = "1";
          gallery.addEventListener("scroll", function() {
            var w = gallery.clientWidth || 1;
            var idx = Math.round(gallery.scrollLeft / w);
            dots.forEach(function(d, i) { d.classList.toggle("active", i === idx); });
          });
        }
        dots.forEach(function(dot) {
          if (dot.dataset.bound) return;
          dot.dataset.bound = "1";
          dot.addEventListener("click", function() {
            gallery.scrollTo({ left: gallery.clientWidth * parseInt(dot.dataset.index || "0", 10), behavior: "smooth" });
          });
        });
      });
    }
    initBagGallery();
    // Tienda dinámica: lee Firestore y re-renderiza peluches / bolsos / pijamas / llaveros.
    // Si Firestore falla o está vacío, se conserva el HTML estático como respaldo.
    (function() {
      var firebaseConfig = {
        apiKey: "AIzaSyCX8NAHSBLDKUKvwV93YL_1xhF1xS1aKf4",
        authDomain: "angell-e31ed.firebaseapp.com",
        projectId: "angell-e31ed",
        storageBucket: "angell-e31ed.firebasestorage.app",
        messagingSenderId: "780288943136",
        appId: "1:780288943136:web:67b168d5b9e9f6a9c6c845"
      };
      var WA = "51930427807";
      var CAT_LABEL = { peluches: "Peluches", bolsos: "Bolsos", pijamas: "Pijamas", llaveros: "Llaveros" };
      function catLabel(c){ return CAT_LABEL[c] || "Angell Boutique"; }
      function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
      function normPhotos(p){
        if (p.imagenes && p.imagenes.length) return p.imagenes.map(function(f){
          if (typeof f === "string") return { url: f, x: 50, y: 50, z: 100 };
          return { url: f.url || f.imagen || "oso.png", x: f.x != null ? f.x : (f.imgX != null ? f.imgX : 50), y: f.y != null ? f.y : (f.imgY != null ? f.imgY : 50), z: f.z != null ? f.z : (f.imgZ != null ? f.imgZ : 100) };
        });
        return [{ url: p.imagen || "oso.png", x: p.imgX != null ? p.imgX : 50, y: p.imgY != null ? p.imgY : 50, z: p.imgZ != null ? p.imgZ : 100 }];
      }
      /* El zoom de la dueña viaja como variable (--z) y no como transform
         suelto: así el CSS puede componer el acercamiento del hover encima
         en lugar de pisarlo, y funciona en todos los productos. */
      function imgStyle(ph){
        var pos = ph.x + "% " + ph.y + "%";
        var z = ph.z / 100;
        return z > 1.01
          ? ("object-position:" + esc(pos) + ";--z:" + z + ";transform-origin:" + esc(pos))
          : ("object-position:" + esc(pos));
      }
      function mediaHTML(p, uid){
        var photos = normPhotos(p);
        var badge = p.agotado ? '<span class="badge-agotado">AGOTADO</span>' : '';
        if (photos.length <= 1) {
          var ph = photos[0];
          return badge + '<img src="' + esc(ph.url) + '" alt="' + esc(p.nombre || "Producto") + '" class="product-img" loading="lazy" style="' + imgStyle(ph) + '" onerror="this.src=\'oso.png\'">';
        }
        var slides = photos.map(function(ph){
          return '<div class="pcar-slide"><img src="' + esc(ph.url) + '" alt="' + esc(p.nombre || "Producto") + '" class="product-img" loading="lazy" style="' + imgStyle(ph) + '" onerror="this.src=\'oso.png\'"></div>';
        }).join("");
        var dots = photos.map(function(_, i){
          return '<button class="pcar-dot' + (i === 0 ? ' active' : '') + '" data-i="' + i + '" data-t="track-' + uid + '" aria-label="Foto ' + (i + 1) + '"></button>';
        }).join("");
        return badge +
          '<div class="pcar-track" id="track-' + uid + '">' + slides + '</div>' +
          '<div class="pcar-dots" id="dots-track-' + uid + '">' + dots + '</div>';
      }
      var uidSeq = 0;
      function isPortada(p){ return p.portada === true || p.destacado === true; }
      function portadaCard(p){
        var agot = !!p.agotado;
        var waText = "Hola! Quiero " + (p.nombre || "este producto");
        var href = agot ? "#" : ("https://wa.me/" + WA + "?text=" + encodeURIComponent(waText));
        var photos = normPhotos(p);
        var cols = "repeat(" + Math.min(Math.max(photos.length, 1), 3) + ", 1fr)";
        // La altura del riel la fija cuántas fotos hay: con n fotos de
        // 3:4 en fila, el conjunto es 0.75×n de proporción. Va como
        // variable para que en móvil la regla siga mandando.
        var aspect = (Math.min(Math.max(photos.length, 1), 3) * 0.75).toFixed(3);
        var gal = photos.map(function(ph, i){
          return '<img src="' + esc(ph.url) + '" alt="' + esc((p.nombre || "Producto") + " - foto " + (i + 1)) + '" style="' + imgStyle(ph) + '" onerror="this.src=\'oso.png\'">';
        }).join("");
        var dots = photos.length > 1
          ? '<div class="bag-dots">' + photos.map(function(_, i){
              return '<button class="bag-dot' + (i === 0 ? " active" : "") + '" data-index="' + i + '" aria-label="Foto ' + (i + 1) + '"></button>';
            }).join("") + '</div>'
          : '';
        return '<li class="bag-card" data-categoria="' + esc(catLabel(p.categoria)) + '">' +
          '<div class="bag-gallery-row" style="--cols:' + Math.min(Math.max(photos.length, 1), 3) + ';--aspect:' + aspect + '">' +
            (agot ? '<span class="badge-agotado">AGOTADO</span>' : '') + gal +
          '</div>' + dots +
          '<div class="bag-card-info">' +
            '<span class="bag-badge">' + esc(p.etiqueta || "nuevo") + '</span>' +
            '<h3 class="bag-name">' + esc(p.nombre || "") + '</h3>' +
            '<p class="bag-desc">' + esc(p.descripcion || "") + '</p>' +
            '<div class="bag-card-bottom">' +
              '<span class="product-price">S/ ' + esc(p.precio != null ? p.precio : "–") + '</span>' +
              (agot
                ? '<span class="product-cta is-disabled">Agotado</span>'
                : '<a href="' + href + '" class="product-cta" target="_blank" rel="noopener">Comprar</a>') +
            '</div>' +
          '</div></li>';
      }
      function card(p){
        if (isPortada(p)) return portadaCard(p);
        var agot = !!p.agotado;
        var waText = "Hola! Quiero " + (p.nombre || "este producto");
        var href = agot ? "#" : ("https://wa.me/" + WA + "?text=" + encodeURIComponent(waText));
        var uid = "p" + (uidSeq++);
        return '<li class="product-card' + (agot ? ' is-agotado' : '') + '" data-categoria="' + esc(catLabel(p.categoria || "peluches")) + '">' +
          '<div class="product-img-wrap">' + mediaHTML(p, uid) + '</div>' +
          '<div class="product-info">' +
            '<h3 class="product-name">' + esc(p.nombre || "") + '</h3>' +
            '<p class="product-desc">' + esc(p.descripcion || "") + '</p>' +
            '<div class="product-bottom">' +
              '<span class="product-price">S/ ' + esc(p.precio != null ? p.precio : "–") + '</span>' +
              (agot
                ? '<span class="product-cta is-disabled">Agotado</span>'
                : '<a href="' + href + '" class="product-cta" target="_blank" rel="noopener">Comprar</a>') +
            '</div>' +
          '</div></li>';
      }
      function initCarousels(){
        document.querySelectorAll(".pcar-track").forEach(function(track){
          if (track.dataset.bound) return;
          track.dataset.bound = "1";
          var dotsBox = document.getElementById("dots-" + track.id);
          var dots = dotsBox ? dotsBox.querySelectorAll(".pcar-dot") : [];
          track.addEventListener("scroll", function(){
            var idx = Math.round(track.scrollLeft / track.clientWidth);
            dots.forEach(function(d, i){ d.classList.toggle("active", i === idx); });
          });
          dots.forEach(function(d){
            d.addEventListener("click", function(){
              track.scrollTo({ left: track.clientWidth * parseInt(d.dataset.i), behavior: "smooth" });
            });
          });
        });
      }
      function fill(id, items){
        var ul = document.getElementById(id);
        if (!ul || !items.length) return false;
        uidSeq = 0;
        ul.innerHTML = items.map(card).join("");
        initCarousels();
        try { initBagGallery(); } catch(e){}
        return true;
      }
      try {
        firebase.initializeApp(firebaseConfig);
        var db = firebase.firestore();
        db.collection("products").orderBy("orden").get().then(function(snap){
          var all = snap.docs.map(function(d){ var o = d.data(); o.id = d.id; return o; })
            .filter(function(p){ return p.visible !== false; });
          if (!all.length) return; // conserva HTML estático
          fill("grid-peluches", all.filter(function(p){ return (p.categoria||"peluches") === "peluches"; }));
          fill("grid-bolsos", all.filter(function(p){ return p.categoria === "bolsos"; }));
          var pij = all.filter(function(p){ return p.categoria === "pijamas"; });
          var secPij = document.getElementById("pijamas");
          if (pij.length && secPij) { fill("grid-pijamas", pij); secPij.style.display = ""; }
          fill("grid-llaveros", all.filter(function(p){ return p.categoria === "llaveros"; }));
        }).catch(function(){ /* sin conexión: se queda el HTML estático */ });
      } catch(e){ /* SDK bloqueado: se queda el HTML estático */ }
    })();
    window.addEventListener('load', function(){
      setTimeout(function(){ document.getElementById('intro').classList.add('hidden'); }, 1000);
    });
    (function(){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
      }, { threshold: 0, rootMargin: '0px 0px 18% 0px' });
      function watch(){
        document.querySelectorAll('.section-inner, .promo-card, .product-card, .bag-card, .contact-card, .hero-text, .hero-image').forEach(function(el){
          if (!el.classList.contains('reveal')) { el.classList.add('reveal'); io.observe(el); }
        });
      }
      watch();
      new MutationObserver(watch).observe(document.body, { childList: true, subtree: true });
    })();
document.getElementById('navToggle').addEventListener('click', function(){ document.getElementById('navLinks').classList.toggle('open'); });

/* ═══════════════════════════════════════════════════════════
   TARJETAS SIN CAJA + MODAL DE DETALLE + MÁQUINA DE ESCRIBIR
   ═══════════════════════════════════════════════════════════ */
(function () {
  var WA_NUM = '51930427807';
  var SECTION_CAT = { productos: 'Peluches', bolsos: 'Bolsos', pijamas: 'Pijamas', llaveros: 'Llaveros' };

  function xt(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ── 1. La tarjeta pierde la caja y gana el overlay ── */
  function hydrateCards() {
    document.querySelectorAll('.product-card, .bag-card').forEach(function (card) {
      if (card.dataset.hydrated) return;
      var info = card.querySelector('.product-info, .bag-card-info');
      var media = card.querySelector('.product-img-wrap, .bag-gallery-row');
      if (!info || !media) return;
      card.dataset.hydrated = '1';

      var nameEl = info.querySelector('.product-name, .bag-name');
      var descEl = info.querySelector('.product-desc, .bag-desc');
      var priceEl = info.querySelector('.product-price');
      var name = nameEl ? nameEl.textContent.trim() : '';
      var desc = descEl ? descEl.textContent.trim() : '';
      var price = priceEl ? priceEl.textContent.trim() : '';

      // Cada foto guarda también su encuadre: el modal tiene que abrir
      // la foto donde la dejó la dueña, no en el centro por defecto.
      var leerFoto = function (i) {
        return {
          u: i.getAttribute('src'),
          p: (i.style && i.style.objectPosition) || '50% 50%',
          z: (i.style && i.style.transform) || ''
        };
      };

      // Las fotos vienen de dos formas: en slides (el carrusel de la
      // tarjeta) o sueltas una al lado de la otra (la destacada). Si
      // solo se miran los slides, la ficha de la destacada se quedaba
      // con una foto de las tres.
      var fotos = [].map.call(media.querySelectorAll('.pcar-slide img'), leerFoto)
        .filter(function (f) { return !!f.u; });

      if (!fotos.length) {
        fotos = [].map.call(media.querySelectorAll('img'), leerFoto)
          .filter(function (f) { return !!f.u; });
      }

      var sec = card.closest('section[id]');
      var cat = card.dataset.categoria || SECTION_CAT[sec ? sec.id : ''] || 'Angell Boutique';
      var agotado = card.classList.contains('is-agotado') || !!media.querySelector('.badge-agotado');

      card.dataset.p = JSON.stringify({
        nombre: name, desc: desc, precio: price,
        categoria: cat, fotos: fotos, agotado: agotado
      });

      var isFeature = card.classList.contains('bag-card');

      var meta = document.createElement('div');
      meta.className = 'bay-meta';
      meta.innerHTML = '<span class="bay-cat">' + xt(cat) + '</span>' +
                       '<span class="bay-price">' + xt(price) + '</span>';
      // La destacada ya lleva su badge; la fila de categoría sobra.
      if (!isFeature) info.insertBefore(meta, info.firstChild);

      var bottom = info.querySelector('.product-bottom, .bag-card-bottom');
      if (bottom) bottom.parentNode.removeChild(bottom);

      var order = document.createElement('a');
      order.className = 'bay-buy';
      order.textContent = agotado ? 'Agotado' : 'Comprar';
      if (agotado) {
        order.setAttribute('aria-disabled', 'true');
      } else {
        order.setAttribute('href', 'https://wa.me/' + WA_NUM + '?text=' +
          encodeURIComponent('Hola! Quiero ' + (name || 'este producto')));
        order.setAttribute('target', '_blank');
        order.setAttribute('rel', 'noopener');
      }
      if (isFeature) {
        // En la destacada el precio y el estado van en una línea, como
        // en la ficha: no como el botón a lo ancho de la rejilla.
        var row = document.createElement('div');
        row.className = 'bay-buyrow';
        var amount = document.createElement('span');
        amount.className = 'bay-price';
        amount.textContent = price;
        row.appendChild(amount);
        row.appendChild(order);
        info.appendChild(row);
      } else {
        info.appendChild(order);
      }

      /* La foto abre el detalle. Se ignora el clic si viene de los
         puntitos del carrusel, y también si hubo arrastre horizontal,
         que en un carrusel es deslizar, no pulsar. */
      var trigger = document.createElement('button');
      trigger.className = 'bay-trigger';
      trigger.type = 'button';
      trigger.setAttribute('aria-label', 'Ver detalle de ' + (name || 'producto'));
      media.appendChild(trigger);

      var downX = null;
      media.addEventListener('mousedown', function (e) { downX = e.clientX; });
      media.addEventListener('touchstart', function (e) {
        downX = e.touches[0] ? e.touches[0].clientX : null;
      }, { passive: true });
      media.addEventListener('click', function (e) {
        if (e.target.closest('.pcar-dots, .pcar-dot')) return;
        if (downX !== null && e.clientX !== undefined && Math.abs(e.clientX - downX) > 8) return;
        openModal(card);
      });
    });
  }

  /* ── 2. El detalle ── */
  var modal = document.getElementById('productModal');
  var el = {
    media: document.querySelector('.modal-media'),
    shot: document.getElementById('modalShot'),
    photo: document.getElementById('modalPhoto'),
    index: document.getElementById('modalIndex'),
    total: document.getElementById('modalTotal'),
    name: document.getElementById('modalName'),
    price: document.getElementById('modalPrice'),
    stock: document.getElementById('modalStock'),
    stockText: document.getElementById('modalStockText'),
    desc: document.getElementById('modalDesc'),
    crumbs: document.getElementById('modalCrumbs'),
    cta: document.getElementById('modalCta'),
    thumbs: document.getElementById('modalThumbs'),
    prev: modal.querySelector('[data-modal-prev]'),
    next: modal.querySelector('[data-modal-next]'),
    close: modal.querySelector('.modal-close')
  };
  var view = { fotos: [], i: 0 };
  var lastFocus = null;

  /* Regla general para todas las fotos, sin excepciones: el marco se
     ajusta a la proporción de cada foto, así que entra completa y
     centrada, sin recorte. Como el marco está detrás transparente, lo
     que sobra no se ve. Sirve para cualquier foto que subas de acá en
     adelante: vertical, apaisada o panorámica. */
  var apilado = window.matchMedia('(max-width: 768px)');

  function fitShot() {
    if (!el.media || !el.shot) return;
    var nw = el.photo.naturalWidth, nh = el.photo.naturalHeight;
    if (!nw || !nh) return;

    if (apilado.matches) {
      var mw = el.media.clientWidth;
      if (!mw) return;
      var mh = mw / (nw / nh);
      el.media.style.height = Math.round(mh) + 'px';
      el.shot.style.width = mw + 'px';
      el.shot.style.height = Math.round(mh) + 'px';
      return;
    }

    el.media.style.height = '';
    var w = el.media.clientWidth, h = el.media.clientHeight;
    if (!w || !h) return;
    var tw = w, th = w / (nw / nh);
    if (th > h) { th = h; tw = h * (nw / nh); }
    el.shot.style.width = Math.round(tw) + 'px';
    el.shot.style.height = Math.round(th) + 'px';
  }

  function paint() {
    var n = view.fotos.length;
    var f = view.fotos[view.i];
    el.photo.src = f.u;
    el.photo.style.objectPosition = f.p;
    // El zoom de la dueña (imgZ) es un recorte para la miniatura de la
    // tarjeta. Acá la foto es grande: si se copia, se sale del cuadro y
    // se encima con la ficha. La ficha va sin zoom.
    el.photo.style.transform = '';
    el.index.textContent = view.i + 1;
    el.total.textContent = n;
    el.prev.disabled = n < 2;
    el.next.disabled = n < 2;
    [].forEach.call(el.thumbs.children, function (b, i) {
      b.classList.toggle('is-active', i === view.i);
    });
    fitShot();
  }

  el.photo.addEventListener('load', fitShot);
  window.addEventListener('resize', function () {
    if (!modal.hidden) fitShot();
  });
  
  function buildThumbs() {
    el.thumbs.innerHTML = '';
    if (view.fotos.length < 2) return;
    view.fotos.forEach(function (f, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Foto ' + (i + 1));
      b.innerHTML = '<img src="' + xt(f.u) + '" alt="" style="object-position:' + xt(f.p) + '">';      b.addEventListener('click', function () { view.i = i; paint(); });
      el.thumbs.appendChild(b);
    });
  }

  function openModal(card) {
    var d = {};
    try { d = JSON.parse(card.dataset.p || '{}'); } catch (e) {}
    view.fotos = d.fotos && d.fotos.length ? d.fotos : [{ u: 'oso.png', p: '50% 50%', z: '' }];
    view.i = 0;

    el.name.textContent = d.nombre || '';
    el.price.textContent = d.precio || '';
    el.desc.textContent = d.desc || '';
    el.crumbs.textContent = (d.categoria || 'Angell Boutique') + ' / Angell Boutique';
    el.stockText.textContent = d.agotado ? 'Agotado por ahora' : 'Disponible para consultar';
    el.stock.classList.toggle('is-out', !!d.agotado);

    if (d.agotado) {
      el.cta.setAttribute('aria-disabled', 'true');
      el.cta.removeAttribute('href');
    } else {
      el.cta.removeAttribute('aria-disabled');
      el.cta.setAttribute('href', 'https://wa.me/' + WA_NUM + '?text=' +
        encodeURIComponent('Hola! Quiero ' + (d.nombre || 'este producto')));
    }

    buildThumbs();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    paint();
    el.close.focus();
    // por si la foto venía cacheada y no dispara load
    setTimeout(fitShot, 120);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-modal-close]')) { closeModal(); return; }
    if (e.target.closest('[data-modal-prev]')) { view.i = (view.i - 1 + view.fotos.length) % view.fotos.length; paint(); return; }
    if (e.target.closest('[data-modal-next]')) { view.i = (view.i + 1) % view.fotos.length; paint(); }
  });

  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'ArrowLeft' && view.fotos.length > 1) { view.i = (view.i - 1 + view.fotos.length) % view.fotos.length; paint(); }
    if (e.key === 'ArrowRight' && view.fotos.length > 1) { view.i = (view.i + 1) % view.fotos.length; paint(); }
    if (e.key === 'Tab') {
      // el foco no se escapa del modal mientras está abierto
      var f = modal.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ── 3. "¿Charlamos un ratito?" letra por letra ── */
  function typeContact() {
    var title = document.getElementById('contactTitle');
    if (!title) return;
    var a = title.querySelector('.ct-a');
    var b = title.querySelector('.ct-b');
    var c = title.querySelector('.ct-c');
    if (!a || !b || !c) return;
    if (reduced()) return; // sin movimiento reducido, el texto ya está entero

    var full = a.textContent + b.textContent + c.textContent;
    var na = a.textContent.length;
    var nb = na + b.textContent.length;
    a.textContent = ''; b.textContent = ''; c.textContent = '';

    var i = 0;
    (function step() {
      if (i >= full.length) return;
      var ch = full.charAt(i);
      if (i < na) a.textContent += ch;
      else if (i < nb) b.textContent += ch;
      else c.textContent += ch;
      i++;
      setTimeout(step, ch === ' ' ? 95 : 54);
    })();
  }

  function boot() {
    hydrateCards();
    var sec = document.getElementById('contacto');
    if (sec && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          typeContact();
          io.disconnect();
        });
      }, { threshold: 0.4 });
      io.observe(sec);
    } else {
      typeContact();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Firestore repuebla las rejillas después: hay que hidratar de nuevo.
  new MutationObserver(function () { hydrateCards(); })
    .observe(document.body, { childList: true, subtree: true });
})();
