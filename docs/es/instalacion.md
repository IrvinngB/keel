# Instalar Keel: los detalles

> Traducción de [install.md](../install.md). Si algo difiere, prevalece la versión en inglés.

El [README](README.md#instalación) tiene los comandos. Esta página explica qué escriben
y por qué.

## Antigravity

Antigravity (`agy`) todavía no está soportado. Es un producto distinto de Gemini CLI, con
sus propias convenciones (sus skills globales viven en `~/.gemini/config/skills`), y una
prueba headless no encontró los skills colocados en `.agents/skills`. Tendrá una entrada
en el registry cuando se confirmen de forma interactiva sus rutas de skills y comandos a
nivel de proyecto.

## Los skills se instalan una sola vez

Codex, opencode, Gemini y Kimi leen todos `.agents/skills`, así que, a nivel de proyecto,
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
(`<!-- keel:begin agent=<id> -->` … `<!-- keel:end agent=<id> -->`). Codex y Kimi pueden
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
