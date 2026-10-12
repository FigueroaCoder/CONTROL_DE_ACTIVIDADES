/* ===== Portal del Reportero: interfaz propia, solo tickets (crear, seguimiento, historial propio y tablero del equipo) ===== */
let repTab='nuevo',repShown='',repMiF='todos',repEqF='todos',repQ='';
const REPTABS={nuevo:['plus-circle','Nuevo ticket'],mios:['clipboard-list','Mis tickets'],equipo:['users','Tablero del equipo']};

/* Fase vista por quien reporta. "Recién asignado" = ya lo aceptó alguien pero aún no empieza; "En proceso" = quien lo atiende ya lo marcó en proceso */
const FASE={nuevo:['Sin aceptar','#f59e0b','inbox'],asignado:['Recién asignado','#3b82f6','user-check'],proceso:['En proceso','#8b5cf6','loader'],
 resuelto:['Resuelto','#10b981','check-circle-2'],rechazado:['Rechazado','#ef4444','ban'],revocado:['Revocado','#64748b','undo-2']};
const tkFase=t=>t.estado==='abierto'?'nuevo':t.estado==='asignado'?(t.avance==='en_proceso'?'proceso':'asignado'):t.estado;
const faseB=f=>`<span class="badge" style="--c:${FASE[f][1]}"><i data-lucide="${FASE[f][2]}"></i>${FASE[f][0]}</span>`;

const REPF_M={todos:['Todos',()=>true],nuevo:['Sin aceptar',f=>f==='nuevo'],asignado:['Recién asignados',f=>f==='asignado'],proceso:['En proceso',f=>f==='proceso'],
 resuelto:['Resueltos',f=>f==='resuelto'],fin:['Rechazados / revocados',f=>f==='rechazado'||f==='revocado']};
const REPF_E={todos:['Todos',()=>true],nuevo:['Abiertos · sin aceptar',f=>f==='nuevo'],asignado:['Recién asignados',f=>f==='asignado'],proceso:['En proceso',f=>f==='proceso'],
 resuelto:['Cerrados · cumplidos',f=>f==='resuelto'],rechazado:['Rechazados',f=>f==='rechazado']};

function repGo(t){repTab=t;renderRep();scrollTo({top:0,behavior:'smooth'})}
function repSetF(k){if(repTab==='mios')repMiF=k;else repEqF=k;repRefresh();icons()}

function repShellHtml(){
 const u=USERS[S.user];
 return `<header class="rp-top">
  <div class="rp-brand"><i data-lucide="ticket"></i><div><b>Mesa de tickets</b><small>Portal de reportes · L10</small></div></div>
  <nav class="rp-tabs">${Object.entries(REPTABS).map(([k,[ic,l]])=>`<button data-t="${k}" onclick="repGo('${k}')"><i data-lucide="${ic}"></i>${l}${k==='mios'?'<em id="rpBMios">0</em>':''}</button>`).join('')}</nav>
  <div class="rp-user">
   <div class="rel"><button class="ib" onclick="repToggleNotifs()" title="Notificaciones"><i data-lucide="bell"></i><span id="repNB" class="nb"></span></button>
    <div id="repND" class="drop"><div class="dh2"><b>Notificaciones</b><button onclick="limpiarNotifs();repNotifs()">Limpiar</button></div><div id="repNL"></div></div></div>
   <span class="av">${esc(u.n[0].toUpperCase())}</span><div class="rp-nm"><b>${esc(u.n)}</b><small>${RL[u.r]}</small></div>
   <button class="ib" title="Cerrar sesión" onclick="FB.logout()"><i data-lucide="log-out"></i></button>
  </div></header><main class="rp-main" id="rpMain"></main>`;
}

