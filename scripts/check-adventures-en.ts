/**
 * Vérifie que chaque aventure du MJ automatique a sa version anglaise
 * complète (`lib/autoGm/en/`) : sans elle, une table anglaise lit le texte
 * français. Lancé par `npm test` ; liste ce qui manque et échoue s'il manque
 * quelque chose.
 */
import { ADVENTURES, ENGLISH } from '../lib/autoGm'

const missing: string[] = []
for (const [id, adventure] of Object.entries(ADVENTURES)) {
  const text = ENGLISH[id]
  if (!text) {
    missing.push(`${id} : aucune version anglaise`)
    continue
  }
  for (const [sceneId, scene] of Object.entries(adventure.scenes)) {
    const tx = text.scenes[sceneId]
    const where = `${id} › ${sceneId}`
    if (!tx) {
      missing.push(`${where} : scène non traduite`)
      continue
    }
    if (tx.narration.length !== scene.narration.length) missing.push(`${where} : ${scene.narration.length} paragraphes en français, ${tx.narration.length} en anglais`)
    if (scene.setup?.show && !tx.show) missing.push(`${where} : légende de l'image (show)`)
    const step = scene.step
    if ((step.kind === 'continue' || step.kind === 'random') && step.label && !tx.label) missing.push(`${where} : bouton (label)`)
    if (step.kind === 'vote' || step.kind === 'check' || step.kind === 'trial' || step.kind === 'combat') {
      if (!tx.prompt) missing.push(`${where} : question (prompt)`)
    }
    if (step.kind === 'vote') for (const o of step.options) if (!tx.options?.[o.id]) missing.push(`${where} : choix « ${o.id} »`)
    if ((step.kind === 'check' || step.kind === 'trial') && step.reason && !tx.reason) missing.push(`${where} : raison du jet (reason)`)
    if (step.kind === 'combat') for (const f of step.foes) if (!tx.foes?.[f.id]) missing.push(`${where} : ennemi « ${f.id} »`)
    if (step.kind === 'end' && !tx.end) missing.push(`${where} : titre de fin (end)`)
  }
}

if (missing.length > 0) {
  console.error(`Traduction anglaise incomplète (${missing.length}) :\n- ${missing.join('\n- ')}`)
  process.exit(1)
}
console.log(`Aventures en anglais : ${Object.keys(ADVENTURES).length} complètes.`)
