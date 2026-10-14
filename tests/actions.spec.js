const { test, expect } = require('@playwright/test');
const workflows = require('../actions-engine.js');
test('CI ejecuta build y test en orden',()=>{const f=workflows.create('ci');expect(workflows.validate(f)).toEqual([['build'],['test']]);const result=workflows.simulate(f);expect(result.success).toBeTruthy();expect(result.status.test).toBe('success')});
test('fallo de tests impide desplegar',()=>{const r=workflows.simulate(workflows.create('failure'));expect(r.status.test).toBe('failure');expect(r.status.deploy).toBe('skipped');expect(r.success).toBeFalsy()});
test('reintento permite recuperar el pipeline',()=>{const r=workflows.simulate(workflows.create('failure'),{retryFailed:true});expect(r.success).toBeTruthy()});
test('valida dependencias circulares',()=>{const f=workflows.create('ci');f.jobs[0].needs=['test'];expect(()=>workflows.validate(f)).toThrow(/circulares/)});
test('interfaz de Actions ejecuta y reintenta',async({page})=>{await page.goto('file://'+require('node:path').resolve(__dirname,'..','index.html'));await page.locator('#wf-template').selectOption('failure');await page.locator('#wf-load').click();await page.locator('#wf-run').click();await expect(page.locator('#wf-logs')).toContainText('omitido por dependencia fallida');await page.locator('#wf-retry').click();await expect(page.locator('#wf-overview')).toContainText('Ejecución exitosa')});
