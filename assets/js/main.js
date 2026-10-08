const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('#motion');
const sequence = document.querySelector('.intro-sequence');
const phases = [...document.querySelectorAll('.hero-phase')];
const steps = [...document.querySelectorAll('.intro-step')];
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const captions = ['Reconnaissance & discovery: map the attack surface and enumerate services, identities and permissions.', 'Exploitation & validation: confirm weaknesses and demonstrate impact within the agreed scope.', 'Reporting & remediation guidance: explain findings, recommend fixes and retest where agreed.'];
let sculpture, paused = motionQuery.matches, progress = 0, activeMode = -1, ticking = false;
function setMotion() {
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.innerHTML = paused ? 'Resume motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
  sculpture?.setPaused(paused);
}
function showPhase(mode) {
  if (mode === activeMode) return;
  activeMode = mode;
  phases.forEach((phase, index) => { phase.hidden = index !== mode; });
  steps.forEach((step, index) => step.classList.toggle('active', index === mode));
  modeButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.mode) === mode)));
  document.querySelector('#scene-caption').textContent = captions[mode];
}
function updateScroll() {
  const viewport = parseFloat(document.documentElement.style.getPropertyValue('--viewport-height')) || innerHeight;
  const extent = sequence.offsetHeight - viewport;
  if (!motionQuery.matches && !document.documentElement.classList.contains("reading") && extent > 100) {
    progress = Math.max(0, Math.min(1, -sequence.getBoundingClientRect().top / extent));
    showPhase(progress < .31 ? 0 : progress < .68 ? 1 : 2);
    sculpture?.setProgress(progress);
    sequence.style.setProperty('--progress', progress);
    const exit = Math.max(0, Math.min(1, (viewport * 1.48 - sequence.getBoundingClientRect().bottom) / (viewport * .82)));
    const handoff = exit * exit * (3 - 2 * exit);
    sequence.style.setProperty('--handoff', handoff);
    sculpture?.setHandoff(handoff);
  }
  ticking = false;
}
addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
addEventListener('resize', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); }
});
modeButtons.forEach(button => button.addEventListener('click', () => {
  const mode = Number(button.dataset.mode);
  showPhase(mode);
  sculpture?.setMode(mode);
}));
motionButton.addEventListener('click', () => { paused = !paused; setMotion(); });
motionQuery.addEventListener('change', () => { paused = motionQuery.matches; showPhase(0); setMotion(); updateScroll(); });
document.querySelector('#year').textContent = new Date().getFullYear();
showPhase(0); setMotion(); updateScroll();
if (!navigator.connection?.saveData) {
  import('./sculpture.js?v=20261008-3').then(({ createSculpture }) => {
    sculpture = createSculpture(document.querySelector('#scene'), false);
    sculpture.setPaused(paused);
    sculpture.setProgress(progress);
  }).catch(e => { motionButton.hidden = true; console.warn('Using static scene fallback', e.message); });
} else { motionButton.hidden = true; }
let readingView = motionQuery.matches;
addEventListener('portfolio:reading', event => {
  readingView = event.detail;
  sculpture?.setPaused(readingView || paused);
  if (readingView) { showPhase(0); sculpture?.setMode(0); sculpture?.setHandoff(0); sequence.style.setProperty("--handoff", 0); }
});
import('./narrative.js?v=20261008-4').catch(error => console.warn('Reading layout retained', error.message));
