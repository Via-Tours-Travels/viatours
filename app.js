(function(){
'use strict';

/* ---------------------------------------------------------------
   Utilities
   --------------------------------------------------------------- */
var $  = function(sel, ctx){ return (ctx||document).querySelector(sel); };
var $$ = function(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); };
var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var hasGsap = typeof window.gsap !== 'undefined';
if (hasGsap && window.ScrollTrigger) { gsap.registerPlugin(ScrollTrigger); }

function fmtMoney(n){ return '$' + Math.round(n).toLocaleString('en-US'); }

function parseDate(input){
  if (!input) return null;
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input !== 'string') return null;
  // ISO YYYY-MM-DD
  var iso = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso){
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }
  // Try Date constructor, then with T suffix
  var d = new Date(input);
  if (!isNaN(d.getTime())) return d;
  d = new Date(input + 'T00:00:00');
  if (!isNaN(d.getTime())) return d;
  return null;
}

function addDays(dateInput, days){
  var d = parseDate(dateInput) || new Date();
  d.setDate(d.getDate() + Number(days));
  return d;
}

function toISODate(d){
  var dt = parseDate(d) || new Date();
  var y = dt.getFullYear();
  var m = String(dt.getMonth()+1).padStart(2,'0');
  var day = String(dt.getDate()).padStart(2,'0');
  return y + '-' + m + '-' + day;
}

function prettyDate(dateStr){
  var dt = parseDate(dateStr);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

/* ---------------------------------------------------------------
   Preloader
   --------------------------------------------------------------- */
function initPreloader(){
  var el = $('#preloader');
  var bar = $('#preloaderBar');
  var status = $('#preloaderStatus');
  var lines = ['Calibrating', 'Checking systems', 'Plotting route', 'Ready'];
  var C = 2 * Math.PI * 42;

  function finish(){
    if (hasGsap && !reduceMotion){
      gsap.to(el, { opacity:0, duration:.4, ease:'power2.out', onComplete:function(){
        el.classList.add('is-done');
        runHeroEntrance();
      }});
    } else { 
      el.classList.add('is-done');
      runHeroEntrance();
    }
  }

  if (reduceMotion){
    finish();
    return;
  }

  if (hasGsap && bar && status){
    gsap.set(bar, { strokeDasharray:C, strokeDashoffset:C });
    var tl = gsap.timeline({ onComplete: finish });
    tl.to(bar, { strokeDashoffset:0, duration:1.35, ease:'power2.inOut' }, 0);
    lines.forEach(function(text, idx){
      tl.call(function(){ status.innerHTML = text + '<span>…</span>'; }, null, idx * 0.32);
    });
  } else {
    setTimeout(finish, 900);
  }

  setTimeout(function(){ if(el && !el.classList.contains('is-done')) finish(); }, 3500);
}

/* ---------------------------------------------------------------
   Hero entrance
   --------------------------------------------------------------- */
function splitHeroTitle(){
  $$('#heroTitle .line span').forEach(function(span){
    var words = span.textContent.split(' ');
    span.innerHTML = words.map(function(w){ return '<span class="word" style="display:inline-block;">'+w+'&nbsp;</span>'; }).join('');
  });
}

function runHeroEntrance(){
  if (!hasGsap || reduceMotion){
    return;
  }
  var words = $$('#heroTitle .word');
  var tl = gsap.timeline({ defaults:{ ease:'power4.out' } });
  tl.from(words, { yPercent:120, opacity:0, duration:1, stagger:.06 })
    .from('.hero .eyebrow', { opacity:0, y:14, duration:.6 }, 0)
    .from('.hero [data-reveal]', { opacity:0, y:26, duration:.8, stagger:.08 }, '-=.7')
    .from('.hud--hero', { opacity:0, y:30, scale:.96, duration:1 }, '-=.9')
    .from('.hud--hero .hud__stat', { opacity:0, y:10, stagger:.08, duration:.5 }, '-=.4')
    .from('.booking', { opacity:0, y:40, duration:.9 }, '-=.6')
    .from('.nav', { y:-90, duration:.8 }, 0);
}

/* ---------------------------------------------------------------
   Route line draw
   --------------------------------------------------------------- */
function initRouteDraw(){
  var path = $('#routePath');
  var dot = $('#routeDot');
  if (!path) return;
  var len = 400;
  try { len = path.getTotalLength(); } catch(e) {}
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;

  if (!hasGsap){
    path.style.strokeDashoffset = 0;
    return;
  }
  if (reduceMotion){
    path.style.strokeDashoffset = 0;
    if(dot){
      try {
        var end = path.getPointAtLength(len);
        dot.setAttribute('cx', end.x);
        dot.setAttribute('cy', end.y);
      } catch(e) {}
    }
    return;
  }
  var proxy = { t:0 };
  gsap.to(proxy, {
    t:1, duration:2.4, ease:'power2.inOut', delay:1.1,
    onUpdate:function(){
      path.style.strokeDashoffset = String(len * (1 - proxy.t));
      if (dot){
        try {
          var p = path.getPointAtLength(proxy.t * len);
          dot.setAttribute('cx', p.x);
          dot.setAttribute('cy', p.y);
        } catch(e) {}
      }
    },
    repeat:-1, repeatDelay:1.6, yoyo:false
  });
}

/* ---------------------------------------------------------------
   Nav
   --------------------------------------------------------------- */
function initNav(){
  var nav = $('#siteNav');
  if (!nav) return;
  function onScroll(){
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });
}

