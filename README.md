# Liga de Redondela — web estática

Web 100% estática (sin backend) pensada para GitHub Pages que muestra los
resultados del Torneo de Fútbol Aficionado de Redondela, jornada a jornada,
con clasificación y evolución de puntos.

La web publicada (`index.html`) es **solo de consulta**: no tiene ningún
botón ni formulario para añadir o editar resultados. Los datos únicamente
cambian cuando tú generas un `DatosJornadas/JornadaN.json` y haces
`commit` + `push`, así que solo quien tenga acceso de escritura al
repositorio de GitHub puede actualizar la liga.

## Estructura del proyecto

```
index.html                    Web pública (solo consulta): resultados, clasificación, evolución y campos
config.json                   Nombre del torneo y entidad organizadora
campos.json                   Campos de fútbol: nombre, enlace al mapa y foto opcional
DatosJornadas/JornadaN.json   Un archivo por jornada, numerados de forma correlativa
assets/style.css              Estilos compartidos
assets/app.js                 Lógica de la web pública

--- Solo en tu equipo, nunca se suben al repositorio (ver .gitignore) ---
admin.html                    Herramienta local para digitalizar un acta (OCR + revisión)
assets/admin.js                Lógica de la herramienta de digitalización
ImagenesOrigen/                Fotos originales de las actas + manifest.json (uso exclusivo de admin.html)
```

`admin.html`, `assets/admin.js` e `ImagenesOrigen/` están excluidos en
`.gitignore` a propósito: viven en tu carpeta de trabajo pero nunca se
publican en GitHub Pages ni se comparten con nadie más. Así evitas exponer
la herramienta de edición y las fotos originales (que a veces incluyen
teléfono/email de contacto).

## Cómo añadir una nueva jornada (solo tú, en tu equipo)

1. Guarda la foto del acta en `ImagenesOrigen/` (por ejemplo `jornada2.jpeg`) y
   añade su nombre al array de `ImagenesOrigen/manifest.json`. Esta carpeta es
   local (ver `.gitignore`), así que puedes crearla si no existe todavía.
2. Sirve la carpeta del proyecto con un servidor estático local (ver
   "Probar en local" más abajo) y abre `http://localhost:8000/admin.html`
   directamente en el navegador. Esta página no está enlazada desde la web
   pública ni se publica en GitHub Pages.
3. Elige la imagen y pulsa **Analizar con OCR**: tesseract.js reconoce el
   texto de la foto de forma orientativa (puede confundir letras o números,
   sobre todo si el marcador está manuscrito).
4. Rellena/corrige a mano el formulario de partidos (equipo local, visitante,
   campo y resultado) usando el texto OCR y la propia imagen como referencia.
   Dejar el resultado vacío marca el partido como "Pendiente".
5. Pulsa **Generar JSON** y después **Descargar JSON**.
6. Guarda el archivo descargado como `DatosJornadas/JornadaN.json` (siguiendo
   la numeración correlativa) y haz commit + push **solo de ese archivo**
   (admin.html, assets/admin.js e ImagenesOrigen/ ya están ignorados por
   git). Al publicarse en GitHub Pages, `index.html` la detectará
   automáticamente.

## Formato de `DatosJornadas/JornadaN.json`

```json
{
  "numero": 1,
  "fecha": "2026-09-27",
  "partidos": [
    { "local": "EQUIPO A", "visitante": "EQUIPO B", "campo": "Nombre del campo", "gl": 1, "gv": 3 }
  ]
}
```

`gl`/`gv` a `null` indica que el partido todavía no se ha jugado.

## Formato de `campos.json`

```json
[
  { "nombre": "Soutomaior", "alias": [], "enlace": "https://maps.app.goo.gl/...", "imagen": "", "equipos": ["BANDEIRA", "SAXAMONDE"] }
]
```

- `equipos`: equipos de la liga que juegan en ese campo (con el mismo nombre
  que en las jornadas). Los campos con la lista vacía se muestran como
  «adicionales y amistosos».
- `alias`: otros nombres con los que aparece el campo en las jornadas, para
  enlazar el campo de cada partido con su mapa.
- `enlace`: URL de Google Maps del campo; al tocar la tarjeta se abre en una
  pestaña nueva.
- `imagen`: ruta opcional a una foto del campo (por ejemplo
  `assets/campos/soutomaior.jpg`). Si se deja vacía, la tarjeta muestra un
  icono ⚽ por defecto.

## Cómo funciona la web pública

`index.html` no puede listar carpetas (es una web estática), así que
`assets/app.js` va pidiendo `DatosJornadas/Jornada1.json`,
`DatosJornadas/Jornada2.json`... hasta encontrar el primer número que no
existe. Por eso los archivos deben numerarse de forma correlativa sin huecos.

Con todas las jornadas cargadas, la web calcula en el navegador:

- **Jornada**: resultados de la jornada seleccionada y clasificación justo
  después de disputarse.
- **Clasificación**: tabla general con todos los resultados hasta la fecha.
- **Evolución**: puntos acumulados de cada equipo después de cada jornada,
  para ver de un vistazo cómo ha progresado la clasificación.

## Probar en local

```bash
python3 -m http.server 8000
```

y abre `http://localhost:8000/index.html`.
