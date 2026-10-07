/* ===== Tickets: lista, urgencia/SLA, asignar, resolver, rechazar, detalle ===== */
let tkF='activos',tkQ='';
const TKF={activos:activo,abierto:t=>t.estado==='abierto',asignado:t=>t.estado==='asignado',resuelto:t=>t.estado==='resuelto',rechazado:t=>t.estado==='rechazado',todos:()=>true};
const TKL={activos:'Activos',abierto:'Abiertos',asignado:'Asignados',resuelto:'Resueltos',rechazado:'Rechazados',todos:'Todos'};

function renderTickets(){
 const all=DB.get('tickets',[]);
 $('#v-tickets').innerHTML=`
 <div class="ph"><div><h2>Tickets y hallazgos</h2><p>Atención priorizada por nivel de urgencia y tiempo límite (SLA)</p></div><button class="btn b-amb" onclick="tkNuevo()"><i data-lucide="plus"></i>Nuevo ticket</button></div>
 <div class="scale">${Object.values(URG).map(u=>`<span style="--c:${u.c}"><i class="dot"></i>${u.n} · ${u.t}</span>`).join('')}</div>
 <div class="card flush"><div class="tb"><div class="chips">${Object.keys(TKF).map(k=>`<button class="${k===tkF?'on':''}" onclick="tkF='${k}';renderTickets();icons()">${TKL[k]}<em>${all.filter(TKF[k]).length}</em></button>`).join('')}</div>
 <input class="search" placeholder="Buscar folio, resumen, módulo…" value="${esc(tkQ)}" oninput="tkQ=this.value;drawTickets()"></div>
 <div class="tw"><table><thead><tr><th>Folio</th><th>Resumen</th><th>Módulo</th><th>Urgencia / tiempo límite</th><th>Asignado</th><th>Estado</th><th></th></tr></thead><tbody id="tkBody"></tbody></table></div></div>`;
 drawTickets();
}
function drawTickets(){
 const q=tkQ.toLowerCase(),can=puedeGestionar(),ic=(i,tip,fn,c='')=>`<button class="ib ${c}" title="${tip}" onclick="${fn}"><i data-lucide="${i}"></i></button>`;
 const rows=DB.get('tickets',[]).filter(TKF[tkF]).filter(t=>!q||[t.id,t.resumen,t.modulo,t.comentario].join(' ').toLowerCase().includes(q))
  .sort((a,b)=>(activo(b)-activo(a))||(activo(a)?a.sla-b.sla:b.creado-a.creado));
 $('#tkBody').innerHTML=rows.length?rows.map((t,i)=>`<tr class="row" style="animation-delay:${Math.min(i,10)*35}ms">
  <td class="mono acc">${esc(t.id)}</td>
  <td><b>${esc(t.resumen)}</b><div class="mu sm">${esc(t.comentario)}</div>${t.estado==='rechazado'?`<div class="sm" style="color:#f87171">Motivo: ${esc(t.motivoRechazo)}</div>`:''}</td>
  <td>${esc(t.modulo)}</td>
  <td>${urgB(t.urgencia)}<div class="sm mu">Atender en: ${URG[t.urgencia].t}</div>${slaHtml(t)}</td>
  <td>${t.usuarioAsignado?esc(nom(t.usuarioAsignado)):'<span class="warn-t">Sin asignar</span>'}</td>
  <td>${badge(t.estado)}</td>
  <td class="ra">${ic('eye','Detalle',`tkDetalle('${t.id}')`)}${can&&activo(t)&&t.usuarioReporta===S.user?ic('pencil','Editar mi ticket',`tkEditar('${t.id}')`)+ic('trash-2','Eliminar mi ticket',`tkEliminar('${t.id}')`,'no'):''}${can&&activo(t)?ic('user-check',t.estado==='abierto'?'Tomar / asignar':'Reasignar / cambiar urgencia',`tkAsignar('${t.id}')`)+ic('check','Resolver',`tkResolver('${t.id}')`,'ok')+(t.usuarioReporta!==S.user?ic('x','Rechazar',`tkRechazar('${t.id}')`,'no'):''):''}</td></tr>`).join(''):`<tr><td colspan="7" class="empty">Sin tickets en esta vista</td></tr>`;
 icons();
}
function tkMut(id,fn){const a=DB.get('tickets',[]),t=a.find(x=>x.id===id);if(!t)return;fn(t);DB.set('tickets',a);renderAll()}

