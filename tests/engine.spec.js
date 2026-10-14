const { test, expect } = require('@playwright/test');
const engine = require('../engine.js');

test('motor: crea commits y mantiene snapshots separados por rama', () => {
  const s=engine.initial();
  s.work['archivo.txt']='Versión inicial';
  s.staged={...s.work};
  const first=engine.commit(s,'primer cambio');
  expect(s.branches.main).toBe(first);
  expect(engine.head(s).files['archivo.txt']).toBe('Versión inicial');
  s.branches['feature/Mariana']=first;
  s.branch='feature/Mariana';
  s.work['archivo.txt']='Cambio de Mariana';
  s.staged={...s.work};
  const second=engine.commit(s,'segundo cambio');
  expect(engine.reachable(s,second,first)).toBeTruthy();
  expect(engine.reachable(s,first,second)).toBeFalsy();
  expect(s.commits[first].files['archivo.txt']).toBe('Versión inicial');
  expect(s.commits[second].files['archivo.txt']).toBe('Cambio de Mariana');
});

test('motor: detecta ancestro común entre historias divergentes', () => {
  const s=engine.initial(),root=s.branches.main;
  s.branches.feature=root;
  s.branch='feature';s.work['feature.txt']='x';s.staged={...s.work};
  const feature=engine.commit(s,'feature');
  s.branch='main';s.work={...s.commits[root].files,'main.txt':'y'};s.staged={...s.work};
  const main=engine.commit(s,'main');
  expect(engine.ancestor(s,main,feature)).toBe(root);
  expect(engine.reachable(s,main,feature)).toBeFalsy();
  expect(engine.reachable(s,feature,main)).toBeFalsy();
});

test('motor: marca cambios pendientes y los limpia después del commit', () => {
  const s=engine.initial();
  s.work['nuevo.txt']='nuevo';
  expect(engine.updateDirty(s)).toBeTruthy();
  s.staged={...s.work};
  engine.commit(s,'agregar archivo');
  expect(s.dirty).toBeFalsy();
});
