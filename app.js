/* ===== Arranque, sesión, render global y vigilancia de SLA ===== */
const VIEWS={dashboard:renderDashboard,tickets:renderTickets,modulos:renderModulos,tareas:renderTareas,admin:renderAdmin,usuarios:renderUsuarios,chat:renderChat};
function renderAll(){if(!S.user)return;renderSide();renderBadges();renderNotifs();$('[data-v=usuarios]').style.display=esAdmin()?'':'none';VIEWS[cur]();icons()}
let _rt,_iv;const scheduleRender=()=>{clearTimeout(_rt);_rt=setTimeout(renderAll,150)};

function showLogin(v){document.body.classList.toggle('in',!v);$('#lBtn').disabled=false;icons()}
function loginErr(m){$('#lErr').textContent=m;showLogin(true)}
async function doLogin(e){e.preventDefault();$('#lErr').textContent='';$('#lBtn').disabled=true;
 try{await FB.login($('#lEm').value.trim(),$('#lPw').value)}catch(x){loginErr('Correo o contraseña incorrectos')}}
function appStart(email){
 S.user=email;const u=USERS[email];showLogin(false);
 $('#me').innerHTML=`<span class="av">${esc(u.n[0].toUpperCase())}</span><div><b>${esc(u.n)}</b><small>${RL[u.r]}</small></div><button class="ib" title="Cerrar sesión" onclick="FB.logout()"><i data-lucide="log-out"></i></button>`;
 if(esAdmin()&&!DB.get('modulos',[]).length)DB.set('modulos',['Módulo 6','Módulo 7']);
 cur='';chatA='general';$$('.view').forEach(x=>x.classList.remove('on','out'));go('dashboard');
 if(!_iv)_iv=setInterval(vigilarSla,15000);setTimeout(vigilarSla,1500);
}
function appStop(){S.user=null;resetCache();showLogin(true)}

function vigilarSla(){
 if(!S.user)return;
 const now=Date.now(),a=DB.get('tickets',[]);let ch=false;
 if(esAdmin())a.forEach(t=>{if(activo(t)&&t.sla<now&&!t.alertado){t.alertado=1;ch=true;
  notify(S.user,`⏰ SLA vencido: ${t.id} · ${t.resumen}`);if(t.usuarioAsignado&&t.usuarioAsignado!==S.user)notify(t.usuarioAsignado,`⏰ SLA vencido: ${t.id}`)}});
 if(ch){DB.set('tickets',a);beep();toast('Hay tickets con tiempo de atención vencido','err');return}
 $$('[data-sla]').forEach(e=>{const t=a.find(x=>x.id===e.dataset.sla);if(t){const l=t.sla-now;e.textContent=fmtLeft(l);e.className='sla '+slaCls(t,l)}});
}
