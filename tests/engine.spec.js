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

test('stash guarda cambios y permite restaurarlos', () => {
  const s=engine.initial();
  s.work['temporal.txt']='WIP';
  engine.updateDirty(s);
  expect(engine.stash(s,'push')).toBe('stash@{0}');
  expect(s.work['temporal.txt']).toBeUndefined();
  expect(engine.stash(s,'list')).toHaveLength(1);
  engine.stash(s,'pop');
  expect(s.work['temporal.txt']).toBe('WIP');
  expect(engine.stash(s,'list')).toHaveLength(0);
});
test('reset soft conserva staging y reset hard recupera el snapshot', () => {
  const s=engine.initial(),root=s.branches.main;
  s.work['change.txt']='contenido';s.staged={...s.work};
  engine.commit(s,'Cambio');
  engine.reset(s,'--soft',root);
  expect(s.staged['change.txt']).toBe('contenido');
  engine.reset(s,'--hard',root);
  expect(s.work['change.txt']).toBeUndefined();
  expect(s.staged).toBeNull();
});
test('cherry-pick aplica cambios de otra rama como nuevo commit', () => {
  const s=engine.initial(),root=s.branches.main;
  s.branches.feature=root;s.branch='feature';
  s.work['feature.txt']='contenido';s.staged={...s.work};
  const id=engine.commit(s,'Agregar feature');
  s.branch='main';s.work={...s.commits[root].files};s.staged=null;
  const created=engine.cherryPick(s,id);
  expect(s.commits[created].parents).toEqual([root]);
  expect(s.work['feature.txt']).toBe('contenido');
});
test('tags apuntan a snapshots y no se pueden duplicar', () => {
  const s=engine.initial();
  expect(engine.tag(s,'v1.0.0')).toBe('a1b2c3');
  expect(engine.tag(s)).toEqual({'v1.0.0':'a1b2c3'});
  expect(()=>engine.tag(s,'v1.0.0')).toThrow();
});
