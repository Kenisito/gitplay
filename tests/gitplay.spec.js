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
  await expect(page.locator('#progress-text')).toHaveText('2 / 5 misiones');
  await page.locator('#file-list').getByText('mensaje.txt').click();
  await expect(page.locator('#file-content')).toHaveValue(/Hola desde feature/);
});

test('el progreso se conserva al recargar', async ({ page }) => {
  await command(page, 'git status');
  await page.reload();
  await expect(page.locator('#progress-text')).toHaveText('1 / 5 misiones');
  await expect(page.locator('#xp')).toContainText('100 XP');
});
