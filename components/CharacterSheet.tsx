'use client'

import { FC, useState, useEffect } from 'react'

const STATS = [
  { key: 'force', label: 'Force' },
  { key: 'dexterite', label: 'Dextérité' },
  { key: 'constitution', label: 'Constitution' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'sagesse', label: 'Sagesse' },
  { key: 'charisme', label: 'Charisme' }
]
const ATTACKS = [
  { key: 'mod_contact', label: 'Contact' },
  { key: 'mod_distance', label: 'Distance' },
  { key: 'mod_magique', label: 'Magique' }
]

const getStatColor = (value: number) => {
  if (value >= 18) return 'bg-yellow-400 text-black'
  if (value >= 14) return 'bg-green-500 text-white'
  if (value >= 10) return 'bg-green-300 text-black'
  if (value >= 6) return 'bg-orange-400 text-white'
  return 'bg-red-500 text-white'
}

const getPvColor = (pv: number, pvMax: number) => {
  if (!pvMax) return 'bg-gray-500 text-white'
  const ratio = pv / pvMax
  if (ratio > 0.7) return 'bg-green-500 text-white'
  if (ratio > 0.3) return 'bg-orange-400 text-white'
  return 'bg-red-500 text-white'
}

type Props = {
  perso: any,
  onUpdate: (perso: any) => void,
  chatBoxRef?: React.RefObject<HTMLDivElement>
}

const TABS = [
  { key: 'main', label: 'Statistiques' },
  { key: 'equip', label: 'Équipement' },
  { key: 'desc', label: 'Description' }
]

const DICE_OPTIONS = [
  { value: 'd4', label: 'D4' },
  { value: 'd6', label: 'D6' },
  { value: 'd20', label: 'D20' }
]

const rollDice = (dice: string): number => {
  const match = dice.match(/d(\d+)/i)
  if (!match) return 0
  const sides = parseInt(match[1])
  return Math.floor(Math.random() * sides) + 1
}

