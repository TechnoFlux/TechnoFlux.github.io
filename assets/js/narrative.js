// Progressive, native-scroll storytelling. No wheel interception or scroll replacement.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
const toggle = document.querySelector('#reading-mode');
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const ease = n => n * n * (3 - 2 * n);
let reading = reduced.matches;
let frame = 0;
let height = innerHeight;
let header = document.querySelector('.header').offsetHeight;
const reels = [];
// Mobile browser chrome expands/collapses while scrolling. Use a stable small
// viewport for pinned chapters so those toolbar resizes do not move the story.
const viewportProbe = document.createElement('div');
viewportProbe.setAttribute('aria-hidden', 'true');
viewportProbe.style.cssText = 'position:fixed;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
document.body.append(viewportProbe);

function createReel(selector, kind, travel) {
  const stage = document.querySelector(selector);
  const reel = document.createElement('div');
  reel.className = `reel ${kind}-reel`;
  reel.dataset.chapter = kind;
  reel.style.setProperty('--travel', travel);
  stage.before(reel); reel.append(stage);
  stage.classList.add('reel-stage');
  const bar = document.createElement('div'); bar.className = 'reel-progress'; bar.setAttribute('aria-hidden', 'true'); stage.append(bar);
  const entry = { reel, stage, kind, p: 0, bar };
  reels.push(entry); return entry;
}
function jump(entry, value, behavior = reading ? 'instant' : 'smooth') {
  const top = scrollY + entry.reel.getBoundingClientRect().top - header;
  scrollTo({ top: top + (entry.reel.offsetHeight - entry.stage.offsetHeight) * value, behavior });
}
function controls(entry, labels, values = labels.map((_, i) => i / Math.max(1, labels.length - 1))) {
  const group = document.createElement('div'); group.className = 'reel-controls'; group.setAttribute('role', 'group'); group.setAttribute('aria-label', `${entry.kind} chapters`);
  const buttons = labels.map((label, i) => {
    const button = document.createElement('button'); button.textContent = label; button.type = 'button';
    button.addEventListener('click', () => jump(entry, values[i])); group.append(button); return button;
  });
  entry.stage.append(group); entry.buttons = buttons;
}
function setCurrent(entry, index) {
  if (entry.current === index) return;
  entry.current = index;
  entry.buttons?.forEach((button, i) => button.setAttribute('aria-current', i === index ? 'step' : 'false'));
}
const research = createReel('#work', 'research', 155);
controls(research, ['CSRF', 'Stored XSS', 'RCE']);
const chainNodes = [...document.querySelectorAll('.chain-node')];
const chainLines = [...document.querySelectorAll('.chain-connector')];
const researchArt = document.querySelector('.research-art');
const chain = document.querySelector('.chain');
const annotation = document.createElement('p'); annotation.className = 'chain-note'; annotation.setAttribute('aria-hidden', 'true'); researchArt.append(annotation);
const chainNotes = ['A forged request crosses the first boundary.', 'Stored JavaScript reaches a privileged context.', 'The chain reaches remote code execution.'];

const tools = createReel('#tools', 'tools', 135);
controls(tools, ['Open-source tooling', 'Responsible disclosure']);
const workTrack = document.querySelector('.work-pair');
const workWindow = document.createElement('div'); workWindow.className = 'work-window';
workTrack.before(workWindow); workWindow.append(workTrack);
const terminalLines = [...document.querySelectorAll('.terminal-body p')];

const shellLab = createReel('#shell-lab', 'shell-lab', 210);
controls(shellLab, ['Connection', 'Permission', 'Root'], [.12, .5, .9]);
const shellPanels = [...document.querySelectorAll('[data-shell-panel]')];
const shellLines = shellPanels.map(panel => [...panel.querySelectorAll('.shell-line')]);
const shellRoute = [...document.querySelectorAll('.shell-route>span')];

