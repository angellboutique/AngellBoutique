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
      function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
      function normPhotos(p){
        if (p.imagenes && p.imagenes.length) return p.imagenes.map(function(f){
          if (typeof f === "string") return { url: f, x: 50, y: 50, z: 100 };
          return { url: f.url || f.imagen || "oso.png", x: f.x != null ? f.x : (f.imgX != null ? f.imgX : 50), y: f.y != null ? f.y : (f.imgY != null ? f.imgY : 50), z: f.z != null ? f.z : (f.imgZ != null ? f.imgZ : 100) };
        });
        return [{ url: p.imagen || "oso.png", x: p.imgX != null ? p.imgX : 50, y: p.imgY != null ? p.imgY : 50, z: p.imgZ != null ? p.imgZ : 100 }];
      }
      function imgStyle(ph){
        var pos = ph.x + "% " + ph.y + "%";
        var z = ph.z / 100;
        return z > 1.01
          ? ("object-position:" + esc(pos) + ";transform:scale(" + z + ");transform-origin:" + esc(pos))
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
          return '<div class="pcar-slide"><img src="' + esc(ph.url) + '" alt="' + esc(p.nombre || "Producto") + '" loading="lazy" style="' + imgStyle(ph) + '" onerror="this.src=\'oso.png\'"></div>';
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
        var gal = photos.map(function(ph, i){
          return '<img src="' + esc(ph.url) + '" alt="' + esc((p.nombre || "Producto") + " - foto " + (i + 1)) + '" style="' + imgStyle(ph) + '" onerror="this.src=\'oso.png\'">';
        }).join("");
        var dots = photos.length > 1
          ? '<div class="bag-dots">' + photos.map(function(_, i){
              return '<button class="bag-dot' + (i === 0 ? " active" : "") + '" data-index="' + i + '" aria-label="Foto ' + (i + 1) + '"></button>';
            }).join("") + '</div>'
          : '';
        return '<li class="bag-card">' +
          '<div class="bag-gallery-row" style="grid-template-columns:' + cols + '">' +
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
        return '<li class="product-card' + (agot ? ' is-agotado' : '') + '">' +
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