/* ===== Puntos 5S: módulos, mis tareas, asignación (admin) ===== */
function renderSide(){$('#sideMods').innerHTML=DB.get('modulos',[]).map(m=>`<div class="sm1"><i data-lucide="cpu"></i>${esc(m)}</div>`).join('')}
function renderBadges(){const s=stats();$('#bTk').textContent=s.t.filter(activo).length;$('#bTareas').textContent=misPend().length}

/* Lo activo de un módulo: puntos 5S sin cerrar + tickets abiertos/asignados */
const modActivos=m=>[
 ...DB.get('puntos',[]).filter(p=>p.modulo===m&&p.estado!=='atendido').map(p=>({k:'p',x:p,asig:p.usuarioAsignado,fecha:p.fechaLevantamiento,txt:p.descripcion})),
 ...DB.get('tickets',[]).filter(t=>t.modulo===m&&activo(t)).map(t=>({k:'t',x:t,asig:t.usuarioAsignado,fecha:fmtD(t.creado),txt:t.resumen}))
].sort((a,b)=>(!!a.asig-!!b.asig)||String(a.fecha).localeCompare(String(b.fecha)));

function renderModulos(){
 const P=DB.get('puntos',[]);
 $('#v-modulos').innerHTML=`<div class="ph"><div><h2>Módulos de pruebas L10</h2><p>Todo lo activo por módulo y a quién está cargado · lo que parpadea en amarillo aún no tiene responsable</p></div><div class="acts"><button class="btn" onclick="modNuevo()"><i data-lucide="plus"></i>Nuevo módulo</button></div></div>
 <div class="stack">${DB.get('modulos',[]).map(m=>{const ps=P.filter(p=>p.modulo===m),ok=ps.filter(p=>p.estado==='atendido').length,pc=ps.length?Math.round(ok/ps.length*100):0,
 act=modActivos(m),sin=act.filter(a=>!a.asig).length;
 return`<div class="card"><div class="ch2"><h4><i data-lucide="box"></i>${esc(m)}</h4><span class="mu sm">${act.length} activo(s)${sin?` · <b class="warn-t">${sin} sin asignar</b>`:''} · ${ok}/${ps.length} puntos 5S resueltos · ${pc}%</span></div><div class="bar"><i style="width:0" data-w="${pc}"></i></div>
 <div class="tw"><table><thead><tr><th>Tipo</th><th>Detalle</th><th>Levantado por</th><th>Fecha</th><th>Cargado a</th><th>Estado</th><th></th></tr></thead><tbody>${act.length?act.map(a=>modFila(a)).join(''):'<tr><td colspan="7" class="empty">Sin pendientes activos</td></tr>'}</tbody></table></div></div>`}).join('')}</div>`;
 requestAnimationFrame(()=>$$('[data-w]').forEach(e=>e.style.width=e.dataset.w+'%'));
}
function modFila(a){
 const x=a.x,esP=a.k==='p',sin=!a.asig,ib=(i,tip,fn,c='')=>`<button class="ib ${c}" title="${tip}" onclick="${fn}"><i data-lucide="${i}"></i></button>`;
 const quien=esP?x.usuarioLevanta:x.usuarioReporta;
 let acc='';
 if(sin&&(esP?esAdmin():puedeGestionar()))acc+=`<button class="btn b-amb" onclick="${esP?`ptAsignar('${x.id}')`:`tkAsignar('${x.id}')`}"><i data-lucide="user-plus"></i>Asignar</button>`;
 if(esP){if(ptMio(x))acc+=ib('pencil','Editar mi punto',`ptEditar('${x.id}')`)+ib('trash-2','Eliminar mi punto',`ptEliminar('${x.id}')`,'no');acc+=ib('check','Cerrar',`ptCerrar('${x.id}')`,'ok')}
 else acc+=ib('eye','Detalle',`tkDetalle('${x.id}')`);
 return`<tr class="row${sin?' sin-asig':''}"><td><span class="badge" style="--c:${esP?'var(--pri)':URG[x.urgencia].c}">${esP?'Punto 5S':'Ticket '+esc(x.id)}</span></td><td><b>${esc(a.txt)}</b></td><td class="mu">${esc(nom(quien))}</td><td class="mono mu">${esc(a.fecha)}</td><td>${sin?'<span class="warn-t">Sin asignar</span>':esc(nom(a.asig))}</td><td>${badge(esP?x.estado:x.estado)}</td><td class="ra">${acc}</td></tr>`;
}

/* Mis tareas: pendientes (puntos 5S y tickets cargados al usuario) y terminadas */
const misPend=()=>[
 ...DB.get('puntos',[]).filter(p=>p.usuarioAsignado===S.user&&p.estado!=='atendido').map(p=>({k:'p',x:p})),
 ...DB.get('tickets',[]).filter(t=>t.usuarioAsignado===S.user&&t.estado==='asignado').map(t=>({k:'t',x:t}))];
const misTerm=()=>[
 ...DB.get('puntos',[]).filter(p=>p.estado==='atendido'&&(p.usuarioAsignado===S.user||p.usuarioCierra===S.user)).map(p=>({k:'p',x:p,f:p.fechaCumplido||''})),
 ...DB.get('tickets',[]).filter(t=>t.estado==='resuelto'&&(t.usuarioAsignado===S.user||t.cierra===S.user)).map(t=>({k:'t',x:t,f:t.cerrado?hoy(new Date(t.cerrado)):''}))
].sort((a,b)=>String(b.f).localeCompare(String(a.f)));

