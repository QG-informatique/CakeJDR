// Liste des thèmes de l'interface. Les couleurs de chacun sont dans
// app/themes.css, sous [data-theme="<id>"] ; ici, ce qui ne tient pas en CSS :
// le nom affiché, la disposition des panneaux de la table et le fond par défaut.

export type ThemeLayout = {
  /** Côté de la fiche de personnage sur grand écran ; le chat prend l'autre. */
  sheetSide: 'left' | 'right'
}

export type Theme = {
  id: string
  name: string
  layout: ThemeLayout
  /** Fond affiché tant que le joueur n'en a pas choisi un autre : 'plain' = le
   *  fond uni du thème, sinon un des fonds animés (voir BackgroundContext). */
  defaultBackground: 'plain' | 'rpg'
}

export const THEMES: Theme[] = [
  { id: 'ardoise', name: 'Ardoise', layout: { sheetSide: 'left' }, defaultBackground: 'plain' },
  { id: 'classique', name: 'Classique', layout: { sheetSide: 'left' }, defaultBackground: 'rpg' },
]

export const DEFAULT_THEME_ID = 'ardoise'
export const THEME_STORAGE_KEY = 'cakejdr-theme'

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!
}
