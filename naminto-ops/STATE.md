# STATE.md — État courant du projet Naminto IA

> Document vivant. À lire en tout premier en début de session. À mettre à jour avant de clore toute session de vibecoding.
> Ne raconte pas l'historique ici (ça, c'est `DECISIONS.md`) : ce fichier décrit **où on en est maintenant**.

## Dernière mise à jour

- Date : 2026-08-21
- Par : session SandboxProvider — étude comparative (E2B/Daytona/Modal/Vercel Sandbox), décision **D-8 : E2B** retenu (microVM Firecracker, SDK TS natif, palier gratuit). `packages/providers/sandbox-e2b` créé et câblé comme `SandboxProvider` par défaut dans `apps/api` (remplace `sandbox-stub`, qui reste dans le dépôt mais n'est plus utilisé). `npm run lint`, `typecheck`, `test` (17/17) et `build` passent tous. Commit + push faits automatiquement (accord utilisateur "à chaque fois").

## Phase actuelle

**Étapes 1-3b de la "Prochaine étape recommandée" ci-dessous : faites, plus le choix du fournisseur `SandboxProvider` (D-8).** Reste : implémenter le Coding Agent lui-même (étape 4) — le seul prérequis restant est une vraie clé `E2B_API_KEY` pour le tester en conditions réelles, plus brancher Reasoning Engine + Agent Orchestrator + User Interface bout-en-bout (étape 5).

## Ce qui existe

- [x] Instructions maîtresses de projet (rôle IA, architecture cible, principes d'indépendance)
- [x] Kit de pilotage IA : `CLAUDE.md`, `AGENTS.md`, `naminto-ops/*` (à la racine du dépôt)
- [x] Stack technique tranchée, basée sur l'étude des outils IA du marché (`STACK.md`, `DECISIONS.md` D-1), avec l'écart npm-vs-pnpm documenté en D-7
- [x] Périmètre du MVP défini (`DECISIONS.md` D-2)
- [x] Implémentations par défaut choisies pour `SandboxProvider`, `BackendProvider`, `IntelligenceProvider`, `PaymentProvider` (`DECISIONS.md` D-3 à D-6)
- [x] Squelette de dépôt de code (backend `apps/api` NestJS, frontend `apps/web` Next.js, `packages/naminto-core`, `packages/providers/*`)
- [x] Naminto Core — squelette de coordination (`packages/naminto-core/src/core.ts`) + les 4 interfaces Provider (MVP), chacune avec un adaptateur par défaut : `intelligence-anthropic` (défaut), `intelligence-openai` (2ᵉ adaptateur, D-5), `sandbox-e2b` (fournisseur nommé, D-8 — microVM Firecracker managé via E2B, lève une erreur de config explicite sans `E2B_API_KEY`), `backend-selfhosted` (contrat Postgres/GoTrue/PostgREST, D-4, pas encore d'infra réelle), `payment-stub` (D-6, Billing hors MVP)
- [x] Reasoning Engine — `IntelligenceReasoningEngine` (`packages/reasoning-engine`), applique les étapes 1-5 de `WORKFLOW.md` via un `IntelligenceProvider`, valide manuellement la forme JSON de la réponse (pas de `Plan` silencieusement faux)
- [x] Agent Orchestrator séquentiel — `SequentialAgentOrchestrator` (`packages/agent-orchestrator`), s'arrête au premier échec, erreur explicite si un rôle n'a pas d'agent enregistré
- [ ] Coding Agent (MVP, pleinement implémenté)
- [ ] Testing Agent (MVP, version minimale)
- [ ] Debug Agent (MVP, boucle bornée à 3 tentatives)
- [ ] Execution Engine / Sandbox (MVP, un seul `SandboxProvider` branché)
- [ ] Memory System (MVP, persistance d'état simple, pas encore de recherche sémantique)
- [ ] File System (MVP)
- [ ] User System (MVP, authentification simple)
- [ ] User Interface (MVP, chat d'intention + viewer en streaming)
- [ ] Hors MVP (Phase 2+, voir D-2) : Design Agent, Architecture Agent, Research Agent, Deployment Agent en agents autonomes séparés ; Security System avancé ; Billing System ; Credit System ; Administration

## Prochaine étape recommandée

1. ~~Initialiser le monorepo~~ — fait (npm workspaces, D-7).
2. ~~Créer le squelette de Naminto Core avec les 4 interfaces Provider~~ — fait.
3. ~~Implémenter le second adaptateur `IntelligenceProvider`~~ — fait (`intelligence-openai`).
3b. ~~Reasoning Engine + Agent Orchestrator~~ — fait (`packages/reasoning-engine`, `packages/agent-orchestrator`), testés via doublures, pas encore branchés sur une vraie clé API ni un vrai agent.
3c. ~~Choisir un fournisseur `SandboxProvider` réel~~ — fait (D-8, E2B), `packages/providers/sandbox-e2b` câblé par défaut dans `apps/api`.
4. Appliquer `WORKFLOW.md` à la première fonctionnalité concrète : le **Coding Agent** capable de transformer une spécification simple en code exécuté dans le sandbox et testé (boucle complète objectif → validation).
5. Brancher le Reasoning Engine + Agent Orchestrator sur `apps/api` et une **User Interface** de chat pour obtenir une démonstration bout-en-bout du pitch (`CONTEXT.md`), une fois le Coding Agent (étape 4) prêt à recevoir des tâches.

## Blocages / questions ouvertes

- ~~Accès au dépôt distant non débloqué~~ — résolu : authentification GitHub locale basculée sur le compte `namintoia-eng` (device-flow login), dépôt configuré pour toujours pousser avec ce compte.
- Aucune clé réelle configurée (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `E2B_API_KEY`, `DATABASE_URL`, etc.) — attendu à ce stade (`.env.example` uniquement), mais bloque tout appel réel des adaptateurs `IntelligenceProvider`/`SandboxProvider`/`BackendProvider` tant que ce n'est pas fourni. Pour `E2B_API_KEY` spécifiquement : compte à créer sur e2b.dev (palier gratuit suffisant pour développer le Coding Agent, voir D-8).

## Comment mettre à jour ce fichier

À chaque fin de session : mettre à jour « Dernière mise à jour », cocher les cases nouvellement complètes, réviser « Prochaine étape recommandée », et ajouter toute nouvelle question ouverte. Toute décision structurante prise pendant la session doit en plus être ajoutée à `DECISIONS.md`.