function tkNuevo(){
 openModal({title:'Reportar ticket / hallazgo',icon:'alert-circle',cls:'b-amb',ok:'Emitir ticket',
 body:fld('Módulo afectado',`<select id="f_mod">${opts(DB.get('modulos',[]).map(m=>[m,m]))}</select>`)+fld('Resumen',`<input id="f_res" placeholder="Ej. Fuga de aire comprimido en jaula B">`)+fld('Detalles del hallazgo',`<textarea id="f_det" rows="3" placeholder="Describe la afectación para que el equipo pueda atenderla"></textarea>`)+urgPick(3),
 onOk(){
  const resumen=$('#f_res').value.trim(),comentario=$('#f_det').value.trim();
  if(!resumen||!comentario){toast('Completa el resumen y los detalles','err');return false}
  const a=DB.get('tickets',[]),u=urgVal(),now=Date.now();let id;do{id='TK-'+Math.floor(1000+Math.random()*9000)}while(a.some(t=>t.id===id));
  const t={id,modulo:$('#f_mod').value,resumen,comentario,usuarioReporta:S.user,usuarioAsignado:null,estado:'abierto',urgencia:u,creado:now,slaIni:now,sla:calcSla(now,u),hist:[]};
  addHist(t,'Ticket creado · Urgencia '+URG[u].n+' ('+URG[u].t+')');a.unshift(t);DB.set('tickets',a);
  const msg=`${u<=2?'🚨 ':''}Nuevo ticket ${id} (${URG[u].n}, atender en ${URG[u].t}): ${resumen}`;
  notifyRoles(['admin','comun'],msg);beep();toast('Ticket '+id+' emitido','ok');tkF='activos';renderAll();
 }});
}
function tkAsignar(id){
 const t=DB.get('tickets',[]).find(x=>x.id===id),lista=esAdmin()?usersRol(['admin','comun']):[[S.user,nom(S.user)+' (yo)']];
 openModal({title:`Asignar ${esc(id)}`,icon:'user-check',ok:'Guardar asignación',
 body:`<p class="mu sm">${esc(t.resumen)}</p>`+fld('Asignar a',`<select id="f_asg">${opts(lista,t.usuarioAsignado||S.user)}</select>`)+urgPick(t.urgencia),
 onOk(){const asg=$('#f_asg').value,u=urgVal();
  tkMut(id,t=>{if(u!==t.urgencia){addHist(t,`Urgencia: ${URG[t.urgencia].n} → ${URG[u].n}`);t.urgencia=u;t.slaIni=Date.now();t.sla=calcSla(t.slaIni,u);t.alertado=0}
   t.usuarioAsignado=asg;t.estado='asignado';addHist(t,'Asignado a '+nom(asg)+' · límite '+fmtD(t.sla));
   notify(t.usuarioReporta,`Tu ticket ${t.id} fue asignado a ${nom(asg)}. Atención antes de: ${fmtD(t.sla)}`);if(asg!==S.user)notify(asg,`Se te asignó ${t.id} (${URG[u].n}): ${t.resumen}`)});
  beep();toast('Ticket asignado','ok')}});
}
function tkResolver(id){
 const t=DB.get('tickets',[]).find(x=>x.id===id);
 openModal({title:`Resolver ${esc(id)}`,icon:'check-circle-2',cls:'b-ok',ok:'Marcar como resuelto',
 body:`<p class="mu sm">${esc(t.resumen)}</p>`+fld('¿Qué se hizo para resolverlo?',`<textarea id="f_sol" rows="3"></textarea>`)+fld('¿Alguien apoyó en el cierre?',`<input id="f_apo" placeholder="Nombres (opcional)">`),
 onOk(){const sol=$('#f_sol').value.trim(),apo=$('#f_apo').value.trim();
  tkMut(id,t=>{t.estado='resuelto';t.cierra=S.user;t.solucion=sol;t.apoyo=apo;t.cerrado=Date.now();addHist(t,'Resuelto'+(sol?': '+sol:'')+(apo?' · apoyo: '+apo:''));notify(t.usuarioReporta,`Tu ticket ${t.id} fue resuelto por ${nom(S.user)}.`)});
  beep();toast('Ticket resuelto','ok')}});
}
function tkRechazar(id){
 const t=DB.get('tickets',[]).find(x=>x.id===id);
 openModal({title:`Rechazar ${esc(id)}`,icon:'ban',cls:'b-no',ok:'Rechazar ticket',
 body:`<p class="mu sm">${esc(t.resumen)}</p>`+fld('Motivo del rechazo',`<select id="f_mot">${opts(MOTIVOS.map(m=>[m,m]))}</select>`)+fld('Explicación (obligatoria si el motivo es “Otro”)',`<textarea id="f_exp" rows="3" placeholder="Opcional: da contexto a quien reportó"></textarea>`),
 onOk(){const m=$('#f_mot').value,e=$('#f_exp').value.trim();
  if(m==='Otro'&&!e){toast('Explica el motivo del rechazo','err');return false}
  tkMut(id,t=>{t.estado='rechazado';t.motivoRechazo=m+(e?' — '+e:'');t.rechazadoPor=S.user;t.cerrado=Date.now();addHist(t,'Rechazado: '+t.motivoRechazo);notify(t.usuarioReporta,`Tu ticket ${t.id} fue rechazado por ${nom(S.user)}. Motivo: ${t.motivoRechazo}`)});
  beep();toast('Ticket rechazado y reportero notificado')}});
}
function tkDetalle(id){
 const t=DB.get('tickets',[]).find(x=>x.id===id);if(!t)return;
 openModal({title:`${esc(t.id)} · ${esc(t.resumen)}`,icon:'ticket',
 body:`<div style="display:flex;gap:8px;flex-wrap:wrap">${badge(t.estado)}${urgB(t.urgencia)}<span class="badge">${esc(t.modulo)}</span></div><p>${esc(t.comentario)}</p>
 <div class="sm mu">Reportó: ${esc(nom(t.usuarioReporta))} · Asignado: ${esc(nom(t.usuarioAsignado))} · Límite: ${fmtD(t.sla)} ${slaHtml(t)}</div>
 ${t.estado==='rechazado'?`<div class="rej"><b>Rechazado por ${esc(nom(t.rechazadoPor))}</b><br>${esc(t.motivoRechazo)}</div>`:''}
 <div class="tl">${(t.hist||[]).map(h=>`<div>${esc(h.txt)}<small>${fmtD(h.t)} · ${esc(nom(h.u))}</small></div>`).join('')}</div>`});
}

