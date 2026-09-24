# Contribuir a Keel

> Traducción de [CONTRIBUTING.md](../../CONTRIBUTING.md). Si algo difiere, prevalece la versión en inglés.

Gracias por ayudar. Keel es pequeño a propósito: contratos en markdown en `core/`, un
generador sin dependencias y un CLI sin dependencias. Las contribuciones que mantienen
eso son las más fáciles de aceptar.

## Antes de empezar

- **Abre primero un issue** para cualquier cosa que no sea un typo o un arreglo de una
  línea. Una conversación corta evita un PR rechazado.
- **Los reportes de soporte de agentes son contribuciones.** Si ejecutaste Keel dentro de
  un agente marcado como Experimental y funcionó (o no), abre un issue de *Agent support
  report*. Así es como las filas pasan de Experimental a Tested.
- Sé amable. Este proyecto sigue el [Código de Conducta](../../CODE_OF_CONDUCT.md) (en
  inglés).

## Keel se desarrolla con Keel

Los cambios que alteran el comportamiento pasan por el pipeline, y sus artefactos en
`keel/` forman parte del PR. [AGENTS.md](../../AGENTS.md) (en inglés) tiene las reglas,
incluida la versión de Keel que ejecuta el pipeline. Quien revisa lee primero la propuesta
y la spec, y después el código.

## Preparación

Requisitos: Node.js 18+ y git. No hay nada que instalar.

```bash
git clone https://github.com/IrvinngB/keel && cd keel
node bin/sdd help
node bin/sdd build        # regenera adapters/ a partir de core/
```

## Dónde va cada cambio

| Quieres cambiar | Edita | Nunca edites |
|-----------------|-------|--------------|
| El comportamiento de una fase o comando | `core/phases/`, `core/commands/` | `adapters/` |
| La estructura de artefactos, el envelope, los guards | `core/conventions.md` | `adapters/` |
| El ruteo del orquestador | `core/orchestrator.md` | `adapters/` |
| Un backend de persistencia | `core/persistence/` (parte de `template.md`) | — |
| Soporte para un agente nuevo | una fila de `registry` en `build/manifest.json` | `core/` |
| Un formato de archivo de salida nuevo | un formateador en `build/generate.js` | — |
| El comportamiento del CLI | `bin/sdd` + un test en `test/` | — |

`adapters/` es generado. Las ediciones a mano las sobrescribe el siguiente build, y el CI
rechaza un PR cuyo `adapters/` no coincida con la salida de `sdd build`.

## Las reglas que mantienen Keel portable

1. **El core es agnóstico a la herramienta.** Sin nombres de agentes, sintaxis con slash
   ni rutas propias de una herramienta en `core/`. Usa los marcadores (`{{cmd:X}}`,
   `{{agent:X}}`, `{{skill:X}}`) y deja que el registry los resuelva.
2. **Los cuerpos de los skills son neutrales respecto a la invocación.** Escribe "fase
   `sdd-apply`" y "comando `continue`", nunca `/sdd:continue` ni `$sdd-continue`.
3. **Cero dependencias en runtime.** `bin/sdd` y `build/generate.js` usan solo módulos
   integrados de Node.
4. **Nunca borres archivos del usuario.** Install y doctor pueden avisar; no eliminan.
5. **Sé honesto con el estado.** Marca un agente como `verified` solo después de revisar
   su documentación oficial, y escribe "Tested" en el README solo después de una sesión
   real. Anota en `unverifiedFields` todo lo que sea inferido.

## Antes de abrir un PR

```bash
npm test                            # suite de node:test, sin dependencias
node bin/sdd build                  # debe terminar bien (corre una autocomprobación)
git status --porcelain adapters/    # debe quedar vacío después de commitear el rebuild
```

Los tests viven en `test/` y ejecutan el CLI real contra repos git desechables con un
`HOME` aislado. Un arreglo en `bin/sdd` viene con un test que falla sin él. El CI corre la
suite en Linux, macOS y Windows con Node 18 y 22.

Después:

- Commitea el `adapters/` regenerado en el mismo PR que el cambio de `core/`, como un
  commit aparte `build: regenerate adapters`.
- Usa [Conventional Commits](https://www.conventionalcommits.org/): `feat(cli): ...`,
  `fix(core): ...`, `docs: ...`, `build: ...`, `chore: ...`.
- Agrega una línea bajo un encabezado `Unreleased` en `CHANGELOG.md` para los cambios que
  vea el usuario.
- Si cambias `README.md`, `docs/install.md` o `CONTRIBUTING.md`, actualiza su versión en
  español en `docs/es/` (un test comprueba que la estructura coincida).
- Mantén los PRs por debajo de unas 400 líneas cambiadas, sin contar `adapters/`. Divide
  el trabajo más grande en PRs apilados, la misma regla que Keel exige a sus usuarios.

## Publicar una versión (mantenedores)

La versión vive en `package.json`, `build/manifest.json` y
`.claude-plugin/marketplace.json`; un test falla si no coinciden.

1. `npm version <patch|minor> --no-git-tag-version` sube la versión de `package.json`,
   sincroniza los demás campos y regenera `adapters/`.
2. Pon fecha al encabezado de `CHANGELOG.md`, commitea `chore: release X.Y.Z`, abre un PR
   y mézclalo.
3. Crea el tag en `main`: `git tag -a vX.Y.Z -m "Keel X.Y.Z" && git push origin vX.Y.Z`, y
   luego `gh release create vX.Y.Z --notes-file <la sección del changelog>`.
4. `npm publish` desde un checkout limpio del tag. `prepublishOnly` corre los tests y se
   niega a publicar si `adapters/` está desactualizado.

## Reportar problemas de seguridad

No abras un issue público. Mira [SECURITY.md](../../SECURITY.md) (en inglés).

## Licencia

Al contribuir aceptas que tus aportes se licencian bajo la
[Licencia MIT](../../LICENSE).
