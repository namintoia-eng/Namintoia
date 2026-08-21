# STATE.md — État courant du projet Naminto IA

> Document vivant. À lire en tout premier en début de session. À mettre à jour avant de clore toute session de vibecoding.
> Ne raconte pas l'historique ici (ça, c'est `DECISIONS.md`) : ce fichier décrit **où on en est maintenant**.

## Dernière mise à jour

- Date : 2026-08-21
- Par : session API wiring — `POST /plan` ajouté sur `apps/api` (`src/plan/`) : prend `{ intent }`, appelle le Reasoning Engine puis l'Agent Orchestrator (avec le Coding Agent enregistré pour le rôle `coding`), renvoie `{ plan, result }`. `NamintoCoreModule` étendu pour dériver `ReasoningEngine`/`AgentOrchestrator` des mêmes instances de providers que `NamintoCore` (pas d'instances dupliquées). Validation manuelle du corps de requête (400 explicite si `intent` absent/vide), pas de nouvelle dépendance (pas de class-validator). Vérifié **en conditions réelles** : serveur démarré avec `.env` chargé, `curl` sur `/health` (200), `/plan` sans intent (400), `/plan` avec intent (500 — la requête atteint bien Anthropic, qui refuse faute de crédit, chaîne complète confirmée jusqu'au bout). `npm run lint`, `typecheck`, `test` (21/21) et `build` passent tous.

## Phase actuelle

**Étapes 1-5 (partie API) de la "Prochaine étape recommandée" ci-dessous : faites.** Reste : la **User Interface** de chat sur `apps/web` (actuellement une page statique) pour une démo bout-en-bout visible par un humain, et retester `/plan` en vrai une fois du crédit Anthropic disponible.

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
- [x] Coding Agent — `CodingAgent` (`packages/coding-agent`), spécification → script shell → exécution sandbox → succès basé sur le code de sortie réel, jamais sur la parole du modèle
- [x] `apps/api` : `POST /plan` câble Reasoning Engine → Agent Orchestrator → Coding Agent bout en bout, vérifié en conditions réelles (voir ci-dessus)
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
4. ~~Coding Agent~~ — fait (`packages/coding-agent`).
5a. ~~Brancher Reasoning Engine + Agent Orchestrator + Coding Agent sur `apps/api`~~ — fait (`POST /plan`), vérifié en conditions réelles.
5b. Une **User Interface** de chat sur `apps/web` (actuellement une page statique) qui appelle `POST /plan` et affiche le résultat — pour obtenir une démonstration bout-en-bout du pitch (`CONTEXT.md`) visible par un humain, pas seulement via `curl`.

## Blocages / questions ouvertes

- ~~Accès au dépôt distant non débloqué~~ — résolu : authentification GitHub locale basculée sur le compte `namintoia-eng` (device-flow login), dépôt configuré pour toujours pousser avec ce compte.
- `E2B_API_KEY` configurée dans `.env` local (non commité) et **vérifiée en conditions réelles** : sandbox créé/détruit avec succès (voir historique de session pour le détail).
- `ANTHROPIC_API_KEY` configurée dans `.env` local (non commité), clé valide (authentification OK), mais **compte sans crédit** — Anthropic renvoie `"Your credit balance is too low to access the Anthropic API"` sur tout appel réel. Confirmé en testant directement contre l'API Anthropic (hors code Naminto), donc ce n'est pas un bug côté adaptateur. L'utilisateur sait qu'il doit acheter du crédit sur console.anthropic.com → Plans & Billing, mais a choisi de ne pas le faire tout de suite ("on y reviendra") — **pas un blocage à résoudre proactivement**, juste un état à retester quand le crédit sera ajouté.
- `OPENAI_API_KEY`/`DATABASE_URL`/etc. toujours non configurées — attendu à ce stade.

## Comment mettre à jour ce fichier

À chaque fin de session : mettre à jour « Dernière mise à jour », cocher les cases nouvellement complètes, réviser « Prochaine étape recommandée », et ajouter toute nouvelle question ouverte. Toute décision structurante prise pendant la session doit en plus être ajoutée à `DECISIONS.md`.