function initMobileMenu(){
  var burger = $('#navBurger');
  var menu = $('#mobileMenu');
  if (!burger || !menu) return;
  function close(){
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded','false');
    menu.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  function toggle(){
    var open = menu.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', toggle);
  $$('#mobileMenu a').forEach(function(a){ a.addEventListener('click', close); });
}

function initScrollProgress(){
  var bar = $('#scrollProgress');
  if (!bar) return;
  function update(){
    var h = document.documentElement;
    var scrolled = h.scrollTop;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + '%';
  }
  update();
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
}

/* ---------------------------------------------------------------
   Scroll reveals
   --------------------------------------------------------------- */
function initScrollReveals(){
  if (!hasGsap || !window.ScrollTrigger || reduceMotion) return;
  $$('[data-reveal]').forEach(function(el){
    if (el.closest('.hero')) return;
    gsap.from(el, {
      opacity:0, y:34, duration:.8, ease:'power3.out',
      scrollTrigger:{ trigger:el, start:'top 86%', once:true }
    });
  });

  gsap.utils.toArray('.feature-card').forEach(function(card, i){
    gsap.from(card, { opacity:0, y:24, duration:.6, delay:(i%3)*0.06, ease:'power3.out',
      scrollTrigger:{ trigger:card, start:'top 90%', once:true } });
  });
  gsap.utils.toArray('.how__step').forEach(function(card, i){
    gsap.from(card, { opacity:0, y:24, duration:.6, delay:(i%4)*0.08, ease:'power3.out',
      scrollTrigger:{ trigger:card, start:'top 90%', once:true } });
  });
}

/* ---------------------------------------------------------------
   Magnetic CTA pull
   --------------------------------------------------------------- */
function initMagnetic(){
  var btn = $('#heroCta');
  if (!btn || reduceMotion || window.matchMedia('(pointer:coarse)').matches) return;
  btn.addEventListener('mousemove', function(e){
    var r = btn.getBoundingClientRect();
    var x = (e.clientX - r.left - r.width/2) * .35;
    var y = (e.clientY - r.top - r.height/2) * .6;
    if (hasGsap){ gsap.to(btn, { x:x, y:y, duration:.4, ease:'power2.out' }); }
  });
  btn.addEventListener('mouseleave', function(){
    if (hasGsap){ gsap.to(btn, { x:0, y:0, duration:.5, ease:'elastic.out(1,.4)' }); }
  });
}

/* ---------------------------------------------------------------
   Booking Bar
   --------------------------------------------------------------- */
function initBookingSearch(){
  var form = $('#bookingForm');
  if (!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var pickup = ($('#pickupSearchInput') && $('#pickupSearchInput').value && $('#pickupSearchInput').value.trim()) || '';
    var drop = ($('#dropSearchInput') && $('#dropSearchInput').value && $('#dropSearchInput').value.trim()) || '';
    var dateVal = ($('#pickupDate') && $('#pickupDate').value) || '';
    var vehicle = ($('#vehicleType') && $('#vehicleType').value) || '';

    if (!pickup || !drop || !dateVal || !vehicle){
      showToast('Please enter pickup, drop, date and vehicle type before booking');
      return;
    }

    var parsedDate = parseDate(dateVal);
    if (!parsedDate){
      showToast('Please enter a valid pickup date');
      return;
    }
    var todayISO = toISODate(new Date());
    var maxISO = toISODate(addDays(new Date(), 365 * 3));
    if (dateVal < todayISO){
      showToast('Pickup date cannot be in the past');
      return;
    }
    if (dateVal > maxISO){
      showToast('Pickup date is too far in the future');
      return;
    }

    var ref = 'CMG-' + Math.random().toString(36).slice(2,7).toUpperCase();

    var message = 'Hi Cab MileGi, I would like to book a ride.\n' +
                  'Reference: ' + ref + '\n' +
                  'Pickup: ' + pickup + '\n' +
                  'Drop: ' + drop + '\n' +
                  'Date: ' + dateVal + '\n' +
                  'Vehicle: ' + vehicle + '\n' +
                  'Please confirm availability and next steps.';

    var url = 'https://wa.me/?text=' + encodeURIComponent(message);
    window.open(url, '_blank');
    showToast('Opening WhatsApp — sending your booking request');
  });
}

/* ---------------------------------------------------------------
   Date logic — sets native min/max constraints without intrusive popups
   --------------------------------------------------------------- */
function initDateLogic(){
  var todayISO = toISODate(new Date());
  var maxISO = toISODate(addDays(new Date(), 365 * 3));
  var pickup = $('#pickupDate');
  if (pickup){
    pickup.min = todayISO;
    pickup.max = maxISO;
    if (!pickup.value) {
      pickup.value = todayISO;
    }
  }
}

/* ---------------------------------------------------------------
   Odometer digit-roll counters
   --------------------------------------------------------------- */
function buildOdometer(container, value){
  container.innerHTML = '';
  var str = String(value);
  var nodes = [];
  for (var idx=0; idx<str.length; idx++){
    var ch = str[idx];
    if (/[0-9]/.test(ch)){
      var wrap = document.createElement('span');
      wrap.className = 'odo-digit';
      var strip = document.createElement('span');
      strip.className = 'odo-strip';
      for (var d=0; d<=9; d++){
        var num = document.createElement('span');
        num.className = 'odo-num';
        num.textContent = String(d);
        strip.appendChild(num);
      }
      wrap.appendChild(strip);
      container.appendChild(wrap);
      nodes.push({ strip:strip, wrap:wrap, target:parseInt(ch,10) });
    } else {
      var sep = document.createElement('span');
      sep.className = 'odo-sep';
      sep.textContent = ch;
      container.appendChild(sep);
    }
  }
  return nodes;
}

function animateOdometer(el){
  var target = parseInt(el.getAttribute('data-count'), 10) || 0;
  var suffix = el.getAttribute('data-suffix') || '';
  var display = target.toLocaleString('en-US');
  var nodes = buildOdometer(el, display);

  var suffixEl = document.createElement('span');
  suffixEl.className = 'odo-suffix';
  suffixEl.textContent = suffix;
  el.appendChild(suffixEl);

  function getDigitHeight(n){
    return n.wrap.clientHeight || n.wrap.offsetHeight || (n.strip.children[0] && n.strip.children[0].offsetHeight) || 40;
  }

  if (!hasGsap || reduceMotion){
    nodes.forEach(function(n){
      var h = getDigitHeight(n);
      n.strip.style.transform = 'translateY(-' + (n.target * h) + 'px)';
    });
    return;
  }

  requestAnimationFrame(function(){
    nodes.forEach(function(n, i){
      var h = getDigitHeight(n);
      gsap.to(n.strip, { y: -(n.target * h), duration:1.1, delay: i*0.07, ease:'power3.inOut' });
    });
  });
}

function initStats(){
  var els = $$('.stat__value');
  if (!els.length) return;
  if (!hasGsap || !window.ScrollTrigger){
    els.forEach(animateOdometer);
    return;
  }
  ScrollTrigger.create({
    trigger:'#stats', start:'top 75%', once:true,
    onEnter:function(){ els.forEach(animateOdometer); }
  });
}

/* ---------------------------------------------------------------
   Testimonial carousel
   --------------------------------------------------------------- */
function initTestimonials(){
  var track = $('#testiTrack');
  if (!track) return;
  var cards = $$('.testi__card', track);
  var dotsWrap = $('#testiDots');
  var prev = $('#testiPrev');
  var next = $('#testiNext');
  if (!cards.length) return;
  var index = 0;
  var timer;

  if (dotsWrap){
    dotsWrap.innerHTML = '';
    cards.forEach(function(_, i){
      var dot = document.createElement('button');
      dot.className = 'testi__dot' + (i===0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Go to review ' + (i+1));
      dot.addEventListener('click', function(){ goTo(i); });
      dotsWrap.appendChild(dot);
    });
  }
  var dots = dotsWrap ? $$('.testi__dot', dotsWrap) : [];

  function goTo(i){
    index = (i + cards.length) % cards.length;
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    dots.forEach(function(d, di){ d.classList.toggle('is-active', di === index); });
  }
  function restart(){
    clearInterval(timer);
    timer = setInterval(function(){ goTo(index+1); }, 6000);
  }

  prev && prev.addEventListener('click', function(){ goTo(index-1); restart(); });
  next && next.addEventListener('click', function(){ goTo(index+1); restart(); });

  var startX = null;
  track.addEventListener('pointerdown', function(e){ startX = e.clientX; });
  track.addEventListener('pointerup', function(e){
    if (startX === null) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 50){ goTo(index + (dx < 0 ? 1 : -1)); restart(); }
    startX = null;
  });
  track.addEventListener('pointercancel', function(){ startX = null; });
  track.addEventListener('pointerleave', function(){ startX = null; });

  var viewport = track.closest('.testi__viewport');
  var container = viewport ? (viewport.parentElement || viewport) : track;
  container.addEventListener('mouseenter', function(){ clearInterval(timer); });
  container.addEventListener('mouseleave', restart);

  if (!reduceMotion) restart();
}

/* ---------------------------------------------------------------
   FAQ accordion
   --------------------------------------------------------------- */
function initFAQ(){
  var items = $$('.faq__item');
  function closeItem(it){
    it.classList.remove('is-open');
    var a = $('.faq__a', it);
    if (a) a.style.maxHeight = '0px';
  }
  function openItem(it){
    it.classList.add('is-open');
    var a = $('.faq__a', it);
    if (a) a.style.maxHeight = a.scrollHeight + 'px';
  }
  items.forEach(function(item){
    item.classList.contains('is-open') ? openItem(item) : closeItem(item);
    var q = $('.faq__q', item);
    if (q){
      q.addEventListener('click', function(){
        var willOpen = !item.classList.contains('is-open');
        items.forEach(closeItem);
        if (willOpen) openItem(item);
      });
    }
  });
  window.addEventListener('resize', function(){
    items.forEach(function(it){
      if (it.classList.contains('is-open')) openItem(it);
    });
  });
}

/* ---------------------------------------------------------------
   Toasts
   --------------------------------------------------------------- */
function showToast(message){
  var stack = $('#toastStack');
  if (!stack) return;
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>'+message+'</span>';
  stack.appendChild(toast);
  requestAnimationFrame(function(){ toast.classList.add('is-visible'); });
  setTimeout(function(){
    toast.classList.remove('is-visible');
    setTimeout(function(){ toast.remove(); }, 500);
  }, 3600);
}

/* ---------------------------------------------------------------
   Booking modal — Streamlined, Frictionless & Focused
   --------------------------------------------------------------- */
function initBookingModal(){
  var modal = $('#bookingModal');
  var backdrop = $('#modalBackdrop');
  var closeBtn = $('#modalClose');
  var bookingView = $('#modalBookingView');
  var ticketView = $('#modalTicketView');
  var form = $('#modalForm');
  var lastFocused = null;

  var focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var trapFocusListener = null;

  function openModal(){
    var heroPickup = $('#pickupDate') && $('#pickupDate').value;
    var heroPickupLoc = $('#pickupSearchInput') && $('#pickupSearchInput').value && $('#pickupSearchInput').value.trim();
    var heroDrop = $('#dropSearchInput') && $('#dropSearchInput').value && $('#dropSearchInput').value.trim();
    var todayISO = toISODate(new Date());
    var maxISO = toISODate(addDays(new Date(), 365 * 3));
    
    var mPickupEl = $('#mPickup');
    var mPickupLocEl = $('#mPickupLoc');
    var mDropEl = $('#mDrop');

    if (mPickupEl){
      var initial = heroPickup && parseDate(heroPickup) ? heroPickup : todayISO;
      mPickupEl.min = todayISO;
      mPickupEl.max = maxISO;
      mPickupEl.value = initial;
    }

    if (mPickupLocEl && heroPickupLoc && !mPickupLocEl.value){
      mPickupLocEl.value = heroPickupLoc;
    }

    if (mDropEl && heroDrop && !mDropEl.value){
      mDropEl.value = heroDrop;
    }

    if (bookingView) bookingView.hidden = false;
    if (ticketView) ticketView.hidden = true;

    lastFocused = document.activeElement;
    if (modal) modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    setTimeout(function(){ var name = $('#mName'); if (name) name.focus(); }, 350);

    trapFocusListener = function(e){
      if (e.key !== 'Tab' || !modal || !modal.classList.contains('is-open')) return;
      var nodes = Array.prototype.slice.call(modal.querySelectorAll(focusableSelector));
      if (!nodes.length) return;
      var first = nodes[0], last = nodes[nodes.length-1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trapFocusListener);
  }

  function closeModal(){
    if (modal) modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
    if (trapFocusListener) { document.removeEventListener('keydown', trapFocusListener); trapFocusListener = null; }
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) closeModal();
  });

  if (form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var todayISO = toISODate(new Date());
      var maxISO = toISODate(addDays(new Date(), 365 * 3));
      var pickupDateVal = ($('#mPickup') && $('#mPickup').value) || todayISO;
      
      if (pickupDateVal < todayISO){
        showToast('Pickup date cannot be in the past');
        return;
      }
      if (pickupDateVal > maxISO){
        showToast('Pickup date is too far in the future');
        return;
      }

      var ref = 'CMG-' + Math.random().toString(36).slice(2,7).toUpperCase();
      var nameVal = ($('#mName') && $('#mName').value) || 'Valued Guest';
      var pickupLocVal = ($('#mPickupLoc') && $('#mPickupLoc').value) || 'Specified Location';
      var dropVal = ($('#mDrop') && $('#mDrop').value) || 'Specified Location';

      var tRef = $('#tRef'); if (tRef) tRef.textContent = ref;
      var tName = $('#tName'); if (tName) tName.textContent = nameVal;
      var tPickupLoc = $('#tPickupLoc'); if (tPickupLoc) tPickupLoc.textContent = pickupLocVal;
      var tDrop = $('#tDrop'); if (tDrop) tDrop.textContent = dropVal;
      var tPickup = $('#tPickup'); if (tPickup) tPickup.textContent = prettyDate(pickupDateVal);
      
      if (bookingView) bookingView.hidden = true;
      if (ticketView) ticketView.hidden = false;

      if (hasGsap && !reduceMotion){
        gsap.from('.ticket__stub', { opacity:0, y:18, duration:.6, ease:'power3.out' });
        gsap.from('.ticket__check', { scale:0, duration:.5, ease:'back.out(2.2)', delay:.1 });
      }
      showToast('Booking confirmed — ticket generated');

      window._lastBooking = {
        title: 'Cab MileGi Booking Confirmation',
        description: 'Booking Reference ' + ref + ' for ' + nameVal + '.\nPickup: ' + pickupLocVal + ' on ' + prettyDate(pickupDateVal) + '.\nDrop: ' + dropVal + '.\nPlease show this ticket at pickup.',
        start: pickupDateVal,
        end: toISODate(addDays(pickupDateVal, 1))
      };
    });
  }

  var doneBtn = $('#modalDoneBtn'); if (doneBtn) doneBtn.addEventListener('click', closeModal);
  var addCal = $('#addCalendarBtn'); if (addCal) addCal.addEventListener('click', function(){ if (window._lastBooking) downloadICS(window._lastBooking); });

  var navBook = $('#navBookBtn'); if (navBook) navBook.addEventListener('click', function(e){ e.preventDefault(); openModal(); });
  var heroCta = $('#heroCta'); if (heroCta) heroCta.addEventListener('click', function(e){ e.preventDefault(); openModal(); });
}

