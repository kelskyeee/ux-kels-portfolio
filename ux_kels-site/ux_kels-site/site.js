(function () {
  // Copy email, falling back to selecting the text.
  var copy = document.getElementById('copy-email'), email = document.getElementById('email');
  if (copy && email) copy.addEventListener('click', function () {
    var done = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy email'; }, 1600); };
    var select = function () { var r = document.createRange(); r.selectNodeContents(email); var s = getSelection(); s.removeAllRanges(); s.addRange(r); copy.textContent = 'Selected, press Ctrl/⌘ C'; };
    try { navigator.clipboard.writeText(email.textContent.trim()).then(done, select); } catch (e) { select(); }
  });

  // Case study: highlight the chapter in view.
  var links = document.querySelectorAll('.toc a');
  if (links.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.chapter[id]').forEach(function (c) { io.observe(c); });
  }

  // Burger menu on phones: toggles the link sheet, closes on a pick, Escape or a tap outside.
  var nav = document.querySelector('.nav'), burger = document.querySelector('[data-burger]');
  if (nav && burger) {
    var setOpen = function (open) { nav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open); };
    burger.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.querySelectorAll('.nav__links a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); burger.focus(); } });
    addEventListener('click', function (e) { if (!nav.contains(e.target)) setOpen(false); });
    matchMedia('(min-width: 641px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });
  }

  // Melon head-bobs on a tap too, since phones have no hover.
  var melon = document.querySelector('.melon__toon');
  if (melon) {
    var bob = function () { melon.classList.remove('is-bobbing'); void melon.offsetWidth; melon.classList.add('is-bobbing'); };
    melon.addEventListener('click', bob);
    melon.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bob(); } });
    melon.addEventListener('animationend', function () { melon.classList.remove('is-bobbing'); });
  }

  // Header links: underline the section you're in. The last section whose top has passed mid-screen wins.
  var navLinks = [].slice.call(document.querySelectorAll('.nav__links a[href^="#"]')).map(function (a) {
    return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) };
  }).filter(function (l) { return l.el; });
  if (navLinks.length) {
    var ticking = false;
    var mark = function () {
      ticking = false;
      var line = innerHeight * .45, current = null;
      var atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      navLinks.forEach(function (l) { if (l.el.getBoundingClientRect().top <= line) current = l; });
      if (atEnd) current = navLinks.reduce(function (a, b) { return a.el.offsetTop > b.el.offsetTop ? a : b; });
      navLinks.forEach(function (l) {
        l.a.classList.toggle('is-current', l === current);
        if (l === current) l.a.setAttribute('aria-current', 'location'); else l.a.removeAttribute('aria-current');
      });
    };
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(mark); } }, { passive: true });
    addEventListener('resize', mark);
    mark();
  }
})();

