/* ===== Dashboard: indicadores, tendencia y análisis de trabajo ===== */
let charts=[],dashDias=14,dashAnim=true;
const DIAS=[[7,'7 días'],[14,'14 días'],[30,'30 días'],[90,'90 días']];
const DAY=864e5;

/* Duración legible: 45 min · 3 h 20 min · 2 d 4 h */
function fmtDur(ms){if(!(ms>0))return'—';const m=Math.round(ms/6e4),h=Math.floor(m/60),d=Math.floor(h/24);return d?`${d} d ${h%24} h`:h?`${h} h ${m%60} min`:`${m} min`}
const inicioDia=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x.getTime()};
/* Fecha 'AAAA-MM-DD' (puntos 5S) a milisegundos locales */
const msDe=s=>s?new Date(s+'T12:00:00').getTime():0;

/* Todo el análisis se calcula aquí a partir de tickets y puntos 5S */
function analisis(s,dias){
 const hoyI=inicioDia(Date.now()),desde=hoyI-(dias-1)*DAY,desdeAnt=desde-dias*DAY;
 const T=s.t,P=s.p,now=Date.now();
 /* eventos: [momento, tipo]; creado = se levantó, cerrado = se resolvió / atendió */
 const ev=[];
 T.forEach(t=>{ev.push([t.creado,'c']);if(t.estado==='resuelto'&&t.cerrado)ev.push([t.cerrado,'k'])});
 P.forEach(p=>{ev.push([msDe(p.fechaLevantamiento),'c']);if(p.estado==='atendido'&&p.fechaCumplido)ev.push([msDe(p.fechaCumplido),'k'])});
 const cuenta=(a,b,tp)=>ev.filter(([m,k])=>k===tp&&m>=a&&m<b).length;
 const labels=[],cre=Array(dias).fill(0),cer=Array(dias).fill(0);
 for(let i=0;i<dias;i++)labels.push(new Date(desde+i*DAY).toLocaleDateString('es-MX',{day:'numeric',month:'short'}));
 ev.forEach(([m,k])=>{if(m>=desde&&m<hoyI+DAY){const i=Math.floor((inicioDia(m)-desde)/DAY);(k==='c'?cre:cer)[i]++}});
 const resP=T.filter(t=>t.estado==='resuelto'&&t.cerrado&&t.cerrado>=desde);
 const enSla=resP.filter(t=>t.cerrado<=t.sla).length;
 const act=T.filter(activo);
 return{labels,cre,cer,
  cerP:cuenta(desde,hoyI+DAY,'k'),cerA:cuenta(desdeAnt,desde,'k'),creP:cuenta(desde,hoyI+DAY,'c'),creA:cuenta(desdeAnt,desde,'c'),
  nRes:resP.length,enSla,sla:resP.length?Math.round(enSla/resP.length*100):null,
  tiempo:resP.length?resP.reduce((a,t)=>a+(t.cerrado-(t.creado||t.cerrado)),0)/resP.length:0,
  urg:act.filter(t=>t.urgencia<=2).length,act,now}
}
/* Variación contra el periodo anterior (más cerrados es bueno; más levantados solo informa) */
function delta(a,b,bueno=true){
 if(!a&&!b)return'<span class="dl nu">Sin movimiento</span>';
 if(!b)return`<span class="dl up">▲ nuevo</span> <span>vs. periodo previo</span>`;
 const p=Math.round((a-b)/b*100);if(p===0)return'<span class="dl nu">= igual</span> <span>que el periodo previo</span>';
 const up=p>0,cls=bueno?(up?'up':'dn'):'nu';
 return`<span class="dl ${cls}">${up?'▲':'▼'} ${Math.abs(p)}%</span> <span>vs. periodo previo</span>`}

