/* ===== Notificaciones y chat ===== */
let chatA='general';
function renderNotifs(){
 const n=DB.get('notificaciones',[]).filter(x=>x.destinatario===S.user),un=n.filter(x=>!x.leido).length,b=$('#nBadge');
 b.textContent=un;b.style.display=un?'block':'none';
 $('#nList').innerHTML=n.length?n.map(x=>`<div class="nt ${x.leido?'':'un'}">${esc(x.mensaje)}<small>${esc(x.fecha)}</small></div>`).join(''):'<p class="empty sm">Sin notificaciones</p>';
}
function toggleNotifs(){
 $('#nDrop').classList.toggle('on');
 const a=DB.get('notificaciones',[]);a.forEach(n=>{if(n.destinatario===S.user)n.leido=true});
 setTimeout(()=>{DB.set('notificaciones',a);renderNotifs()},1200);
}
function limpiarNotifs(){DB.set('notificaciones',DB.get('notificaciones',[]).filter(n=>n.destinatario!==S.user));renderNotifs()}
document.addEventListener('click',e=>{if(!e.target.closest('.rel'))$('#nDrop').classList.remove('on')});

function renderChat(){
 const old=$('#chatIn'),val=old?old.value:'',foc=old&&document.activeElement===old;
 const todos=DB.get('chat',[]),msgs=chatA==='general'?todos.filter(c=>c.receptor==='general'):todos.filter(c=>(c.emisor===S.user&&c.receptor===chatA)||(c.emisor===chatA&&c.receptor===S.user));
 const tab=(id,ic,t)=>`<button class="${id===chatA?'on':''}" onclick="chatA='${id}';renderChat();icons()"><i data-lucide="${ic}"></i>${esc(t)}</button>`;
 $('#v-chat').innerHTML=`<div class="ph"><div><h2>Centro de chat</h2><p>Canal general y mensajes directos</p></div></div>
 <div class="chat"><div class="card cl">${tab('general','users','Chat general L10')}${Object.keys(USERS).filter(e=>e!==S.user).map(e=>tab(e,'user',nom(e))).join('')}</div>
 <div class="card cb"><div class="cm" id="cm">${msgs.length?msgs.map(m=>`<div class="msg ${m.emisor===S.user?'me':''}"><small>${esc(nom(m.emisor))} · ${esc(m.fecha)}</small><div>${esc(m.texto)}</div></div>`).join(''):'<p class="empty">Aún no hay mensajes</p>'}</div>
 <div class="ci"><input id="chatIn" placeholder="Escribe un mensaje…" onkeydown="if(event.key==='Enter')enviarChat()"><button class="btn b-pri" onclick="enviarChat()"><i data-lucide="send"></i></button></div></div></div>`;
 const ni=$('#chatIn');if(val)ni.value=val;if(foc)ni.focus();
 const cm=$('#cm');cm.scrollTop=cm.scrollHeight;
}
function enviarChat(){
 const t=$('#chatIn').value.trim();if(!t)return;
 const a=DB.get('chat',[]);a.push({id:Date.now(),emisor:S.user,receptor:chatA,texto:t,fecha:new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})});DB.set('chat',a);
 if(chatA!=='general'){notify(chatA,`Mensaje de ${nom(S.user)}`);beep()}
 renderChat();icons();$('#chatIn').focus();
}
