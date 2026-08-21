# STATE.md — État courant du projet Naminto IA

> Document vivant. À lire en tout premier en début de session. À mettre à jour avant de clore toute session de vibecoding.
> Ne raconte pas l'historique ici (ça, c'est `DECISIONS.md`) : ce fichier décrit **où on en est maintenant**.

## Dernière mise à jour

- Date : 2026-08-21
- Par : session Chargement `.env` dans apps/api (D-15) — `apps/api/src/main.ts` charge désormais explicitement le `.env` racine via `dotenv` avant l'import d'`AppModule` (NestJS ne charge aucun `.env` par défaut, contrairement à Next.js pour `apps/web`). Vérifié en conditions réelles : log de démarrage confirme `injected env (10) from ..\..\.env` ; `POST /plan` authentifié échoue désormais avec un vrai appel réseau Anthropic (`request failed with status 400`) au lieu de `ANTHROPIC_API_KEY is not configured` ; confirmé par appel direct à l'API Anthropic que la cause reste le blocage crédit déjà connu (pas un problème de configuration). `npm run check` intégralement vert. Détail : `DECISIONS.md` D-15.
- Session précédente : Authentification branchée sur /plan (D-14) — `SessionAuthGuard` protège les trois routes de `PlanController`, 401 sans jeton valide, isolation par compte (`userId:projectId`), `apps/web` découpé en `AuthForm.tsx`/`Chat.tsx`/`page.tsx`. Détail : `DECISIONS.md` D-14.

## Phase actuelle

**Le périmètre MVP minimal défini dans `DECISIONS.md` D-2 est maintenant intégralement complet, authentification branchée comprise (D-14) et le chargement des clés API dans `apps/api` corrigé (D-15)** : Naminto Core + 4 Providers, Reasoning Engine, Agent Orchestrator (correction bornée + session sandbox partagée), Coding/Testing/Debug Agent, sandbox réel (E2B), Memory System, File System, User System branché avec isolation par compte, User Interface de chat protégée par connexion — tout vérifié en conditions réelles. Il ne reste plus qu'un seul point avant une démo `/plan` bout-en-bout complète : du crédit Anthropic réel sur le compte (blocage déjà connu, volontairement non résolu par l'utilisateur pour l'instant — voir « Blocages » ci-dessous).

## Ce qui existe

