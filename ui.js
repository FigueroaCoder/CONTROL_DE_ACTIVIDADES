/* ===== Utilidades de interfaz: modales, toasts, sonido, navegación, helpers compartidos ===== */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const icons=()=>{if(window.lucide)lucide.createIcons()};
function toast(m,t=''){const e=document.createElement('div');e.className='toast '+t;e.textContent=m;$('#toasts').appendChild(e);setTimeout(()=>{e.classList.add('bye');setTimeout(()=>e.remove(),300)},3400)}
function beep(){try{const A=window.AudioContext||window.webkitAudioContext,c=new A(),o=c.createOscillator(),g=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(880,c.currentTime);o.frequency.exponentialRampToValueAtTime(1760,c.currentTime+.3);g.gain.setValueAtTime(.6,c.currentTime);g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.5);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.5)}catch(e){}}
function countTo(el,n){const s=+el.dataset.v||0,t0=performance.now();el.dataset.v=n;(function f(t){const p=Math.min(1,(t-t0)/650);el.textContent=Math.round(s+(n-s)*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(t0)}

/* Modal genérico */
function openModal({title,icon='circle',body,ok='Guardar',cls='b-pri',onOk}){
 $('#dlg').innerHTML=`<div class="dh"><h3><i data-lucide="${icon}"></i>${title}</h3><button class="x" onclick="closeModal()">×</button></div><div class="db">${body}</div><div class="df"><button class="btn" onclick="closeModal()">${onOk?'Cancelar':'Cerrar'}</button>${onOk?`<button class="btn ${cls}" id="mok">${ok}</button>`:''}</div>`;
 if(onOk)$('#mok').onclick=()=>{if(onOk()!==false)closeModal()};
 $('#modal').classList.add('on');icons();
 const f=$('#dlg input:not([type=radio]),#dlg textarea,#dlg select');if(f)setTimeout(()=>f.focus(),80);
}
const closeModal=()=>$('#modal').classList.remove('on');
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
const fld=(l,h)=>`<label class="fl"><span>${l}</span>${h}</label>`;
const opts=(a,sel)=>a.map(([v,t])=>`<option value="${esc(v)}" ${v==sel?'selected':''}>${esc(t)}</option>`).join('');
const urgPick=sel=>`<div class="fl"><span>¿Qué tan crítica es la atención?</span><div class="urg">${Object.entries(URG).map(([k,u])=>`<label style="--c:${u.c}"><input type="radio" name="urg" value="${k}" ${k==sel?'checked':''}><span><b>${u.n}</b><small>${u.t}</small></span></label>`).join('')}</div><small class="mu">Tiempo máximo de atención: desde los próximos 15 minutos hasta esta semana.</small></div>`;
const urgVal=()=>+$('input[name=urg]:checked').value;

/* Helpers compartidos */
const ST={abierto:['Abierto','#ef4444'],asignado:['Asignado','#f59e0b'],resuelto:['Resuelto','#10b981'],rechazado:['Rechazado','#8393b2'],pendiente:['Pendiente','#ef4444'],en_proceso:['En proceso','#f59e0b'],atendido:['Atendido','#10b981']};
const badge=s=>`<span class="badge" style="--c:${ST[s][1]}">${ST[s][0]}</span>`;
const urgB=u=>`<span class="badge" style="--c:${URG[u].c}"><i class="dot"></i>${URG[u].n}</span>`;
const activo=t=>t.estado==='abierto'||t.estado==='asignado';
const fmtD=d=>new Date(d).toLocaleString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
function fmtLeft(ms){const m=Math.floor(Math.abs(ms)/60000),h=Math.floor(m/60),d=Math.floor(h/24),s=d?`${d}d ${h%24}h`:h?`${h}h ${m%60}m`:`${m}m`;return ms<0?'Vencido hace '+s:'Quedan '+s}
const slaCls=(t,l)=>l<0?'over':l<(t.sla-(t.slaIni||t.creado))*.25?'warn':'ok';
const slaHtml=t=>{if(!activo(t))return'';const l=t.sla-Date.now();return`<span class="sla ${slaCls(t,l)}" data-sla="${t.id}">${fmtLeft(l)}</span>`};
function stats(){const p=DB.get('puntos',[]),t=DB.get('tickets',[]),now=Date.now();return{p,t,total:p.length+t.length,
 pend:p.filter(x=>x.estado==='pendiente').length+t.filter(x=>x.estado==='abierto').length,
 proc:p.filter(x=>x.estado==='en_proceso').length+t.filter(x=>x.estado==='asignado').length,
 ok:p.filter(x=>x.estado==='atendido').length+t.filter(x=>x.estado==='resuelto').length,
 rej:t.filter(x=>x.estado==='rechazado').length,over:t.filter(x=>activo(x)&&x.sla<now).length}}

/* Navegación con transición salida/entrada */
const TITLES={dashboard:'Dashboard',tickets:'Tickets y hallazgos',modulos:'Módulos L10',tareas:'Mis tareas',admin:'Asignación',usuarios:'Usuarios',chat:'Chat'};
let cur='dashboard';
function go(v){
 const old=$('.view.on');if(old&&v===cur)return;
 const show=()=>{$$('.view').forEach(x=>x.classList.remove('on','out'));$('#v-'+v).classList.add('on');cur=v;
  $$('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));$('#crumb').textContent=TITLES[v];renderAll();scrollTo({top:0,behavior:'smooth'})};
 if(old){old.classList.add('out');setTimeout(show,180)}else show();
}
