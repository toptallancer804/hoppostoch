import { Extension } from "@codemirror/state"
import { hoverTooltip } from "@codemirror/tooltip"
import { useReadonlyStream } from "~/helpers/utils/composables"
import { aggregateEnvs$ } from "~/newstore/environments"

const cursorTooltipField = hoverTooltip((view, pos, side) => {
  const { from, to, text } = view.state.doc.lineAt(pos)
  let start = pos
  let end = pos

  while (start > from && /\w/.test(text[start - from - 1])) start--
  while (end < to && /\w/.test(text[end - from])) end++

  if ((start === pos && side < 0) || (end === pos && side > 0)) return null
  if (!/(<<\w+>>)/g.test(text.slice(start - from - 2, end - from + 2)))
    return null

  const aggregateEnvs = useReadonlyStream(aggregateEnvs$, null)
  const envName = getEnvName(
    aggregateEnvs.value?.find(
      (env: { key: string }) => env.key === text.slice(start - from, end - from)
    )?.sourceEnv
  )
  const envValue = getEnvValue(
    aggregateEnvs.value?.find(
      (env: { key: string }) => env.key === text.slice(start - from, end - from)
    )?.value
  )
  const textContent = `${envName} <kbd>${envValue}</kbd>`

  return {
    pos: start,
    end,
    above: true,
    create() {
      const dom = document.createElement("span")
      dom.innerHTML = textContent
      dom.className = "tooltip-theme"
      return { dom }
    },
  }
})

function getEnvName(name: any) {
  if (name) return name
  return "choose an environment"
}

function getEnvValue(value: string) {
  if (value) return value.replace(/"/g, "&quot;")
  // it does not filter special characters before adding them to HTML.
  return "not found"
}

export const environmentTooltip: Extension = cursorTooltipField