const CharacterSheet: FC<Props> = ({ perso, onUpdate, chatBoxRef }) => {
  const [edit, setEdit] = useState(false)
  const [tab, setTab] = useState('main')
  const [localPerso, setLocalPerso] = useState({ ...perso })
  const [dice, setDice] = useState('d6')
  const [processing, setProcessing] = useState(false)

  // Pour compatibilité: pv_max ou pvMax (si jamais)
  const pvActuel = Number(edit ? localPerso.pv : perso.pv) || 0
  const pvMax = Number(edit ? (localPerso.pv_max ?? localPerso.pvMax ?? localPerso.pv) : (perso.pv_max ?? perso.pvMax ?? perso.pv)) || pvActuel

  useEffect(() => {
    if (edit) setLocalPerso({ ...perso })
  }, [edit, perso])

  const handleChange = (field: string, value: any) => {
    setLocalPerso({ ...localPerso, [field]: value })
  }

  const save = () => {
    setEdit(false)
    onUpdate(localPerso)
  }

  // Fonction Level Up avec gestion pv_max/pv
  const handleLevelUp = async () => {
    if (processing) return
    setProcessing(true)
    let updatedPerso = { ...perso, niveau: Number(perso.niveau) + 1 }
    // Prend la clé utilisée pour le max (pv_max ou pvMax ou rien)
    const pvMaxKey =
      updatedPerso.pv_max !== undefined ? 'pv_max'
      : updatedPerso.pvMax !== undefined ? 'pvMax'
      : 'pv_max'

    for (const stat of ['pv', ...STATS.map(s => s.key)]) {
      const gain = rollDice(dice)
      // Pop-up event
      const event = new CustomEvent('dice-roll', {
        detail: {
          diceType: dice,
          result: gain,
          label: `Level up - ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${dice.toUpperCase()})`
        }
      })
      window.dispatchEvent(event)
      // Ajout au chat
      if (chatBoxRef?.current) {
        const message = document.createElement('p')
        message.innerHTML = `<strong>🎲 ${perso.nom} - ${dice.toUpperCase()} - ${stat} :</strong> ${gain}`
        chatBoxRef.current.appendChild(message)
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
      }

      if (stat === 'pv') {
        // Gère augmentation du max ET des PV actuels
        const currentMax = Number(updatedPerso[pvMaxKey] ?? updatedPerso.pv ?? 0)
        const newPvMax = currentMax + gain
        const currentPv = Number(updatedPerso.pv ?? 0)
        // Le joueur récupère exactement ce qu'il gagne en pv_max, sans dépasser le nouveau max
        const newPv = Math.min(currentPv + gain, newPvMax)
        updatedPerso = {
          ...updatedPerso,
          [pvMaxKey]: newPvMax,
          pv: newPv
        }
      } else {
        updatedPerso = { ...updatedPerso, [stat]: Number(updatedPerso[stat] ?? 0) + gain }
      }
      onUpdate(updatedPerso)
      await new Promise((resolve) => setTimeout(resolve, 1300))
    }
    setProcessing(false)
  }

  return (
    <aside className="w-1/5 bg-gray-900 p-3 overflow-y-auto text-[15px] text-white">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold mb-2">Personnage</h2>
        <button onClick={() => { if (edit) save(); else setEdit(true); }} className="text-xs px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white">
          {edit ? 'Sauver' : 'Éditer'}
        </button>
      </div>
      <nav className="flex gap-1 mb-3">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`px-2 py-1 rounded-t text-sm font-semibold ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === 'main' && (
        <div>
          {/* Infos principales */}
          <div className="mb-1 flex items-center">
            <strong className="w-24">Nom :</strong>
            {edit
              ? <input value={localPerso.nom || ''} onChange={e => handleChange('nom', e.target.value)} className="ml-1 px-1 py-0.5 rounded text-sm font-semibold bg-white border text-black" />
              : <span className="ml-1 text-sm font-semibold">{perso.nom}</span>
            }
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-24">Niveau :</strong>
            {edit
              ? <input type="text" value={localPerso.niveau || ''} onChange={e => handleChange('niveau', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-12 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.niveau}</span>
            }
          </div>

          {/* PV Badge à droite */}
          <div className="mb-2 flex items-start justify-between">
            <div className="flex flex-col flex-1">
              <div className="mb-1 flex items-center">
                <strong className="w-32">Points de chance :</strong>
                {edit
                  ? <input type="text" value={localPerso.points_chance || ''} onChange={e => handleChange('points_chance', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
                  : <span className="ml-1 text-sm">{perso.points_chance}</span>
                }
              </div>
              <div className="mb-1 flex items-center">
                <strong className="w-24">Défense :</strong>
                {edit
                  ? <input type="text" value={localPerso.defense || ''} onChange={e => handleChange('defense', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
                  : <span className="ml-1 text-sm">{perso.defense}</span>
                }
              </div>
              <div className="mb-1 flex items-center">
                <strong className="w-24">Initiative :</strong>
                {edit
                  ? <input type="text" value={localPerso.initiative || ''} onChange={e => handleChange('initiative', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
                  : <span className="ml-1 text-sm">{perso.initiative}</span>
                }
              </div>
            </div>
            {/* PV Badge à droite */}
            <div className="flex flex-col items-center ml-4 min-w-[90px]">
              <span
                className={`flex items-center justify-center text-2xl font-bold rounded-full h-16 w-16 border-4 ${getPvColor(pvActuel, pvMax)}`}
                style={{ boxShadow: '0 0 8px #222' }}
              >
                {pvActuel}
              </span>
              <span className="mt-1 text-xs text-gray-300">PV / {pvMax}</span>
              {edit && (
                <div className="mt-1 flex gap-1">
                  <input
                    type="number"
                    min={0}
                    value={localPerso.pv ?? ''}
                    onChange={e => handleChange('pv', e.target.value)}
                    className="w-10 px-1 py-0.5 rounded bg-white border text-sm text-black"
                    placeholder="PV"
                  />
                  <span className="text-gray-400 font-bold">/</span>
                  <input
                    type="number"
                    min={0}
                    value={localPerso.pv_max ?? localPerso.pvMax ?? ''}
                    onChange={e => handleChange('pv_max', e.target.value)}
                    className="w-10 px-1 py-0.5 rounded bg-white border text-sm text-black"
                    placeholder="Max"
                  />
                </div>
              )}
            </div>
          </div>
          {/* Stats + attaques alignées */}
          <div className="mt-3 flex gap-0">
            <div className="flex-1">
              <div className="font-semibold text-base mb-1">Caractéristiques</div>
              {STATS.map(stat =>
                <div key={stat.key} className="flex gap-5 items-center mb-1">
                  <strong className="w-20">{stat.label}</strong>
                  {edit
                    ? <>
                        <input type="text" value={localPerso[stat.key] ?? ''} onChange={e => handleChange(stat.key, e.target.value)} className="ml-3 px-1 py-0.5 rounded bg-white border w-12 text-sm text-black" />
                        <span className="mx-1">/</span>
                        <input type="text" value={localPerso[`${stat.key}_mod`] ?? ''} onChange={e => handleChange(`${stat.key}_mod`, e.target.value)} className="px-1 py-0.5 rounded bg-white border w-12 text-sm text-black" placeholder="mod" />
                      </>
                    : <>
                        <span className={`ml-6 px-2 py-0.5 rounded text-base font-bold ${getStatColor(Number(perso[stat.key]))} bg-opacity-80`}>
                          {perso[stat.key]}
                        </span>
                        <span className="ml-2 text-gray-300 text-base font-semibold">
                          ({perso[`${stat.key}_mod`] >= 0 ? '+' : ''}{perso[`${stat.key}_mod`]})
                        </span>
                      </>
                  }
                </div>
              )}
            </div>
            <div className="flex flex-col items-end justify-between ml-8 min-w-[120px]">
              <div className="font-semibold text-base mb-1">Mod. Attaques</div>
              {ATTACKS.map(att =>
                <div key={att.key} className="flex items-center mb-2 w-full justify-end">
                  <strong className="w-16 text-right">{att.label}</strong>
                  {edit
                    ? <input type="text" value={localPerso[att.key] ?? ''} onChange={e => handleChange(att.key, e.target.value)} className="ml-2 px-1 py-0.5 rounded bg-white border w-12 text-sm text-black text-right" />
                    : <span className="ml-3 px-2 py-0.5 rounded text-base font-bold bg-gray-700 text-white text-right">{perso[att.key] ?? 0}</span>
                  }
                </div>
              )}
            </div>
          </div>
          {/* Compétences seulement ici */}
          <div className="mt-4">
            <div className="font-semibold text-base">Compétences</div>
            {edit
              ? <textarea value={localPerso.competences || ''} onChange={e => handleChange('competences', e.target.value)} className="w-full p-1 rounded bg-white text-black dark:bg-gray-700 dark:text-white text-sm" rows={3} />
              : <div className="whitespace-pre-line text-sm">{perso.competences}</div>
            }
          </div>

          {/* Level Up */}
          <div className="mt-6">
            <label className="block mb-1">Type de dé :</label>
            <select
              value={dice}
              onChange={e => setDice(e.target.value)}
              className="w-full mb-2 p-1 border rounded bg-white text-black dark:bg-gray-700 dark:text-white"
            >
              {DICE_OPTIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <button
              onClick={handleLevelUp}
              disabled={processing}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Lancer Level Up
            </button>
          </div>
        </div>
      )}

      {/* ...les onglets équipement/description restent inchangés... */}

      {tab === 'equip' && (
        <div>
          <div className="font-semibold mb-2 text-base">Armes & Armures</div>
          <div className="mb-1 flex items-center">
            <strong className="w-32">Armes équipées :</strong>
            {edit
              ? <input value={localPerso.armes || ''} onChange={e => handleChange('armes', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-24 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.armes}</span>
            }
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-32">Dégâts armes :</strong>
            {edit
              ? <input value={localPerso.degats_armes || ''} onChange={e => handleChange('degats_armes', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-20 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.degats_armes}</span>
            }
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-32">Armure équipée :</strong>
            {edit
              ? <input value={localPerso.armure || ''} onChange={e => handleChange('armure', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-24 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.armure}</span>
            }
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-32">Modif armure :</strong>
            {edit
              ? <input type="text" value={localPerso.modif_armure || ''} onChange={e => handleChange('modif_armure', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-12 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.modif_armure}</span>
            }
          </div>
        </div>
      )}

      {tab === 'desc' && (
        <div>
          <div className="font-semibold mb-2 text-base">Description</div>
          <div className="mb-1 flex items-center">
            <strong className="w-24">Race :</strong> {edit
              ? <input value={localPerso.race || ''} onChange={e => handleChange('race', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.race}</span>}
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-24">Profil :</strong> {edit
              ? <input value={localPerso.profil || ''} onChange={e => handleChange('profil', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.profil}</span>}
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-24">Sexe :</strong> {edit
              ? <input value={localPerso.sexe || ''} onChange={e => handleChange('sexe', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.sexe}</span>}
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-24">Âge :</strong> {edit
              ? <input type="text" value={localPerso.age || ''} onChange={e => handleChange('age', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-12 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.age}</span>}
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-24">Taille :</strong> {edit
              ? <input value={localPerso.taille || ''} onChange={e => handleChange('taille', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-12 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.taille}</span>}
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-24">Poids :</strong> {edit
              ? <input value={localPerso.poids || ''} onChange={e => handleChange('poids', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-12 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.poids}</span>}
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-32">Capacité raciale :</strong> {edit
              ? <textarea value={localPerso.capacite_raciale || ''} onChange={e => handleChange('capacite_raciale', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border text-sm text-black w-full" />
              : <span className="ml-1 text-sm">{perso.capacite_raciale}</span>}
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-24">Bourse (PA) :</strong> {edit
              ? <input type="text" value={localPerso.bourse || ''} onChange={e => handleChange('bourse', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.bourse}</span>}
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-24">Équipement :</strong> {edit
              ? <textarea value={localPerso.equipement || ''} onChange={e => handleChange('equipement', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border text-sm text-black w-full" />
              : <span className="ml-1 text-sm">{perso.equipement}</span>}
          </div>
        </div>
      )}
      {edit && (
        <button onClick={save} className="mt-3 w-full bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">Sauver</button>
      )}
    </aside>
  )
}

export default CharacterSheet
