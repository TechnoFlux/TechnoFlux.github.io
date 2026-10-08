# Offensive Security Field Notes

A browser-local command workbench and concise assessment reference, linked from [Abhishek Joshi’s portfolio](https://technoflux.github.io/).

## What is here

- Bash and Python 3 reverse-shell examples, with plain and transparent Base64 representations.
- Callback-address and port validation; matching Ncat listener syntax.
- Decoded command previews, prerequisites, quoting notes and connection diagnostics.
- Markdown session-note export generated locally, with no server or stored history.
- Original web/API authorization matrices, Linux permission-review notes, Active Directory evidence prompts and reporting/retest checklists.

The commands use established primitives; their syntax is not claimed as a novel technique. The contribution is the implementation, surrounding explanations and explicit assumptions. Encoding is not encryption or a claim of detection bypass. No commands execute from the webpage.

## Implementation

`../assets/js/shell-builder.js` contains pure command generation and validation. `../assets/js/field-notes.js` handles the interface, clipboard and file export. The site uses native modules and has no build dependencies.

## Validation

Run the repository’s automated checks with Node.js 22 or later:

```sh
npm test
```

These cover input boundaries, rejected shell metacharacters, decoded equivalence, shell syntax and exported context. They do not run a reverse shell.

An additional isolated Linux loopback check was performed during development on 2026-10-08 using GNU Bash 5.3.9, Python 3.14.7 and GNU base64. All four generated variants connected to a listener bound to `127.0.0.1`, returned a harmless test marker, and exited. This verifies those runtime combinations; it is not a claim of universal target compatibility. The Ncat listener was checked against upstream documentation, not exercised in that loopback test (the test listener used Python sockets).

The browser interface was checked at 320, 390, 768 and 1440 pixels, including invalid inputs and Markdown downloads. No request is made to the callback address by the page. Windows shell support is not provided in this edition.

## References

- [GNU Bash: redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html)
- [Python sockets](https://docs.python.org/3/library/socket.html) and [PTY utilities](https://docs.python.org/3/library/pty.html)
- [Ncat usage](https://nmap.org/ncat/guide/ncat-usage.html)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Sudoers policy reference](https://www.sudo.ws/docs/man/sudoers.man/)

Corrections should include the runtime/tool version, expected behavior and a minimal reproducible example without real credentials or client information.
