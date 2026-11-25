# PiraMax — Pirámide Numérica 🔢🏆

![HTML](https://img.shields.io/badge/HTML5-orange?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-blue?logo=css3&logoColor=white)
![JS](https://img.shields.io/badge/JavaScript-yellow?logo=javascript&logoColor=black)
![No dependencias](https://img.shields.io/badge/sin%20dependencias-green)
![License](https://img.shields.io/badge/licencia-MIT-blue)

Un juego de lógica matemática en **HTML + CSS + JavaScript puros** (sin librerías ni build). Construye la pirámide: cada bloque es la **suma** o el **producto** de los dos bloques que lo sostienen. ¡Descubre las casillas «?** y completa la pirámide!

## 🎮 Cómo jugar

1. La **fila inferior (base)** siempre es visible.
2. Cada bloque de arriba es la **SUMA** de los dos bloques que lo sostienen: `2 + 3 = 5`.
3. Escribe los números en las casillas «?** y presiona **✅ Comprobar** (o Enter).
4. Las correctas se marcan en verde; las incorrectas tiemblan en rojo.
5. ¡Completa la pirámide, gana puntos y pasa al siguiente nivel!

## ⚡ Características

- 📈 **Dificultad progresiva (pura suma)**: la base crece (3 → 7 casillas), los números de la base aumentan (1–5 hasta 1–18) y cada vez se ocultan más casillas (55% → 100%). Las sumas por cuadro se hacen cada vez más grandes.
- 💡 **Pistas** (2 por nivel) que revelan una casilla aleatoria.
- 🏆 **Puntuación con récord** guardado en `localStorage`.
- 🌈 **Confeti**, fanfarria de sonido (Web Audio API) y animaciones.
- 🔢 **Matemática garantizada**: la pirámide se valida celda por celda antes de jugarse, y un filtro anti-repeticiones evita repetir las últimas 12 pirámides.
- 📱 **Optimizado para móvil**: celdas dinámicas según el ancho de pantalla, botones táctiles de ≥48px, teclado numérico automático y auto-focus en la primera casilla «?».
- 🔊 Botón para activar/silenciar el sonido.

## 🚀 Cómo ejecutar

Solo abre [`index.html`](index.html) en tu navegador. No hay que instalar nada:

```bash
# Opcional, con un servidor local:
npx serve .
# o
python3 -m http.server 8080
```

## 📁 Estructura

```
├── index.html      # Estructura del juego
├── css/
│   └── styles.css  # Diseño, animaciones y responsive móvil
└── js/
    └── script.js   # Generación de pirámides, validación, HUD, sonidos y confeti
```

## 🧮 ¿Por qué la pirámide es perfecta?

Cada celda se genera con la misma función `applyOp(a, b)` y luego se verifica con `validatePyramid()` que **cada bloque coincide exactamente** con la operación de sus dos bloques inferiores. Si hubiera alguna discrepancia, se regenera automáticamente.

## 📊 ¿Cuántas partidas distintas?

Millones: con base de 7 casillas y números 1–18 hay hasta **18⁷ ≈ 612 millones** de pirámides distintas, más todas las combinaciones de casillas ocultas.

## 📜 Licencia

Proyecto bajo licencia [MIT](LICENSE) — libre de usar, modificar y distribuir (incluso con fines comerciales), citando o no la fuente.

```
MIT License
Copyright (c) 2026 Dany Briones
```

---

Hecho con ❤️ · HTML + CSS + JS
