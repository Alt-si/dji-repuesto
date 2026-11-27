# Lista de precios de repuestos DJI Agras

Lista web con los 2.175 repuestos del archivo **"Precios de repuestos 18.11.2026"** (vigente desde el 18/11/2026 hasta nuevo aviso).

## Qué incluye

- Precio de lista en USD, tal cual figura en el PDF, y una columna **Precio final** con el recargo (10 % por defecto; se puede cambiar arriba a la derecha).
- Buscador por código o nombre y filtros por rubro y por equipo (T30, T40, T50, D12000i, etc.).
- Modo edición: cambiar nombre y precio, agregar y eliminar productos, exportar a CSV.
- Ficha de cada repuesto (tocando el nombre): precios, información del repuesto y foto.
- Enlace "Ver foto real" por producto, que busca el código en Google Imágenes.

## Archivos

| Archivo | Contenido |
|---|---|
| `index.html` | La página completa |
| `cat.js` | Clasificación por rubro, detección de equipo compatible y textos de información por rubro |
| `data.json` | Los 2.175 productos: `d` descripción, `c` código, `p` precio USD |

## Cómo se guardan los cambios

- **Publicada en Claude** (artifact): las ediciones, las fotos y las explicaciones generadas con IA se guardan en una base compartida, y todos los que abren la lista las ven.
- **Fuera de Claude** (GitHub Pages o un servidor propio): las ediciones y el porcentaje se guardan en el navegador de cada persona. La carga de fotos y el botón "Explicar con IA" solo funcionan en la versión de Claude.

## Abrirla localmente

La página carga `data.json`, así que hay que servirla desde un servidor web (no alcanza con abrir el archivo con doble clic):

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

Para publicarla con GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.
