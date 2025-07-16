'use client'

import { FC, useState, useEffect } from 'react'
import ParamMenu from './ParamMenu'
import AddCompetenceModal, { NewCompetence } from './AddCompetenceModal'

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

// Types pour les tableaux dynamiques
type Competence = { nom: string, type: string, effets: string, degats?: string }
type Objet = { nom: string, quantite: number }
type CustomField = { label: string, value: string }

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

// Valeurs par défaut si fiche vide
const defaultPerso = {
  nom: 'Gustave',
  niveau: 2,
  chance: 3,
  defense: 13,
  initiative: 12,
  pv: 24,
  pv_max: 30,
  force: 13, force_mod: 1,
  dexterite: 14, dexterite_mod: 2,
  constitution: 12, constitution_mod: 1,
  intelligence: 8, intelligence_mod: -1,
  sagesse: 10, sagesse_mod: 0,
  charisme: 11, charisme_mod: 0,
  mod_contact: 2,
  mod_distance: 1,
  mod_magique: 0,
  competences: [
    { nom: 'Cri sauvage', type: 'active', effets: 'Provoque la peur', degats: '1d4' },
    { nom: 'Résistance', type: 'passive', effets: 'Réduit les dégâts physiques' }
  ],
  armes: 'Épée rouillée',
  degats_armes: '1d6+1',
  armure: 'Armure en cuir',
  modif_armure: 2,
  race: 'Cake',
  profil: 'Guerrier loyal',
  sexe: 'M',
  age: 25,
  taille: "1m70",
  poids: "80kg",
  capacite_raciale: "Peut se régénérer en mangeant du sucre, même sous forme solide. Peut se séparer en deux morceaux pour esquiver.",
  bourse: 30,
  traits: "Optimiste, téméraire",
  ideal: "Liberté",
  obligations: "Protéger les plus faibles",
  failles: "Avide, parfois naïf",
  avantages: "Endurance surnaturelle",
  background: "Né dans une boulangerie, Gustave parcourt le monde pour retrouver la recette de son ancêtre.",
  champs_perso: [
    { label: "Amorce", value: "6 cm de moins que la moyenne" }
  ],
  objets: [
    { nom: "Potion de soin", quantite: 3 },
    { nom: "Torchon magique", quantite: 1 }
  ]
}

