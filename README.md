# Lista de precios de repuestos DJI Agras

Lista web con los 2.175 repuestos del archivo **"Precios de repuestos 18.11.2026"** (vigente desde el 18/11/2026 hasta nuevo aviso).

## Qué incluye

- Precio de lista en USD, tal cual figura en el PDF, y una columna **Precio final** con el recargo (10 % por defecto; se puede cambiar arriba a la derecha).
- Buscador por código o nombre y filtros por rubro y por equipo (T30, T40, T50, D12000i, etc.).
- Modo edición: cambiar nombre y precio, agregar y eliminar productos, exportar a CSV.
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

### Base de datos

| Tabla | Para qué |
|---|---|
| `edits` | Un registro por producto editado o agregado (`data`: nombre, precio, foto, información, eliminado) |
| `config` | El porcentaje de recargo (`id = 'main'`) |
| `editores` | Emails autorizados para editar |

Los precios originales están en `data.json`; la base guarda solo lo que se cambió.

### Agregar un editor

1. En Supabase: **Authentication → Users → Add user → Create new user**, con email y contraseña (tildar "Auto Confirm User").
2. En **SQL Editor**, ejecutar:
   ```sql
   insert into public.editores (email) values ('nombre@ejemplo.com');
   ```

Para quitar a alguien: `delete from public.editores where email = 'nombre@ejemplo.com';`

### Aviso del plan gratis

Supabase pausa los proyectos gratis después de una semana sin actividad. Los datos no se pierden; se reactiva desde el panel de Supabase con un clic.

## Abrirla localmente

La página carga `data.json`, así que hay que servirla desde un servidor web (no alcanza con abrir el archivo con doble clic):

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

Para publicarla con GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.
