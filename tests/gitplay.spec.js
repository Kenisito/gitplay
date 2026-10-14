const { test, expect } = require('@playwright/test');
const { resolve } = require('node:path');
const url = 'file://' + resolve(__dirname, '..', 'index.html');

async function command(page, value) {
  await page.locator('#command').fill(value);
  await page.locator('#command-form button[type=submit]').click();
}

test.beforeEach(async ({ page }) => {
  await page.goto(url);
  page.on('dialog', dialog => dialog.accept());
});

test('carga la interfaz y comienza sin errores', async ({ page }) => {
  await expect(page).toHaveTitle(/GitPlay/);
  await expect(page.locator('#current-branch')).toHaveText('main');
  await expect(page.locator('#stat-commits')).toHaveText('1');
  await expect(page.locator('#progress-text')).toHaveText('0 / 5 misiones');
});

test('status, archivo, staging y commit cumplen las primeras misiones', async ({ page }) => {
  await command(page, 'git status');
  await command(page, 'touch avance.txt');
  await command(page, 'git add .');
  await command(page, 'git commit -m "Mi avance"');
  await expect(page.locator('#stat-commits')).toHaveText('2');
  await expect(page.locator('#progress-text')).toHaveText('3 / 5 misiones');
  await expect(page.locator('#xp')).toContainText('300 XP');
  await expect(page.locator('#file-list')).toContainText('avance.txt');
});

test('rama feature, commit y merge fast-forward', async ({ page }) => {
  await command(page, 'git switch -c feature');
  await command(page, 'touch feature.txt');
  await command(page, 'git add .');
  await command(page, 'git commit -m "Funcionalidad nueva"');
  await command(page, 'git switch main');
  await expect(page.locator('#file-list')).not.toContainText('feature.txt');
  await command(page, 'git merge feature');
  await expect(page.locator('#current-branch')).toHaveText('main');
  await expect(page.locator('#file-list')).toContainText('feature.txt');
  await expect(page.locator('#console')).toContainText('Fast-forward');
  await expect(page.locator('#stat-branches')).toHaveText('2');
  await expect(page.locator('#progress-text')).toHaveText('1 / 5 misiones');
});

test('detecta y permite resolver un conflicto en merge de tres vías', async ({ page }) => {
  await page.locator('#demo-conflict').click();
  await command(page, 'git merge feature');
  await expect(page.locator('#console')).toContainText('CONFLICTO');
  await expect(page.locator('#conflict-panel')).toContainText('Conflicto en mensaje.txt');
  await page.getByRole('button', { name: 'Usar feature' }).click();
  await page.getByRole('button', { name: 'Guardar y marcar resuelto' }).click();
  await command(page, 'git commit -m "Resolver conflicto"');
  await expect(page.locator('#console')).toContainText('Commit creado correctamente');
  await expect(page.locator('#progress-text')).toHaveText('1 / 5 misiones');
  await page.locator('#file-list').getByText('mensaje.txt').click();
  await expect(page.locator('#file-content')).toHaveValue(/Hola desde feature/);
});

test('el progreso se conserva al recargar', async ({ page }) => {
  await command(page, 'git status');
  await page.reload();
  await expect(page.locator('#progress-text')).toHaveText('1 / 5 misiones');
  await expect(page.locator('#xp')).toContainText('100 XP');
});

