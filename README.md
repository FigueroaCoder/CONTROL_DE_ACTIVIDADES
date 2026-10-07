# Plant Operational Hub · L10 (con Firebase)

## Puesta en marcha
1. Firebase Console → Authentication → Sign-in method → habilita **Correo/contraseña**.
2. Firestore Database → crea la base de datos y en la pestaña Rules pega el contenido de `firestore.rules`.
3. Sube esta carpeta a GitHub Pages y abre la página.
4. Crea tu primer usuario en Authentication → Users. Al iniciar sesión por primera vez queda como **administrador**.
5. Desde la sección **Usuarios** el admin crea cuentas y define su tipo: Administrador, Usuario común o Reportero.

## Permisos
- Reportero: crea tickets y puntos, ve todo, chatea.
- Usuario común: además asigna, resuelve, rechaza y cierra; edita/elimina solo sus propios pendientes.
- Administrador: todo lo anterior + usuarios, módulos y asignación de puntos 5S.

## Estructura
css/styles.css · js/store.js (roles, SLA, caché) · js/firebase.js (Auth + Firestore) · js/ui.js · js/dashboard.js · js/tickets.js · js/puntos.js · js/usuarios.js · js/chat.js · js/app.js
