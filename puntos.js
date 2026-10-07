/* ===== Puntos 5S: módulos, mis tareas, asignación (admin) ===== */
function renderSide(){$('#sideMods').innerHTML=DB.get('modulos',[]).map(m=>`<div class="sm1"><i data-lucide="cpu"></i>${esc(m)}</div>`).join('')}
function renderBadges(){const s=stats();$('#bTk').textContent=s.t.filter(activo).length;$('#bTareas').textContent=s.p.filter(p=>p.usuarioAsignado===S.user&&p.estado!=='atendido').length}

function renderModulos(){
 const P=DB.get('puntos',[]);
 $('#v-modulos').innerHTML=`<div class="ph"><div><h2>Módulos de pruebas L10</h2><p>Avance de hallazgos 5S por área</p></div><div class="acts"><button class="btn" onclick="modNuevo()"><i data-lucide="plus"></i>Nuevo módulo</button><button class="btn b-pri" onclick="ptNuevo()"><i data-lucide="plus-circle"></i>Levantar punto 5S</button></div></div>
 <div class="stack">${DB.get('modulos',[]).map(m=>{const ps=P.filter(p=>p.modulo===m),ok=ps.filter(p=>p.estado==='atendido').length,pc=ps.length?Math.round(ok/ps.length*100):0;
 return`<div class="card"><div class="ch2"><h4><i data-lucide="box"></i>${esc(m)}</h4><span class="mu sm">${ok}/${ps.length} resueltos · ${pc}%</span></div><div class="bar"><i style="width:0" data-w="${pc}"></i></div>
 <div class="tw"><table><thead><tr><th>Hallazgo</th><th>Levantado por</th><th>Fecha</th><th>Asignado</th><th>Estado</th><th></th></tr></thead><tbody>${ps.length?ps.map(p=>`<tr><td><b>${esc(p.descripcion)}</b></td><td class="mu">${esc(nom(p.usuarioLevanta))}</td><td class="mono mu">${esc(p.fechaLevantamiento)}</td><td>${p.usuarioAsignado?esc(nom(p.usuarioAsignado)):'<span class="warn-t">Sin asignar</span>'}</td><td>${badge(p.estado)}</td><td class="ra">${ptMio(p)?`<button class="ib" title="Editar mi punto" onclick="ptEditar('${p.id}')"><i data-lucide="pencil"></i></button><button class="ib no" title="Eliminar mi punto" onclick="ptEliminar('${p.id}')"><i data-lucide="trash-2"></i></button>`:''}${p.estado!=='atendido'?`<button class="ib ok" title="Cerrar" onclick="ptCerrar('${p.id}')"><i data-lucide="check"></i></button>`:`<span class="mu sm">Cerrado ${esc(p.fechaCumplido)}</span>`}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">Sin hallazgos</td></tr>'}</tbody></table></div></div>`}).join('')}</div>`;
 requestAnimationFrame(()=>$$('[data-w]').forEach(e=>e.style.width=e.dataset.w+'%'));
}
function renderTareas(){
 const mis=DB.get('puntos',[]).filter(p=>p.usuarioAsignado===S.user&&p.estado!=='atendido').sort((a,b)=>(a.fechaLimite||'9').localeCompare(b.fechaLimite||'9'));
 $('#v-tareas').innerHTML=`<div class="ph"><div><h2>Mis tareas asignadas</h2><p>Ordenadas por fecha límite · criticidad de 1 (baja) a 5 (crítica)</p></div></div>
 <div class="card flush"><div class="tw"><table><thead><tr><th>Criticidad</th><th>Módulo</th><th>Punto</th><th>Levantó</th><th>Fecha límite</th><th>Estado</th><th></th></tr></thead><tbody>${mis.length?mis.map((p,i)=>{const d=p.fechaLimite?Math.ceil((new Date(p.fechaLimite+'T23:59:59')-Date.now())/864e5):null;
 return`<tr class="row" style="animation-delay:${i*40}ms"><td><span class="crit" style="background:${PCRIT[p.criticidad||1]}">Nivel ${p.criticidad||1}</span></td><td>${esc(p.modulo)}</td><td><b>${esc(p.descripcion)}</b></td><td class="mu">${esc(nom(p.usuarioLevanta))}</td><td class="mono">${esc(p.fechaLimite||'Sin límite')}${d!==null?`<div class="sm" style="color:${d<0?'#f87171':d<=1?'#fbbf24':'#34d399'}">${d<0?'Vencida':d===0?'Vence hoy':'En '+d+' día(s)'}</div>`:''}</td><td>${badge(p.estado)}</td><td class="ra"><button class="ib ok" title="Cerrar" onclick="ptCerrar('${p.id}')"><i data-lucide="check"></i></button></td></tr>`}).join(''):'<tr><td colspan="7" class="empty">No tienes tareas pendientes</td></tr>'}</tbody></table></div></div>`;
}
function renderAdmin(){
 if(!esAdmin()){$('#v-admin').innerHTML=`<div class="ph"><div><h2>Asignación de tareas</h2></div></div><div class="lock"><i data-lucide="shield-alert"></i>Acceso restringido. Cambia al rol Admin para asignar tareas.</div>`;return}
 const sin=DB.get('puntos',[]).filter(p=>!p.usuarioAsignado&&p.estado!=='atendido');
 $('#v-admin').innerHTML=`<div class="ph"><div><h2>Asignación de tareas</h2><p>Define responsable, plazo y criticidad de cada punto 5S</p></div></div>
 <div class="card flush"><div class="tw"><table><thead><tr><th>Módulo</th><th>Punto</th><th>Levantado</th><th></th></tr></thead><tbody>${sin.length?sin.map((p,i)=>`<tr class="row" style="animation-delay:${i*40}ms"><td><b>${esc(p.modulo)}</b></td><td>${esc(p.descripcion)}</td><td class="mono mu">${esc(p.fechaLevantamiento)}</td><td class="ra"><button class="btn b-pri" onclick="ptAsignar('${p.id}')">Asignar</button></td></tr>`).join(''):'<tr><td colspan="4" class="empty">Todo está asignado</td></tr>'}</tbody></table></div></div>`;
}
function ptMut(id,fn){const a=DB.get('puntos',[]),p=a.find(x=>x.id===id);if(p)fn(p);DB.set('puntos',a);renderAll()}
function ptNuevo(){
 openModal({title:'Levantar punto 5S',icon:'plus-circle',body:fld('Módulo',`<select id="f_mod">${opts(DB.get('modulos',[]).map(m=>[m,m]))}</select>`)+fld('Descripción del hallazgo',`<textarea id="f_d" rows="3"></textarea>`),
 onOk(){const d=$('#f_d').value.trim();if(!d){toast('Escribe la descripción','err');return false}
  const a=DB.get('puntos',[]);a.unshift({id:'PUNTO-'+Date.now(),modulo:$('#f_mod').value,descripcion:d,estado:'pendiente',fechaLevantamiento:hoy(),usuarioLevanta:S.user,usuarioAsignado:null,fechaLimite:null,criticidad:null,fechaCumplido:null,usuarioCierra:null,personalApoyo:null});
  DB.set('puntos',a);toast('Punto registrado','ok');renderAll()}});
}
function ptCerrar(id){
 if(!puedeGestionar())return toast('Solo admin y usuarios comunes pueden cerrar','err');
 openModal({title:'Cerrar punto',icon:'check-circle-2',cls:'b-ok',ok:'Cerrar como solucionado',body:fld('¿Alguien apoyó en el cierre?',`<input id="f_a" placeholder="Nombres (opcional)">`),
 onOk(){const ap=$('#f_a').value.trim();ptMut(id,p=>{p.estado='atendido';p.fechaCumplido=hoy();p.usuarioCierra=S.user;p.personalApoyo=ap||null;notifyRoles(['admin'],`Punto solucionado por ${nom(S.user)}: "${p.descripcion.slice(0,40)}…"`)});toast('Punto cerrado','ok')}});
}
function ptAsignar(id){
 openModal({title:'Asignar tarea',icon:'user-plus',ok:'Cargar tarea',
 body:fld('Trabajador',`<select id="f_u">${opts(usersRol(['admin','comun']))}</select>`)+fld('Fecha límite',`<input type="date" id="f_f">`)+fld('Criticidad (1 baja – 5 crítica)',`<select id="f_c">${opts([[1,'1 · Baja'],[2,'2 · Media baja'],[3,'3 · Media'],[4,'4 · Alta'],[5,'5 · Crítica']],3)}</select>`),
 onOk(){const f=$('#f_f').value;if(!f){toast('Selecciona fecha límite','err');return false}
  const u=$('#f_u').value,c=+$('#f_c').value;ptMut(id,p=>{p.usuarioAsignado=u;p.fechaLimite=f;p.criticidad=c;p.estado='en_proceso';notify(u,`Nueva tarea (nivel ${c}): "${p.descripcion.slice(0,40)}…"`)});beep();toast('Tarea asignada','ok')}});
}
function modNuevo(){
 if(!esAdmin())return toast('Solo el administrador crea módulos','err');
 openModal({title:'Nuevo módulo L10',icon:'layers',ok:'Crear módulo',body:fld('Nombre',`<input id="f_m" placeholder="Ej. Módulo 8">`),
 onOk(){const n=$('#f_m').value.trim();if(!n)return false;const a=DB.get('modulos',[]);if(!a.includes(n)){a.push(n);DB.set('modulos',a)}renderAll()}});
}

/* Editar / eliminar: solo admin y usuario común, y solo puntos propios no cerrados */
const ptMio=p=>puedeGestionar()&&p.usuarioLevanta===S.user&&p.estado!=='atendido';
function ptEditar(id){
 const p=DB.get('puntos',[]).find(x=>x.id===id);if(!p)return;
 openModal({title:'Editar punto 5S',icon:'pencil',ok:'Guardar cambios',body:fld('Módulo',`<select id="f_mod">${opts(DB.get('modulos',[]).map(m=>[m,m]),p.modulo)}</select>`)+fld('Descripción',`<textarea id="f_d" rows="3">${esc(p.descripcion)}</textarea>`),
 onOk(){const d=$('#f_d').value.trim();if(!d){toast('Escribe la descripción','err');return false}ptMut(id,k=>{k.modulo=$('#f_mod').value;k.descripcion=d});toast('Punto actualizado','ok')}});
}
function ptEliminar(id){
 openModal({title:'Eliminar punto',icon:'trash-2',cls:'b-no',ok:'Eliminar',body:'<p>El punto se eliminará de forma permanente.</p>',onOk(){DB.set('puntos',DB.get('puntos',[]).filter(x=>x.id!==id));toast('Punto eliminado');renderAll()}});
}
