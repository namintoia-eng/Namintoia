# STATE.md — État courant du projet Naminto IA

> Document vivant. À lire en tout premier en début de session. À mettre à jour avant de clore toute session de vibecoding.
> Ne raconte pas l'historique ici (ça, c'est `DECISIONS.md`) : ce fichier décrit **où on en est maintenant**.

## Dernière mise à jour

- Date : 2026-08-22
- Par : session Chat en streaming (D-21) — `POST /plan` devient un flux SSE (`@Sse()`, `apps/api/src/plan/plan.controller.ts`) émettant la **progression par étape** (planification → début/fin de chaque tâche d'agent → résultat final), choix explicite de l'utilisateur plutôt que du streaming token par token (sortie structurée, pas du texte continu). `AgentOrchestrator.run()` gagne un 3ᵉ paramètre optionnel `onTaskEvent` (rétrocompatible) émettant `TaskProgressEvent` (`task_start`/`task_complete`), y compris pendant les tentatives de la boucle de débogage. `Chat.tsx` lit le flux manuellement (`response.body.getReader()`, pas d'`EventSource` natif — incompatible avec POST + `Authorization`), affiche la liste des tâches en temps réel pendant l'exécution. Piège trouvé en implémentant : `@Post()` doit rester au-dessus de `@Sse()` (ordre d'exécution des décorateurs, sinon la route s'enregistre silencieusement en GET). `npm run check` intégralement vert. Vérifié en conditions réelles : `curl -N` confirmant les trames SSE arrivant au fil du temps et une fermeture propre de connexion ; navigateur réel confirmant « Planification… » puis l'erreur de blocage crédit Anthropic déjà connue s'affichant proprement sans spinner infini (un faux « bug » initial dû à un process Next.js orphelin de l'ancien dépôt abandonné squattant le port 3000 — résolu, sans rapport avec le code livré). Détail : `DECISIONS.md` D-21.
- Session précédente : Gestion de projets (D-20) — voir `DECISIONS.md` D-20.

## Phase actuelle

**Le périmètre MVP minimal défini dans `DECISIONS.md` D-2 est intégralement complet**, et les chantiers au-delà du MVP le sont également : Project System (D-16, D-20), authentification avec isolation par compte réelle (D-14/D-16), refonte UI/UX (D-17), connexion Google (D-18, câblage vérifié, en attente d'un vrai client OAuth), historique et fichiers dans le chat (D-19), gestion de projets — renommer/supprimer (D-20), chat en streaming — progression par étape (D-21). Naminto Core + 4 Providers, Reasoning Engine, Agent Orchestrator, Coding/Testing/Debug Agent, sandbox réel (E2B), Memory System, File System, User System (mot de passe + Google), User Interface de chat présentable, protégée par connexion, scopée à un projet consultable/renommable/supprimable, avec historique et fichiers consultables, progression en direct pendant l'exécution — tout vérifié en conditions réelles dans la limite de ce qui est vérifiable sans comptes vendor réels. Deux points restent avant une démo bout-en-bout complète : du crédit Anthropic réel sur le compte, et un vrai client OAuth Google (tous deux déjà documentés, volontairement non résolus par l'utilisateur pour l'instant — voir « Blocages » ci-dessous).

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
- [x] Connexion Google — `authenticateExternal`/`ExternalIdentity` (`DECISIONS.md` D-18), `GoogleOAuthService`, `GET /auth/google`(`/callback`), bouton dans `AuthForm.tsx` ; câblage vérifié, **en attente d'un vrai client OAuth Google pour un test de bout en bout réel** (voir « Blocages »)
- [x] Authentification branchée sur `/plan` + isolation par compte (`DECISIONS.md` D-14) — `SessionAuthGuard` protège les trois routes de `PlanController`
- [x] Project System — `Project`/`ProjectSystem` (`packages/naminto-core`), `LocalProjectSystem` (`packages/project-system`, D-16), `POST/GET /projects`, propriété vérifiée réellement (pas juste préfixée) avant tout accès à `/plan` ; renommage/suppression avec cascade sur l'historique et les fichiers (`DECISIONS.md` D-20)
- [x] User Interface — chat d'intention protégé par connexion et scopé à un projet sélectionné (`apps/web/app/page.tsx` + `AuthForm.tsx` + `ProjectPicker.tsx` + `Chat.tsx`)
- [x] Design UI/UX présentable — Tailwind CSS v4, thème sombre (`DECISIONS.md` D-17)
- [x] Historique et fichiers consultables dans le chat — `GET /plan/:projectId/file`, sections Historique/Fichiers (`DECISIONS.md` D-19)
- [x] Chat en streaming — progression par étape en temps réel (`POST /plan` en SSE, `TaskProgressEvent`, `DECISIONS.md` D-21)
- [ ] Hors MVP (Phase 2+, voir D-2) : Design Agent, Architecture Agent, Research Agent, Deployment Agent en agents autonomes séparés ; Security System avancé ; Billing System ; Credit System ; Administration ; bascule thème clair/sombre ; édition/suppression de fichiers depuis l'UI ; corbeille/restauration après suppression de projet ; streaming token par token du texte brut du modèle ; reconnexion automatique du flux SSE

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
13. ~~Project System (projets nommés, propriété réelle sur `/plan`)~~ — fait (D-16), vérifié en conditions réelles.
14. ~~Refonte UI/UX présentable~~ — fait (D-17), vérifié en navigateur réel.
15. ~~Connexion Google, bouton direct~~ — fait (D-18), câblage vérifié avec des identifiants factices (302 réel vers Google atteint).
16. ~~Historique et fichiers dans le chat~~ — fait (D-19), vérifié en conditions réelles (données de test semées dans le stockage fichier faute de crédit Anthropic pour un vrai run).
17. ~~Gestion de projets (renommer/supprimer)~~ — fait (D-20), vérifié en conditions réelles y compris la cascade de suppression sur le stockage fichier.
18. ~~Chat en streaming (progression par étape)~~ — fait (D-21), vérifié en conditions réelles (`curl` + navigateur réel).
19. Retester tout le pipeline dès que du crédit Anthropic réel est disponible, et tester la connexion Google de bout en bout dès qu'un vrai client OAuth est créé — deux vérifications en conditions réelles manquantes, tout le reste est intégralement complet.

## Blocages / questions ouvertes

- ~~Accès au dépôt distant non débloqué~~ — résolu : authentification GitHub locale basculée sur le compte `namintoia-eng` (device-flow login), dépôt configuré pour toujours pousser avec ce compte.
- `E2B_API_KEY` configurée dans `.env` local (non commité) et **vérifiée en conditions réelles** : sandbox créé/détruit avec succès (voir historique de session pour le détail).
- ~~`ANTHROPIC_API_KEY` n'est pas reçue par le process `apps/api` en dev~~ — résolu (D-15) : `apps/api` charge désormais le `.env` racine via `dotenv`.
- `ANTHROPIC_API_KEY` configurée dans `.env` local (non commité), clé valide (authentification OK), mais **compte sans crédit** — Anthropic renvoie `"Your credit balance is too low to access the Anthropic API"` sur tout appel réel. Confirmé en testant directement contre l'API Anthropic (hors code Naminto), donc ce n'est pas un bug côté adaptateur. L'utilisateur sait qu'il doit acheter du crédit sur console.anthropic.com → Plans & Billing, mais a choisi de ne pas le faire tout de suite ("on y reviendra") — **pas un blocage à résoudre proactivement**, juste un état à retester quand le crédit sera ajouté.
- `OPENAI_API_KEY`/`DATABASE_URL`/etc. toujours non configurées — attendu à ce stade.
- **Piège d'environnement (pas un blocage produit)** : l'ancien dépôt abandonné `D:\ADF\Naminto.AI` possède son propre `.claude/launch.json` avec une configuration `"web"` du même nom, sur le même port (3000). Si un process Next.js orphelin de ce dépôt reste vivant, l'outil de prévisualisation navigateur peut résoudre le mauvais `launch.json` et servir la mauvaise application. Repéré et résolu pendant la vérification de D-21 (`netstat -ano` sur le port 3000 → process orphelin tué → serveur `apps/web` du bon dépôt redémarré directement). Réflexe pour toute session future : si le navigateur affiche un comportement inattendu qui contredit le code source, vérifier `netstat -ano | grep :3000` avant de chercher un bug côté code.
- `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`AUTH_STATE_SECRET` non configurées — le bouton "Continuer avec Google" est câblé et vérifié avec des identifiants factices (redirection réelle vers Google atteinte, `state` CSRF validé) mais ne peut pas compléter un vrai flux avant que l'utilisateur crée un client OAuth dans Google Cloud Console (Credentials → OAuth Client ID → Web application → redirect URI exactement `http://localhost:3001/auth/google/callback`) et fournisse les vraies valeurs — même situation que `ANTHROPIC_API_KEY`/`E2B_API_KEY`, pas un blocage à résoudre proactivement.

## Comment mettre à jour ce fichier

À chaque fin de session : mettre à jour « Dernière mise à jour », cocher les cases nouvellement complètes, réviser « Prochaine étape recommandée », et ajouter toute nouvelle question ouverte. Toute décision structurante prise pendant la session doit en plus être ajoutée à `DECISIONS.md`.