/* ---------------------------------------------------------------
   .ics calendar file generator
   --------------------------------------------------------------- */
function downloadICS(opts){
  try{
    var fmt = function(dStr){
      var d = parseDate(dStr) || new Date();
      d.setHours(10, 0, 0, 0);
      return d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
    };
    var esc = function(str){
      return String(str).replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n');
    };
    var lines = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Cab MileGi Rentals//Booking//EN','BEGIN:VEVENT',
      'UID:' + Date.now() + '@cabmilegi.com',
      'DTSTAMP:' + fmt(opts.start),
      'DTSTART:' + fmt(opts.start),
      'DTEND:' + fmt(opts.end),
      'SUMMARY:' + esc(opts.title),
      'DESCRIPTION:' + esc(opts.description),
      'END:VEVENT','END:VCALENDAR'
    ];
    var blob = new Blob([lines.join('\r\n')], { type:'text/calendar' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'cabmilegi-booking.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    showToast('Calendar file downloaded');
  } catch(err){
    showToast('Could not create calendar file');
  }
}

/* ---------------------------------------------------------------
   Back to top
   --------------------------------------------------------------- */
function initBackToTop(){
  var btn = $('#backToTop');
  if (!btn) return;
  function onScroll(){
    btn.classList.toggle('is-visible', window.scrollY > 640);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });
  btn.addEventListener('click', function(){
    window.scrollTo({ top:0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

/* ---------------------------------------------------------------
   Init
   --------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function(){
  var yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  function safe(name, fn){
    try { fn(); } catch (err) { if (window.console) console.error('CabMileGi init failed:', name, err); }
  }

  safe('splitHeroTitle', splitHeroTitle);
  safe('initPreloader', initPreloader);
  safe('initNav', initNav);
  safe('initMobileMenu', initMobileMenu);
  safe('initScrollProgress', initScrollProgress);
  safe('initRouteDraw', initRouteDraw);
  safe('initScrollReveals', initScrollReveals);
  safe('initMagnetic', initMagnetic);
  safe('initBookingSearch', initBookingSearch);
  safe('initDateLogic', initDateLogic);
  safe('initStats', initStats);
  safe('initTestimonials', initTestimonials);
  safe('initFAQ', initFAQ);
  safe('initBookingModal', initBookingModal);
  safe('initBackToTop', initBackToTop);

  window.addEventListener('load', function(){
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
});
})();