function renderDashboard(){
 const s=stats(),first=USERS[S.user].n.split(' ')[0],A=analisis(s,dashDias),top=A.act.sort((a,b)=>a.sla-b.sla).slice(0,5);
 const mods=DB.get('modulos',[]),pAb=s.p.filter(p=>p.estado!=='atendido');
 const slaC=A.sla===null?'#64748b':A.sla>=90?'#10b981':A.sla>=75?'#f59e0b':'#ef4444';
 /* [etiqueta, valor, ícono, color, detalle, ¿cuenta animada?] */
 const kp=[
  ['Pendientes',s.pend,'alert-triangle','#ef4444',`${A.urg} activos con urgencia crítica o alta`,1],
  ['En proceso',s.proc,'clock','#f59e0b','Tickets y puntos 5S en atención',1],
  [`Cerrados · ${dashDias} días`,A.cerP,'check-circle-2','#10b981',delta(A.cerP,A.cerA),1],
  ['SLA vencidos',s.over,'timer-off','#ef4444',`de ${A.act.length} tickets activos`,1],
  ['Cumplimiento SLA',A.sla===null?'—':A.sla+'%','shield-check',slaC,A.nRes?`${A.enSla} de ${A.nRes} tickets resueltos a tiempo`:'Sin tickets resueltos en el periodo',0],
  ['Resolución media',fmtDur(A.tiempo),'timer','#2563eb','Promedio por ticket resuelto',0]];
 const pr=dashDias;
 $('#v-dashboard').classList.toggle('still',!dashAnim);
 $('#v-dashboard').innerHTML=`
 <div class="ph"><div><h2>Hola, ${esc(first)}</h2><p>${new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})} · ${s.total} registros en el sistema</p></div>
  <div class="acts"><div class="seg" role="group" aria-label="Periodo de análisis">${DIAS.map(([d,l])=>`<button class="${d===pr?'on':''}" onclick="dashPeriodo(${d})">${l}</button>`).join('')}</div>
  <button class="btn b-amb" onclick="tkNuevo()"><i data-lucide="alert-circle"></i>Reportar ticket</button></div></div>
 <div class="kpis">${kp.map(([l,v,i,c,d,n])=>`<div class="kpi" style="--c:${c}"><div class="kt"><small>${l}</small><i data-lucide="${i}"></i></div><b ${n?`data-n="${v}"`:''}>${n?(dashAnim?0:v):esc(v)}</b><span class="ks">${d}</span></div>`).join('')}</div>
 <div class="g12">
  <div class="card s8"><div class="chd"><div><h4>Actividad del equipo</h4><p>Registros levantados y cerrados por día · tickets y puntos 5S · últimos ${pr} días</p></div></div><div class="ch tall"><canvas id="c0"></canvas></div></div>
  <div class="card s4"><div class="chd"><div><h4>Estado general</h4><p>Distribución de todos los registros</p></div></div><div class="ch tall"><canvas id="c1"></canvas></div></div>
 </div>
 <div class="g12">
  <div class="card s5"><div class="chd"><div><h4>Atención inmediata</h4><p>Tickets activos ordenados por tiempo límite</p></div></div>${top.length?top.map(t=>`<div class="urow" style="--c:${URG[t.urgencia].c}" onclick="tkF='activos';go('tickets')"><div><b>${esc(t.id)} · ${esc(t.resumen)}</b><span class="mu sm">${esc(t.modulo)} · ${URG[t.urgencia].n} (${URG[t.urgencia].t})</span></div>${slaHtml(t)}</div>`).join(''):'<p class="empty">No hay tickets activos. Todo al corriente.</p>'}</div>
  <div class="card s7"><div class="chd"><div><h4>Carga de trabajo por módulo</h4><p>Tickets activos y puntos 5S sin cerrar</p></div></div><div class="ch"><canvas id="c3"></canvas></div></div>
 </div>
 <div class="g12">
  <div class="card s8"><div class="chd"><div><h4>Productividad por persona</h4><p>Puntos 5S atendidos y tickets resueltos · semana inicia en lunes</p></div></div><div class="ch"><canvas id="c4"></canvas></div></div>
  <div class="card s4"><div class="chd"><div><h4>Avance 5S por módulo</h4><p>Puntos resueltos sobre el total levantado</p></div></div>${mods.length?mods.map(m=>{const ps=s.p.filter(p=>p.modulo===m),ok=ps.filter(p=>p.estado==='atendido').length,pc=ps.length?Math.round(ok/ps.length*100):0;
   return`<div class="mrow"><div><b>${esc(m)}</b><span class="mu sm">${ok}/${ps.length} · ${pc}%</span></div><div class="bar"><i class="${pc===100&&ps.length?'ok':''}" style="width:${dashAnim?0:pc}%" data-w="${pc}"></i></div></div>`}).join(''):'<p class="empty">Aún no hay módulos.</p>'}</div>
 </div>
 <div class="g12">
  <div class="card s6"><div class="chd"><div><h4>Tickets activos por urgencia</h4><p>Cuántos faltan por atender en cada nivel</p></div></div><div class="ch"><canvas id="c2"></canvas></div></div>
  <div class="card s6"><div class="chd"><div><h4>Puntos 5S abiertos por criticidad</h4><p>Del nivel 1 (baja) al 5 (crítica)</p></div></div><div class="ch"><canvas id="c5"></canvas></div></div>
 </div>`;
 $$('#v-dashboard [data-n]').forEach(e=>dashAnim?countTo(e,+e.dataset.n):e.textContent=e.dataset.n);
 if(dashAnim)requestAnimationFrame(()=>$$('#v-dashboard [data-w]').forEach(e=>e.style.width=e.dataset.w+'%'));
 drawCharts(s,A,mods,pAb);dashAnim=false;
}
function dashPeriodo(d){dashDias=d;dashAnim=false;renderDashboard();icons()}

