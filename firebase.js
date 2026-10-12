/* ===== Firebase: autenticación, Firestore en tiempo real y alta de usuarios (módulo ES) ===== */
import {initializeApp,deleteApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut,createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,collection,doc,setDoc,deleteDoc,updateDoc,onSnapshot,getDoc,writeBatch,runTransaction,query,where} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const cfg={apiKey:"AIzaSyBdaZVSLkDzYAx56-EpN7YTO3hOV_PnbJc",authDomain:"holds-8c5d5.firebaseapp.com",projectId:"holds-8c5d5",storageBucket:"holds-8c5d5.firebasestorage.app",messagingSenderId:"313031756800",appId:"1:313031756800:web:38ef9e962060cf66ed1ce5",measurementId:"G-DCRKJT0J6T"};
const app=initializeApp(cfg),auth=getAuth(app),fs=getFirestore(app);

const fail=e=>{console.error(e);window.toast&&toast('Acción no permitida o sin conexión ('+(e.code||'error')+')','err')};
const clean=o=>JSON.parse(JSON.stringify(o));
const SORT={
 puntos:(a,b)=>b.id.localeCompare(a.id),tickets:(a,b)=>b.creado-a.creado,
 notificaciones:(a,b)=>a.id<b.id?1:-1,chat:(a,b)=>a.id-b.id,modulos:(a,b)=>a.orden-b.orden};
let unsubs=[],ready=new Set(),started=false,total=6;

window.FB={
 login:(e,p)=>signInWithEmailAndPassword(auth,e,p),
 logout:()=>signOut(auth),
 put:(k,id,d)=>setDoc(doc(fs,k,id),clean(d)).catch(fail),
 /* Tickets: solo escribe si nadie lo cambió desde la versión que viste. Si alguien se adelantó (p. ej. otro lo tomó), no pisa nada y avisa */
 putVer:(k,id,d,base)=>{const r=doc(fs,k,id);
  return runTransaction(fs,async tx=>{const s=await tx.get(r);
   if(s.exists()&&(base===null||(s.data().v||0)!==base)){const e=new Error('conflicto');e.code='conflict';throw e}
   tx.set(r,clean(d))}).catch(async e=>{
   if(e.code!=='conflict')return fail(e);
   const s=await getDoc(r),x=s.exists()?s.data():null;
   if(x){const i=C[k].findIndex(t=>t.id===id);if(i>=0)C[k][i]=x;else C[k].unshift(x)}
   const m=!x?'Ese ticket ya no existe':x.estado==='asignado'?'Ya lo tomó '+nom(x.usuarioAsignado):x.estado==='resuelto'?'Ya fue resuelto':x.estado==='rechazado'?'Ya fue rechazado':x.estado==='revocado'?'Ya fue revocado por quien lo reportó':'Ese ticket cambió justo antes de tu acción';
   window.toast(m+'. Se actualizó tu vista; repite la acción si aún aplica.','err');window.scheduleRender()})},
 del:(k,id)=>deleteDoc(doc(fs,k,id)).catch(fail),
 setRol:(uid,rol)=>updateDoc(doc(fs,'usuarios',uid),{rol}).catch(fail),
 quitar:uid=>deleteDoc(doc(fs,'usuarios',uid)).catch(fail),
 /* El admin crea cuentas con una app secundaria para no perder su propia sesión */
 async crearUsuario(nombre,email,pass,rol){
  const sec=initializeApp(cfg,'sec'+Date.now()),a2=getAuth(sec);
  try{const c=await createUserWithEmailAndPassword(a2,email,pass);
   await setDoc(doc(fs,'usuarios',c.user.uid),{uid:c.user.uid,email:c.user.email,nombre,rol});await signOut(a2)}
  finally{await deleteApp(sec)}
 }};

