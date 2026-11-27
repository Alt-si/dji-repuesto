# Lista de precios de repuestos DJI Agras

Lista web con los 2.175 repuestos del archivo **"Precios de repuestos 18.11.2026"** (vigente desde el 18/11/2026 hasta nuevo aviso).

## Qué incluye

- Precio de lista en USD, tal cual figura en el PDF, y una columna **Precio final** con el recargo (10 % por defecto; se puede cambiar arriba a la derecha).
- Buscador por código o nombre y filtros por rubro y por equipo (T30, T40, T50, D12000i, etc.).
- Modo edición: poner **nuestro nombre** a un repuesto (se muestra debajo del nombre original, que nunca se pierde), cambiar precio, agregar y eliminar productos, exportar a CSV.
- El buscador encuentra los repuestos también por nuestro nombre.
- Ficha de cada repuesto (tocando el nombre): precios, información del repuesto y foto.
- Enlace "Ver foto real" por producto, que busca el código en Google Imágenes. La foto se copia y se pega en la ficha con Ctrl+V.

## Archivos

| Archivo | Contenido |
|---|---|
| `index.html` | La página completa |
| `cat.js` | Clasificación por rubro, detección de equipo compatible y textos de información por rubro |
| `data.json` | Los 2.175 productos: `d` descripción, `c` código, `p` precio USD |
| `config.js` | Conexión a Supabase |

## Cómo se guardan los cambios (Supabase)

La lista está conectada al proyecto de Supabase **dji-repuestos** (región São Paulo). `config.js` tiene la dirección y la clave pública.

- **Todos** pueden ver la lista con los cambios, las fotos y la información, sin cuenta.
- **Solo los editores** pueden cambiar precios y nombres, agregar o eliminar productos, cambiar el porcentaje y subir fotos. Entran con "Ingresar para editar".
- Los cambios aparecen en vivo para todos los que tienen la lista abierta.
- Las fotos se achican antes de subirlas (máximo 900 px, JPG) y se guardan en el bucket público `fotos`.

### Usuarios y panel de administración

- **Primer ingreso:** la primera vez que alguien toca "Ingresar", la página ofrece crear la **cuenta administradora**. Solo funciona mientras no exista ningún administrador.
- **Panel admin** (botón arriba, solo administradores):
  - crear usuarios con email y contraseña inicial (botón "Generar" para una contraseña al azar);
  - darles permiso de **Editor** (cambia precios y sube fotos) o **Administrador** (además maneja usuarios);
  - **Quitar acceso / Habilitar**, **Nueva contraseña** y **Eliminar**.
- Cada usuario puede cambiar su contraseña desde **Mi cuenta**.
- Siempre tiene que quedar al menos un administrador activo; la base lo impide.
- Las fotos que sube cualquier editor quedan públicas para todos los que ven la lista.
- En cada ficha figura quién hizo la última modificación y cuándo.

### Favoritos

- Cada usuario con permiso marca repuestos con la estrella ☆ (en la lista o en la ficha).
- El botón **★ Favoritos** muestra su listado: cantidad y nota por repuesto, subtotal y total con recargo, y **Copiar listado** para pegarlo en WhatsApp o un mail. Tocando el nombre se abre la ficha.
- El listado queda guardado en la base y es privado de cada usuario; no se borra al cerrar la página.
- El administrador lo habilita por usuario en el panel (casilla **Favoritos**). Los administradores lo tienen siempre.
- **Comparte favoritos** (Panel admin, casilla por usuario): los usuarios marcados usan un mismo listado y cualquiera de ellos agrega o quita repuestos, con quién agregó cada uno; los demás usan su listado propio (que no se borra).
- Permiso **Consulta**: ve la lista y usa favoritos, pero no puede cambiar precios ni fotos.

### Configurar

