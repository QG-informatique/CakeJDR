/**
 * Crédit QG Informatique.
 *
 * Règle commune à tous les projets (`C:\DEV\CLAUDE.md`) : discret, mais
 * toujours visible et jamais masqué derrière une interaction. Rendu par
 * `ClientLayout`, il apparaît donc sur tous les écrans.
 *
 * Le conteneur laisse passer les clics (`pointer-events-none`) pour ne rien
 * intercepter au-dessus de l'interface de jeu ; seul le lien les capte.
 */
export default function CreditQG() {
  return (
    <p
      className="credit-qg pointer-events-none fixed bottom-1.5 left-2.5 z-50 m-0 text-[0.75rem] leading-none text-white/60 transition-colors duration-200 hover:text-white/95"
      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}
    >
      Application créée par{' '}
      <a
        href="https://www.qg-informatique.fr"
        target="_blank"
        rel="noopener"
        className="pointer-events-auto border-b border-current text-inherit no-underline"
      >
        QG Informatique
      </a>
    </p>
  )
}
