# STATE.md — État courant du projet Naminto IA

> Document vivant. À lire en tout premier en début de session. À mettre à jour avant de clore toute session de vibecoding.
> Ne raconte pas l'historique ici (ça, c'est `DECISIONS.md`) : ce fichier décrit **où on en est maintenant**.

## Dernière mise à jour

- Date : 2026-08-21
- Par : session Memory System — nouveau contrat `MemoryStore`/`ConversationTurn` dans `packages/naminto-core` (persiste un échange complet : intention → `Plan` → `OrchestrationResult`, horodaté). Implémentation MVP par défaut : `FileMemoryStore` (`packages/memory-system`) — un fichier JSON par projet, écritures sérialisées par projet pour éviter une course lecture-modification-écriture, aucune base de données requise. Câblé dans `apps/api` : `POST /plan` accepte désormais un `projectId` optionnel (`"default"` si absent) et sauvegarde chaque échange ; nouvel endpoint `GET /plan/:projectId` renvoie l'historique. Vérifié en conditions réelles : écriture/lecture sur disque réel confirmée (hors mocks), `GET /plan/default` testé sur le serveur démarré. `npm run lint`, `typecheck`, `test` (29/29) et `build` passent tous.

## Phase actuelle

**Le périmètre MVP minimal défini dans `DECISIONS.md` D-2 est maintenant complet, Memory System inclus** : Naminto Core + 4 Providers, Reasoning Engine, Agent Orchestrator (avec boucle de correction bornée), Coding/Testing/Debug Agent, sandbox réel (E2B), User Interface de chat, Memory System (persistance fichier). Restent hors scope tant que non demandés explicitement : File System, User System — et la vérification en conditions réelles complète du pipeline une fois le crédit Anthropic disponible.

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
- [x] Testing Agent — `TestingAgent` (`packages/testing-agent`), écrit et exécute de vrais tests couvrant les cas limites, pas seulement le chemin heureux (`testing-agent.md`)
- [x] Debug Agent — `DebugAgent` (`packages/debug-agent`), diagnostique et corrige une tâche en échec, invoqué par l'orchestrateur en boucle bornée à 3 tentatives (`debug-agent.md`, D-9)
- [x] Execution Engine / Sandbox (MVP, un seul `SandboxProvider` branché) — E2B, D-8
- [x] Memory System — `MemoryStore`/`ConversationTurn` (`packages/naminto-core`), `FileMemoryStore` (`packages/memory-system`), câblé dans `apps/api` (`POST /plan` sauvegarde, `GET /plan/:projectId` relit) ; persistance simple par fichier, pas encore de recherche sémantique (MVP, D-2)
- [ ] File System (MVP)
- [ ] User System (MVP, authentification simple)
- [x] User Interface — chat d'intention minimal (`apps/web/app/page.tsx`), pas encore en streaming (réponse synchrone unique pour l'instant, cf. `POST /plan`)
- [ ] Hors MVP (Phase 2+, voir D-2) : Design Agent, Architecture Agent, Research Agent, Deployment Agent en agents autonomes séparés ; Security System avancé ; Billing System ; Credit System ; Administration

## Prochaine étape recommandée

1. ~~Initialiser le monorepo~~ — fait (npm workspaces, D-7).
2. ~~Créer le squelette de Naminto Core avec les 4 interfaces Provider~~ — fait.
3. ~~Implémenter le second adaptateur `IntelligenceProvider`~~ — fait (`intelligence-openai`).
3b. ~~Reasoning Engine + Agent Orchestrator~~ — fait (`packages/reasoning-engine`, `packages/agent-orchestrator`), testés via doublures, pas encore branchés sur une vraie clé API ni un vrai agent.
3c. ~~Choisir un fournisseur `SandboxProvider` réel~~ — fait (D-8, E2B), `packages/providers/sandbox-e2b` câblé par défaut dans `apps/api`.
4. ~~Coding Agent~~ — fait (`packages/coding-agent`).
5a. ~~Brancher Reasoning Engine + Agent Orchestrator + Coding Agent sur `apps/api`~~ — fait (`POST /plan`), vérifié en conditions réelles.
5b. ~~User Interface de chat sur `apps/web`~~ — fait, vérifiée en navigateur réel (et un bug CORS trouvé/corrigé au passage).
6. ~~Testing Agent + Debug Agent~~ — fait (D-9), boucle de correction bornée à 3 tentatives dans l'orchestrateur.
7. ~~Memory System~~ — fait, `FileMemoryStore` câblé sur `POST/GET /plan`.
8. Retester tout le pipeline avec un vrai crédit Anthropic dès qu'il est disponible — seule vérification en conditions réelles qui manque encore pour le périmètre MVP D-2, maintenant fonctionnellement complet.
9. Au-delà du MVP D-2 (à discuter avec l'utilisateur avant de commencer, ce n'est pas encore demandé) : File System, User System.

## Blocages / questions ouvertes

- ~~Accès au dépôt distant non débloqué~~ — résolu : authentification GitHub locale basculée sur le compte `namintoia-eng` (device-flow login), dépôt configuré pour toujours pousser avec ce compte.
- `E2B_API_KEY` configurée dans `.env` local (non commité) et **vérifiée en conditions réelles** : sandbox créé/détruit avec succès (voir historique de session pour le détail).
- `ANTHROPIC_API_KEY` configurée dans `.env` local (non commité), clé valide (authentification OK), mais **compte sans crédit** — Anthropic renvoie `"Your credit balance is too low to access the Anthropic API"` sur tout appel réel. Confirmé en testant directement contre l'API Anthropic (hors code Naminto), donc ce n'est pas un bug côté adaptateur. L'utilisateur sait qu'il doit acheter du crédit sur console.anthropic.com → Plans & Billing, mais a choisi de ne pas le faire tout de suite ("on y reviendra") — **pas un blocage à résoudre proactivement**, juste un état à retester quand le crédit sera ajouté.
- `OPENAI_API_KEY`/`DATABASE_URL`/etc. toujours non configurées — attendu à ce stade.

## Comment mettre à jour ce fichier

À chaque fin de session : mettre à jour « Dernière mise à jour », cocher les cases nouvellement complètes, réviser « Prochaine étape recommandée », et ajouter toute nouvelle question ouverte. Toute décision structurante prise pendant la session doit en plus être ajoutée à `DECISIONS.md`.