function repSkeleton(){
 if(repTab==='nuevo')return `<section class="rp-new">
  <div class="card rp-form"><h2>¿Qué encontraste?</h2><p class="mu">Cuéntanos el hallazgo; el equipo lo recibirá al instante.</p>
   ${fld('Módulo afectado',`<select id="f_mod">${opts(DB.get('modulos',[]).map(m=>[m,m]))}</select>`)}
   ${fld('Resumen',`<input id="f_res" placeholder="Ej. Fuga de aire comprimido en jaula B">`)}
   ${fld('Detalles del hallazgo',`<textarea id="f_det" rows="4" placeholder="Describe la afectación para que el equipo pueda atenderla"></textarea>`)}
   ${urgPick(3)}
   <button class="btn b-pri rp-big" onclick="repEnviar()"><i data-lucide="send"></i>Enviar ticket</button></div>
  <aside class="rp-side">
   <div class="card"><h4><i data-lucide="route"></i>Qué sigue después</h4><ol class="rp-how"><li><b>Sin aceptar.</b> Tu ticket espera a que alguien del equipo lo tome. Aquí todavía puedes revocarlo.</li><li><b>Recién asignado.</b> Ya tiene responsable, aún no empieza.</li><li><b>En proceso.</b> El responsable ya está trabajando en él.</li><li><b>Resuelto.</b> Te avisamos y queda en tu historial.</li></ol></div>
   <div class="card"><h4><i data-lucide="history"></i>Tus últimos tickets</h4><div id="rpRecent"></div></div>
  </aside></section>`;
 const mine=repTab==='mios';
 return `<div class="rp-hero"><div><h2>${mine?'Mis tickets':'Tablero del equipo'}</h2><p>${mine?'Seguimiento e historial de lo que has reportado':'Tickets de otras personas: abiertos, recién asignados, en proceso y cerrados'}</p></div>
  ${mine?`<button class="btn b-pri" onclick="repGo('nuevo')"><i data-lucide="plus"></i>Nuevo ticket</button>`:''}</div>
  <div class="rp-stats" id="rpStats"></div>
  <div class="rp-tb"><div class="chips" id="rpChips"></div><input class="search" id="rpQ" placeholder="Buscar folio, resumen, persona…" oninput="repQ=this.value;repRefresh();icons()"></div>
  <div class="rp-list" id="rpList"></div>`;
}