function listen(name,fn,filtro){
 unsubs.push(onSnapshot(filtro?query(collection(fs,name),...filtro):collection(fs,name),s=>{
  fn(s.docs.map(d=>d.data()));
  if(!started){ready.add(name);if(ready.size===total){started=true;window.appStart(auth.currentUser.email)}}else window.scheduleRender();
 },fail));
}
onAuthStateChanged(auth,async u=>{
 unsubs.forEach(f=>f());unsubs=[];ready=new Set();started=false;
 if(!u){window.appStop();return}
 let rol;
 try{
  const perfil=await getDoc(doc(fs,'usuarios',u.uid));
  if(!perfil.exists()){
   if((await getDoc(doc(fs,'config','init'))).exists()){await signOut(auth);window.loginErr('Tu usuario no tiene perfil. Pide al administrador que lo cree.');return}
   /* Primer acceso de todo el sistema: ese usuario queda como administrador */
   const b=writeBatch(fs);
   b.set(doc(fs,'usuarios',u.uid),{uid:u.uid,email:u.email,nombre:u.email.split('@')[0],rol:'admin'});
   b.set(doc(fs,'config','init'),{por:u.email,t:Date.now()});await b.commit();rol='admin';
  }else rol=perfil.data().rol;
 }catch(e){fail(e);await signOut(auth);return}
 /* El reportero solo lee lo de tickets (las reglas le niegan puntos y chat), así que no se suscribe a ellos */
 const cols=rol==='reportero'?['notificaciones']:['puntos','notificaciones','chat'];total=3+cols.length;
 /* Usuarios en vivo: si el administrador cambia TU tipo, la sesión se reinicia sola con tu nueva vista; si te quita el acceso, se cierra */
 listen('usuarios',a=>{const me=auth.currentUser&&auth.currentUser.email,antes=USERS[me]&&USERS[me].r;
  Object.keys(USERS).forEach(k=>delete USERS[k]);a.forEach(x=>USERS[x.email]={n:x.nombre,r:x.rol,uid:x.uid,email:x.email});
  if(!started||!me)return;
  if(!USERS[me]){signOut(auth);window.loginErr('El administrador retiró tu acceso.');return}
  if(antes&&USERS[me].r!==antes){window.toast('Tu tipo de usuario cambió a '+RL[USERS[me].r]+'. Actualizando…','ok');setTimeout(()=>location.reload(),900)}});
 /* Cada quien solo lee SUS notificaciones (las reglas lo exigen) */
 cols.forEach(k=>listen(k,a=>{C[k]=a.sort(SORT[k])},k==='notificaciones'?[where('destinatario','==',u.email)]:null));
 /* Avisos con sonido y voz, solo para quien le corresponde:
    - ticket nuevo: admin y usuario común (no a quien lo levantó), con la urgencia
    - ticket tomado / cerrado / rechazado: a quien lo levantó, con el nombre de quien lo hizo */
 listen('tickets',a=>{const prev=new Map(C.tickets.map(t=>[t.id,t]));C.tickets=a.sort(SORT.tickets);if(!started)return;
  const me=auth.currentUser&&auth.currentUser.email,rol=USERS[me]&&USERS[me].r,staff=rol==='admin'||rol==='comun';
  C.tickets.forEach(t=>{const p=prev.get(t.id);
   if(!p){if(staff&&t.usuarioReporta!==me&&Date.now()-t.creado<120000)alertaTicket(t);return}
   if(p.estado===t.estado&&p.usuarioAsignado===t.usuarioAsignado)return;
   if(t.usuarioReporta===me){
    if(p.estado==='abierto'&&t.estado==='asignado'&&t.usuarioAsignado!==me)avisoTomado(t);
    else if(p.estado!==t.estado&&(t.estado==='resuelto'||t.estado==='rechazado')&&(t.cierra||t.rechazadoPor)!==me)avisoCierre(t)}
   else if(staff&&p.estado==='abierto'&&t.estado==='asignado'&&t.usuarioAsignado!==me)window.toast(nom(t.usuarioAsignado)+' tomó el ticket '+t.id)})});
 listen('modulos',a=>{C.modulos=a.sort(SORT.modulos).map(x=>x.nombre)});
});
