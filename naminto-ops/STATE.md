# STATE.md — État courant du projet Naminto IA

> Document vivant. À lire en tout premier en début de session. À mettre à jour avant de clore toute session de vibecoding.
> Ne raconte pas l'historique ici (ça, c'est `DECISIONS.md`) : ce fichier décrit **où on en est maintenant**.

## Dernière mise à jour

- Date : 2026-08-22
- Par : session Moteurs Groq/Ollama + refonte du chat (D-23, D-24) — **D-23** : `GroqIntelligenceProvider` (nouveau `packages/providers/intelligence-groq`, API compatible OpenAI) devient le moteur IA par défaut d'`apps/api`, remplaçant `AnthropicIntelligenceProvider` — le compte Anthropic configuré n'a jamais eu de crédit, bloquant toute vérification réelle depuis D-19. `OllamaIntelligenceProvider` (nouveau `packages/providers/intelligence-ollama`, API native locale, aucune clé) ajouté comme second adaptateur. `intelligence-anthropic`/`intelligence-openai` restent dans le dépôt, testés, simplement plus câblés par défaut. **D-24** : refonte complète de `Chat.tsx` en vraie interface de conversation — fil de messages en bulles (utilisateur à droite, assistant à gauche réutilisant `PlanResult.tsx`), ordre chronologique croissant, historique intégré directement au fil (plus de section séparée avec `<details>`), zone de saisie fixée en bas, panneau Fichiers replié par défaut ouvert via un bouton d'en-tête. L'échange en cours est fondu directement depuis la charge utile SSE `done` dans l'historique local, sans refetch réseau (évite une course constatée en écrivant les tests). `npm run check` intégralement vert (53 tests `apps/web` dont 23 pour `Chat.test.tsx`). Vérification en conditions réelles de D-23 (et donc, pour la première fois, du streaming D-21/sortie en direct D-22 avec une vraie tâche) en attente d'une `GROQ_API_KEY` fournie par l'utilisateur — étape manuelle, même statut que E2B/Google OAuth. Détail : `DECISIONS.md` D-23, D-24.
- Session précédente : Sortie de commande en direct pendant une tâche (D-22) — voir `DECISIONS.md` D-22.

## Phase actuelle

