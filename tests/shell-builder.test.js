import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { buildSession, sessionMarkdown } from '../assets/js/shell-builder.js';
const base = { host: '127.0.0.1', port: '4444', runtime: 'bash', representation: 'plain' };

test('rejects addresses that could cross a shell quoting boundary', () => {
  for (const host of ['x;id', '$(id)', '`id`', "x'y", 'x"y', 'x\ny', 'x/y', 'https://lab.test', '-lab', 'lab..test', '999.1.1.1', '01.2.3.4', '']) {
    assert.throws(() => buildSession({ ...base, host }), /valid IPv4 address or hostname/, host);
  }
});
test('accepts normal hostnames, trims whitespace, and enforces numeric port boundaries', () => {
  assert.equal(buildSession({ ...base, host: ' lab-01.example.test ' }).settings.host, 'lab-01.example.test');
  for (const port of ['1', '65535']) assert.equal(buildSession({ ...base, port }).settings.port, Number(port));
  for (const port of ['0', '65536', '-1', '22;id', '4.4', '2e3', ' 22', '']) assert.throws(() => buildSession({ ...base, port }), /port from 1 to 65535/);
});
test('encoded variants decode to the same underlying operation', () => {
  for (const runtime of ['bash', 'python']) {
    const plain = buildSession({ ...base, runtime });
    const encoded = buildSession({ ...base, runtime, representation: 'base64' });
    const token = runtime === 'bash' ? encoded.payload.match(/printf '%s' '([^']+)'/)[1] : encoded.payload.match(/b64decode\("([^"]+)"\)/)[1];
    assert.equal(Buffer.from(token, 'base64').toString(), runtime === 'bash' ? plain.plain : plain.decoded);
    assert.equal(encoded.decoded, plain.decoded);
  }
});
test('all generated wrappers parse as POSIX shell commands', { skip: process.platform === 'win32' }, () => {
  for (const runtime of ['bash', 'python']) for (const representation of ['plain', 'base64']) {
    const { payload } = buildSession({ ...base, runtime, representation });
    const result = spawnSync('/bin/sh', ['-n'], { input: payload, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
});
test('export carries prerequisites and the decoded form, not just the wrapper', () => {
  const session = buildSession({ ...base, runtime: 'python', representation: 'base64' });
  const exported = sessionMarkdown(session);
  for (const value of [session.payload, session.decoded, session.listener, session.requirements, '127.0.0.1:4444']) assert.ok(exported.includes(value));
  assert.ok(exported.includes('nothing was executed'));
});