test('rama con slash, push remoto y retorno a main', async ({ page }) => {
  await command(page, 'git switch -c feature/Mariana');
  await expect(page.locator('#current-branch')).toHaveText('feature/Mariana');
  await command(page, 'touch propuesta.txt');
  await command(page, 'git add .');
  await command(page, 'git commit -m "Agregar propuesta"');
  await command(page, 'git push -u origin feature/Mariana');
  await expect(page.locator('#console')).toContainText('Push simulado OK');
  await command(page, 'git branch -a');
  await expect(page.locator('#console')).toContainText('remotes/origin/feature/Mariana');
  await command(page, 'git switch main');
  await expect(page.locator('#file-list')).not.toContainText('propuesta.txt');
  await command(page, 'git merge feature/Mariana');
  await command(page, 'git push origin main');
  await expect(page.locator('#file-list')).toContainText('propuesta.txt');
});
test('diff, mv, restore y rm alteran el repositorio virtual', async ({ page }) => {
  await command(page, 'touch demo.txt');
  await command(page, 'git mv demo.txt renombrado.txt');
  await expect(page.locator('#file-list')).toContainText('renombrado.txt');
  await command(page, 'git diff');
  await expect(page.locator('#console')).toContainText('renombrado.txt');
  await command(page, 'git rm renombrado.txt');
  await expect(page.locator('#file-list')).not.toContainText('renombrado.txt');
  await command(page, 'git restore README.md');
  await expect(page.locator('#file-list')).toContainText('README.md');
});

test('la tarjeta de misión se sincroniza con comandos y enseña el checklist', async ({ page }) => {
  await expect(page.locator('#mission-count')).toContainText('0 / 1');
  await command(page, 'git status');
  await expect(page.locator('#mission-activity')).toContainText('git status');
  await expect(page.locator('#mission-count')).toContainText('1 / 1');
  await page.locator('#next-mission').click();
  await expect(page.locator('#mission-title')).toContainText('primer archivo');
  await command(page, 'touch avance.txt');
  await expect(page.locator('#mission-steps')).toContainText('Crear avance.txt');
  await expect(page.locator('#mission-activity')).toContainText('touch avance.txt');
});

test('comandos rápidos e historial de terminal', async ({ page }) => {
  await page.locator('[data-command="git status"]').click();
  await expect(page.locator('#console')).toContainText('On branch main');
  await expect(page.locator('#tree-indicator')).toContainText('Limpio');
  await command(page, 'touch test-ui.txt');
  await expect(page.locator('#tree-indicator')).toContainText('Cambios pendientes');
  await page.locator('#command').press('ArrowUp');
  await expect(page.locator('#command')).toHaveValue('touch test-ui.txt');
});
test('muestra aviso antes de descartar ediciones no guardadas', async ({ page }) => {
  await page.locator('#file-content').fill('Contenido sin guardar');
  let message = '';
  page.removeAllListeners('dialog');
  page.once('dialog', async dialog => { message = dialog.message(); await dialog.dismiss(); });
  await page.locator('[data-command="git status"]').click();
  expect(message).toContain('sin guardar');
  await expect(page.locator('#file-content')).toHaveValue('Contenido sin guardar');
});

test('git add sin cambios no muestra staging falso', async ({ page }) => {
  await command(page, 'git add .');
  await expect(page.locator('#console')).toContainText('No hay cambios nuevos para preparar');
  await expect(page.locator('#tree-indicator')).toContainText('Limpio');
});

test('git add con cambios avanza checklist pero requiere commit', async ({ page }) => {
  await command(page, 'git status');
  await command(page, 'touch avance.txt');
  await page.locator('#next-mission').click();
  await page.locator('#next-mission').click();
  await command(page, 'git add .');
  await expect(page.locator('#mission-context')).toContainText('Ya ejecutaste git add .');
  await expect(page.locator('#mission-steps')).toContainText('✓ Preparar cambios con git add .');
  await command(page, 'git commit -m "Mi avance"');
  await expect(page.locator('#progress-text')).toContainText('3 / 5');
});

test('permite crear rama nueva conservando cambios preparados', async ({ page }) => {
  await command(page, 'touch pendiente.txt');
  await command(page, 'git add .');
  await command(page, 'git status');
  await expect(page.locator('#console')).toContainText('Changes staged for commit: pendiente.txt');
  await command(page, 'git switch -c feature/Mariana');
  await expect(page.locator('#current-branch')).toHaveText('feature/Mariana');
  await command(page, 'git commit -m "Guardar pendiente"');
  await expect(page.locator('#console')).toContainText('Commit creado correctamente');
  await expect(page.locator('#file-list')).toContainText('pendiente.txt');
});
