/* ===== Roles, escala de urgencia (SLA) y capa de datos (caché sincronizada con Firestore) ===== */
const USERS={},S={user:null};               /* USERS se llena desde Firestore (colección usuarios) */
const RL={admin:'Administrador',comun:'Usuario común',reportero:'Reportero'};
const rolDe=e=>USERS[e]?USERS[e].r:null,esAdmin=()=>rolDe(S.user)==='admin',puedeGestionar=()=>['admin','comun'].includes(rolDe(S.user));
const usersRol=rs=>Object.values(USERS).filter(u=>rs.includes(u.r)).map(u=>[u.email,u.n]);
const notifyRoles=(rs,m)=>usersRol(rs).filter(([e])=>e!==S.user).forEach(([e])=>notify(e,m));
const nom=e=>USERS[e]?USERS[e].n:(e||'—');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hoy=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
/* min = minutos máximos de atención; 0 = durante esta semana (hasta el domingo 23:59) */
const URG={
 1:{n:'Crítica',min:30,c:'#ef4444',t:'30 min'},
 2:{n:'Alta',min:60,c:'#f97316',t:'1 hora'},
 3:{n:'Media',min:240,c:'#eab308',t:'4 horas'},
 4:{n:'Baja',min:1440,c:'#84cc16',t:'24 horas'},
 5:{n:'Programada',min:0,c:'#10b981',t:'Esta semana'}};
const PCRIT={1:'#10b981',2:'#84cc16',3:'#eab308',4:'#f97316',5:'#ef4444'};
const MOTIVOS=['Duplicado','Información insuficiente','No es competencia de este equipo','Sin evidencia / no reproducible','Ya estaba resuelto','No procede','Otro'];

/* Caché en memoria: firebase.js la actualiza con onSnapshot; DB.set escribe solo los documentos que cambiaron */
const C={puntos:[],tickets:[],modulos:[],notificaciones:[],chat:[]};
const COL={puntos:{id:x=>x.id},tickets:{id:x=>x.id},notificaciones:{id:x=>String(x.id)},chat:{id:x=>String(x.id)},
 modulos:{id:x=>x.replace(/\W/g,'_')+x.length,doc:x=>({nombre:x,orden:Date.now()})}};
const DB={get:(k,d)=>C[k]??d,
 set(k,v){const cfg=COL[k],old=new Map((C[k]||[]).map(x=>[cfg.id(x),JSON.stringify(x)])),seen=new Set();C[k]=v;
  v.forEach(x=>{const id=cfg.id(x);seen.add(id);if(old.get(id)!==JSON.stringify(x))FB.put(k,id,cfg.doc?cfg.doc(x):x)});
  old.forEach((_,id)=>{if(!seen.has(id))FB.del(k,id)})}};
function resetCache(){for(const k in C)C[k]=[];Object.keys(USERS).forEach(k=>delete USERS[k])}

function calcSla(base,u){
 const m=URG[u].min;if(m)return base+m*60000;
 const d=new Date(base);d.setDate(d.getDate()+(7-d.getDay())%7);d.setHours(23,59,59,0);return d.getTime();
}
function addHist(t,txt){t.hist=t.hist||[];t.hist.push({t:Date.now(),u:S.user,txt})}
function notify(to,msg){
 const n=DB.get('notificaciones',[]);
 n.unshift({id:Date.now()+String(Math.floor(Math.random()*1e4)).padStart(4,'0'),destinatario:to,mensaje:msg,leido:false,fecha:new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})});
 DB.set('notificaciones',n.slice(0,300));
}
