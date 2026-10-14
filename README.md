# GitPlay 🎮

Plataforma interactiva para aprender Git desde el navegador, sin instalaciones.

## Cómo probarlo

Abre `index.html` en tu navegador. Practica:

```bash
git status
touch avance.txt
git add .
git commit -m "Mi avance"
git switch -c feature
touch extra.txt
git add .
git commit -m "Agregar extra"
git switch main
git merge feature
```

## Incluye

- Terminal Git educativa y explorador de archivos.
- Ramas y commits con snapshots de contenido.
- Merge fast-forward y merge de tres vías con conflictos por archivo.
- Editor visual de resolución de conflictos.
- Grafo de commits, cinco misiones y puntos de experiencia.
- Progreso guardado en `localStorage`.

Usa **Preparar escenario de conflicto** para entrenar con un merge conflict.

**Nota:** El motor es una simulación educativa, no ejecuta Git real ni reproduce todos sus casos límite.

## Próximas mejoras

- [ ] Separar motor Git y UI, añadir pruebas automatizadas.
- [ ] Grafo DAG más detallado y animaciones.
- [ ] Simulador de Pull Requests, revisiones y GitHub Actions.
- [ ] Experiencia móvil y accesibilidad.
- [ ] Publicar en GitHub Pages o Cloudflare Pages.

## Tecnologías

HTML, CSS y JavaScript sin dependencias.

## Pruebas automatizadas

GitHub Actions ejecuta las pruebas de navegador en cada push a `main` y en cada Pull Request.

```bash
npm install
npx playwright install chromium
npm test
```

Consulta el resultado en [GitHub Actions](https://github.com/Kenisito/gitplay/actions).

## Laboratorio de Pull Requests

Después de crear un commit en una rama `feature/*`, publica la rama con `git push -u origin feature/Mariana`. Abre el panel **Laboratorio de Pull Requests**, selecciona la rama, crea el PR, inspecciona los cambios, deja comentarios, apruébalo y realiza el merge. Para recuperar los cambios fusionados en tu rama `main` local, utiliza `git switch main` y `git pull origin main`.

Los Pull Requests son simulados y se guardan localmente en el navegador. No se realizan solicitudes a GitHub.
