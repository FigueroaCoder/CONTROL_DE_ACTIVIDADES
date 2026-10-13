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
fuente/plantilla.html (esqueleto) · styles.css (temas claro/oscuro) · store.js (roles, SLA, caché) · firebase.js (Auth + Firestore) · ui.js (utilidades y tema) · dashboard.js · tickets.js · reportero.js (portal del reportero) · puntos.js · usuarios.js · chat.js · app.js · guard.js (protecciones) · construir.mjs (generador del index.html)

## Cómo generar el index.html publicado
1. Una sola vez, dentro de `fuente/`: `npm install`
2. Cada vez que cambies algo: `npm run build`
3. Sube a GitHub **solo** el `index.html` de la raíz (la carpeta `fuente/` sigue en `.gitignore`).

El build produce `index.html` (CSS minificado, JavaScript ofuscado, HTML comprimido, CSP y guard.js) y `fuente/index.fuente.html` (versión legible para depurar).

## Diseño y tema
- Interfaz clara por defecto (blanca, tipografía del sistema, tarjetas planas con borde fino). El botón de luna/sol (login, encabezado y portal del reportero) cambia a modo oscuro y la elección se recuerda en ese navegador.
- Todos los colores salen de variables CSS (`:root` y `html[data-theme=dark]` en `styles.css`); las gráficas leen esas variables, así que cambian con el tema.

## Dashboard (administrador y usuario común)
- Selector de periodo (7 / 14 / 30 / 90 días) que alimenta la tendencia, el cierre de registros, el cumplimiento de SLA y el tiempo medio de resolución.
- Indicadores: pendientes, en proceso, cerrados del periodo (con variación contra el periodo previo), SLA vencidos, % de cumplimiento de SLA y tiempo medio de resolución.
- Gráficas: actividad diaria (levantados vs cerrados), estado general, carga por módulo (tickets + puntos 5S), productividad por persona, avance 5S por módulo, tickets activos por urgencia y puntos 5S abiertos por criticidad.

## Tickets
- Urgencia y tiempo máximo de atención: Crítica 30 min · Alta 1 h · Media 4 h · Baja 24 h · Programada esta semana.
- Cada ticket muestra su módulo, quién lo reportó y una cuenta regresiva en vivo (hh:mm:ss) desde que se levanta.
- Cuando otra persona levanta un ticket, a administradores y usuarios comunes les suena una alarma y una voz dice quién lo levantó y de qué módulo. El navegador requiere un primer clic en la página para permitir audio y voz.
- Estados que ve quien reportó: Sin aceptar → Recién asignado → En proceso → Resuelto (o Rechazado / Revocado). "En proceso" lo marca quien atiende con el botón ▶ de la tabla de tickets.

## Tiempo real y avisos
- Todo se sincroniza al instante con Firestore (tickets, usuarios, notificaciones): si alguien envía, toma o cierra un ticket, a los demás se les actualiza solo.
- Si el administrador cambia tu tipo de usuario, tu sesión se reinicia sola con la vista nueva; si te quita el acceso, se cierra.
- Dos personas no pueden tomar el mismo ticket: la segunda ve "Ya lo tomó X" y la lista se actualiza (cada ticket lleva un número de versión `v`).
- Sonido + voz, solo a quien le corresponde:
  - Ticket nuevo: administrador y usuario común (no a quien lo levantó). Dice la urgencia, el módulo y quién lo levantó; la alarma es más larga si es Crítica o Alta.
  - Ticket tomado: a quien lo levantó, con el nombre de quien lo tomó. Los demás del equipo solo ven un aviso en pantalla.
  - Ticket cerrado o rechazado: a quien lo levantó, con el nombre de quien lo cerró.

## Seguridad
- **Nada en el navegador es 100 % secreto**: el navegador siempre recibe el código para poder ejecutarlo, y la opción "Ver código fuente" (view-source:) es una función del navegador que ninguna página puede desactivar. Lo que sí se hace es dificultarlo:
  - `guard.js` bloquea clic derecho, F12, Ctrl+U/S, Ctrl+Mayús+I/J/C/K/E y equivalentes de Mac, y cubre la pantalla mientras estén abiertas las herramientas de desarrollador.
  - El `index.html` publicado lleva el JavaScript **ofuscado** (textos codificados, nombres internos ilegibles) y el HTML/CSS minificados, de modo que "Ver código fuente" muestra código casi ilegible. Los nombres de las funciones llamadas desde botones (`onclick`) se mantienen.
- Política de seguridad de contenido (CSP), sin referrer, sin indexado de buscadores y protección contra incrustación en otros sitios. Se quitó Analytics.
- **La seguridad real son las reglas de `firestore.rules`** (publícalas en Firebase): cada rol solo accede a lo suyo, cada quien solo lee sus notificaciones, los tickets se validan al crearse y nadie puede cambiarse el tipo de usuario. La configuración de Firebase (apiKey, etc.) es pública por diseño; lo que protege los datos son esas reglas y la autenticación.
- Estructura publicada: solo `index.html`. La carpeta `fuente/` (código sin minificar, reglas y generador) está en `.gitignore` y no se sube a GitHub.