/* Editar / eliminar: solo admin y usuario común, y solo tickets propios que sigan activos */
function tkEditar(id){
 const t=DB.get('tickets',[]).find(x=>x.id===id);if(!t)return;
 openModal({title:`Editar ${esc(id)}`,icon:'pencil',ok:'Guardar cambios',
 body:fld('Módulo',`<select id="f_mod">${opts(DB.get('modulos',[]).map(m=>[m,m]),t.modulo)}</select>`)+fld('Resumen',`<input id="f_res" value="${esc(t.resumen)}">`)+fld('Detalles',`<textarea id="f_det" rows="3">${esc(t.comentario)}</textarea>`)+urgPick(t.urgencia),
 onOk(){const r=$('#f_res').value.trim(),d=$('#f_det').value.trim(),u=urgVal();if(!r||!d){toast('Completa resumen y detalles','err');return false}
  tkMut(id,k=>{k.modulo=$('#f_mod').value;k.resumen=r;k.comentario=d;if(u!==k.urgencia){addHist(k,`Urgencia: ${URG[k.urgencia].n} → ${URG[u].n}`);k.urgencia=u;k.slaIni=Date.now();k.sla=calcSla(k.slaIni,u);k.alertado=0}addHist(k,'Editado por su autor')});toast('Ticket actualizado','ok')}});
}
function tkEliminar(id){
 openModal({title:`Eliminar ${esc(id)}`,icon:'trash-2',cls:'b-no',ok:'Eliminar',body:'<p>El ticket se eliminará de forma permanente.</p>',
 onOk(){DB.set('tickets',DB.get('tickets',[]).filter(t=>t.id!==id));toast('Ticket eliminado');renderAll()}});
}
