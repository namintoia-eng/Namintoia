# CONTEXT.md — Résumé condensé du projet Naminto IA

> Objectif de ce fichier : permettre à n'importe quel agent IA de retrouver, en moins de deux minutes de lecture, l'essentiel du projet sans avoir à relire tout l'historique de conversation.

## Pitch en une phrase

Naminto IA est une plateforme d'intelligence artificielle autonome qui transforme une intention exprimée en langage naturel en application logicielle complète, fonctionnelle et testée.

## Exemple d'usage cible

> « Crée-moi une application de gestion commerciale avec authentification, tableau de bord, clients, facturation et paiements. »

Naminto IA doit alors : comprendre la demande, analyser les besoins, poser les questions réellement nécessaires (pas plus), élaborer un plan, concevoir l'architecture, générer le code, créer l'interface, exécuter le projet, le tester, détecter les erreurs, les corriger, présenter le résultat, poursuivre les modifications demandées, et conserver le contexte du projet d'une session à l'autre.

## Ce que Naminto IA n'est pas

- Ce n'est pas une interface habillée par-dessus un unique fournisseur IA (Claude, Codex, Lovable...).
- Ce n'est pas un générateur de code à usage unique sans mémoire ni suivi.
- Ce n'est pas un produit qui code « au hasard » sans passer par une phase de compréhension et d'architecture.

## Pilier central : Naminto Core

Naminto Core est la couche centrale qui coordonne : l'intelligence, le raisonnement, les agents, la mémoire, les outils, les projets, le système d'exécution, le système de tests, les permissions, les ressources, la facturation.

L'architecture est modulaire : chaque composant doit pouvoir évoluer, être remplacé ou être testé indépendamment des autres.

## Où trouver le reste

- Méthode de travail obligatoire → `WORKFLOW.md`
- Règles d'indépendance et garde-fous → `RULES.md`
- État d'avancement actuel → `STATE.md`
- Décisions déjà prises → `DECISIONS.md`
- Vocabulaire officiel → `GLOSSARY.md`
- Stack technique recommandée → `STACK.md`
- Rôles des agents spécialisés → `agents/`

## Instructions de projet complètes

Les instructions maîtresses complètes fournies par le porteur du projet (rôle de l'IA, indépendance, architecture cible détaillée) sont la référence amont de tous les fichiers de ce kit. En cas de doute non tranché par ce kit, ces instructions maîtresses priment.
