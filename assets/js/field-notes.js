import { buildSession, sessionMarkdown } from './shell-builder.js?v=1';
const form = document.querySelector('#shell-form');
const error = document.querySelector('#form-error');
const status = document.querySelector('#copy-status');
const copyButtons = [...document.querySelectorAll('[data-copy]')];
const exportButton = document.querySelector('#export-notes');
let session;
function update() {
  status.textContent = '';
  try {
    session = buildSession(Object.fromEntries(new FormData(form)));
    error.textContent = '';
    for (const name of ['listener', 'payload', 'decoded', 'requirements', 'mechanism']) document.getElementById(name).textContent = session[name];
  } catch (e) {
    session = undefined;
    error.textContent = e.message;
    for (const name of ['listener', 'payload', 'decoded']) document.getElementById(name).textContent = 'Correct the settings to generate a command.';
    for (const name of ['requirements', 'mechanism']) document.getElementById(name).textContent = '';
  }
  copyButtons.forEach(button => button.disabled = !session);
  exportButton.disabled = !session;
}
form.addEventListener('input', update);
form.addEventListener('change', update);
form.addEventListener('submit', event => event.preventDefault());
copyButtons.forEach(button => button.addEventListener('click', async () => {
  if (!session) return;
  const output = document.getElementById(button.dataset.copy);
  try {
    await navigator.clipboard.writeText(output.textContent);
    status.textContent = `${button.dataset.copy === 'listener' ? 'Listener' : 'Target-side command'} copied.`;
  } catch {
    const selection = getSelection(), range = document.createRange();
    range.selectNodeContents(output); selection.removeAllRanges(); selection.addRange(range);
    status.textContent = 'Command selected. Use your browser’s copy action.';
  }
}));
exportButton.addEventListener('click', () => {
  if (!session) return;
  const url = URL.createObjectURL(new Blob([sessionMarkdown(session)], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'field-notes-shell-session.md';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = 'Session notes exported.';
});
update();
