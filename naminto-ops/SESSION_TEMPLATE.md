# SESSION_TEMPLATE.md — Rituel d'ouverture et de clôture de session

> Une session de vibecoding sur Naminto IA n'a pas de mémoire automatique entre deux sessions. Ce rituel remplace cette mémoire par une lecture/écriture disciplinée des fichiers du kit.

## À l'ouverture de la session

1. Lire `CLAUDE.md` (si ce n'est pas déjà le contexte système).
2. Lire `naminto-ops/STATE.md` — où en est le projet.
3. Lire `naminto-ops/DECISIONS.md` — ne pas rejouer un débat déjà tranché.
4. Lire `naminto-ops/GLOSSARY.md` — vocabulaire à respecter.
5. Si la session incarne un agent spécialisé, lire le fichier correspondant dans `naminto-ops/agents/`.
6. Identifier l'objectif de la session en une phrase, et vérifier qu'il correspond à la « Prochaine étape recommandée » de `STATE.md` — sinon, noter explicitement pourquoi on s'en écarte.

## Pendant la session

- Toute fonctionnalité non triviale suit `WORKFLOW.md` du début à la fin.
- Toute décision structurante est notée dans `DECISIONS.md` **au moment où elle est prise**, pas reconstituée en fin de session de mémoire.
- Tout nouveau terme est ajouté à `GLOSSARY.md` dès sa première utilisation.

## À la clôture de la session

1. Mettre à jour `naminto-ops/STATE.md` :
   - Date et brève description de la session.
   - Cases cochées/décochées.
   - Nouvelle « Prochaine étape recommandée ».
   - Nouvelles questions ouvertes ou blocages, s'il y en a.
2. Vérifier que chaque décision structurante prise pendant la session a bien une entrée dans `DECISIONS.md`.
3. Vérifier qu'aucun terme nouveau n'a été utilisé sans être ajouté à `GLOSSARY.md`.
4. Si un fichier de stack (`STACK.md`) ou de règles (`RULES.md`) a été remis en question, le signaler explicitement à l'utilisateur avant de clore.

## Anti-pattern à éviter

Terminer une session avec du code fonctionnel mais `STATE.md` non mis à jour : la session suivante repartira d'une image fausse du projet et referra du travail déjà fait, ou pire, contredira une décision déjà prise.