// Interactive layer: cursor tag, rubber letters, stickers, pokeable cartoons, vibe picker, pill nav.
(function () {
  var motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };

  // Cursor tag that trails the pointer and changes its word over things you can use.
  // Only for a real mouse: touch and pen hide it, so it never sticks on phones or touch laptops.
  if (matchMedia('(any-pointer: fine)').matches) {
    var tag = document.createElement('div');
    tag.className = 'cursor'; tag.setAttribute('aria-hidden', 'true'); tag.textContent = 'you';
    document.body.appendChild(tag);
    var words = [['.drag-toon', 'drag me!'], ['.toon', 'poke'], ['.rh', 'boing!'], ['.case', 'peek inside'], ['.compare', 'slide'], ['.tile', 'ooh'], ['.notes a', 'read'], ['.chip', 'pick me'], ['.process__step', 'hi!'], ['.do-item__btn', 'peel back'], ['.pretty', 'hmm…'], ['.layer', 'this one'], ['.badge', 'flip me'], ['a, button', 'click']];
    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    var follow = function () {
      cx += (tx - cx) * (motion ? .22 : 1); cy += (ty - cy) * (motion ? .22 : 1);
      tag.style.transform = 'translate(' + (cx + 16) + 'px,' + (cy + 18) + 'px)';
      running = Math.abs(tx - cx) + Math.abs(ty - cy) > .5;
      if (running) requestAnimationFrame(follow);
    };
    addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') tag.classList.remove('is-on'); }, { passive: true });
    addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') { tag.classList.remove('is-on'); return; }
      tx = e.clientX; ty = e.clientY; tag.classList.add('is-on');
      var word = 'you', t = null;
      for (var i = 0; e.target.closest && i < words.length; i++) { t = e.target.closest(words[i][0]); if (t) { word = words[i][1]; break; } }
      if (tag.textContent !== word) tag.textContent = word;
      tag.classList.toggle('is-big', !!t);
      if (!running) { running = true; requestAnimationFrame(follow); }
    });
    document.addEventListener('pointerleave', function () { tag.classList.remove('is-on'); });
  }

  // Headlines: each letter boings when the pointer passes over it.
  if (motion) document.querySelectorAll('.hero .display, .cs-title .display, main h2.h1, main h2.display, .chapter__head .h2').forEach(function (headline) {
    headline.setAttribute('aria-label', headline.textContent.replace(/\s+/g, ' ').trim());
    var walker = document.createTreeWalker(headline, NodeFilter.SHOW_TEXT), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        part.split('').forEach(function (c) { var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; w.appendChild(s); });
        frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
  });
  document.addEventListener('pointerover', function (e) {
    var ch = e.target.closest && e.target.closest('.ch');
    if (!ch || ch.classList.contains('is-boing')) return;
    ch.classList.add('is-boing');
    ch.addEventListener('animationend', function () { ch.classList.remove('is-boing'); }, { once: true });
  });

  // Statement: stickers start scattered and land in their slots as you scroll through.
  var say = document.querySelector('.say');
  if (say && motion) {
    say.classList.add('is-live');
    var pin = say.querySelector('.say__pin'), text = say.querySelector('.say__text');
    var words = [];
    Array.prototype.slice.call(text.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement('span'); s.className = 'wd'; s.textContent = part; frag.appendChild(s); words.push(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    // start position (fraction of the pinned area), start rotation, start size multiplier
    var starts = [[.18, .24, -16, 2.4], [.84, .2, 14, 2.1], [.8, .8, -10, 2.6], [.16, .82, 12, 2.2]];
    var stickers = Array.prototype.map.call(say.querySelectorAll('.slot'), function (slot, i) {
      var el = document.createElement('span');
      el.className = 'sticker ' + slot.className.replace(/\bslot\b/, '').trim();
      el.setAttribute('aria-hidden', 'true');
      el.appendChild(slot.querySelector('img').cloneNode());
      pin.appendChild(el);
      return { slot: slot, el: el, from: starts[i % starts.length] };
    });
    var queued = false;
    var place = function () {
      queued = false;
      var r = say.getBoundingClientRect();
      var p = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
      var pr = pin.getBoundingClientRect();
      stickers.forEach(function (s, i) {
        var sr = s.slot.getBoundingClientRect();
        var t = ease(clamp((p - .08 - i * .1) / .45, 0, 1));
        var x0 = s.from[0] * pr.width, y0 = s.from[1] * pr.height;
        var x1 = sr.left - pr.left + sr.width / 2, y1 = sr.top - pr.top + sr.height / 2;
        var x = x0 + (x1 - x0) * t - sr.width / 2, y = y0 + (y1 - y0) * t - sr.height / 2;
        var k = s.from[3] + (1 - s.from[3]) * t;
        s.el.style.width = sr.width + 'px'; s.el.style.height = sr.height + 'px';
        s.el.style.fontSize = getComputedStyle(text).fontSize;
        s.el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + s.from[2] * (1 - t) + 'deg) scale(' + k + ')';
        s.el.classList.toggle('is-home', t >= 1);
      });
      say.classList.toggle('is-done', p > .85);
      words.forEach(function (w, i) { w.style.opacity = .2 + .8 * clamp(p * 1.5 * words.length - i, 0, 1); });
    };
    var queue = function () { if (!queued) { queued = true; requestAnimationFrame(place); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    if (document.fonts) document.fonts.ready.then(queue);
    place();
  }

  // Cards, tiles, figures and the cover lean toward the pointer; any sketch inside drifts the other way.
  if (finePointer && motion) document.querySelectorAll('.case, .cs-cover, .tile, .figs .fig__box').forEach(function (card) {
    if (card.closest('.deck')) return; // the work deck slides instead
    var lean = card.classList.contains('cs-cover') ? 3 : card.classList.contains('case') ? 7 : 9;
    card.addEventListener('pointermove', function (e) {
      var b = card.getBoundingClientRect(), dx = (e.clientX - b.left) / b.width - .5, dy = (e.clientY - b.top) / b.height - .5;
      card.classList.add('is-tilting');
      card.style.setProperty('--ry', (dx * lean) + 'deg'); card.style.setProperty('--rx', (-dy * lean) + 'deg');
      card.style.setProperty('--px', (-dx * 18) + 'px'); card.style.setProperty('--py', (-dy * 12) + 'px');
    });
    card.addEventListener('pointerleave', function () {
      card.classList.remove('is-tilting');
      ['--rx', '--ry', '--px', '--py'].forEach(function (p) { card.style.removeProperty(p); });
    });
  });

  // Poke any cartoon: it squashes and says something.
  var lines = ['hey!', 'boing', 'hehe', '♡', 'oi!', 'hi hi', 'wheee'];
  var poke = function (el, x, y) {
    el.classList.remove('is-poked'); void el.offsetWidth; el.classList.add('is-poked');
    var b = document.createElement('span'); b.className = 'poke'; b.setAttribute('aria-hidden', 'true');
    b.textContent = lines[Math.floor(Math.random() * lines.length)];
    b.style.left = x + 'px'; b.style.top = y + 'px';
    document.body.appendChild(b); setTimeout(function () { b.remove(); }, 900);
  };
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.toon');
    if (t && !t.classList.contains('drag-toon')) poke(t, e.clientX, e.clientY);
  });

  // Draggable cartoons: drag them around, they spring back on release.
  document.querySelectorAll('.drag-toon').forEach(function (jumper) {
    var sx = 0, sy = 0, dx = 0, dy = 0, vx = 0, vy = 0, dragging = false, moved = false;
    var apply = function () {
      var stretch = Math.min(Math.hypot(dx, dy) / 600, .18);
      jumper.style.translate = dx + 'px ' + dy + 'px';
      jumper.style.rotate = clamp(dx * .08, -25, 25) + 'deg';
      jumper.style.scale = (1 - stretch * .5) + ' ' + (1 + stretch);
    };
    var spring = function () {
      if (dragging) return;
      vx = (vx - dx * .12) * .8; vy = (vy - dy * .12) * .8; dx += vx; dy += vy;
      if (Math.abs(dx) + Math.abs(dy) + Math.abs(vx) + Math.abs(vy) < .3) { dx = dy = 0; apply(); return; }
      apply(); requestAnimationFrame(spring);
    };
    jumper.draggable = false; // otherwise the browser's own image drag cancels ours
    jumper.addEventListener('pointerdown', function (e) {
      e.preventDefault(); dragging = true; moved = false; sx = e.clientX - dx; sy = e.clientY - dy;
      jumper.setPointerCapture(e.pointerId); jumper.classList.add('is-dragging');
    });
    jumper.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dx = e.clientX - sx; dy = e.clientY - sy; moved = moved || Math.hypot(dx, dy) > 4; apply();
    });
    var drop = function (e) {
      if (!dragging) return;
      dragging = false; jumper.classList.remove('is-dragging');
      if (!moved) poke(jumper, e.clientX, e.clientY);
      vx = vy = 0; motion ? spring() : (dx = dy = 0, apply());
    };
    jumper.addEventListener('pointerup', drop);
    jumper.addEventListener('pointercancel', drop);
  });

  // How I work: a little star hops from step to step while the strip is on screen; pointing at a step takes over.
  var process = document.querySelector('.process'), pFace = document.querySelector('.process__face');
  if (process && pFace) {
    var steps = process.querySelectorAll('.process__step'), at = -1, timer = null;
    var go = function (n) {
      at = (n + steps.length) % steps.length;
      var box = steps[at].querySelector('.process__box').getBoundingClientRect(), wrap = process.getBoundingClientRect();
      steps.forEach(function (s, i) { s.classList.toggle('is-on', i === at); });
      pFace.style.setProperty('--x', (box.left - wrap.left + box.width / 2 - 16) + 'px');
      pFace.style.setProperty('--y', (box.top - wrap.top - 40) + 'px');
    };
    var stop = function () { clearInterval(timer); timer = null; };
    var start = function () { if (motion && !timer) timer = setInterval(function () { go(at + 1); }, 1400); };
    steps.forEach(function (s, i) { s.addEventListener('pointerenter', function () { stop(); go(i); }); });
    process.addEventListener('pointerleave', start);
    addEventListener('resize', function () { if (at >= 0) go(at); });
    go(0);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(process);
  }


  // Everything below the hero rises into place as it reaches you, siblings one after another.
  var risers = document.querySelectorAll('.process__step, .section-head > *, .do-head > *, .deck, .soon, .layers__stage, .do-item, .about__badge, .about__copy > *, .tile, .notes li, .contact__text > *, .vibe__stage, .chapter, .insight, .stat, .fig, .next .wrap > div');
  if (risers.length && motion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    var rise = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); rise.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    risers.forEach(function (el) {
      var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains('rv'); });
      el.classList.add('rv'); el.style.setProperty('--i', Math.min(sibs.length, 6));
      rise.observe(el);
    });
  }

  // Work deck: one project open at a time. Desktop slides the open card along a row of spines;
  // phones get a native swipe carousel. Buttons, the slider, arrow keys and swipes all drive both.
  var deck = document.querySelector('[data-deck]');
  if (deck) {
    var track = deck.querySelector('.deck__track'), cards = Array.prototype.slice.call(track.children);
    var range = deck.querySelector('[data-deck-range]'), now = deck.querySelector('[data-deck-now]');
    var prevBtn = deck.querySelector('[data-deck-prev]'), nextBtn = deck.querySelector('[data-deck-next]');
    var wide = matchMedia('(min-width: 900px)'), cur = 0, last = cards.length - 1;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var show = function (i, opts) {
      opts = opts || {};
      cur = clamp(i, 0, last);
      cards.forEach(function (card, k) {
        card.classList.toggle('is-active', k === cur);
        card.style.setProperty('--d', Math.abs(k - cur));
      });
      range.value = cur + 1;
      range.setAttribute('aria-valuetext', 'Project ' + (cur + 1) + ' of ' + cards.length);
      range.style.setProperty('--fill', (last ? cur / last * 100 : 0) + '%');
      now.textContent = pad(cur + 1);
      prevBtn.disabled = cur === 0; nextBtn.disabled = cur === last;
      if (!wide.matches && !opts.fromScroll) track.scrollTo({ left: cards[cur].offsetLeft - cards[0].offsetLeft, behavior: motion ? 'smooth' : 'auto' });
      if (opts.focus) cards[cur].querySelector('.case').focus({ preventScroll: true });
    };
    prevBtn.addEventListener('click', function () { show(cur - 1); });
    nextBtn.addEventListener('click', function () { show(cur + 1); });
    range.addEventListener('input', function () { show(range.value - 1); });
    cards.forEach(function (card, k) {
      card.querySelector('.deck__spine').addEventListener('click', function () { show(k, { focus: true }); });
    });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(cur + (e.key === 'ArrowRight' ? 1 : -1), { focus: true }); }
    });
    // phones: follow the native swipe so the controls stay in step
    var scrollQueued = false;
    track.addEventListener('scroll', function () {
      if (wide.matches || scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(function () {
        scrollQueued = false;
        var step = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
        var i = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2 ? last : Math.round(track.scrollLeft / step);
        if (i !== cur) show(i, { fromScroll: true });
      });
    }, { passive: true });
    // desktop: drag or swipe sideways across the deck to slide
    var downX = null, swiped = false;
    track.addEventListener('pointerdown', function (e) { if (wide.matches) { downX = e.clientX; swiped = false; } });
    addEventListener('pointerup', function (e) {
      if (downX === null) return;
      var dx = e.clientX - downX; downX = null;
      if (Math.abs(dx) > 60) { swiped = true; show(cur + (dx < 0 ? 1 : -1)); }
    });
    track.addEventListener('click', function (e) { if (swiped) { e.preventDefault(); e.stopPropagation(); swiped = false; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });
    wide.addEventListener('change', function () { show(cur); });
    show(0);
  }

  // Contact: pick what you need and cartoon me gets ready for it.
  var vibes = {
    research: ['img/toon-laptop.png?v=2', 476, 720, 'Cartoon of me in a desk chair typing on a pink laptop.', 'notes open, questions ready.'],
    design: ['img/toon-desk.png', 720, 330, 'Cartoon of my desk: a pink laptop, two monitors with wireframes, a rainbow keyboard, coffee and plants.', 'wireframes on both screens!'],
    ideas: ['img/toon-jump.png', 472, 720, 'Cartoon of me jumping with both arms in the air.', 'ooh, I love a blank page.'],
    system: ['img/toon-plant.png', 368, 720, 'Cartoon of me carrying a monstera plant in a terracotta pot.', "let's grow something that lasts."],
    hello: ['img/toon-wave.png?v=2', 352, 720, 'Cartoon of me waving hello in a black shirt, jeans and white gloves.', 'hi! no agenda needed.']
  };
  var vToon = document.getElementById('vibe-toon'), vLine = document.getElementById('vibe-line');
  var chips = document.querySelectorAll('.chip[data-vibe]');
  Object.keys(vibes).forEach(function (k) { new Image().src = vibes[k][0]; });
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var v = vibes[chip.dataset.vibe];
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      var swap = function () {
        vToon.src = v[0]; vToon.width = v[1]; vToon.height = v[2]; vToon.alt = v[3];
        vLine.textContent = v[4];
        vLine.classList.remove('is-new'); void vLine.offsetWidth; vLine.classList.add('is-new');
      };
      if (!motion || !vToon.animate) return swap();
      vToon.animate([{ transform: 'none' }, { transform: 'scale(1.15, .2)', opacity: .2 }], { duration: 180, easing: 'ease-in' }).onfinish = function () {
        swap();
        vToon.animate([{ transform: 'scale(.7, 1.3) translateY(-30px)' }, { transform: 'scale(1.06, .94)' }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      };
    });
  });

  // Rubber-hose shapes: pie-eyed 1930s cartoon bits, drawn from one small set. Click one and it boings.
  var eyes = function (a, b, y, r) {
    return [a, b].map(function (x) {
      return '<g class="rh-eye"><ellipse cx="' + x + '" cy="' + y + '" rx="' + r * .6 + '" ry="' + r + '" fill="#0c1014"/><path d="M' + x + ' ' + y + 'l' + (-r * .45) + ' ' + (-r * .8) + 'h' + r * .6 + 'z" fill="#fff"/></g>';
    }).join('');
  };
  var ink = 'class="rh-ink" fill="none"';
  var shapes = {
    star: '<path class="rh-fill rh-ink" d="M50 4C55 36 64 45 96 50 64 55 55 64 50 96 45 64 36 55 4 50 36 45 45 36 50 4Z"/>' + eyes(44, 56, 49, 5),
    ball: '<circle class="rh-fill rh-ink" cx="50" cy="54" r="38"/><path d="M26 44a26 26 0 0 1 14-16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' + eyes(40, 60, 48, 8) + '<path ' + ink + ' d="M38 68q12 11 24 0"/>',
    heart: '<path class="rh-fill rh-ink" d="M50 88C22 68 8 52 10 34 12 18 32 10 50 28 68 10 88 18 90 34 92 52 78 68 50 88Z"/>' + eyes(40, 60, 44, 7) + '<path ' + ink + ' d="M43 60q7 7 14 0"/>',
    cloud: '<path class="rh-fill rh-ink" d="M24 78a17 17 0 0 1-2-34 22 22 0 0 1 40-12 18 18 0 0 1 28 16 15 15 0 0 1-2 30Z"/><path ' + ink + ' d="M36 56q5 5 10 0M58 56q5 5 10 0M46 66q6 4 12 0"/>',
    flower: '<path d="M50 98C42 84 58 74 50 58" fill="none" stroke="#0c1014" stroke-width="10" stroke-linecap="round"/><path d="M50 98C42 84 58 74 50 58" fill="none" stroke="#b8f542" stroke-width="4" stroke-linecap="round"/>' +
      '<path class="rh-ink" fill="#b8f542" d="M50 82c-14 2-22-6-24-14 10-2 20 2 24 14Z"/>' +
      [0, 60, 120, 180, 240, 300].map(function (a) { var r = a * Math.PI / 180; return '<circle class="rh-ink" fill="#e5e7eb" cx="' + (50 + Math.cos(r) * 19).toFixed(1) + '" cy="' + (34 + Math.sin(r) * 19).toFixed(1) + '" r="12"/>'; }).join('') +
      '<circle class="rh-fill rh-ink" cx="50" cy="34" r="15"/>' + eyes(45, 55, 32, 4.5),
    worm: '<path d="M8 64c12-28 26-28 34 0s22 28 34 0c4-12 10-18 16-20" fill="none" stroke="#0c1014" stroke-width="17" stroke-linecap="round"/><path d="M8 64c12-28 26-28 34 0s22 28 34 0c4-12 10-18 16-20" fill="none" style="stroke:var(--f, #b8f542)" stroke-width="9" stroke-linecap="round"/>' +
      '<circle cx="90" cy="43" r="6" fill="#fff" stroke="#0c1014" stroke-width="2.5"/><circle class="rh-eye" cx="91" cy="43" r="3" fill="#0c1014"/>',
    spark: '<path d="M34 66 12 88M44 56l2-34M56 64l32-8" fill="none" stroke="#0c1014" stroke-width="13" stroke-linecap="round"/><path d="M34 66 12 88M44 56l2-34M56 64l32-8" fill="none" style="stroke:var(--f, #b8f542)" stroke-width="6" stroke-linecap="round"/>'
  };
  document.querySelectorAll('.rh[data-rh]').forEach(function (el) {
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<svg viewBox="0 0 100 100">' + (shapes[el.dataset.rh] || '') + '</svg>';
  });
  document.addEventListener('click', function (e) {
    var s = e.target.closest && e.target.closest('.rh');
    if (!s) return;
    s.classList.remove('is-boing'); void s.offsetWidth; s.classList.add('is-boing');
    poke(s, e.clientX, e.clientY);
  });

  // About: the name badge hangs on a spring. Brush past it or tap it and it swings.
  var badgeWrap = document.querySelector('.about__badge');
  if (badgeWrap && motion) {
    var ang = 0, angV = 0, swinging = false;
    var swing = function () {
      angV = (angV - ang * .06) * .94; ang += angV;
      badgeWrap.style.setProperty('--swing', ang.toFixed(2) + 'deg');
      swinging = Math.abs(ang) + Math.abs(angV) > .02;
      if (swinging) requestAnimationFrame(swing); else badgeWrap.style.setProperty('--swing', '0deg');
    };
    var push = function (v) { angV = clamp(angV + v, -6, 6); if (!swinging) { swinging = true; requestAnimationFrame(swing); } };
    var badge = badgeWrap.querySelector('.badge');
    badge.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') push(clamp(e.movementX, -30, 30) * -.02); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { if (en[0].isIntersecting) push(2.5); }, { threshold: .6 }).observe(badge);
  }

  // About: flip the badge to meet the dogs on the back.
  var flipCard = document.querySelector('[data-badge]'), flipBtn = document.querySelector('[data-badge-flip]');
  if (flipCard && flipBtn) {
    var sides = flipCard.querySelectorAll('.badge__side');
    var flip = function () {
      var on = !flipCard.classList.contains('is-flipped');
      flipCard.classList.toggle('is-flipped', on);
      sides[0].setAttribute('aria-hidden', String(on)); sides[1].setAttribute('aria-hidden', String(!on));
      flipBtn.setAttribute('aria-pressed', String(on));
      flipBtn.textContent = on ? 'flip back to me ↺' : 'flip it, meet the pups ↻';
    };
    flipCard.addEventListener('click', flip);
    flipBtn.addEventListener('click', flip);
  }

  // What I do: the finished screen sits on top of research, flows and a system.
  // Scrolling in spreads the stack apart; picking a service flips the layers above it back.
  var layers = document.querySelector('[data-layers]'), stack = null;
  if (layers) {
    stack = layers.querySelector('.stack');
    var order = ['research', 'design', 'system', 'screen'], cycle = 5000;
    var layerEls = stack.querySelectorAll('.layer'), items = layers.querySelectorAll('.do-item');
    var prettyBtn = layers.querySelector('[data-pretty]'), note = layers.querySelector('[data-pretty-note]');
    var active = null, peeling = false, pretty = false, userTook = false, inView = false, cycTimer = null;
    layers.classList.add('is-live');
    layers.style.setProperty('--cycle', cycle + 'ms');
    var render = function () {
      var ai = order.indexOf(active), on = peeling && !pretty && active;
      layerEls.forEach(function (el) {
        var k = order.indexOf(el.dataset.layer), peeled = on && k > ai;
        el.classList.toggle('is-peeled', !!peeled);
        el.style.setProperty('--fi', peeled ? k - ai - 1 : 0);
        el.classList.toggle('is-active', !!on && k === ai);
      });
      items.forEach(function (it) {
        var open = it.dataset.layer === active;
        it.classList.toggle('is-open', open);
        it.classList.toggle('is-timing', open && !!cycTimer);
        it.querySelector('.do-item__btn').setAttribute('aria-expanded', String(open));
      });
    };
    var pick = function (name) { active = name === 'screen' ? null : name; peeling = true; render(); };
    var stopCycle = function () { clearInterval(cycTimer); cycTimer = null; };
    var startCycle = function () {
      if (!motion || userTook || pretty || cycTimer) return;
      if (!active) pick('research');
      cycTimer = setInterval(function () { pick(order[(order.indexOf(active) + 1) % 3]); restartTimer(); }, cycle);
      restartTimer();
    };
    var restartTimer = function () {
      items.forEach(function (it) { it.classList.remove('is-timing'); });
      var open = layers.querySelector('.do-item.is-open');
      if (open && cycTimer) { void open.offsetWidth; open.classList.add('is-timing'); }
    };
    var takeOver = function () { userTook = true; stopCycle(); };
    var setPretty = function (on) {
      pretty = on;
      prettyBtn.setAttribute('aria-checked', String(on));
      layers.classList.toggle('is-pretty', on);
      note.textContent = on ? 'looks great! …but does it work?' : "there's a lot under the screen ↑";
      if (on) active = null;
      render(); queueFrame();
    };
    items.forEach(function (it) {
      it.querySelector('.do-item__btn').addEventListener('click', function () {
        takeOver(); if (pretty) setPretty(false);
        pick(active === it.dataset.layer ? 'screen' : it.dataset.layer);
      });
    });
    layerEls.forEach(function (el) {
      el.addEventListener('click', function () { takeOver(); if (pretty) setPretty(false); pick(el.dataset.layer); });
    });
    prettyBtn.addEventListener('click', function () { takeOver(); setPretty(!pretty); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) {
      inView = en[0].isIntersecting; if (!inView) stopCycle(); else if (peeling) startCycle();
    }, { threshold: .4 }).observe(layers);
    if (!motion) { peeling = true; active = 'research'; }
    render();
  }

  // One scroll loop for the in-between bits: shapes drift at their own depth, band edges stretch
  // with scroll speed and spring back, squiggles draw themselves, and the layer stack spreads out.
  var drifters = Array.prototype.slice.call(document.querySelectorAll('.rh[data-depth]'));
  var squiggles = Array.prototype.map.call(document.querySelectorAll('.squiggle'), function (sq) {
    var path = sq.querySelector('path'), d = 'M0 30';
    for (var x = 0; x < 1200; x += 100) d += ' C' + (x + 30) + ' ' + (x % 200 ? 58 : 2) + ' ' + (x + 70) + ' ' + (x % 200 ? 58 : 2) + ' ' + (x + 100) + ' 30';
    path.setAttribute('d', d);
    return { el: sq, path: path, len: path.getTotalLength(), rider: sq.querySelector('.squiggle__rider') };
  });
  var lastY = scrollY, lastT = performance.now(), wob = 0, wobV = 0, framing = false, gapMax = 60;
  var sizeStack = function () { if (stack) { gapMax = stack.offsetWidth * .26; stack.style.setProperty('--gap-max', gapMax + 'px'); } };
  sizeStack();
  var frame = function (now) {
    framing = false;
    var vh = innerHeight, dt = Math.max(16, now - lastT), v = (scrollY - lastY) / dt;
    lastY = scrollY; lastT = now;
    if (motion) {
      drifters.forEach(function (s) {
        var r = s.parentNode.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        s.style.translate = '0 ' + clamp((r.top + r.height / 2 - vh / 2) * -s.dataset.depth * .3, -22, 22).toFixed(1) + 'px';
      });
      // a spring chasing scroll speed, so the edges overshoot a little when you stop
      wobV = (wobV + (clamp(Math.abs(v) / 3, 0, 1) - wob) * .2) * .74; wob += wobV;
      document.documentElement.style.setProperty('--wob', wob.toFixed(3));
    }
    squiggles.forEach(function (s) {
      var r = s.el.getBoundingClientRect(), p = motion ? clamp((vh * .95 - r.top) / (vh * .6), 0, 1) : 1;
      s.path.style.setProperty('--draw', (1 - p).toFixed(4));
      var pt = s.path.getPointAtLength(p * s.len);
      s.rider.style.setProperty('--rx', (pt.x / 12) + '%'); s.rider.style.setProperty('--ry', (pt.y / 60 * 100) + '%');
    });
    if (stack) {
      var sr = layers.querySelector('.layers__stage').getBoundingClientRect();
      var p = motion ? ease(clamp((vh * .95 - sr.top) / (vh * .5), 0, 1)) : 1;
      stack.style.setProperty('--gap', (pretty ? 0 : p * gapMax).toFixed(1) + 'px');
      if (p > .97 && !peeling) { peeling = true; render(); if (inView) startCycle(); }
    }
    if (motion && (Math.abs(wob) + Math.abs(wobV) > .002 || Math.abs(v) > .01)) queueFrame();
  };
  var queueFrame = function () { if (!framing) { framing = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', queueFrame, { passive: true });
  addEventListener('resize', function () { sizeStack(); queueFrame(); });
  queueFrame();

  // Floating pill: says where you are, hides at the top and when contact is on screen.
  var pill = document.getElementById('pill'), where = document.getElementById('pill-where');
  var hero = document.querySelector('.hero, .cs-title, .post-intro'), contact = document.querySelector('#contact, .next');
  if (pill && 'IntersectionObserver' in window) {
    var heroVisible = true, contactVisible = false;
    var sync = function () { pill.classList.toggle('is-shown', !heroVisible && !contactVisible); };
    new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; sync(); }).observe(hero);
    if (contact) new IntersectionObserver(function (en) { contactVisible = en[0].isIntersecting; sync(); }, { threshold: .35 }).observe(contact);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) where.textContent = en.target.dataset.where; });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('[data-where]').forEach(function (s) { spy.observe(s); });
  }
})();

// Case study: before/after slider and a toc marker that follows you.
(function () {
  document.querySelectorAll('.compare').forEach(function (fig) {
    var range = fig.querySelector('.compare__range');
    range.addEventListener('input', function () { fig.style.setProperty('--pos', range.value + '%'); });
  });

  var marker = document.querySelector('.toc__toon');
  if (marker && 'IntersectionObserver' in window) {
    var move = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var a = document.querySelector('.toc a[href="#' + en.target.id + '"]');
        if (a) marker.style.setProperty('--y', (a.offsetTop + a.offsetHeight / 2 - 16) + 'px');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.chapter[id]').forEach(function (c) { move.observe(c); });
  }
})();
