# Keel

> Traducción de [README.md](../../README.md). Si algo difiere, prevalece la versión en inglés.

[![CI](https://github.com/IrvinngB/keel/actions/workflows/ci.yml/badge.svg)](https://github.com/IrvinngB/keel/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

> Desarrollo guiado por especificaciones (spec-driven development) para cualquier agente
> de código con IA. Planifica el cambio, demuéstralo y mantén las specs en git, uses
> Claude Code, opencode, Codex CLI, Gemini CLI o cualquier herramienta que lea
> `AGENTS.md`.

**¿Por qué?** Los agentes saltan directo al código. Keel pasa cada cambio por un
pipeline: las suposiciones se cuestionan antes del diseño, cada consumidor del código se
mapea antes de escribir las tareas, y nada se archiva hasta que está verificado:

```
explore → proposal → spec → clarify → design → blast-radius → tasks → apply → verify → archive
```

Todo son archivos de texto plano bajo `keel/`, revisados en tus pull requests como si
fueran código.

## Inicio rápido (Claude Code)

```
/plugin marketplace add IrvinngB/keel
/plugin install sdd@keel
/sdd:init
/sdd:new my-change
```

¿Usas otro agente? Mira [Instalación](#instalación).

## Qué obtienes

Un cambio en curso, desde la terminal y sin gastar tokens:

```console
$ sdd status
CHANGE         PHASES                                                  TASKS GUARD    STATE
add-dark-mode  explore→proposal→spec→clarify→design→blast-radius→tasks 2/4   none     apply
rate-limit-api proposal→spec                                           -     -        spec

next: /sdd:continue

$ sdd next
add-dark-mode: next phase = apply → run /sdd:continue add-dark-mode
rate-limit-api: next phase = clarify → run /sdd:continue rate-limit-api
```

Y los artefactos que hay detrás, versionados junto con tu código:

```
keel/
├── config.yaml              stack, comandos de test/lint verificados, almacén de artefactos
├── steering/                product.md · tech.md · structure.md, se actualizan tras apply
├── specs/auth/spec.md       fuente de verdad, se actualiza al archivar
├── lessons/add-login.md     postmortem: lo planeado vs. lo que realmente pasó en git
└── changes/
    ├── add-dark-mode/       proposal · specs/ · clarifications · design ·
    │                        blast-radius · tasks · state.yaml
    ├── rate-limit-api/
    └── archive/2026-09-20-add-login/
```

## ¿En qué se diferencia?

[OpenSpec](https://github.com/Fission-AI/OpenSpec) y
[spec-kit](https://github.com/github/spec-kit) son kits de SDD maduros y muy usados; si
encajan con tu equipo, úsalos. Keel es más joven y apuesta por otras cosas:

- **Más compuertas antes del código.** Además de clarify, una fase blast-radius mapea
  cada consumidor real del código que vas a cambiar, con evidencia archivo:línea, y
  bloquea las tareas hasta que cada punto que se rompe esté cubierto. La detección de
  drift y los postmortems cierran el ciclo después de apply.
- **Se hace cumplir, no solo se sugiere.** Un guard de pre-commit de git bloquea los
  commits mientras haya tareas sin marcar, y los cambios demasiado grandes requieren PRs
  encadenados o un `size:exception` explícito.
- **Un solo núcleo, adaptadores generados.** Cada agente recibe archivos generados a
  partir de un mismo conjunto de contratos en markdown; agregar un agente es una fila del
  registry. Más abajo, el estado honesto de cada agente.
- **Persistencia intercambiable.** Archivos por defecto; SQLite, o un servidor de memoria
  MCP mapeado mediante el backend genérico, detrás de la misma interfaz SAVE/LOAD/LIST.

## Instalación

El CLI es `sdd`, los comandos son `/sdd:*` y los skills se llaman `sdd-*`: SDD es la
metodología, Keel es el proyecto.

### Claude Code (plugin)

```
/plugin marketplace add IrvinngB/keel
/plugin install sdd@keel
```

### Cualquier otro agente

```bash
npx keel-sdd install opencode --project      # sin instalar nada antes, o deja `sdd` en el PATH:
npm install -g keel-sdd                      # incluye Windows; así todos los `sdd ...` de abajo funcionan
# última versión de main: npm install -g github:IrvinngB/keel
# desde un clon: ln -s "$PWD/bin/sdd" ~/.local/bin/sdd

sdd install opencode --user                  # global: ~/.config/opencode/{agent,command,skills}
sdd install opencode --project               # por repo: .opencode/{agent,command} + .agents/skills
sdd install codex --project                  # .agents/skills + bloque en AGENTS.md + commit guard
sdd install gemini --project                 # .agents/skills + .gemini/commands + bloque en GEMINI.md
sdd install kimi --project                   # .agents/skills + bloque en AGENTS.md   (experimental)
sdd install antigravity --project            # .agents/skills + bloque en AGENTS.md   (experimental)
sdd install generic --project                # cualquier otro agente que respete AGENTS.md: .sdd/core/
                                             # + AGENTS.md (--context-file=GEMINI.md para un 2.º archivo)
sdd install claude                           # imprime los comandos /plugin de arriba
```

Usa `--user` en lugar de `--project` para una instalación global (Gemini y Kimi imprimen
el bloque para que lo pegues en vez de escribirlo: no hay una ruta de contexto a nivel de
usuario verificada; Antigravity, en cambio, escribe `~/.gemini/AGENTS.md` a nivel de usuario, sin comprobar).

### Agentes soportados

| Agente | Directorio de skills | Comandos | Subagentes | Archivo de contexto | Estado |
|--------|---------------------|----------|------------|---------------------|--------|
| Claude Code | plugin | `/sdd:new` | sí | plugin | Verified (1) |
| opencode | `.agents/skills` | `/sdd-new` | sí | — | Tested (1) |
| Codex CLI | `.agents/skills` | `$sdd-new` (skills) | single-phase | `AGENTS.md` | Experimental (3) |
| Gemini CLI | `.agents/skills` | `/sdd:new` (TOML) | single-phase | `GEMINI.md` | Experimental (4) |
| Kimi Code CLI | `.agents/skills` | `/skill:sdd-new` | single-phase | `AGENTS.md` (2) | Experimental |
| Antigravity | `.agents/skills` | `/sdd-new` (skills) | single-phase | `AGENTS.md` (5) | Experimental (5) |
| Generic | — | leer el archivo de la fase | single-phase | `AGENTS.md` | Verified |

**Tested** significa que una sesión headless real de ese agente cargó los skills
instalados (opencode 1.18.18, 2026-09-23). **Verified** significa que la superficie de
extensión se comparó con la documentación oficial del agente en esa fecha.
**Experimental** significa que solo se apoya en documentación o que es en parte
inferido: ninguno garantiza que el pipeline completo funcione dentro de ese agente.
(1) La estructura de archivos `agents/` y `command/` viene de la versión anterior y no se
volvió a comprobar; los comandos `/sdd-*` generados para opencode no se ejercitaron.
(2) Que Kimi lea `AGENTS.md` es una inferencia, no está confirmado. (3) Codex no estaba
disponible para probar. (4) Gemini CLI se está retirando para cuentas individuales en
favor de Antigravity; Google rechazó la ejecución headless, así que no se pudo probar.
(5) Antigravity (`agy`) se basa en su documentación (revisada el 2026-09-24) y no se
ejercitó en una sesión real; sus directorios de detección, la ruta de skills de usuario,
el archivo de contexto de usuario y la invocación no están verificados.

`sdd install` y `sdd doctor` imprimen los campos `unverified` y las notas de cada agente.
Gemini CLI lee `GEMINI.md`, no `AGENTS.md`, a menos que lo agregues en
`context.fileName`; `sdd install gemini` escribe `GEMINI.md`. Keel instala solo
skills y un bloque en `AGENTS.md` para Antigravity; no escribe comandos, agentes, workflows
ni hooks. No se comprobó si Antigravity los admite.

Qué escribe el instalador, los directorios de skills compartidos, los bloques de
contexto por agente, los dry runs y los detalles de Antigravity:
[instalacion.md](instalacion.md).

### En todos los casos, por proyecto

Ejecuta `/sdd:init` dentro de tu agente: detecta el stack, escribe `keel/config.yaml` y
hace las preguntas de configuración: almacén de artefactos (cualquier backend registrado
o una combinación con `+`), Strict TDD y revisión de seguridad.

## Uso

Dentro de cualquier agente instalado:

| Comando | Para qué sirve |
|---------|----------------|
| `/sdd:init` | inicializa keel/ y detecta el stack |
| `/sdd:new <change>` | explorar + propuesta |
| `/sdd:continue` | la siguiente fase que ya tiene sus dependencias listas |
| `/sdd:ff` | toda la planificación de una vez (propose→spec→clarify→design→blast-radius→tasks) |
| `/sdd:explore <topic>` | investigar una idea y comparar enfoques |
| `/sdd:clarify` | forzar las preguntas incómodas antes del diseño |
| `/sdd:apply` / `/sdd:verify` / `/sdd:archive` | implementar → demostrar → cerrar |
| `/sdd:blast <symbol>` | ¿qué se rompe si cambio X? (suelto o dentro del pipeline) |
| `/sdd:estimate` `/sdd:drift` `/sdd:security` `/sdd:steer` `/sdd:postmortem` | riesgo, divergencia, auditoría, contexto, aprendizaje |

(Se muestra el dialecto de Claude; mira la tabla de arriba para otros agentes: `sdd next`
siempre imprime el comando exacto para tu herramienta.)

Desde tu terminal, sin gastar tokens:

```bash
sdd status            # cada cambio activo: fase, tareas x/y, decisiones pendientes
sdd next              # el comando exacto a ejecutar, en el dialecto de tu herramienta
sdd doctor            # herramientas detectadas, adaptadores instalados, guards activos
sdd guard install     # guard universal de pre-commit de git (cualquier agente, cualquier persona)
```

## Qué incluye el pipeline

- **Compuerta clarify** — no se diseña sobre suposiciones: se verifican contra el código
  real, con preguntas BLOCKER y respuestas por defecto recomendadas, antes de `design`.
- **Blast radius (radio de impacto)** — antes de las tareas, se mapea cada consumidor
  real del código que vas a cambiar con evidencia archivo:línea (llamadas, rutas, tablas,
  APIs publicadas, tests); cada fila BREAKS debe convertirse en una tarea o el pipeline
  se bloquea.
- **Aprendizaje por postmortem** — tras archivar, lo planeado se contrasta con lo que
  realmente pasó en git y se guarda en `keel/lessons/`; los patrones recurrentes se
  convierten en actualizaciones de steering PROPUESTAS (nunca se aplican solas). El
  sistema mejora con el uso.
- **Detección de drift** — el `git log` de los archivos tocados frente a las fechas de
  los artefactos, clasificado en: `CODE_UNTRACKED` / `SPEC_STALE` / `DESIGN_STALE` /
  `ARTIFACT_UNDONE`.
- **Documentos de steering** — `keel/steering/{product,tech,structure}.md` se actualizan
  tras cada lote de apply; las sesiones empiezan con la verdad, no con arqueología.
- **Agnóstico al stack** — `stack-detector` verifica los comandos reales de test/lint y
  los guarda en `keel/config.yaml`; las fases siguientes leen la configuración, nunca
  asumen un lenguaje.
- **Protección para quien revisa** — pronóstico de 400 líneas por cambio; el trabajo
  demasiado grande requiere PRs encadenados (apilados / cadena de ramas de feature) o un
  `size:exception` explícito.
- **Reversibilidad y observabilidad obligatorias** — design.md no puede entregarse sin
  sus secciones de Rollback y Observability (se permite "N/A + por qué"; el silencio no).
- **Dos modos de ejecución** — las herramientas con subagentes delegan (contexto limpio
  por fase); las que no los tienen corren estrictamente una fase a la vez. Mismos
  contratos, mismos archivos.
- **Commit guard universal** — PreToolUse de Claude + pre-commit de git (para saltarlo
  deliberadamente: `SDD_ALLOW_COMMIT=1 git commit ...`).

## Arquitectura

```
core/               ← única fuente de verdad (independiente de la herramienta)
├── orchestrator.md     el rol del orquestador: ruteo, guards, cachés de sesión
├── conventions.md      estructura de artefactos, state.yaml, envelope, guard de carga de trabajo
├── persistence/        interface.md + backends: archivos · SQLite · MCP genérico ·
│                     template.md para agregar el tuyo
├── phases/             16 contratos de fase (10 del pipeline + 6 utilidades)
└── commands/           15 cuerpos de comando
adapters/           ← GENERADO por build/generate.js — nunca lo edites a mano
bin/sdd             ← CLI: build · install · status · next · doctor · guard
hooks/              ← PreToolUse (Claude) + pre-commit (guard universal de git)
```

**¿Herramienta nueva?** Agrega una entrada al registry de agentes en
`build/manifest.json`; `core/` no cambia nunca.

## Agregar un agente

Los agentes son filas de `registry` dentro de `build/manifest.json`. Una fila declara:

- `invoke` — cómo se resuelven `{{cmd:X}}`, `{{agent:X}}` y `{{skill:X}}` (plantillas
  `{name}`, `{short}`) y `args` — cómo se referencian los argumentos del usuario;
- `emit` — si las fases y comandos se convierten en skills o en archivos nativos de
  subagente/comando (`format` elige un formateador existente, como `toml`), el nombre del
  directorio de skills y un bloque `contextFile` opcional;
- `install` — dónde se escriben los archivos según el alcance, más el archivo de contexto
  al que se agrega;
- `status` (`verified` | `experimental`), `unverifiedFields` y `notes`, que
  `sdd install` y `sdd doctor` imprimen como advertencias.

Agrega la fila, corre `sdd build` y listo: no hay que tocar el generador para ningún
agente que encaje en las formas de skills, Markdown o TOML. Un formato de archivo
totalmente nuevo necesita una pequeña función formateadora en `build/generate.js`.
Mientras no exista la fila, `sdd install generic` ya cubre al agente.

## Contribuir

Los reportes de errores, los reportes de soporte de agentes y los PRs son bienvenidos.
Empieza por [contribuir.md](contribuir.md): dónde va cada cambio, las reglas de
portabilidad y las comprobaciones que corre el CI.

- Preguntas e ideas: [Discussions](https://github.com/IrvinngB/keel/discussions)
- Tu primera contribución: [good first issues](https://github.com/IrvinngB/keel/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- ¿Probaste Keel en un agente Experimental? Un
  [reporte de soporte de agente](https://github.com/IrvinngB/keel/issues/new?template=agent_support.yml)
  es la forma más rápida de pasarlo a Tested.

La participación sigue el [Código de Conducta](../../CODE_OF_CONDUCT.md) (en inglés); las
vulnerabilidades se reportan según [SECURITY.md](../../SECURITY.md) (en inglés).

## Licencia

MIT
