/* ===== Dashboard ===== */
let charts=[];
function renderDashboard(){
 const s=stats(),first=USERS[S.user].n.split(' ')[0];
 const top=s.t.filter(activo).sort((a,b)=>a.sla-b.sla).slice(0,5);
 const kp=[['Pendientes',s.pend,'alert-triangle','#ef4444'],['En proceso',s.proc,'clock','#f59e0b'],['Resueltos',s.ok,'check-circle-2','#10b981'],['Rechazados',s.rej,'ban','#8393b2'],['SLA vencidos',s.over,'timer-off','#ef4444']];
 $('#v-dashboard').innerHTML=`
 <div class="ph"><div><h2>Hola, ${esc(first)}</h2><p>${new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})} · ${s.total} registros en el sistema</p></div>
  <div class="acts"><button class="btn b-amb" onclick="tkNuevo()"><i data-lucide="alert-circle"></i>Reportar ticket</button><button class="btn b-pri" onclick="ptNuevo()"><i data-lucide="plus-circle"></i>Levantar punto 5S</button></div></div>
 <div class="kpis">${kp.map(([l,v,i,c])=>`<div class="kpi" style="--c:${c}"><i data-lucide="${i}"></i><div><small>${l}</small><b data-n="${v}">0</b></div></div>`).join('')}</div>
 <div class="g2">
  <div class="card"><h4><i data-lucide="siren"></i>Atención inmediata (por tiempo límite)</h4>${top.length?top.map(t=>`<div class="urow" style="--c:${URG[t.urgencia].c}" onclick="tkF='activos';go('tickets')"><div><b>${esc(t.id)} · ${esc(t.resumen)}</b><span class="mu sm">${esc(t.modulo)} · ${URG[t.urgencia].n} (${URG[t.urgencia].t})</span></div>${slaHtml(t)}</div>`).join(''):'<p class="empty">Sin tickets activos 🎉</p>'}</div>
  <div class="card"><h4><i data-lucide="pie-chart"></i>Estado general</h4><div class="ch"><canvas id="c1"></canvas></div></div>
  <div class="card"><h4><i data-lucide="gauge"></i>Tickets activos por urgencia</h4><div class="ch"><canvas id="c2"></canvas></div></div>
  <div class="card"><h4><i data-lucide="bar-chart-3"></i>Activos por módulo</h4><div class="ch"><canvas id="c3"></canvas></div></div>
  <div class="card" style="grid-column:1/-1"><h4><i data-lucide="trophy"></i>Puntos cerrados por persona · hoy, esta semana y este mes</h4><div class="ch"><canvas id="c4"></canvas></div></div>
 </div>`;
 $$('#v-dashboard [data-n]').forEach(e=>countTo(e,+e.dataset.n));
 drawCharts(s);
}
function drawCharts(s){
 if(!window.Chart)return;charts.forEach(c=>c.destroy());
 Chart.defaults.color='#8393b2';Chart.defaults.font.family='Inter,system-ui,sans-serif';
 const base={responsive:true,maintainAspectRatio:false,animation:{duration:900,easing:'easeOutQuart'}},ax={grid:{color:'#1d2842'},ticks:{precision:0}};
 const act=s.t.filter(activo);
 charts=[
  new Chart($('#c1'),{type:'doughnut',data:{labels:['Pendientes','En proceso','Resueltos','Rechazados'],datasets:[{data:[s.pend,s.proc,s.ok,s.rej],backgroundColor:['#ef4444','#f59e0b','#10b981','#64748b'],borderWidth:0,hoverOffset:8}]},options:{...base,cutout:'68%',plugins:{legend:{position:'right',labels:{usePointStyle:true}}}}}),
  new Chart($('#c2'),{type:'bar',data:{labels:Object.values(URG).map(u=>u.n),datasets:[{data:Object.keys(URG).map(k=>act.filter(t=>t.urgencia==k).length),backgroundColor:Object.values(URG).map(u=>u.c),borderRadius:8}]},options:{...base,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:ax}}}),
  new Chart($('#c3'),{type:'bar',data:{labels:DB.get('modulos',[]),datasets:[{data:DB.get('modulos',[]).map(m=>s.p.filter(p=>p.modulo===m&&p.estado!=='atendido').length+act.filter(t=>t.modulo===m).length),backgroundColor:'#4f8cff',borderRadius:8}]},options:{...base,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:ax}}}),cierresChart(s)];
}

/* Cierres por persona: puntos 5S atendidos + tickets resueltos (semana inicia en lunes) */
function cierresChart(s){
 const n=new Date(),hoyS=hoy(),iniS=hoy(new Date(n.getFullYear(),n.getMonth(),n.getDate()-(n.getDay()+6)%7)),mesS=hoyS.slice(0,7),r={};
 usersRol(['admin','comun']).forEach(([e])=>r[e]=[0,0,0]);
 const add=(u,f)=>{if(!u||!f)return;const o=r[u]=r[u]||[0,0,0];if(f===hoyS)o[0]++;if(f>=iniS&&f<=hoyS)o[1]++;if(f.slice(0,7)===mesS)o[2]++};
 s.p.filter(p=>p.estado==='atendido').forEach(p=>add(p.usuarioCierra,p.fechaCumplido));
 s.t.filter(t=>t.estado==='resuelto').forEach(t=>add(t.cierra,t.cerrado&&hoy(new Date(t.cerrado))));
 const k=Object.keys(r),ds=(l,i,c)=>({label:l,data:k.map(e=>r[e][i]),backgroundColor:c,borderRadius:6});
 return new Chart($('#c4'),{type:'bar',data:{labels:k.map(nom),datasets:[ds('Hoy',0,'#4f8cff'),ds('Esta semana',1,'#8b5cf6'),ds('Este mes',2,'#10b981')]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:900},plugins:{legend:{labels:{usePointStyle:true}}},scales:{x:{grid:{display:false}},y:{grid:{color:'#1d2842'},ticks:{precision:0}}}}});
}