const CharacterSheet: FC<Props> = ({ perso, onUpdate, chatBoxRef }) => {
  // --- États ---
  const [edit, setEdit] = useState(false)
  const [tab, setTab] = useState('main')
  const [localPerso, setLocalPerso] = useState<any>({ ...(Object.keys(perso||{}).length ? perso : defaultPerso) })
  const [dice, setDice] = useState('d6')
  const [processing, setProcessing] = useState(false)
  const [newComp, setNewComp] = useState<Partial<Competence>>({})
  const [newObj, setNewObj] = useState<Partial<Objet>>({})
  const [newCustom, setNewCustom] = useState<Partial<CustomField>>({})
  const [showCompModal, setShowCompModal] = useState(false)

  // Pour éviter les décalages : référence centrale
  const cFiche = edit ? localPerso : (Object.keys(perso||{}).length ? perso : defaultPerso)
  // Pour compatibilité: pv_max ou pvMax (si jamais)
  const pvActuel = Number(cFiche.pv) || 0
  const pvMax = Number(cFiche.pv_max ?? cFiche.pvMax ?? cFiche.pv) || pvActuel

  useEffect(() => {
    if (edit) setLocalPerso({ ...cFiche })
  // eslint-disable-next-line
  }, [edit])

  // Sauvegarde
  const save = () => {
    setEdit(false)
    onUpdate(localPerso)
  }

  // --- Handlers Compétences/Objets/Champs persos (édition dynamique) ---
  const addComp = () => {
    if (!newComp.nom) return
    setLocalPerso({ ...localPerso, competences: [...(localPerso.competences||[]), {...newComp}] })
    setNewComp({})
  }
  const delComp = (idx: number) => {
    const arr = [...(localPerso.competences||[])]
    arr.splice(idx,1)
    setLocalPerso({ ...localPerso, competences: arr })
  }
  const addObj = () => {
    if (!newObj.nom || !newObj.quantite) return
    setLocalPerso({ ...localPerso, objets: [...(localPerso.objets||[]), {...newObj, quantite: Number(newObj.quantite)}] })
    setNewObj({})
  }
  const delObj = (idx: number) => {
    const arr = [...(localPerso.objets||[])]
    arr.splice(idx,1)
    setLocalPerso({ ...localPerso, objets: arr })
  }
  const addCustom = () => {
    if (!newCustom.label || !newCustom.value) return
    setLocalPerso({ ...localPerso, champs_perso: [...(localPerso.champs_perso||[]), {...newCustom}] })
    setNewCustom({})
  }
  const delCustom = (idx: number) => {
    const arr = [...(localPerso.champs_perso||[])]
    arr.splice(idx,1)
    setLocalPerso({ ...localPerso, champs_perso: arr })
  }
  const handleChange = (field: string, value: any) => {
    setLocalPerso({ ...localPerso, [field]: value })
  }

  // --- LEVEL UP ---
  const handleLevelUp = async () => {
    if (processing) return
    setProcessing(true)
    let updatedPerso = { ...cFiche, niveau: Number(cFiche.niveau) + 1 }
    const pvMaxKey =
      updatedPerso.pv_max !== undefined ? 'pv_max'
      : updatedPerso.pvMax !== undefined ? 'pvMax'
      : 'pv_max'

    for (const stat of ['pv', ...STATS.map(s => s.key)]) {
      const gain = rollDice(dice)
      // Ajout au chat
      if (chatBoxRef?.current) {
        const message = document.createElement('p')
        message.innerHTML = `<strong>🎲 ${cFiche.nom} - ${dice.toUpperCase()} - ${stat} :</strong> ${gain}`
        chatBoxRef.current.appendChild(message)
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
      }
      if (stat === 'pv') {
        const currentMax = Number(updatedPerso[pvMaxKey] ?? updatedPerso.pv ?? 0)
        const newPvMax = currentMax + gain
        const currentPv = Number(updatedPerso.pv ?? 0)
        const newPv = Math.min(currentPv + gain, newPvMax)
        updatedPerso = { ...updatedPerso, [pvMaxKey]: newPvMax, pv: newPv }
      } else {
        updatedPerso = { ...updatedPerso, [stat]: Number(updatedPerso[stat] ?? 0) + gain }
      }
      onUpdate(updatedPerso)
      await new Promise((resolve) => setTimeout(resolve, 1200))
    }
    setProcessing(false)
  }

  function addCompModal(comp: Competence) {
    setLocalPerso({ 
      ...localPerso, 
      competences: [...(localPerso.competences || []), comp] 
    })
    setShowCompModal(false)
  }

  // --- RENDER ---
  return (
    <aside className="w-1/5 bg-gray-900 p-3 overflow-y-auto text-[15px] text-white relative select-none">
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

      {/* Onglet Statistiques */}
      {tab === 'main' && (
        <div>
          {/* Nom en haut à droite au-dessus des PV */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center">
                <strong className="w-20">Niveau :</strong>
                {edit
                  ? <input type="text" value={localPerso.niveau || ''} onChange={e => handleChange('niveau', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
                  : <span className="ml-1 text-sm">{cFiche.niveau}</span>
                }
              </div>
              <div className="flex items-center">
                <strong className="w-20">Défense :</strong>
                {edit
                  ? <input type="text" value={localPerso.defense || ''} onChange={e => handleChange('defense', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
                  : <span className="ml-1 text-sm">{cFiche.defense}</span>
                }
              </div>
              <div className="flex items-center">
                <strong className="w-20">Chance :</strong>
                {edit
                  ? <input type="text" value={localPerso.chance || ''} onChange={e => handleChange('chance', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
                  : <span className="ml-1 text-sm">{cFiche.chance}</span>
                }
              </div>
              <div className="flex items-center">
                <strong className="w-20">Initiative :</strong>
                {edit
                  ? <input type="text" value={localPerso.initiative || ''} onChange={e => handleChange('initiative', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
                  : <span className="ml-1 text-sm">{cFiche.initiative}</span>
                }
              </div>
            </div>
            <div className="flex flex-col items-center ml-4">
              <div className="flex items-center mb-1">
                <span className="text-sm text-gray-400 mr-2">Nom :</span>
                {edit
                  ? <input value={localPerso.nom || ''} onChange={e => handleChange('nom', e.target.value)} className="px-1 py-0.5 rounded text-sm font-semibold bg-white border text-black w-[90px]" />
                  : <span className="text-sm font-semibold">{cFiche.nom}</span>
                }
              </div>
              <span className={`flex items-center justify-center text-2xl font-bold rounded-full h-14 w-14 border-4 ${getPvColor(pvActuel, pvMax)}`} style={{ boxShadow: '0 0 8px #222' }}>
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
          <div className="mt-2 flex gap-0">
            <div className="flex-1">
              <div className="font-semibold text-base mb-1">Caractéristiques</div>
              {STATS.map(stat =>
                <div key={stat.key} className="flex gap-3 items-center mb-1">
                  <strong className="w-20">{stat.label} </strong>
                  {edit
                    ? <>
                        <input type="text" value={localPerso[stat.key] ?? ''} onChange={e => handleChange(stat.key, e.target.value)} className="ml-2 px-1 py-0.5 rounded bg-white border w-10 text-sm text-black" />
                        <span className="mx-1">/</span>
                        <input type="text" value={localPerso[`${stat.key}_mod`] ?? ''} onChange={e => handleChange(`${stat.key}_mod`, e.target.value)} className="px-1 py-0.5 rounded bg-white border w-10 text-sm text-black" placeholder="mod" />
                      </>
                    : <>
                        <span className={`ml-4 px-2 py-0.5 rounded text-base font-bold ${getStatColor(Number(cFiche[stat.key]))} bg-opacity-80`}>
                          {cFiche[stat.key]}
                        </span>
                        <span className="ml-2 text-gray-300 text-base font-semibold">
                          ({cFiche[`${stat.key}_mod`] >= 0 ? '+' : ''}{cFiche[`${stat.key}_mod`]})
                        </span>
                      </>
                  }
                </div>
              )}
            </div>
            <div className="flex flex-col items-end justify-between ml-4 min-w-[120px]">
              <div className="font-semibold text-base mb-1">Mod. Attaques</div>
              {ATTACKS.map(att =>
                <div key={att.key} className="flex items-center mb-2 w-full justify-end">
                  <strong className="w-16 text-right">{att.label}</strong>
                  {edit
                    ? <input type="text" value={localPerso[att.key] ?? ''} onChange={e => handleChange(att.key, e.target.value)} className="ml-2 px-1 py-0.5 rounded bg-white border w-10 text-sm text-black text-right" />
                    : <span className="ml-3 px-2 py-0.5 rounded text-base font-bold bg-gray-700 text-white text-right">{cFiche[att.key] ?? 0}</span>
                  }
                </div>
              )}
            </div>
          </div>
          {/* Compétences */}
            <div className="mt-4">
            <div className="font-semibold text-base mb-1">Compétences</div>
            {edit ? (
              <>
              <div className="flex flex-col gap-2 mb-2">
                {(localPerso.competences || []).map((c: Competence, i: number) => (
                <div key={i} className="bg-gray-800 rounded px-2 py-1 flex flex-col relative">
                  <div className="font-semibold">{c.nom} <span className="text-xs italic text-gray-300">({c.type})</span></div>
                  <div className="text-xs">Effets : {c.effets} {c.degats && <span>- Dégâts : {c.degats}</span>}</div>
                  <button className="absolute top-1 right-2 text-xs text-red-400 hover:underline" onClick={() => delComp(i)}>Suppr</button>
                </div>
                ))}
              </div>
              {/* Modal logic */}
              <AddCompetenceModal
                open={showCompModal}
                onClose={() => setShowCompModal(false)}
                onAdd={comp => { setNewComp({}); addCompModal(comp); }}
              />
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded px-2 py-1"
                onClick={() => setShowCompModal(true)}
              >
                Ajouter une compétence
              </button>
              </>
            ) : (
              <div className="flex flex-col gap-1">
              {(cFiche.competences || []).map((c: Competence, i: number) => (
                <div key={i} className="bg-gray-800 rounded px-2 py-1">
                <div className="font-semibold">{c.nom} <span className="text-xs italic text-gray-300">({c.type})</span></div>
                <div className="text-xs">Effets : {c.effets} {c.degats && <span>- Dégâts : {c.degats}</span>}</div>
                </div>
              ))}
              {(cFiche.competences || []).length === 0 && <span className="text-gray-400 text-xs">Aucune compétence.</span>}
              </div>
            )}
            </div>
          {/* Level Up */}
          <div className="mt-5">
            <label className="block mb-1">Type de dé :</label>
            <select value={dice} onChange={e => setDice(e.target.value)} className="w-full mb-2 p-1 border rounded bg-white text-black dark:bg-gray-700 dark:text-white">
              {DICE_OPTIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <button onClick={handleLevelUp} disabled={processing} className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
              Lancer Level Up
            </button>
          </div>
        </div>
      )}

      {/* Onglet Équipement */}
      {tab === 'equip' && (
        <div className="text-[1.07rem]">
          <div className="font-semibold mb-2 text-lg">Armes & Armures</div>
          <div className="mb-1 flex items-center">
            <strong className="w-32">Armes :</strong>
            {edit
              ? <input value={localPerso.armes || ''} onChange={e => handleChange('armes', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-28 text-sm text-black" />
              : <span className="ml-1">{cFiche.armes}</span>
            }
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-32">Dégâts armes :</strong>
            {edit
              ? <input value={localPerso.degats_armes || ''} onChange={e => handleChange('degats_armes', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-20 text-sm text-black" />
              : <span className="ml-1">{cFiche.degats_armes}</span>
            }
          </div>
          <div className="mb-1 flex items-center">
            <strong className="w-32">Armure :</strong>
            {edit
              ? <input value={localPerso.armure || ''} onChange={e => handleChange('armure', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-28 text-sm text-black" />
              : <span className="ml-1">{cFiche.armure}</span>
            }
          </div>
          <div className="mb-3 flex items-center">
            <strong className="w-32">Modif armure :</strong>
            {edit
              ? <input type="text" value={localPerso.modif_armure || ''} onChange={e => handleChange('modif_armure', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-12 text-sm text-black" />
              : <span className="ml-1">{cFiche.modif_armure}</span>
            }
          </div>
          <div className="font-semibold text-lg mb-1 mt-3">Objets</div>
          {/* Création/édition d’objets */}
          {edit ? (
            <>
              <div className="flex flex-col gap-1 mb-2">
                {(localPerso.objets || []).map((o: Objet, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-800 rounded px-2 py-1">
                    <span className="text-base">{o.nom}</span>
                    <span className="text-xs text-gray-300">x{o.quantite}</span>
                    <button className="text-xs text-red-400 hover:underline ml-2" onClick={() => delObj(i)}>Suppr</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mb-2">
                <input className="p-1 rounded bg-white text-black text-sm flex-1" placeholder="Nom de l'objet" value={newObj.nom||''} onChange={e => setNewObj({...newObj, nom:e.target.value})} />
                <input className="p-1 rounded bg-white text-black text-sm w-16" placeholder="Qté" type="number" min="1" value={newObj.quantite||''} onChange={e => setNewObj({...newObj, quantite:e.target.value})} />
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded p-1" onClick={addObj}>Ajouter</button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              {(cFiche.objets || []).map((o: Objet, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-gray-800 rounded px-2 py-1">
                  <span className="text-base">{o.nom}</span>
                  <span className="text-xs text-gray-300">x{o.quantite}</span>
                </div>
              ))}
              {(cFiche.objets || []).length === 0 && <span className="text-gray-400 text-xs">Aucun objet.</span>}
            </div>
          )}
        </div>
      )}

      {/* Onglet Description */}
      {tab === 'desc' && (
        <div>
          <div className="font-semibold mb-2 text-base">Description</div>
          {/* Champs standards */}
          {[
            { key: 'race', label: 'Race' },
            { key: 'profil', label: 'Profil' },
            { key: 'sexe', label: 'Sexe' },
            { key: 'age', label: 'Âge' },
            { key: 'taille', label: 'Taille' },
            { key: 'poids', label: 'Poids' }
          ].map(({key,label}) => (
            <div key={key} className="mb-1 flex items-center">
              <strong className="min-w-[80px]">{label} :</strong>
              {edit
                ? <input value={localPerso[key] || ''} onChange={e => handleChange(key, e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border text-sm text-black flex-1" />
                : <span className="ml-1 text-sm">{cFiche[key]}</span>}
            </div>
          ))}
          {/* Capacité raciale AVEC deux points juste derrière */}
          <div className="mb-1 flex items-start">
            <strong className="min-w-[120px] mt-1">Capacité raciale :</strong>
            {edit
              ? <textarea value={localPerso.capacite_raciale || ''} onChange={e => handleChange('capacite_raciale', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border text-sm text-black flex-1 min-h-[48px] max-h-[130px] resize-y" />
              : <span className="ml-1 text-sm whitespace-pre-line">{cFiche.capacite_raciale}</span>}
          </div>
          <div className="mb-1 flex items-center">
            <strong className="min-w-[100px]">Bourse (PA) :</strong>
            {edit
              ? <input type="text" value={localPerso.bourse || ''} onChange={e => handleChange('bourse', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
              : <span className="ml-1 text-sm">{cFiche.bourse}</span>}
          </div>
          {/* Ajouts demandés */}
          {[
            { key: 'traits', label: 'Trait perso' },
            { key: 'ideal', label: 'Idéal' },
            { key: 'obligations', label: 'Obligations' },
            { key: 'failles', label: 'Failles' },
            { key: 'avantages', label: 'Avantages' },
            { key: 'background', label: 'Background' }
          ].map(({key,label}) => (
            <div key={key} className="mb-1 flex items-center">
              <strong className="min-w-[100px]">{label} :</strong>
              {edit
                ? <input value={localPerso[key] || ''} onChange={e => handleChange(key, e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border text-sm text-black flex-1" />
                : <span className="ml-1 text-sm whitespace-pre-line">{cFiche[key]}</span>}
            </div>
          ))}
          {/* Champs persos dynamiques */}
          <div className="mt-2">
            <div className="font-semibold text-base mb-1">Autres champs</div>
            {edit ? (
              <>
                <div className="flex flex-col gap-1 mb-1">
                  {(localPerso.champs_perso || []).map((f: CustomField, i: number) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className="p-1 rounded bg-white text-black text-sm w-32" value={f.label} onChange={e => {
                        const arr = [...localPerso.champs_perso]
                        arr[i].label = e.target.value
                        setLocalPerso({ ...localPerso, champs_perso: arr })
                      }} />
                      <span>:</span>
                      <input className="p-1 rounded bg-white text-black text-sm flex-1" value={f.value} onChange={e => {
                        const arr = [...localPerso.champs_perso]
                        arr[i].value = e.target.value
                        setLocalPerso({ ...localPerso, champs_perso: arr })
                      }} />
                      <button className="text-xs text-red-400 hover:underline" onClick={() => delCustom(i)}>Suppr</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 mb-2">
                  <input className="p-1 rounded bg-white text-black text-sm w-32" placeholder="Nom du champ" value={newCustom.label||''} onChange={e => setNewCustom({...newCustom, label:e.target.value})} />
                  <span>:</span>
                  <input className="p-1 rounded bg-white text-black text-sm flex-1" placeholder="Valeur" value={newCustom.value||''} onChange={e => setNewCustom({...newCustom, value:e.target.value})} />
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded p-1" onClick={addCustom}>Ajouter</button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                {(cFiche.champs_perso || []).map((f: CustomField, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="font-semibold">{f.label} :</span>
                    <span className="">{f.value}</span>
                  </div>
                ))}
                {(cFiche.champs_perso || []).length === 0 && <span className="text-gray-400 text-xs">Aucun champ perso.</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bouton paramètre centré en bas */}
      <ParamMenu perso={edit ? localPerso : cFiche} onUpdate={onUpdate} />

      {edit && (
        <button onClick={save} className="mt-3 w-full bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">Sauver</button>
      )}
    </aside>
  )
}

export default CharacterSheet