function renderRep(){
 if(!S.user)return;
 if(!$('#rpMain')){$('#rep').innerHTML=repShellHtml();repShown=''}
 $$('#rep .rp-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===repTab));
 $('#rpBMios').textContent=DB.get('tickets',[]).filter(t=>t.usuarioReporta===S.user&&activo(t)).length;
 repNotifs();
 if(repShown!==repTab){repShown=repTab;repQ='';$('#rpMain').innerHTML=repSkeleton()}
 repRefresh();icons();
}

function repCard(t,mine){
 const f=tkFase(t),i={nuevo:0,asignado:1,proceso:2,resuelto:4}[f],L=['Enviado','Aceptado','En proceso','Resuelto'];
 const track=i===undefined?`<div class="rp-end" style="--c:${FASE[f][1]}">${f==='rechazado'?'Rechazado por '+esc(nom(t.rechazadoPor))+': '+esc(t.motivoRechazo||''):'Revocado por ti antes de ser aceptado'+(t.motivoRevoca?': '+esc(t.motivoRevoca):'')}</div>`
  :`<div class="rp-st">${L.map((l,k)=>`<div class="${k<i?'dn':k===i?'now':''}"><i>${k<i?'✓':k+1}</i><span>${l}</span></div>`).join('')}</div>`;
 return `<article class="rp-tk" style="--c:${FASE[f][1]}">
  <div class="rp-th"><span class="mono acc">${esc(t.id)}</span>${faseB(f)}${urgB(t.urgencia)}<span class="mu sm">${esc(t.modulo)}</span></div>
  <h3>${esc(t.resumen)}</h3><p class="mu">${esc(t.comentario)}</p>
  <div class="rp-meta">${mine?'':`<span>Reportó: <b>${esc(nom(t.usuarioReporta))}</b></span>`}<span>Creado: ${fmtD(t.creado)}</span><span>Responsable: ${t.usuarioAsignado?`<b>${esc(nom(t.usuarioAsignado))}</b>`:'<em>aún sin asignar</em>'}</span>${slaHtml(t)}</div>
  ${track}
  <div class="rp-act"><button class="btn" onclick="tkDetalle('${t.id}')"><i data-lucide="history"></i>Historial</button>${mine&&t.estado==='abierto'?`<button class="btn b-no" onclick="tkRevocar('${t.id}')"><i data-lucide="undo-2"></i>Revocar</button>`:''}</div></article>`;
}

function repRefresh(){
 const tk=DB.get('tickets',[]);
 if(repTab==='nuevo'){
  const sel=$('#f_mod'),m=DB.get('modulos',[]);
  if(sel&&sel.options.length!==m.length){const v=sel.value;sel.innerHTML=opts(m.map(x=>[x,x]),v)}
  const rec=tk.filter(t=>t.usuarioReporta===S.user).slice(0,4);
  $('#rpRecent').innerHTML=rec.length?rec.map(t=>`<div class="rp-mini" onclick="repGo('mios')"><div><b>${esc(t.id)}</b><span class="mu sm"> · ${esc(t.resumen)}</span></div>${faseB(tkFase(t))}</div>`).join(''):'<p class="mu sm">Aún no has reportado nada.</p>';
  return;
 }
 const mine=repTab==='mios',F=mine?REPF_M:REPF_E,sel=mine?repMiF:repEqF,q=repQ.toLowerCase();
 const base=mine?tk.filter(t=>t.usuarioReporta===S.user):tk.filter(t=>t.usuarioReporta!==S.user&&t.estado!=='revocado');
 $('#rpStats').innerHTML=['nuevo','asignado','proceso','resuelto'].map(k=>`<button class="rp-stat ${sel===k?'on':''}" style="--c:${FASE[k][1]}" onclick="repSetF('${k}')"><i data-lucide="${FASE[k][2]}"></i><div><small>${F[k][0]}</small><b>${base.filter(t=>tkFase(t)===k).length}</b></div></button>`).join('');
 $('#rpChips').innerHTML=Object.entries(F).map(([k,[l,fn]])=>`<button class="${k===sel?'on':''}" onclick="repSetF('${k}')">${l}<em>${base.filter(t=>fn(tkFase(t))).length}</em></button>`).join('');
 const rows=base.filter(t=>F[sel][1](tkFase(t))).filter(t=>!q||[t.id,t.resumen,t.modulo,t.comentario,nom(t.usuarioReporta),nom(t.usuarioAsignado)].join(' ').toLowerCase().includes(q))
  .sort((a,b)=>(activo(b)-activo(a))||b.creado-a.creado);
 $('#rpList').innerHTML=rows.length?rows.map(t=>repCard(t,mine)).join(''):`<div class="card empty">${mine?'Aún no hay tickets en esta vista':'No hay tickets de otras personas en esta vista'}</div>`;
}

function repEnviar(){
 const r=$('#f_res').value.trim(),d=$('#f_det').value.trim(),m=$('#f_mod').value;
 if(!m){toast('No hay módulos disponibles; avisa al administrador','err');return}
 if(!r||!d){toast('Completa el resumen y los detalles','err');return}
 const id=tkCrear(m,r,d,urgVal());toast('Ticket '+id+' enviado. Te avisaremos cuando sea aceptado','ok');
 repMiF='todos';repGo('mios');
}

/* Notificaciones del portal (mismos datos que el resto del sistema) */
function repNotifs(){
 const n=DB.get('notificaciones',[]).filter(x=>x.destinatario===S.user),un=n.filter(x=>!x.leido).length,b=$('#repNB');
 b.textContent=un;b.style.display=un?'block':'none';
 $('#repNL').innerHTML=n.length?n.map(x=>`<div class="nt ${x.leido?'':'un'}">${esc(x.mensaje)}<small>${esc(x.fecha)}</small></div>`).join(''):'<p class="empty sm">Sin notificaciones</p>';
}
function repToggleNotifs(){
 $('#repND').classList.toggle('on');
 setTimeout(()=>{const a=DB.get('notificaciones',[]);a.forEach(n=>{if(n.destinatario===S.user)n.leido=true});DB.set('notificaciones',a);repNotifs()},1200);
}
document.addEventListener('click',e=>{const d=$('#repND');if(d&&!e.target.closest('.rel'))d.classList.remove('on')});
