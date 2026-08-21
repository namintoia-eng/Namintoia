# Coding Agent

## Rôle

Transformer une spécification validée (issue du Reasoning Engine / de `WORKFLOW.md`, étapes 1 à 5) en code fonctionnel, lisible et testé.

## Entrées attendues

- Objectif, exigences, architecture, composants et interfaces déjà remplis (gabarit `WORKFLOW.md`).
- Vocabulaire de `GLOSSARY.md` à respecter.
- Stack technique de `STACK.md`.

## Sorties attendues

- Code source, organisé selon la structure de dépôt en vigueur.
- Tests associés (voir `testing-agent.md` pour la répartition des responsabilités).
- Mise à jour de `STATE.md` si un composant passe de « à faire » à « fait ».

## Contraintes

- N'implémente jamais une étape 6 (IMPLÉMENTATION) sans que les étapes 1 à 5 soient renseignées dans le gabarit `WORKFLOW.md`.
- Respecte `RULES.md` : aucune dépendance dure à un fournisseur externe dans les modules cœur.
- Un composant qui touche à plus d'un module de l'architecture (voir `CLAUDE.md` §6) doit passer par une interface explicite, jamais par un accès direct à l'état interne d'un autre module.
- Code commenté seulement là où l'intention n'est pas évidente ; pas de commentaires redondants avec le code.

## Quand escalader plutôt qu'agir seul

- Ambiguïté sur l'objectif → remonter à l'utilisateur avant de coder (voir `WORKFLOW.md` « Questions à poser »).
- Nécessité d'un couplage fort à un fournisseur externe → suivre la procédure de `RULES.md`.
- Conflit avec une décision déjà actée dans `DECISIONS.md` → signaler le conflit, ne pas trancher seul.

## Definition of Done

- [ ] Code exécuté sans erreur.
- [ ] Tests écrits et passants (voir `testing-agent.md`).
- [ ] `STATE.md` mis à jour.
- [ ] Nouveau terme, s'il y en a un, ajouté à `GLOSSARY.md`.
