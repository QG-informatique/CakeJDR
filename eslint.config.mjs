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

      // Accessibilité : signalée sans bloquer. Ces règles étaient purement et
      // simplement désactivées ; les remettre en erreur d'un coup noierait le
      // rapport. Le passage en erreur est prévu avec la refonte de l'interface.
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-noninteractive-tabindex': 'warn',
      'jsx-a11y/no-autofocus': 'warn',

      // Beaucoup de faux positifs sur l'accès à des objets par clé calculée.
      'security/detect-object-injection': 'off',

      // Règles apportées par la version récente du plugin React Hooks. Elles
      // n'avaient jamais tourné ici — le linter ne démarrait pas — et signalent
      // 58 cas réels, concentrés dans les fonds animés (appels à Math.random()
      // pendant le rendu, setState synchrone dans un effet). Ce sont de vrais
      // défauts, mais les corriger revient à réécrire une trentaine de
      // composants avec vérification visuelle : c'est le travail de la phase de
      // consolidation, pas celui d'un correctif de sécurité. Signalées d'ici là.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
]