const experience = createReel('#experience', 'experience', 200);
const career = [...document.querySelectorAll('.timeline article')];
controls(experience, ['Techlastic', 'Independent', 'Zynga', 'EY GDS']);
career.forEach((card, i) => {
  const big = document.createElement('span'); big.className = 'career-year'; big.textContent = ['2024', '2021', '2021', '2021'][i]; big.setAttribute('aria-hidden', 'true'); card.prepend(big);
});

const credentials = createReel('#credentials', 'credentials', 190);
const certTrack = document.querySelector('.cert-list');
const certWindow = document.createElement('div'); certWindow.className = 'cert-window';
certTrack.before(certWindow); certWindow.append(certTrack);
const certs = [...document.querySelectorAll('.cert-item')];
certs.forEach((card, i) => {
  const seal = document.createElement('div'); seal.className = 'cert-seal'; seal.setAttribute('aria-hidden', 'true');
  seal.innerHTML = '<svg viewBox="0 0 100 100"><path d="M50 8 86 29v42L50 92 14 71V29Z"/><path d="M50 20 75 35v30L50 80 25 65V35Z"/><path d="m35 50 10 10 22-23"/></svg>';
  card.prepend(seal); card.style.setProperty('--card-index', i);
});
controls(credentials, ['OffSec', 'eLearnSecurity', 'Red team'], [0, .55, 1]);
const contact = createReel('#contact', 'contact', 55);

const approach = document.querySelector('#approach');
const disciplines = [...document.querySelectorAll('.disciplines details')];
const proof = document.querySelector('.proof');

function mode() {
  const anchor = reels.find(e => e.reel.getBoundingClientRect().top <= header && e.reel.getBoundingClientRect().bottom > height / 2);
  root.classList.toggle('cinema', !reading);
  root.classList.toggle('reading', reading);
  toggle.textContent = reading ? 'Scroll experience' : 'Reading view';
  toggle.setAttribute('aria-pressed', String(reading));
  for (const e of reels) {
    e.stage.style.removeProperty('transform');
    e.stage.style.removeProperty('opacity');
  }
  for (const card of career) { card.inert = false; card.removeAttribute('aria-hidden'); }
  for (const panel of shellPanels) { panel.inert = false; panel.removeAttribute('aria-hidden'); }
  // Inform the hero so the reading choice applies to the entire page.
  dispatchEvent(new CustomEvent('portfolio:reading', { detail: reading }));
  measure();
  if (anchor) anchor.stage.scrollIntoView({ block: 'start', behavior: 'instant' });
}
toggle.hidden = false;
toggle.addEventListener('click', () => { reading = !reading; mode(); });
reduced.addEventListener('change', () => { reading = reduced.matches; mode(); });

