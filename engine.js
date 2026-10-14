/* GitPlay: motor de repositorio independiente de la interfaz. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function initial(){return {remote:{main:'a1b2c3'},tracking:{main:'a1b2c3'},branch:'main',branches:{main:'a1b2c3'},commits:{a1b2c3:{id:'a1b2c3',message:'Commit inicial',parents:[],files:{'README.md':'# Mi proyecto GitPlay\n'}}},work:{'README.md':'# Mi proyecto GitPlay\n'},staged:null,dirty:false,merging:null,observedStatus:false,completed:[],selected:'README.md',level:0,everMergedFeature:false,resolvedMerge:false,activity:[],featureCommit:false};}
function head(state){return state.commits[state.branches[state.branch]];}
function reachable(state,start,goal){const todo=[start],seen=new Set();while(todo.length){const id=todo.pop();if(id===goal)return true;if(seen.has(id)||!state.commits[id])continue;seen.add(id);todo.push(...state.commits[id].parents);}return false;}
function updateDirty(state){state.dirty=JSON.stringify(state.work)!==JSON.stringify(head(state).files);return state.dirty;}
function commit(state,message,parents){let id;do{id=Math.random().toString(16).slice(2,9).padEnd(7,'0')}while(state.commits[id]);state.commits[id]={id,message,parents:parents||[state.branches[state.branch]],files:clone(state.staged??state.work)};state.branches[state.branch]=id;state.work=clone(state.commits[id].files);state.staged=null;state.merging=null;updateDirty(state);return id;}
function ancestor(state,a,b){const seen=new Set(),visit=(id,acc)=>{if(!id||acc.has(id))return;acc.add(id);(state.commits[id]?.parents||[]).forEach(p=>visit(p,acc));};visit(a,seen);const queue=[b],done=new Set();while(queue.length){const id=queue.shift();if(seen.has(id))return id;if(done.has(id))continue;done.add(id);queue.push(...(state.commits[id]?.parents||[]));}return null;}
const engine=Object.freeze({initial,head,reachable,updateDirty,commit,ancestor,clone});root.GitPlayEngine=engine;if(typeof module!=='undefined'&&module.exports)module.exports=engine;
})(globalThis);
