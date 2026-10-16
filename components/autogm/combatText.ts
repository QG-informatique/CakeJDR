import type { TranslationKey } from '@/lib/translations'
import type { CombatLine } from '@/lib/autoGm/combat'
import type { Foe } from '@/lib/autoGm/types'
import { actionName } from '@/lib/autoGm/combatActions'

/** Une ligne du récit d'un combat, dans la langue de celui qui la lit. */
export function combatLineText(
  line: CombatLine,
  t: (key: TranslationKey) => string,
  foes: readonly Foe[],
  lang: 'fr' | 'en',
): string {
  const key = `combatLine${line.k.charAt(0).toUpperCase()}${line.k.slice(1)}` as TranslationKey
  return t(key)
    .replace('{a}', line.a ?? '')
    .replace('{b}', line.b ?? '')
    .replace('{f}', foes.find((f) => f.id === line.f)?.name ?? line.f ?? '')
    .replace('{n}', String(line.n ?? ''))
    .replace('{act}', actionName(line.act, lang))
}
