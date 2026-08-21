# WORKFLOW.md — Méthode obligatoire pour toute fonctionnalité non triviale

> Règle d'or : ne jamais construire une fonctionnalité complexe uniquement à partir d'une intuition. Ce fichier transforme la chaîne de raisonnement du projet en checklist actionnable.

```
OBJECTIF → EXIGENCES → ARCHITECTURE → COMPOSANTS → INTERFACES → IMPLÉMENTATION → TESTS → VALIDATION
```

Utilise le gabarit ci-dessous pour chaque fonctionnalité non triviale. Une fonctionnalité est « triviale » si elle tient dans un seul fichier, ne touche aucune interface publique et ne peut pas casser un autre module — dans le doute, traite-la comme non triviale.

## Gabarit à copier

```markdown
### Fonctionnalité : <nom>

**1. OBJECTIF**
Que doit accomplir cette fonctionnalité, pour qui, et pourquoi maintenant ?

**2. EXIGENCES**
- Fonctionnelles : ...
- Non fonctionnelles (perf, sécurité, coût, accessibilité) : ...
- Contraintes imposées par l'existant : ...

**3. ARCHITECTURE**
Quel(s) module(s) de l'architecture Naminto sont concernés (voir CLAUDE.md §6) ?
Quelles nouvelles interfaces faut-il créer entre modules ?

**4. COMPOSANTS**
Liste des composants/fichiers à créer ou modifier.

**5. INTERFACES**
Contrats d'entrée/sortie entre composants (schémas de données, signatures, événements).
Ne jamais coupler deux modules sans interface définie.

**6. IMPLÉMENTATION**
Code réel, écrit après avoir validé les 5 points précédents.

**7. TESTS**
Quels tests prouvent que l'objectif est atteint ? (unitaires, intégration, bout-en-bout)

**8. VALIDATION**
Comment vérifie-t-on que le résultat correspond à l'objectif de l'étape 1 ?
Qu'est-ce qui doit être mis à jour dans STATE.md / DECISIONS.md / GLOSSARY.md ?
```

## Questions à poser avant de foncer

Naminto IA (et donc l'agent qui le construit) doit poser les questions **réellement nécessaires**, pas toutes les questions possibles. Avant d'implémenter, vérifie que tu peux répondre à :

1. Est-ce que l'objectif est ambigu au point de produire un résultat différent selon l'interprétation ? Si oui → question à l'utilisateur.
2. Est-ce que l'architecture existante permet déjà cette fonctionnalité avec une extension mineure, ou faut-il un nouveau module ?
3. Est-ce que cette fonctionnalité crée une dépendance à un fournisseur externe (voir `RULES.md`) ?
4. Est-ce que cette fonctionnalité touche la mémoire/le contexte projet (voir `Memory System` dans l'architecture) ? Si oui, la persistance doit être testée explicitly.

## Boucle d'auto-correction

Après l'implémentation :

1. Exécuter le projet / la fonctionnalité.
2. Tester (voir `agents/testing-agent.md`).
3. Si échec → détecter l'erreur, corriger, revenir à l'étape 1 (voir `agents/debug-agent.md`).
4. Si succès → présenter le résultat, puis mettre à jour `STATE.md`.

Ne jamais présenter un résultat comme terminé s'il n'a pas passé l'étape 7 (TESTS) et l'étape 8 (VALIDATION) du gabarit.