function measure() {
  height = matchMedia('(max-width:700px)').matches ? (viewportProbe.offsetHeight || innerHeight) : innerHeight;
  header = document.querySelector('.header').offsetHeight;
  root.style.setProperty('--viewport-height', `${height}px`);
  root.style.setProperty('--chapter-height', `${Math.max(540, height - header)}px`);
  root.style.setProperty('--header-height', `${header}px`);
  request();
}
function update() {
  frame = 0;
  if (reading) return;
  const viewport = height - header;
  // Read geometry together before changing styles: avoid layout work per card.
  const snapshots = reels.map(entry => ({ entry, bounds: entry.reel.getBoundingClientRect(), travel: entry.reel.offsetHeight - entry.stage.offsetHeight }));
  const workDistance = Math.max(0, workTrack.scrollWidth - workWindow.clientWidth);
  const certWidth = certWindow.clientWidth;
  const certDistance = Math.max(0, certTrack.scrollWidth - certWidth);
  const certCenters = certs.map(card => card.offsetLeft + card.offsetWidth / 2);
  const approachTop = approach.offsetTop - scrollY;
  const ar = { top: approachTop, height: approach.offsetHeight, bottom: approachTop + approach.offsetHeight };
  const rowTops = disciplines.map(row => row.getBoundingClientRect().top);
  const pr = proof.getBoundingClientRect();
  for (const { entry, bounds, travel } of snapshots) {
    if (bounds.bottom < 0 || bounds.top > height * 1.3) continue;
    const p = clamp((header - bounds.top) / Math.max(1, travel));
    entry.p = p; entry.reel.style.setProperty('--p', p);
    // Animate the whole chapter during the viewport handoff, not only its heading.
    const entering = clamp((height - bounds.top) / viewport);
    const leaving = clamp((height - bounds.bottom) / viewport);
    const arrival = ease(entering);
    const departure = ease(leaving);
    entry.reel.style.setProperty('--arrival', arrival);
    entry.reel.style.setProperty('--departure', departure);
    entry.reel.style.setProperty('--chapter-opacity', Math.max(.025, arrival * (1 - departure * .92)));
    entry.reel.style.setProperty('--chapter-scale', .86 + arrival * .14 - departure * .09);
    entry.reel.style.setProperty('--chapter-y', `${(1 - arrival) * 95 - departure * 55}px`);
    entry.reel.style.setProperty('--chapter-tilt', `${(1 - arrival) * 4 - departure * 2}deg`);
    entry.reel.style.setProperty('--chapter-radius', `${(1 - arrival + departure) * 28}px`);
    if (entry.kind === 'research') {
      const index = Math.min(2, Math.floor(p * 2.99)); setCurrent(entry, index);
      chain.style.transform = `perspective(950px) rotateX(${25 - 25 * p}deg) rotateY(${-18 + p * 27}deg) rotateZ(${-12 + p * 12}deg) scale(${.9 + p * .1})`;
      chainNodes.forEach((node, i) => {
        const local = clamp(p * 3 - i + .7);
        node.style.opacity = .24 + .76 * local;
        node.style.transform = `translateZ(${local * 40}px) translateY(${(1 - local) * 35}px)`;
        node.classList.toggle('chain-active', i === index);
      });
      chainLines.forEach((line, i) => line.style.transform = `scaleX(${clamp(p * 3 - i - .4)})`);
      annotation.textContent = chainNotes[index];
    }
    if (entry.kind === 'tools') {
      const slide = ease(clamp((p - .16) / .72));
      const distance = workDistance;
      workTrack.style.transform = `translate3d(${-slide * distance}px,0,0)`;
      document.querySelector('.terminal').style.transform = `perspective(950px) rotateY(${-9 + Math.min(1,p*4)*9}deg) rotateX(${8-Math.min(1,p*4)*8}deg)`;
      terminalLines.forEach((line, i) => line.style.opacity = .18 + .82 * clamp(p * 8 - i + 1));
      setCurrent(entry, p < .5 ? 0 : 1);
    }
    if (entry.kind === 'shell-lab') {
      // Native scroll is the timeline. No timers, typewriter loops or new WebGL scene.
      const position = p < .25 ? 0 : p < .42 ? ease((p - .25) / .17) : p < .62 ? 1 : p < .8 ? 1 + ease((p - .62) / .18) : 2;
      const current = Math.min(2, Math.round(position));
      setCurrent(entry, current);
      shellLab.stage.style.setProperty('--shell-root', ease(clamp((p - .65) / .22)));
      shellRoute.forEach((node, i) => node.classList.toggle('is-reached', i <= current));
      shellPanels.forEach((panel, i) => {
        const offset = i - position;
        panel.style.setProperty('--shell-offset', offset);
        panel.style.opacity = clamp(1 - Math.abs(offset));
        if (panel.getAttribute('aria-hidden') !== String(i !== current)) {
          panel.setAttribute('aria-hidden', String(i !== current));
          panel.inert = i !== current;
        }
        const starts = [0, .3, .68];
        shellLines[i].forEach((line, j) => {
          const reveal = i === 0 && j === 0 ? 1 : ease(clamp((p - starts[i] - j * .022) / .07));
          line.style.opacity = reveal;
          line.style.transform = `translate3d(0,${(1 - reveal) * 9}px,0)`;
        });
      });
    }
    if (entry.kind === 'experience') {
      const step = Math.min(3.999, p * 4);
      const base = Math.floor(step);
      const position = Math.min(3, base + ease(clamp((step - base - .62) / .38)));
      const current = Math.min(3, Math.round(position)); setCurrent(entry, current);
      career.forEach((card, i) => {
        const offset = i - position;
        card.style.transform = `translate3d(${Math.max(0,offset)*15}px,${offset<0?offset*115:offset*16}%,${-Math.abs(offset)*65}px) rotateX(${offset<0?-offset*9:0}deg)`;
        card.style.opacity = offset < 0 ? clamp(1 + offset * 2) : 1;
        if (card.getAttribute("aria-hidden") !== String(i !== current)) {
          card.classList.toggle("is-active", i === current);
          card.inert = i !== current;
          card.setAttribute("aria-hidden", String(i !== current));
        }
        card.style.zIndex = String(10 - i);
      });
    }
    if (entry.kind === 'credentials') {
      const distance = certDistance;
      certTrack.style.transform = `translate3d(${-p * distance}px,0,0)`;
      certs.forEach((card, i) => {
        const center = certCenters[i] - p * distance;
        const relative = (center - certWidth / 2) / Math.max(1, certWidth);
        const tilt = clamp(relative, -.6, .6) * -24;
        card.style.transform = `perspective(900px) rotateY(${tilt}deg) translateY(${Math.abs(relative)*14}px)`;
      });
      setCurrent(entry, p < .3 ? 0 : p < .85 ? 1 : 2);
    }
    if (entry.kind === 'contact') {
      entry.stage.style.setProperty('--finish', ease(p));
    }
  }
  if (ar.top < height && ar.bottom > 0) {
    const entrance = ease(clamp((height - ar.top) / (viewport * .65)));
    approach.style.setProperty('--section-entry', entrance);
    // A diagonal scanner exposes the next chapter from left to right.
    const scan = ease(clamp((height - ar.top) / (viewport * .88)));
    approach.style.setProperty('--scan', scan);
    const ap = clamp((height * .75 - ar.top) / Math.max(1, ar.height));
    approach.style.setProperty('--approach', ap);
    disciplines.forEach((row, i) => {
      const d = clamp((height * .9 - rowTops[i]) / (height * .55));
      row.style.setProperty('--row', d);
    });
  }
  if (pr.top < height && pr.bottom > 0) proof.style.setProperty('--proof', clamp((height - pr.top) / (height * .45)));
}
function request() { if (!frame) frame = requestAnimationFrame(update); }
addEventListener('scroll', request, { passive: true });
addEventListener('resize', measure);
// Keep every panel's real link reachable with the keyboard, even inside moving tracks.
for (const entry of [tools, credentials]) {
  entry.stage.addEventListener('focusin', event => {
    if (reading || event.target.closest('.reel-controls')) return;
    const card = event.target.closest('.tool-project,.recognition,.cert-item');
    if (!card) return;
    const index = [...card.parentElement.children].indexOf(card);
    const value = index / Math.max(1, card.parentElement.children.length - 1);
    jump(entry, value);
  });
}
// Native fragment links continue to work despite the added sticky wrappers.
for (const link of document.querySelectorAll('a[href^="#"]')) {
  link.addEventListener('click', event => {
    const id = link.getAttribute('href').slice(1);
    const entry = reels.find(e => e.stage.id === id);
    if (!entry || reading) return;
    event.preventDefault(); history.replaceState(null, '', `#${id}`); jump(entry, 0);
  });
}
mode();
document.fonts.ready.then(() => {
  measure();
  // Wrapping sections changes their document positions after the browser's
  // initial fragment jump. Restore a direct link once fonts and reels settle.
  const target = reels.find(entry => `#${entry.stage.id}` === location.hash);
  if (target && !reading) jump(target, 0, 'instant');
});
