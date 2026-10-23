import next from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import security from 'eslint-plugin-security'
import prettier from 'eslint-config-prettier'

/**
 * Configuration ESLint « flat » native.
 *
 * L'ancienne version passait par `FlatCompat` pour charger des configs au
 * format historique. Cette passerelle plantait au démarrage
 * (« Converting circular structure to JSON »), si bien qu'aucune règle n'était
 * appliquée depuis la migration vers Next 16 — le linter était muet, pas propre.
 *
 * `eslint-config-next` v16 exporte directement des configs plates, et fournit
 * déjà les plugins react, react-hooks, import, jsx-a11y, @next/next et
 * @typescript-eslint : les redéclarer ferait échouer le chargement. Seul
 * `security` est ajouté ici.
 */
export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'output/**',
      'tmp/**',
      'next-env.d.ts',
    ],
  },

  ...next,
  ...nextTypescript,

  {
    plugins: { security },
    rules: { ...security.configs.recommended.rules },
  },

  // Désactive les règles de style qui entreraient en conflit avec Prettier.
  prettier,

  {
    rules: {
      // Le runtime JSX moderne n'exige plus l'import de React.
      'react/react-in-jsx-scope': 'off',
      // Les props sont typées par TypeScript.
      'react/prop-types': 'off',
      'react/no-unknown-property': 'off',
      'import/no-anonymous-default-export': 'off',
      '@next/next/no-img-element': 'off',

      // Accessibilité : en erreur depuis le 2026-10-23, les derniers
      // avertissements ayant été corrigés.
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'error',
      'jsx-a11y/no-autofocus': 'error',

      // Beaucoup de faux positifs sur l'accès à des objets par clé calculée.
      'security/detect-object-injection': 'off',

      // Règles de la version récente du plugin React Hooks : les cas signalés
      // ont été corrigés en octobre 2026. Les effets qui se calent vraiment sur
      // le navigateur ou Liveblocks portent une exception commentée, ligne par
      // ligne, avec sa raison.
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/purity': 'error',
      'react-hooks/refs': 'error',
    },
  },
]