**Le périmètre MVP minimal défini dans `DECISIONS.md` D-2 est intégralement complet**, et les chantiers au-delà du MVP le sont également : Project System (D-16, D-20), authentification avec isolation par compte réelle (D-14/D-16), refonte UI/UX (D-17), connexion Google (D-18, câblage vérifié, en attente d'un vrai client OAuth), historique et fichiers dans le chat (D-19), gestion de projets — renommer/supprimer (D-20), chat en streaming — progression par étape (D-21), sortie de commande en direct (D-22), moteur IA Groq par défaut + Ollama (D-23), refonte du chat en vraie interface de conversation (D-24). Naminto Core + 4 Providers, Reasoning Engine, Agent Orchestrator, Coding/Testing/Debug Agent, sandbox réel (E2B), Memory System, File System, User System (mot de passe + Google), User Interface de chat en fil de conversation, protégée par connexion, scopée à un projet consultable/renommable/supprimable, avec historique intégré au fil et fichiers consultables, progression en direct pendant l'exécution — tout vérifié en conditions réelles dans la limite de ce qui est vérifiable sans comptes vendor réels. Deux points restent avant une démo bout-en-bout complète avec une vraie tâche IA : une `GROQ_API_KEY` réelle sur le compte, et un vrai client OAuth Google (tous deux déjà documentés, volontairement non résolus par l'utilisateur pour l'instant — voir « Blocages » ci-dessous).

## Ce qui existe

- [x] Instructions maîtresses de projet (rôle IA, architecture cible, principes d'indépendance)
- [x] Kit de pilotage IA : `CLAUDE.md`, `AGENTS.md`, `naminto-ops/*` (à la racine du dépôt)
- [x] Stack technique tranchée, basée sur l'étude des outils IA du marché (`STACK.md`, `DECISIONS.md` D-1), avec l'écart npm-vs-pnpm documenté en D-7
- [x] Périmètre du MVP défini (`DECISIONS.md` D-2)
- [x] Implémentations par défaut choisies pour `SandboxProvider`, `BackendProvider`, `IntelligenceProvider`, `PaymentProvider` (`DECISIONS.md` D-3 à D-6)
- [x] Squelette de dépôt de code (backend `apps/api` NestJS, frontend `apps/web` Next.js, `packages/naminto-core`, `packages/providers/*`)
- [x] Naminto Core — squelette de coordination (`packages/naminto-core/src/core.ts`) + les 4 interfaces Provider (MVP), chacune avec un adaptateur par défaut : `intelligence-groq` (défaut depuis D-23, API compatible OpenAI), `intelligence-ollama` (2ᵉ adaptateur depuis D-23, local/gratuit, D-23), `intelligence-anthropic`/`intelligence-openai` (implémentés/testés, non câblés par défaut, D-5/D-23), `sandbox-e2b` (fournisseur nommé, D-8 — microVM Firecracker managé via E2B, session partagée par Plan depuis D-11, lève une erreur de config explicite sans `E2B_API_KEY`), `backend-selfhosted` (contrat Postgres/GoTrue/PostgREST, D-4, pas encore d'infra réelle), `payment-stub` (D-6, Billing hors MVP)
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
- [x] User Interface — chat en vraie interface de conversation, protégée par connexion et scopée à un projet sélectionné (`apps/web/app/page.tsx` + `AuthForm.tsx` + `ProjectPicker.tsx` + `Chat.tsx`, refonte D-24)
- [x] Design UI/UX présentable — Tailwind CSS v4, thème sombre (`DECISIONS.md` D-17)
- [x] Historique intégré au fil de conversation (bulles utilisateur/assistant, ordre chronologique) et fichiers consultables via un panneau replié par défaut — `GET /plan/:projectId/file`, `DECISIONS.md` D-19, refonte D-24
- [x] Chat en streaming — progression par étape en temps réel (`POST /plan` en SSE, `TaskProgressEvent`, `DECISIONS.md` D-21)
- [x] Sortie de commande en direct pendant une tâche en cours (`task_output`, `AgentRunContext.onOutput`, `DECISIONS.md` D-22)
- [x] Moteur IA Groq par défaut + Ollama en second adaptateur (`DECISIONS.md` D-23) — débloque une vérification bout en bout réelle dès qu'une `GROQ_API_KEY` est fournie
- [ ] Hors MVP (Phase 2+, voir D-2) : Design Agent, Architecture Agent, Research Agent, Deployment Agent en agents autonomes séparés ; Security System avancé ; Billing System ; Credit System ; Administration ; bascule thème clair/sombre ; édition/suppression de fichiers depuis l'UI ; corbeille/restauration après suppression de projet ; streaming token par token du texte brut du modèle ; reconnexion automatique du flux SSE ; limite/troncature de sortie très longue ; annulation d'une tâche en cours ; coloration stdout/stderr distincte ; switch de moteur IA par variable d'environnement au runtime

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
19. ~~Sortie de commande en direct pendant une tâche~~ — fait (D-22), vérifié par tests unitaires (le blocage crédit Anthropic empêchait une démonstration bout en bout d'une vraie tâche jusqu'à D-23).
20. ~~Moteur IA Groq par défaut + Ollama~~ — fait (D-23), vérifié par tests unitaires ; conditions réelles en attente d'une vraie `GROQ_API_KEY`.
21. ~~Refonte du chat en vraie interface de conversation~~ — fait (D-24), vérifié par 53 tests `apps/web` ; vérification visuelle en navigateur réel en attente d'une vraie `GROQ_API_KEY` pour observer un échange complet.
22. Dès qu'une `GROQ_API_KEY` réelle est fournie : vérifier tout le pipeline en conditions réelles (D-21/D-22/D-23/D-24 ensemble, jamais observé bout en bout jusqu'ici), et tester la connexion Google de bout en bout dès qu'un vrai client OAuth est créé — deux vérifications en conditions réelles manquantes, tout le reste est intégralement complet.

## Blocages / questions ouvertes

- ~~Accès au dépôt distant non débloqué~~ — résolu : authentification GitHub locale basculée sur le compte `namintoia-eng` (device-flow login), dépôt configuré pour toujours pousser avec ce compte.
- `E2B_API_KEY` configurée dans `.env` local (non commité) et **vérifiée en conditions réelles** : sandbox créé/détruit avec succès (voir historique de session pour le détail).
- ~~`ANTHROPIC_API_KEY` n'est pas reçue par le process `apps/api` en dev~~ — résolu (D-15) : `apps/api` charge désormais le `.env` racine via `dotenv`.
- `ANTHROPIC_API_KEY` configurée dans `.env` local (non commité), clé valide (authentification OK), mais **compte sans crédit** — Anthropic renvoie `"Your credit balance is too low to access the Anthropic API"` sur tout appel réel. Confirmé en testant directement contre l'API Anthropic (hors code Naminto). N'est plus le moteur par défaut depuis D-23, donc ne bloque plus `/plan` — reste documenté ici car `intelligence-anthropic` est toujours dans le dépôt et pourrait être recâblé par défaut plus tard.
- **Nouveau (D-23)** : `GROQ_API_KEY` non configurée — c'est désormais la clé qui bloque toute vérification réelle de `/plan` (Reasoning Engine échoue avant qu'aucune tâche ne démarre, mêmes symptômes que le blocage Anthropic précédent). L'utilisateur doit créer une clé sur console.groq.com et la coller dans `.env` pour débloquer une démo bout en bout complète (D-19 à D-24 n'ont encore jamais été vérifiés avec une vraie tâche IA). `OLLAMA_BASE_URL`/`OLLAMA_MODEL` non configurées non plus — Ollama n'est pas le moteur par défaut, donc ne bloque rien, mais nécessiterait une instance locale lancée (`ollama serve`) avec un modèle tiré pour être vérifié.
- `OPENAI_API_KEY`/`DATABASE_URL`/etc. toujours non configurées — attendu à ce stade.
- **Piège d'environnement (pas un blocage produit)** : l'ancien dépôt abandonné `D:\ADF\Naminto.AI` possède son propre `.claude/launch.json` avec une configuration `"web"` du même nom, sur le même port (3000). Si un process Next.js orphelin de ce dépôt reste vivant, l'outil de prévisualisation navigateur peut résoudre le mauvais `launch.json` et servir la mauvaise application. Repéré et résolu pendant la vérification de D-21 (`netstat -ano` sur le port 3000 → process orphelin tué → serveur `apps/web` du bon dépôt redémarré directement). Réflexe pour toute session future : si le navigateur affiche un comportement inattendu qui contredit le code source, vérifier `netstat -ano | grep :3000` avant de chercher un bug côté code.
- `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`AUTH_STATE_SECRET` non configurées — le bouton "Continuer avec Google" est câblé et vérifié avec des identifiants factices (redirection réelle vers Google atteinte, `state` CSRF validé) mais ne peut pas compléter un vrai flux avant que l'utilisateur crée un client OAuth dans Google Cloud Console (Credentials → OAuth Client ID → Web application → redirect URI exactement `http://localhost:3001/auth/google/callback`) et fournisse les vraies valeurs — même situation que `ANTHROPIC_API_KEY`/`E2B_API_KEY`, pas un blocage à résoudre proactivement.

## Comment mettre à jour ce fichier

À chaque fin de session : mettre à jour « Dernière mise à jour », cocher les cases nouvellement complètes, réviser « Prochaine étape recommandée », et ajouter toute nouvelle question ouverte. Toute décision structurante prise pendant la session doit en plus être ajoutée à `DECISIONS.md`.
