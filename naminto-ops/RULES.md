# RULES.md — Indépendance et garde-fous non négociables

## Pourquoi ce fichier existe

C'est la règle fondamentale du projet : Naminto IA ne doit jamais devenir une simple interface dépendante de Claude, Codex, Lovable ou de tout autre fournisseur. Ces outils sont des références fonctionnelles et architecturales à étudier — pas des fondations sur lesquelles bâtir Naminto Core.

## Ce que « indépendance » veut dire concrètement

- **Claude n'est pas le cerveau obligatoire de Naminto IA.** Il peut être *un* fournisseur de raisonnement parmi d'autres derrière une interface abstraite, jamais LE moteur câblé en dur.
- **Codex n'est pas le moteur de programmation obligatoire.** La génération de code doit passer par une interface interchangeable (voir `Tool System` / `Agent System`).
- **Lovable n'est pas le moteur de création UI obligatoire.** La génération d'interface doit être remplaçable.
- Tout appel direct à une API propriétaire externe depuis **Naminto Core** doit passer par une couche d'abstraction (ex. `IntelligenceProvider`, `CodeGenProvider`), jamais par un appel en dur dispersé dans le code métier.

## Ce qui est autorisé

- Utiliser un LLM externe (Claude, GPT, autre) comme **implémentation par défaut** d'un provider, tant que le contrat d'interface permet de le remplacer sans réécrire Naminto Core.
- S'inspirer de l'UX, des conventions d'agents ou des patterns d'outils existants pour concevoir Naminto IA.
- Utiliser des outils de vibecoding tiers (dont Claude Code) **pour construire** Naminto IA — cela ne crée pas de dépendance du *produit final* envers ces outils.

## Ce qui est interdit par défaut

- Coder une fonctionnalité cœur qui ne fonctionne QUE avec un fournisseur IA précis, sans interface de substitution.
- Nommer des types, classes ou schémas de données d'une façon qui expose l'identité du fournisseur sous-jacent dans l'API publique de Naminto Core (ex. `ClaudeResponse` au lieu de `ReasoningResult`).
- Copier la structure de prompts propriétaire d'un concurrent au lieu de concevoir la sienne.
- Prendre une décision d'architecture structurante sans l'écrire dans `DECISIONS.md`.

## Procédure en cas de doute

Si une implémentation semble nécessiter un couplage fort à un fournisseur externe :

1. Documenter le compromis dans `DECISIONS.md` (option envisagée, alternative, coût du couplage).
2. Signaler explicitement le compromis dans la réponse à l'utilisateur avant de l'implémenter.
3. Ne jamais l'implémenter silencieusement « parce que c'était plus simple ».

## Autres garde-fous transverses

- Ne jamais supprimer ou réécrire l'historique de `DECISIONS.md` : on ajoute, on ne réécrit pas le passé (une décision annulée est actée comme telle, pas effacée).
- Ne jamais introduire un terme concurrent à un terme déjà défini dans `GLOSSARY.md` sans le faire évoluer explicitement.
- Toute donnée sensible (clé API, secret, identifiant de paiement) ne doit jamais être écrite en clair dans le code ou dans ces fichiers Markdown — utiliser des variables d'environnement et des fichiers d'exemple (`.env.example`).