function drawCharts(s,A,mods,pAb){
 if(!window.Chart)return;charts.forEach(c=>c.destroy());
 const mu=cv('--mu'),tx=cv('--tx'),grid=cv('--grid'),card=cv('--p'),dark=temaActual()==='dark';
 Chart.defaults.color=mu;Chart.defaults.font.family='-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif';Chart.defaults.font.size=12;
 const anim=dashAnim?{duration:700,easing:'easeOutQuart'}:false;
 const tip={backgroundColor:dark?'#1f2a45':'#0f172a',titleColor:'#fff',bodyColor:'#e2e8f0',padding:10,cornerRadius:8,boxPadding:4,usePointStyle:true,borderColor:dark?'#2c3a5c':'transparent',borderWidth:1};
 const leg={position:'bottom',labels:{usePointStyle:true,pointStyle:'rectRounded',boxWidth:8,boxHeight:8,padding:16}};
 const base={responsive:true,maintainAspectRatio:false,animation:anim,interaction:{mode:'index',intersect:false}};
 const ax={grid:{color:grid},border:{display:false},ticks:{precision:0},beginAtZero:true},nogrid={grid:{display:false},border:{color:grid}};
 const act=s.t.filter(activo),azul='#2563eb',verde='#10b981',lila='#8b5cf6';
 /* Texto central de la dona: total de registros */
 const centro={id:'centro',afterDraw(c){const m=c.getDatasetMeta(0).data[0];if(!m)return;const x=c.ctx,t=c.data.datasets[0].data.reduce((a,b)=>a+b,0);
  x.save();x.textAlign='center';x.textBaseline='middle';x.fillStyle=tx;x.font='650 26px '+Chart.defaults.font.family;x.fillText(t,m.x,m.y-6);x.fillStyle=mu;x.font='12px '+Chart.defaults.font.family;x.fillText('registros',m.x,m.y+16);x.restore()}};
 const stk=(l,d,c)=>({label:l,data:d,backgroundColor:c,borderRadius:4,borderSkipped:false,maxBarThickness:28});
 charts=[
  new Chart($('#c0'),{type:'line',data:{labels:A.labels,datasets:[
   {label:'Levantados',data:A.cre,borderColor:azul,backgroundColor:azul+'1f',fill:true,cubicInterpolationMode:'monotone',tension:.3,borderWidth:2,pointRadius:A.labels.length>31?0:3,pointHoverRadius:5,pointBackgroundColor:card,pointBorderWidth:2},
   {label:'Cerrados',data:A.cer,borderColor:verde,backgroundColor:verde+'14',fill:true,cubicInterpolationMode:'monotone',tension:.3,borderWidth:2,pointRadius:A.labels.length>31?0:3,pointHoverRadius:5,pointBackgroundColor:card,pointBorderWidth:2}]},
   options:{...base,plugins:{legend:leg,tooltip:tip},scales:{x:{...nogrid,ticks:{maxTicksLimit:10,maxRotation:0}},y:ax}}}),
  new Chart($('#c1'),{type:'doughnut',data:{labels:['Pendientes','En proceso','Resueltos','Rechazados'],datasets:[{data:[s.pend,s.proc,s.ok,s.rej],backgroundColor:['#ef4444','#f59e0b','#10b981','#94a3b8'],borderColor:card,borderWidth:3,hoverOffset:4}]},
   options:{responsive:true,maintainAspectRatio:false,animation:anim,cutout:'72%',plugins:{legend:leg,tooltip:tip}},plugins:[centro]}),
  new Chart($('#c2'),{type:'bar',data:{labels:Object.values(URG).map(u=>u.n),datasets:[{data:Object.keys(URG).map(k=>act.filter(t=>t.urgencia==k).length),backgroundColor:Object.values(URG).map(u=>u.c),borderRadius:6,borderSkipped:false,maxBarThickness:46}]},
   options:{...base,plugins:{legend:{display:false},tooltip:{...tip,callbacks:{label:c=>` ${c.parsed.y} tickets activos`}}},scales:{x:nogrid,y:ax}}}),
  new Chart($('#c3'),{type:'bar',data:{labels:mods,datasets:[stk('Tickets activos',mods.map(m=>act.filter(t=>t.modulo===m).length),azul),stk('Puntos 5S sin cerrar',mods.map(m=>pAb.filter(p=>p.modulo===m).length),lila)]},
   options:{...base,indexAxis:'y',plugins:{legend:leg,tooltip:tip},scales:{x:{...ax,stacked:true},y:{...nogrid,stacked:true}}}}),
  cierresChart(s,{base,ax,nogrid,leg,tip,azul,lila,verde}),
  new Chart($('#c5'),{type:'bar',data:{labels:['Nivel 1','Nivel 2','Nivel 3','Nivel 4','Nivel 5','Sin asignar'],datasets:[{data:[1,2,3,4,5].map(n=>pAb.filter(p=>p.criticidad===n).length).concat(pAb.filter(p=>!p.criticidad).length),backgroundColor:[1,2,3,4,5].map(n=>PCRIT[n]).concat('#94a3b8'),borderRadius:6,borderSkipped:false,maxBarThickness:46}]},
   options:{...base,plugins:{legend:{display:false},tooltip:{...tip,callbacks:{label:c=>` ${c.parsed.y} puntos abiertos`}}},scales:{x:nogrid,y:ax}}})];
}

