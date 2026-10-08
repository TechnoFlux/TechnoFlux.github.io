# Abhishek Joshi — Offensive Security

Personal portfolio at https://technoflux.github.io/.

A static, responsive website built with HTML, CSS, JavaScript and Three.js. Original procedural geometry and native-scroll transitions connect research, tooling, experience and certifications. No runtime analytics or external asset requests.

## Local preview

```sh
python3 -m http.server 8790 --bind 127.0.0.1
```

Open http://127.0.0.1:8790/.

## Structure

- `index.html`: content and navigation
- `assets/css/`: responsive design and scroll choreography
- `assets/js/sculpture.js`: procedural 3D scene
- `assets/js/narrative.js`: progressive whole-page scroll experience
- `assets/js/main.js`: scene controls and motion preferences
- `vendor/`: Three.js and its environment helper

Reading view restores ordinary document flow. Reduced-motion preferences are respected, and a static illustration is available without WebGL. The ten certifications and all content remain available in reading mode.

The résumé document is intentionally not included. The primary contact button opens LinkedIn.

## Third-party licenses

Three.js and RoomEnvironment use the MIT license, included in `vendor/THREE-LICENSE.txt`. Geist and Bricolage Grotesque use the SIL Open Font License; their notices are in `assets/fonts/licenses/`.
