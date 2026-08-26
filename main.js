// Main enhancements: accessibility and UX improvements
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    // Ensure all decorative SVGs inside .nav__logo are hidden from assistive tech
    var logos = document.querySelectorAll('.nav__logo svg');
    logos.forEach(function(svg){ svg.setAttribute('aria-hidden','true'); svg.setAttribute('focusable','false'); });

    // Add accessible labels to book buttons if they lack one
    document.querySelectorAll('.js-book').forEach(function(btn){
      if (!btn.getAttribute('aria-label')){
        var carName = btn.closest('.car-card') && btn.closest('.car-card').querySelector('.car-card__name');
        var label = 'Book this car';
        if (carName) label = 'Book ' + carName.textContent.trim();
        btn.setAttribute('aria-label', label);
      }
    });

    // Ensure mobile menu hamburger has aria-controls pointing to the mobile menu
    var burger = document.getElementById('navBurger');
    var menu = document.getElementById('mobileMenu');
    if (burger && menu && !burger.getAttribute('aria-controls')){
      burger.setAttribute('aria-controls', menu.id);
    }

    // Keyboard navigation support for review carousel
    var track = document.getElementById('testiTrack');
    if (track){
      track.setAttribute('tabindex', '0');
      track.setAttribute('aria-label', 'Customer reviews carousel. Use left and right arrow keys to navigate.');
      track.addEventListener('keydown', function(e){
        if (e.key === 'ArrowRight') { var next = document.getElementById('testiNext'); if (next) next.click(); }
        if (e.key === 'ArrowLeft') { var prev = document.getElementById('testiPrev'); if (prev) prev.click(); }
      });
    }
  });

  // Mappls search integration (MapMyIndia AutoSuggest)
  var MAPPLS_KEY = 'xwteaabvostthyqagzyenusmtstqufjtzzzv';

  function debounce(fn, wait){
    var t;
    return function(){
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(ctx, args); }, wait);
    };
  }

  function getCoords(item){
    if (!item) return null;
    if (item.latitude && item.longitude) return { lat: item.latitude, lon: item.longitude };
    if (item.lat && item.lon) return { lat: item.lat, lon: item.lon };
    if (item.lat && item.lng) return { lat: item.lat, lon: item.lng };
    if (item.y && item.x) return { lat: item.y, lon: item.x };
    if (item.geometry && item.geometry.coordinates && item.geometry.coordinates.length >= 2){
      return { lat: item.geometry.coordinates[1], lon: item.geometry.coordinates[0] };
    }
    if (item.center && item.center.length >= 2){ return { lat: item.center[1], lon: item.center[0] }; }
    return null;
  }

  function initPickupSearch(){
    var input = document.getElementById('pickupSearchInput');
    var resultsEl = document.getElementById('pickupResults');
    if (!input || !resultsEl) return;
    var container = input.closest('.pickup-search') || input.parentElement;

    function clearResults(){
      resultsEl.innerHTML = '';
      resultsEl.hidden = true;
    }

    function renderSuggestions(list){
      resultsEl.innerHTML = '';
      if (!list || !list.length){
        var none = document.createElement('div');
        none.className = 'pickup-result pickup-none';
        none.textContent = 'No results found';
        resultsEl.appendChild(none);
        resultsEl.hidden = false;
        return;
      }
      list.forEach(function(item){
        var name = item.placeName || item.name || item.title || item.displayName || item.display_name || item.place || (item.address && item.address.label) || JSON.stringify(item);
        var coords = getCoords(item) || { lat:'', lon:'' };
        var row = document.createElement('div');
        row.className = 'pickup-result';
        row.setAttribute('role','option');
        row.setAttribute('tabindex','0');
        row.dataset.lat = coords.lat;
        row.dataset.lon = coords.lon;
        row.textContent = name;
        row.addEventListener('click', function(){
          input.value = name;
          clearResults();
        });
        row.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); } });
        resultsEl.appendChild(row);
      });
      resultsEl.hidden = false;
    }

    var fetchPlaces = debounce(function(){
      var q = input.value && input.value.trim();
      if (!q || q.length < 3){ clearResults(); return; }
      var url = 'https://apis.mappls.com/api/places/search/json?query=' + encodeURIComponent(q) + '&token=' + encodeURIComponent(MAPPLS_KEY);
      fetch(url).then(function(resp){ return resp.json(); }).then(function(data){
        var list = data && (data.results || data.suggested || data.suggestions || data.hits || data.features || []);
        if (Array.isArray(list) && !list.length && Array.isArray(data.features)){
          list = data.features.map(function(f){ return f.properties || f; });
        }
        renderSuggestions(list);
      }).catch(function(err){
        console.error('Mappls search error', err);
        clearResults();
      });
    }, 400);

    input.addEventListener('input', fetchPlaces);

    // hide on outside click (close if click is not inside this specific container)
    document.addEventListener('click', function(e){
      if (!container.contains(e.target)){ clearResults(); }
    });

    // hide on escape
    input.addEventListener('keydown', function(e){ if (e.key === 'Escape') clearResults(); });
  }

  function initDropSearch(){
    var input = document.getElementById('dropSearchInput');
    var resultsEl = document.getElementById('dropResults');
    if (!input || !resultsEl) return;
    var container = input.closest('.pickup-search') || input.parentElement;

    function clearResults(){
      resultsEl.innerHTML = '';
      resultsEl.hidden = true;
    }

    function renderSuggestions(list){
      resultsEl.innerHTML = '';
      if (!list || !list.length){
        var none = document.createElement('div');
        none.className = 'pickup-result pickup-none';
        none.textContent = 'No results found';
        resultsEl.appendChild(none);
        resultsEl.hidden = false;
        return;
      }
      list.forEach(function(item){
        var name = item.placeName || item.name || item.title || item.displayName || item.display_name || item.place || (item.address && item.address.label) || JSON.stringify(item);
        var coords = getCoords(item) || { lat:'', lon:'' };
        var row = document.createElement('div');
        row.className = 'pickup-result';
        row.setAttribute('role','option');
        row.setAttribute('tabindex','0');
        row.dataset.lat = coords.lat;
        row.dataset.lon = coords.lon;
        row.textContent = name;
        row.addEventListener('click', function(){
          input.value = name;
          clearResults();
        });
        row.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); } });
        resultsEl.appendChild(row);
      });
      resultsEl.hidden = false;
    }

    var fetchPlaces = debounce(function(){
      var q = input.value && input.value.trim();
      if (!q || q.length < 3){ clearResults(); return; }
      var url = 'https://apis.mappls.com/api/places/search/json?query=' + encodeURIComponent(q) + '&token=' + encodeURIComponent(MAPPLS_KEY);
      fetch(url).then(function(resp){ return resp.json(); }).then(function(data){
        var list = data && (data.results || data.suggested || data.suggestions || data.hits || data.features || []);
        if (Array.isArray(list) && !list.length && Array.isArray(data.features)){
          list = data.features.map(function(f){ return f.properties || f; });
        }
        renderSuggestions(list);
      }).catch(function(err){
        console.error('Mappls drop search error', err);
        clearResults();
      });
    }, 400);

    input.addEventListener('input', fetchPlaces);

    // hide on outside click (close if click is not inside this specific container)
    document.addEventListener('click', function(e){
      if (!container.contains(e.target)){ clearResults(); }
    });

    // hide on escape
    input.addEventListener('keydown', function(e){ if (e.key === 'Escape') clearResults(); });
  }

  document.addEventListener('DOMContentLoaded', function(){
    initPickupSearch();
    initDropSearch();
  });
})();