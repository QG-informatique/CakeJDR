// Liste des thèmes de l'interface. Les couleurs de chacun sont dans
// app/themes.css, sous [data-theme="<id>"] ; ici, ce qui ne tient pas en CSS :
// le nom affiché, la disposition des panneaux de la table et le fond.

export type ThemeLayout = {
  /** Côté de la fiche de personnage sur grand écran ; le chat prend l'autre. */
  sheetSide: 'left' | 'right'
}

export type Theme = {
  id: string
  name: string
  layout: ThemeLayout
  /** 'plain' = le fond fixe du thème (--c-backdrop), 'rpg' = les dés roses
   *  animés. Chaque thème a un seul fond : les neuf autres fonds animés ont été
   *  rangés hors du site en octobre 2026 (dossier CakeJDR-themes/fonds-archives, à côté du projet). */
  background: 'plain' | 'rpg'
}

export const THEMES: Theme[] = [
  { id: 'ardoise', name: 'Ardoise', layout: { sheetSide: 'left' }, background: 'plain' },
  { id: 'classique', name: 'Classique', layout: { sheetSide: 'left' }, background: 'rpg' },
]

export const DEFAULT_THEME_ID = 'ardoise'
export const THEME_STORAGE_KEY = 'cakejdr-theme'

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!
}
