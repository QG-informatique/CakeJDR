// Liste des thèmes de l'interface. Les couleurs de chacun sont dans
// app/themes.css, sous [data-theme="<id>"] ; ici, ce qui ne tient pas en CSS :
// le nom affiché et la disposition des panneaux de la table.

export type ThemeLayout = {
  /** Côté de la fiche de personnage sur grand écran ; le chat prend l'autre. */
  sheetSide: 'left' | 'right'
}

export type Theme = {
  id: string
  name: string
  layout: ThemeLayout
}

export const THEMES: Theme[] = [
  { id: 'classique', name: 'Classique', layout: { sheetSide: 'left' } },
]

export const DEFAULT_THEME_ID = 'classique'
export const THEME_STORAGE_KEY = 'cakejdr-theme'

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!
}
