# AGENTS.md — Pointeur pour outils IA tiers

De nombreux outils de vibecoding (Cursor, Codex CLI, Windsurf, Amp, etc.) lisent automatiquement un fichier `AGENTS.md` à la racine du dépôt.

Pour éviter toute divergence entre deux jeux d'instructions, ce fichier ne contient **aucune règle propre** : il redirige entièrement vers la source unique de vérité.

**Source unique de vérité : [`CLAUDE.md`](CLAUDE.md)**

Lis `CLAUDE.md` en entier avant toute action, puis suis les pointeurs qu'il contient vers `naminto-ops/`.

Si ton outil ne sait pas résoudre les liens Markdown relatifs, les fichiers cités se trouvent tous sous :

- `./CLAUDE.md`
- `./naminto-ops/*.md`
- `./naminto-ops/agents/*.md`

Ne duplique pas le contenu de `CLAUDE.md` dans ce fichier, même partiellement : toute modification des règles du projet doit se faire dans `CLAUDE.md` et ses fichiers pointés, jamais ici.