function renderTareas(){
 const mis=misPend().sort((a,b)=>{const fa=a.k==='p'?(a.x.fechaLimite||'9'):hoy(new Date(a.x.sla)),fb=b.k==='p'?(b.x.fechaLimite||'9'):hoy(new Date(b.x.sla));return fa.localeCompare(fb)});
 const ter=misTerm();
 const pend=mis.length?mis.map((a,i)=>{const p=a.x;
  if(a.k==='t')return`<tr class="row" style="animation-delay:${i*40}ms"><td>${urgB(p.urgencia)}</td><td>${esc(p.modulo)}</td><td><b>${esc(p.resumen)}</b><div class="sm mu">Ticket ${esc(p.id)}</div></td><td class="mu">${esc(nom(p.usuarioReporta))}</td><td class="mono">${esc(fmtD(p.sla))}${slaHtml(p)}</td><td>${badge(p.estado)}${p.avance==='en_proceso'?'<div class="sm" style="color:var(--warn)">▶ En proceso</div>':''}</td><td class="ra"><button class="ib" title="Detalle" onclick="tkDetalle('${p.id}')"><i data-lucide="eye"></i></button>${puedeGestionar()?`<button class="ib ok" title="Resolver" onclick="tkResolver('${p.id}')"><i data-lucide="check"></i></button>`:''}</td></tr>`;
  const d=p.fechaLimite?Math.ceil((new Date(p.fechaLimite+'T23:59:59')-Date.now())/864e5):null;
  return`<tr class="row" style="animation-delay:${i*40}ms"><td><span class="crit" style="--c:${PCRIT[p.criticidad||1]}">Nivel ${p.criticidad||1}</span></td><td>${esc(p.modulo)}</td><td><b>${esc(p.descripcion)}</b><div class="sm mu">Punto 5S</div></td><td class="mu">${esc(nom(p.usuarioLevanta))}</td><td class="mono">${esc(p.fechaLimite||'Sin límite')}${d!==null?`<div class="sm" style="color:${d<0?'var(--bad)':d<=1?'var(--warn)':'var(--good)'}">${d<0?'Vencida':d===0?'Vence hoy':'En '+d+' día(s)'}</div>`:''}</td><td>${badge(p.estado)}</td><td class="ra"><button class="ib ok" title="Cerrar" onclick="ptCerrar('${p.id}')"><i data-lucide="check"></i></button></td></tr>`}).join(''):'<tr><td colspan="7" class="empty">No tienes tareas pendientes</td></tr>';
 const term=ter.length?ter.map((a,i)=>{const p=a.x,esP=a.k==='p';
  return`<tr class="row" style="animation-delay:${Math.min(i,10)*30}ms"><td><span class="badge" style="--c:var(--good)">${esP?'Punto 5S':'Ticket '+esc(p.id)}</span></td><td>${esc(p.modulo)}</td><td><b>${esc(esP?p.descripcion:p.resumen)}</b></td><td class="mu">${esc(nom(esP?p.usuarioLevanta:p.usuarioReporta))}</td><td class="mono">${esc(a.f||'—')}</td><td class="ra">${esP?'':`<button class="ib" title="Detalle" onclick="tkDetalle('${p.id}')"><i data-lucide="eye"></i></button>`}</td></tr>`}).join(''):'<tr><td colspan="6" class="empty">Aún no has terminado tareas</td></tr>';
 $('#v-tareas').innerHTML=`<div class="ph"><div><h2>Mis tareas asignadas</h2><p>Tus pendientes ordenados por fecha límite · criticidad de 1 (baja) a 5 (crítica)</p></div></div>
 <div class="card flush"><div class="tw"><table><thead><tr><th>Criticidad / urgencia</th><th>Módulo</th><th>Tarea</th><th>Levantó</th><th>Fecha límite</th><th>Estado</th><th></th></tr></thead><tbody>${pend}</tbody></table></div></div>
 <div class="ph" style="margin-top:26px"><div><h2>Tareas terminadas</h2><p>Todo lo que ya cumpliste · ${ter.length} en total</p></div></div>
 <div class="card flush"><div class="tw"><table><thead><tr><th>Tipo</th><th>Módulo</th><th>Tarea</th><th>Levantó</th><th>Cumplida</th><th></th></tr></thead><tbody>${term}</tbody></table></div></div>`;
}
function renderAdmin(){
 if(!esAdmin()){$('#v-admin').innerHTML=`<div class="ph"><div><h2>Asignación de tareas</h2></div></div><div class="lock"><i data-lucide="shield-alert"></i>Acceso restringido. Cambia al rol Admin para asignar tareas.</div>`;return}
 const sin=DB.get('puntos',[]).filter(p=>!p.usuarioAsignado&&p.estado!=='atendido');
 $('#v-admin').innerHTML=`<div class="ph"><div><h2>Asignación de tareas</h2><p>Define responsable, plazo y criticidad de cada punto 5S</p></div></div>
 <div class="card flush"><div class="tw"><table><thead><tr><th>Módulo</th><th>Punto</th><th>Levantado</th><th></th></tr></thead><tbody>${sin.length?sin.map((p,i)=>`<tr class="row" style="animation-delay:${i*40}ms"><td><b>${esc(p.modulo)}</b></td><td>${esc(p.descripcion)}</td><td class="mono mu">${esc(p.fechaLevantamiento)}</td><td class="ra"><button class="btn b-pri" onclick="ptAsignar('${p.id}')">Asignar</button></td></tr>`).join(''):'<tr><td colspan="4" class="empty">Todo está asignado</td></tr>'}</tbody></table></div></div>`;
}
function ptMut(id,fn){const a=DB.get('puntos',[]),p=a.find(x=>x.id===id);if(p)fn(p);DB.set('puntos',a);renderAll()}
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