- [x] Instructions maîtresses de projet (rôle IA, architecture cible, principes d'indépendance)
- [x] Kit de pilotage IA : `CLAUDE.md`, `AGENTS.md`, `naminto-ops/*` (à la racine du dépôt)
- [x] Stack technique tranchée, basée sur l'étude des outils IA du marché (`STACK.md`, `DECISIONS.md` D-1), avec l'écart npm-vs-pnpm documenté en D-7
- [x] Périmètre du MVP défini (`DECISIONS.md` D-2)
- [x] Implémentations par défaut choisies pour `SandboxProvider`, `BackendProvider`, `IntelligenceProvider`, `PaymentProvider` (`DECISIONS.md` D-3 à D-6)
- [x] Squelette de dépôt de code (backend `apps/api` NestJS, frontend `apps/web` Next.js, `packages/naminto-core`, `packages/providers/*`)
- [x] Naminto Core — squelette de coordination (`packages/naminto-core/src/core.ts`) + les 4 interfaces Provider (MVP), chacune avec un adaptateur par défaut : `intelligence-anthropic` (défaut), `intelligence-openai` (2ᵉ adaptateur, D-5), `sandbox-e2b` (fournisseur nommé, D-8 — microVM Firecracker managé via E2B, session partagée par Plan depuis D-11, lève une erreur de config explicite sans `E2B_API_KEY`), `backend-selfhosted` (contrat Postgres/GoTrue/PostgREST, D-4, pas encore d'infra réelle), `payment-stub` (D-6, Billing hors MVP)
- [x] Reasoning Engine — `IntelligenceReasoningEngine` (`packages/reasoning-engine`), applique les étapes 1-5 de `WORKFLOW.md` via un `IntelligenceProvider`, valide manuellement la forme JSON de la réponse (pas de `Plan` silencieusement faux)
- [x] Agent Orchestrator séquentiel — `SequentialAgentOrchestrator` (`packages/agent-orchestrator`), s'arrête au premier échec, erreur explicite si un rôle n'a pas d'agent enregistré
- [x] Coding Agent — `CodingAgent` (`packages/coding-agent`), spécification → script shell → exécution sandbox → succès basé sur le code de sortie réel, jamais sur la parole du modèle
- [x] `apps/api` : `POST /plan` câble Reasoning Engine → Agent Orchestrator → Coding Agent bout en bout, vérifié en conditions réelles (voir ci-dessus)
- [x] Testing Agent — `TestingAgent` (`packages/testing-agent`), écrit et exécute de vrais tests couvrant les cas limites, pas seulement le chemin heureux (`testing-agent.md`)
- [x] Debug Agent — `DebugAgent` (`packages/debug-agent`), diagnostique et corrige une tâche en échec, invoqué par l'orchestrateur en boucle bornée à 3 tentatives (`debug-agent.md`, D-9)
- [x] Execution Engine / Sandbox (MVP, un seul `SandboxProvider` branché) — E2B, D-8
- [x] Memory System — `MemoryStore`/`ConversationTurn` (`packages/naminto-core`), `FileMemoryStore` (`packages/memory-system`), câblé dans `apps/api` (`POST /plan` sauvegarde, `GET /plan/:projectId` relit) ; persistance simple par fichier, pas encore de recherche sémantique (MVP, D-2)
- [x] File System — `FileSystem`/`ProjectFile` (`packages/naminto-core`), `LocalFileSystem` (`packages/file-system`), capture automatique par l'orchestrateur à la fin de chaque `Plan` (D-12), `GET /plan/:projectId/files`
- [x] User System — `UserSystem`/`User`/`Session` (`packages/naminto-core`), `LocalUserSystem` (`packages/user-system`, D-13), `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- [x] Authentification branchée sur `/plan` + isolation par compte (`DECISIONS.md` D-14) — `SessionAuthGuard` protège les trois routes de `PlanController`, clé interne `userId:projectId`
- [x] User Interface — chat d'intention protégé par connexion (`apps/web/app/page.tsx` + `AuthForm.tsx` + `Chat.tsx`), pas encore en streaming (réponse synchrone unique pour l'instant, cf. `POST /plan`)
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
8. ~~Corriger le partage de sandbox entre les tâches d'un même Plan~~ — fait (D-11), vérifié en conditions réelles contre E2B.
9. ~~File System~~ — fait (D-12), vérifié en conditions réelles contre E2B (fichiers écrits, sandbox détruit, fichiers relus intacts).
10. ~~User System~~ — fait (D-13), module autonome vérifié en conditions réelles.
11. ~~Brancher l'authentification sur `/plan`/le chat + isolation par compte~~ — fait (D-14), vérifié en conditions réelles.
12. ~~Corriger le chargement de `ANTHROPIC_API_KEY` dans `apps/api` en dev~~ — fait (D-15), vérifié en conditions réelles.
13. Retester tout le pipeline dès que du crédit Anthropic réel est disponible — dernière vérification en conditions réelles manquante pour le périmètre MVP D-2, maintenant intégralement complet.

## Blocages / questions ouvertes

- ~~Accès au dépôt distant non débloqué~~ — résolu : authentification GitHub locale basculée sur le compte `namintoia-eng` (device-flow login), dépôt configuré pour toujours pousser avec ce compte.
- `E2B_API_KEY` configurée dans `.env` local (non commité) et **vérifiée en conditions réelles** : sandbox créé/détruit avec succès (voir historique de session pour le détail).
- ~~`ANTHROPIC_API_KEY` n'est pas reçue par le process `apps/api` en dev~~ — résolu (D-15) : `apps/api` charge désormais le `.env` racine via `dotenv`.
- `ANTHROPIC_API_KEY` configurée dans `.env` local (non commité), clé valide (authentification OK), mais **compte sans crédit** — Anthropic renvoie `"Your credit balance is too low to access the Anthropic API"` sur tout appel réel. Confirmé en testant directement contre l'API Anthropic (hors code Naminto), donc ce n'est pas un bug côté adaptateur. L'utilisateur sait qu'il doit acheter du crédit sur console.anthropic.com → Plans & Billing, mais a choisi de ne pas le faire tout de suite ("on y reviendra") — **pas un blocage à résoudre proactivement**, juste un état à retester quand le crédit sera ajouté.
- `OPENAI_API_KEY`/`DATABASE_URL`/etc. toujours non configurées — attendu à ce stade.

## Comment mettre à jour ce fichier

À chaque fin de session : mettre à jour « Dernière mise à jour », cocher les cases nouvellement complètes, réviser « Prochaine étape recommandée », et ajouter toute nouvelle question ouverte. Toute décision structurante prise pendant la session doit en plus être ajoutée à `DECISIONS.md`.
