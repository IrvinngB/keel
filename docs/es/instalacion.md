# Instalar Keel: los detalles

> Traducción de [install.md](../install.md). Si algo difiere, prevalece la versión en inglés.

El [README](README.md#instalación) tiene los comandos. Esta página explica qué escriben
y por qué.

## Antigravity

Antigravity (`agy`) es Experimental: Keel escribió la entrada del registry a partir de su
documentación oficial (revisada el 2026-09-24) y no la ha ejercitado en una sesión real de
Antigravity. Es un producto distinto de Gemini CLI. Keel instala solo skills y un bloque en `AGENTS.md`
para Antigravity; no escribe comandos, agentes, workflows ni hooks. No se comprobó si
Antigravity los admite.

- Alcance de proyecto (`--project`): skills en `.agents/skills` (compartido con los demás
  agentes) y un bloque `antigravity` en `AGENTS.md`. Los skills se invocan como
  `/<skill-name>`, por ejemplo `/sdd-new` (sin comprobar: ver abajo).
- Alcance de usuario (`--user`): skills en `~/.gemini/config/skills` (Antigravity 2.0 y el
  IDE) y el bloque en `~/.gemini/AGENTS.md`. Keel nunca modifica `~/.gemini/GEMINI.md`.
- La CLI de Antigravity lee los skills de usuario desde `~/.gemini/antigravity-cli/skills`;
  Keel no escribe ahí, así que copia a mano las carpetas de skills `sdd*` si usas la CLI.
- La detección busca `~/.gemini/antigravity`, `~/.gemini/antigravity-ide` o
  `~/.gemini/antigravity-cli`, nunca el `~/.gemini` a secas que también usa Gemini CLI.
- `sdd doctor` puede avisar de que hay skills tanto en `~/.agents/skills` como en
  `~/.gemini/config/skills`. Ese aviso puede ser una falsa alarma para quien use la CLI;
  conserva una sola copia si prefieres asegurarte. Keel nunca borra tus archivos.

Sin verificar: los directorios de detección, la ruta de skills de usuario, el archivo de
contexto de usuario, la invocación y el soporte de subagentes. Solo un cambio posterior que
documente una sesión real podrá reducir esa lista o promover Antigravity más allá de Experimental.

Historia: una prueba headless durante la 0.3.0 no encontró skills colocados en
`.agents/skills`. La documentación oficial ahora dice que `.agents/skills` a nivel de
proyecto funciona. Por qué falló la prueba de la 0.3.0 es una hipótesis sin comprobar (una
ubicación de skills a nivel de usuario); no se ha reproducido ni confirmado.

## Los skills se instalan una sola vez

Codex, opencode, Gemini, Kimi y Antigravity leen todos `.agents/skills`, así que, a nivel de proyecto,
cada uno instala sus skills ahí y en ningún otro lugar. Los cuerpos de los skills son
neutrales respecto a la invocación para todos los agentes: dicen "fase `sdd-apply`" y
"comando `continue`", nunca `$sdd-continue`, `/sdd:continue` ni `/skill:sdd-continue`,
de modo que el mismo archivo es correcto para todos los lectores y no puede
desincronizarse. La sintaxis propia de cada agente vive solo en el bloque de su archivo
de contexto y en sus archivos nativos de comando/agente. El alcance de usuario (`--user`)
conserva el directorio de skills propio de cada agente, porque un `~/.agents/skills` a
nivel de usuario solo está verificado para Codex. La única forma de terminar con una copia
doble real es un resto de una instalación anterior (por ejemplo `.kimi/skills`): `sdd
install` avisa y `sdd doctor` reporta "would discover the sdd skills twice"; elimina tú
mismo las entradas `sdd*` sobrantes — sdd nunca borra tus archivos.

## Bloques de contexto por agente

Cada agente es dueño de una región marcada dentro del archivo de contexto
(`<!-- keel:begin agent=<id> -->` … `<!-- keel:end agent=<id> -->`). Codex, Kimi y Antigravity pueden
compartir un mismo `AGENTS.md`; volver a ejecutar `sdd install` reemplaza solo la región
de ese agente, nunca toca tu contenido fuera de los marcadores y conserva los finales de
línea que ya tenía el archivo. Si los marcadores están mal formados (un begin sin end, un
bloque duplicado, un end que no corresponde), `sdd install` se niega a tocar el archivo e
indica la línea que hay que corregir; `sdd doctor` reporta lo mismo. Un bloque genérico de
una versión temprana sin marcador de cierre (`<!-- sdd-kit generic block vN -->`) no se
puede delimitar con seguridad: `sdd doctor` lo reporta como no administrado, y
`sdd install` agrega un bloque administrado y deja ese intacto.

## Dry run

`sdd install <agent> --dry-run` imprime lo que haría y no escribe nada: ni archivos, ni
directorios, ni ediciones al archivo de contexto, ni el hook de git.
`--context-file=<name>` debe ser una ruta relativa dentro del proyecto (sin `..` y sin
escapes por symlink).