Botón **Configurar** (usuarios con sesión):
- **Modo edición** (editores) y **Exportar CSV**. Con el modo edición activo aparece en la barra el botón **Terminar edición**.
- **Recargo sobre el precio de lista (%)** e **IVA (%)**: valen para todos; solo editores y administradores los cambian.
- **Actualizar precios de lista** (editores): aumento o baja en % por rubro, por equipo y/o por texto en el código o nombre (o a todos). Muestra cuántos repuestos cambian y un ejemplo antes de aplicar; cada cambio queda en el historial y el último se puede **deshacer** (tabla `ajustes_precio`).
- **Valor hora de mano de obra** (pesos o USD): es de cada usuario y se usa en sus presupuestos nuevos.

En la lista se ve solo el **precio final** (lista + recargo), marcado **+ IVA**. El precio de lista aparece únicamente en Modo edición. En cada presupuesto se tilda **Agregar IVA** si corresponde.

### Dólar y precios en pesos

- En la portada se muestra el **dólar oficial del Banco Nación** (billete), venta y compra, con la fecha del banco.
- La conversión a pesos usa el **valor venta**.
- La cotización la lee la función `dolar` de bna.com.ar (si el banco no responde, de dolarapi.com) y se renueva cada 15 minutos mientras alguien usa la lista.
- El selector **USD / Pesos** cambia cómo se ven todos los precios; cada persona lo elige y queda recordado en su navegador.

### Presupuestos

- Botón **Presupuestos** (cualquier usuario habilitado). Cada usuario ve solo los suyos.
- Cliente, nota, repuestos (buscador por código o nombre, desde la ficha con "+ Agregar al presupuesto", o "Agregar mis favoritos") con cantidad.
- **Mano de obra**: en el presupuesto solo se cargan las horas; el valor hora está en Configurar. En el detalle, la copia y el PDF sale solo el total de mano de obra.
- Totales en USD y en pesos con el dólar venta del momento; **Actualizar precios y dólar** los vuelve a tomar de la lista.
- **Copiar** (para WhatsApp o mail) e **Imprimir / PDF**: el PDF lleva arriba el logo, el nombre y los datos de la empresa de cada usuario (se cargan en Configurar → Tu empresa) y no incluye nada de la página de la lista. Se guarda solo mientras se escribe.

### Base de datos

| Tabla / función | Para qué |
|---|---|
| `edits` | Un registro por producto editado o agregado (`data`: nombre, precio, foto, información, eliminado, quién y cuándo) |
| `config` | El porcentaje de recargo (`id = 'main'`) |
| `editores` | Usuarios: email, nombre, rol (`admin`/`editor`/`consulta`), activo, favoritos |
| `favoritos` | Listado de cada usuario: repuesto, cantidad, nota |
| `presupuestos` | Presupuestos de cada usuario: cliente, nota, repuestos con precio, horas, valor hora, dólar usado |
| `preferencias` | Valor hora y moneda de cada usuario |
| `cotizacion` | Última cotización del dólar oficial del Banco Nación |
| `fotos_auto` | Resultado de la búsqueda automática de fotos por código |
| bucket `fotos` | Fotos públicas; solo los usuarios habilitados pueden subir o borrar |
| función `dolar` | Lee la cotización del Banco Nación (código en `supabase/functions/dolar`) |
| función `fotos` | Busca fotos por código en tiendas de repuestos (código en `supabase/functions/fotos`) |
| función `admin-usuarios` | Crea usuarios, cambia contraseñas y elimina cuentas (código en `supabase/functions/admin-usuarios`) |

Los precios originales están en `data.json`; la base guarda solo lo que se cambió.

### Aviso del plan gratis

Supabase pausa los proyectos gratis después de una semana sin actividad. Los datos no se pierden; se reactiva desde el panel de Supabase con un clic.

## Abrirla localmente

La página carga `data.json`, así que hay que servirla desde un servidor web (no alcanza con abrir el archivo con doble clic):

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

Para publicarla con GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.
