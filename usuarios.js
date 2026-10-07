/* ===== Gestión de usuarios (solo administrador) ===== */
function renderUsuarios(){
 if(!esAdmin()){$('#v-usuarios').innerHTML=`<div class="lock"><i data-lucide="shield-alert"></i>Acceso restringido al administrador.</div>`;return}
 $('#v-usuarios').innerHTML=`<div class="ph"><div><h2>Usuarios</h2><p>Crea cuentas y define el tipo de acceso de cada persona</p></div><button class="btn b-pri" onclick="usuarioNuevo()"><i data-lucide="user-plus"></i>Nuevo usuario</button></div>
 <div class="card flush"><div class="tw"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Tipo</th><th></th></tr></thead><tbody>${Object.values(USERS).map(u=>`<tr class="row"><td><b>${esc(u.n)}</b></td><td class="mu">${esc(u.email)}</td>
 <td><select style="width:auto" onchange="FB.setRol('${u.uid}',this.value);toast('Tipo actualizado','ok')" ${u.email===S.user?'disabled':''}>${opts(Object.entries(RL),u.r)}</select></td>
 <td class="ra">${u.email===S.user?'<span class="mu sm">Tú</span>':`<button class="ib no" title="Quitar acceso" onclick="usuarioQuitar('${u.uid}')"><i data-lucide="user-x"></i></button>`}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function usuarioNuevo(){
 openModal({title:'Nuevo usuario',icon:'user-plus',ok:'Crear usuario',
 body:fld('Nombre',`<input id="f_n">`)+fld('Correo',`<input id="f_e" type="email">`)+fld('Contraseña (mínimo 6 caracteres)',`<input id="f_p" type="text">`)+fld('Tipo de usuario',`<select id="f_r">${opts(Object.entries(RL),'comun')}</select>`),
 onOk(){const n=$('#f_n').value.trim(),e=$('#f_e').value.trim(),p=$('#f_p').value,r=$('#f_r').value;
  if(!n||!e||p.length<6){toast('Completa nombre, correo y contraseña de 6+ caracteres','err');return false}
  FB.crearUsuario(n,e,p,r).then(()=>toast('Usuario creado: '+e,'ok')).catch(x=>toast(x.code==='auth/email-already-in-use'?'Ese correo ya existe':'No se pudo crear ('+(x.code||'error')+')','err'))}});
}
function usuarioQuitar(uid){
 openModal({title:'Quitar acceso',icon:'user-x',cls:'b-no',ok:'Quitar acceso',body:'<p>El usuario ya no podrá entrar al sistema. Su cuenta de acceso sigue en Firebase Authentication y puede borrarse desde la consola.</p>',onOk(){FB.quitar(uid);toast('Acceso retirado')}});
}