/* Cierres por persona: puntos 5S atendidos + tickets resueltos (semana inicia en lunes) */
function cierresChart(s,o){
 const n=new Date(),hoyS=hoy(),iniS=hoy(new Date(n.getFullYear(),n.getMonth(),n.getDate()-(n.getDay()+6)%7)),mesS=hoyS.slice(0,7),r={};
 usersRol(['admin','comun']).forEach(([e])=>r[e]=[0,0,0]);
 const add=(u,f)=>{if(!u||!f)return;const x=r[u]=r[u]||[0,0,0];if(f===hoyS)x[0]++;if(f>=iniS&&f<=hoyS)x[1]++;if(f.slice(0,7)===mesS)x[2]++};
 s.p.filter(p=>p.estado==='atendido').forEach(p=>add(p.usuarioCierra,p.fechaCumplido));
 s.t.filter(t=>t.estado==='resuelto').forEach(t=>add(t.cierra,t.cerrado&&hoy(new Date(t.cerrado))));
 const k=Object.keys(r),ds=(l,i,c)=>({label:l,data:k.map(e=>r[e][i]),backgroundColor:c,borderRadius:4,borderSkipped:false,maxBarThickness:26});
 return new Chart($('#c4'),{type:'bar',data:{labels:k.map(nom),datasets:[ds('Hoy',0,o.azul),ds('Esta semana',1,o.lila),ds('Este mes',2,o.verde)]},options:{...o.base,plugins:{legend:o.leg,tooltip:o.tip},scales:{x:o.nogrid,y:o.ax}}});
}
