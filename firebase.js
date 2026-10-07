/* ===== Firebase: autenticación, Firestore en tiempo real y alta de usuarios (módulo ES) ===== */
import {initializeApp,deleteApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAnalytics} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut,createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,collection,doc,setDoc,deleteDoc,updateDoc,onSnapshot,getDoc,writeBatch} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const cfg={apiKey:"AIzaSyBdaZVSLkDzYAx56-EpN7YTO3hOV_PnbJc",authDomain:"holds-8c5d5.firebaseapp.com",projectId:"holds-8c5d5",storageBucket:"holds-8c5d5.firebasestorage.app",messagingSenderId:"313031756800",appId:"1:313031756800:web:38ef9e962060cf66ed1ce5",measurementId:"G-DCRKJT0J6T"};
const app=initializeApp(cfg),auth=getAuth(app),fs=getFirestore(app);
try{getAnalytics(app)}catch(e){}

const fail=e=>{console.error(e);window.toast&&toast('Acción no permitida o sin conexión ('+(e.code||'error')+')','err')};
const clean=o=>JSON.parse(JSON.stringify(o));
const SORT={
 puntos:(a,b)=>b.id.localeCompare(a.id),tickets:(a,b)=>b.creado-a.creado,
 notificaciones:(a,b)=>a.id<b.id?1:-1,chat:(a,b)=>a.id-b.id,modulos:(a,b)=>a.orden-b.orden};
let unsubs=[],ready=new Set(),started=false;

window.FB={
 login:(e,p)=>signInWithEmailAndPassword(auth,e,p),
 logout:()=>signOut(auth),
 put:(k,id,d)=>setDoc(doc(fs,k,id),clean(d)).catch(fail),
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

function listen(name,fn){
 unsubs.push(onSnapshot(collection(fs,name),s=>{
  fn(s.docs.map(d=>d.data()));
  if(!started){ready.add(name);if(ready.size===6){started=true;window.appStart(auth.currentUser.email)}}else window.scheduleRender();
 },fail));
}
onAuthStateChanged(auth,async u=>{
 unsubs.forEach(f=>f());unsubs=[];ready=new Set();started=false;
 if(!u){window.appStop();return}
 try{
  if(!(await getDoc(doc(fs,'usuarios',u.uid))).exists()){
   if((await getDoc(doc(fs,'config','init'))).exists()){await signOut(auth);window.loginErr('Tu usuario no tiene perfil. Pide al administrador que lo cree.');return}
   /* Primer acceso de todo el sistema: ese usuario queda como administrador */
   const b=writeBatch(fs);
   b.set(doc(fs,'usuarios',u.uid),{uid:u.uid,email:u.email,nombre:u.email.split('@')[0],rol:'admin'});
   b.set(doc(fs,'config','init'),{por:u.email,t:Date.now()});await b.commit();
  }
 }catch(e){fail(e);await signOut(auth);return}
 listen('usuarios',a=>{Object.keys(USERS).forEach(k=>delete USERS[k]);a.forEach(x=>USERS[x.email]={n:x.nombre,r:x.rol,uid:x.uid,email:x.email})});
 ['puntos','tickets','notificaciones','chat'].forEach(k=>listen(k,a=>{C[k]=a.sort(SORT[k])}));
 listen('modulos',a=>{C.modulos=a.sort(SORT.modulos).map(x=>x.nombre)});
});
