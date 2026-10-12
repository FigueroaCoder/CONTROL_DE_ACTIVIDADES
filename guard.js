/* Protecciones de la página (disuasivas: el código de una página web siempre llega al navegador; la seguridad real está en Firebase Auth y firestore.rules) */
(function(){
 try{if(top!==self)top.location=self.location}catch(e){document.documentElement.style.display='none'}
 var stop=function(e){e.preventDefault();e.stopPropagation();return false};
 addEventListener('contextmenu',function(e){if(!/^(INPUT|TEXTAREA)$/.test(e.target.tagName))stop(e)},true);
 addEventListener('dragstart',stop,true);
 addEventListener('keydown',function(e){var k=(e.key||'').toLowerCase(),c=e.ctrlKey||e.metaKey;
  if(e.key==='F12'||(c&&(k==='u'||k==='s'))||(c&&e.shiftKey&&'ijck'.indexOf(k)>-1)||(e.metaKey&&e.altKey&&'ijcu'.indexOf(k)>-1))stop(e)},true);
 /* Si se abren las herramientas de desarrollador, la página se cubre hasta que se cierren */
 var abierto=false,img=new Image(),cover;
 Object.defineProperty(img,'id',{get:function(){abierto=true}});
 setInterval(function(){abierto=false;console.log(img);console.clear();
  if(abierto&&!cover){cover=document.createElement('div');cover.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#070b14;color:#e6ebf5;display:grid;place-items:center;font:600 18px system-ui;text-align:center;padding:24px';cover.textContent='Cierra las herramientas de desarrollador para continuar.';document.documentElement.appendChild(cover)}
  else if(!abierto&&cover){cover.remove();cover=null}},1000);
})();
