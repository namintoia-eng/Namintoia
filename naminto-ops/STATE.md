# STATE.md — État courant du projet Naminto IA

> Document vivant. À lire en tout premier en début de session. À mettre à jour avant de clore toute session de vibecoding.
> Ne raconte pas l'historique ici (ça, c'est `DECISIONS.md`) : ce fichier décrit **où on en est maintenant**.

## Dernière mise à jour

- Date : 2026-08-21
- Par : session Reasoning Engine + Agent Orchestrator — nouveaux contrats `Plan`/`Agent`/`AgentOrchestrator`/`ReasoningEngine` ajoutés à `packages/naminto-core`, implémentations par défaut `IntelligenceReasoningEngine` (`packages/reasoning-engine`) et `SequentialAgentOrchestrator` (`packages/agent-orchestrator`) créées et testées via des doublures (agents/IntelligenceProvider factices). `npm run lint`, `typecheck`, `test` (16/16) et `build` passent tous. Pas encore committé à la fin de cette session — voir avec l'utilisateur.

## Phase actuelle

**Étapes 1-3 de la "Prochaine étape recommandée" ci-dessous : faites.** Reste : Coding Agent (étape 4, bloqué sur le choix d'un vrai `SandboxProvider`) et brancher Reasoning Engine + User Interface bout-en-bout (étape 5).

## Ce qui existe

- [x] Instructions maîtresses de projet (rôle IA, architecture cible, principes d'indépendance)
- [x] Kit de pilotage IA : `CLAUDE.md`, `AGENTS.md`, `naminto-ops/*` (à la racine du dépôt)
- [x] Stack technique tranchée, basée sur l'étude des outils IA du marché (`STACK.md`, `DECISIONS.md` D-1), avec l'écart npm-vs-pnpm documenté en D-7
- [x] Périmètre du MVP défini (`DECISIONS.md` D-2)
- [x] Implémentations par défaut choisies pour `SandboxProvider`, `BackendProvider`, `IntelligenceProvider`, `PaymentProvider` (`DECISIONS.md` D-3 à D-6)
- [x] Squelette de dépôt de code (backend `apps/api` NestJS, frontend `apps/web` Next.js, `packages/naminto-core`, `packages/providers/*`)
- [x] Naminto Core — squelette de coordination (`packages/naminto-core/src/core.ts`) + les 4 interfaces Provider (MVP), chacune avec un adaptateur par défaut : `intelligence-anthropic` (défaut), `intelligence-openai` (2ᵉ adaptateur, D-5), `sandbox-stub` (refuse d'exécuter tant qu'aucun vrai microVM managé n'est branché, D-3), `backend-selfhosted` (contrat Postgres/GoTrue/PostgREST, D-4, pas encore d'infra réelle), `payment-stub` (D-6, Billing hors MVP)
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
4. Appliquer `WORKFLOW.md` à la première fonctionnalité concrète : le **Coding Agent** capable de transformer une spécification simple en code exécuté dans le sandbox et testé (boucle complète objectif → validation). Prérequis réel : un vrai `SandboxProvider` (D-3) pour remplacer `sandbox-stub`, sinon le Coding Agent n'a rien où exécuter le code généré.
5. Brancher le Reasoning Engine + Agent Orchestrator sur `apps/api` et une **User Interface** de chat pour obtenir une démonstration bout-en-bout du pitch (`CONTEXT.md`), une fois le Coding Agent (étape 4) prêt à recevoir des tâches.

## Blocages / questions ouvertes

- ~~Accès au dépôt distant non débloqué~~ — résolu : authentification GitHub locale basculée sur le compte `namintoia-eng` (device-flow login), dépôt configuré pour toujours pousser avec ce compte.
- Aucune clé réelle configurée (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`, etc.) — attendu à ce stade (`.env.example` uniquement), mais bloque tout appel réel des adaptateurs `IntelligenceProvider`/`BackendProvider` tant que ce n'est pas fourni.
- Pas encore de fournisseur `SandboxProvider` réel choisi/branché (nom précis du fournisseur managé, voir `DECISIONS.md` D-3) — nécessaire avant de commencer le Coding Agent (étape 4 ci-dessus).

## Comment mettre à jour ce fichier

À chaque fin de session : mettre à jour « Dernière mise à jour », cocher les cases nouvellement complètes, réviser « Prochaine étape recommandée », et ajouter toute nouvelle question ouverte. Toute décision structurante prise pendant la session doit en plus être ajoutée à `DECISIONS.md`.
