# Plant Operational Hub · L10 (con Firebase)

## Puesta en marcha
1. Firebase Console → Authentication → Sign-in method → habilita **Correo/contraseña**.
2. Firestore Database → crea la base de datos y en la pestaña Rules pega el contenido de `firestore.rules`.
3. Sube esta carpeta a GitHub Pages y abre la página.
4. Crea tu primer usuario en Authentication → Users. Al iniciar sesión por primera vez queda como **administrador**.
5. Desde la sección **Usuarios** el admin crea cuentas y define su tipo: Administrador, Usuario común o Reportero.

## Permisos
- Reportero: portal propio (tema claro, navegación superior) **solo de tickets**: crear tickets, ver el seguimiento y el historial de los suyos, ver el tablero de tickets de otras personas (abiertos, recién asignados, en proceso y cerrados) y **revocar** un ticket propio mientras nadie lo haya aceptado. No ve puntos 5S, módulos, tareas, dashboard ni chat (las reglas de Firestore también se lo impiden).
- Usuario común: asigna, resuelve, rechaza y cierra tickets, marca "en proceso" los que atiende; edita/elimina solo sus propios pendientes; puntos 5S y chat.
- Administrador: todo lo anterior + usuarios, módulos y asignación de puntos 5S.

> Después de actualizar, vuelve a pegar `firestore.rules` en Firebase (pestaña Rules) y publícalo.

## Estructura
styles.css · store.js (roles, SLA, caché) · firebase.js (Auth + Firestore) · ui.js · dashboard.js · tickets.js · reportero.js (portal del reportero) · puntos.js · usuarios.js · chat.js · app.js

## Tickets
- Urgencia y tiempo máximo de atención: Crítica 30 min · Alta 1 h · Media 4 h · Baja 24 h · Programada esta semana.
- Cada ticket muestra su módulo, quién lo reportó y una cuenta regresiva en vivo (hh:mm:ss) desde que se levanta.
- Cuando otra persona levanta un ticket, a administradores y usuarios comunes les suena una alarma y una voz dice quién lo levantó y de qué módulo. El navegador requiere un primer clic en la página para permitir audio y voz.
- Estados que ve quien reportó: Sin aceptar → Recién asignado → En proceso → Resuelto (o Rechazado / Revocado). "En proceso" lo marca quien atiende con el botón ▶ de la tabla de tickets.
