# DECISIONS.md — Journal des décisions d'architecture (ADR léger)

> On ajoute des entrées, on ne réécrit jamais le passé. Une décision annulée est actée par une nouvelle entrée qui référence l'ancienne, pas par une suppression.
> Format court : assez pour ne pas rejouer un débat déjà tranché, pas un roman.

## Gabarit à copier

```markdown
## D-<numéro> — <titre court> (<date>)

**Statut :** proposée / acceptée / annulée / remplacée par D-<numéro>

**Contexte :** pourquoi cette décision était nécessaire.

**Décision :** ce qui a été tranché, en une phrase claire.

**Alternatives envisagées :** liste courte, avec la raison du rejet.

**Conséquences :** ce que ça implique pour le reste du système (couplages, migrations, dette).
```

## Historique

### D-0 — Adoption du kit de pilotage IA (2026-08-21)

**Statut :** acceptée

**Contexte :** Le projet a besoin d'une base documentaire stable pour que tout agent IA (session après session, outil après outil) travaille avec le même contexte, les mêmes règles et le même vocabulaire, au lieu de redécouvrir le projet à chaque fois.

**Décision :** Mise en place du kit `CLAUDE.md` + `AGENTS.md` + `naminto-ops/` comme source unique de vérité pour le pilotage IA du dépôt.

**Alternatives envisagées :** Se reposer uniquement sur les instructions de projet de la plateforme de vibecoding (rejeté : non portable, pas versionné avec le code, invisible pour d'autres outils IA).

**Conséquences :** Toute règle de pilotage doit désormais vivre dans ce kit, pas ailleurs. Ce fichier doit être tenu à jour à chaque décision structurante future.

### D-1 — Orientation de stack technique basée sur l'étude des outils IA du marché (2026-08-21)

**Statut :** acceptée (orientation) — implémentation détaillée à trancher composant par composant

**Contexte :** Besoin d'un stack technique pour Naminto IA. L'utilisateur a explicitement demandé de s'appuyer sur les stacks des principaux outils de code IA existants (Cursor, Windsurf, Replit Agent, Bolt.new, v0, Devin, Lovable) pour concevoir un stack « surpuissant », sans que cela ne crée de dépendance obligatoire envers ces outils (voir `RULES.md`).

**Décision :** Adoption du stack détaillé dans `STACK.md`, notamment : TypeScript/NestJS/Next.js comme cœur applicatif avec Rust pour les composants critiques en performance ; microVMs type Firecracker comme cible d'isolation par défaut de l'Execution Engine/Sandbox (derrière une interface `SandboxProvider`) ; indexation de code par arbre de Merkle + embeddings pour le Memory System ; versionnement Git/snapshot de chaque action d'agent ; stack de sortie React/Vite + Postgres-Auth-Storage-Realtime (derrière une interface `BackendProvider`) comme défaut pour les applications générées pour les utilisateurs finaux.

**Alternatives envisagées :** Concevoir un stack sans référence au marché (rejeté : réinvente des problèmes déjà résolus à grande échelle, notamment sur le sandboxing sécurisé). Copier un outil précis (rejeté explicitement : violerait `RULES.md` — ces outils sont des références d'étude, jamais des fondations obligatoires).

**Conséquences :** Toute implémentation de l'Execution Engine, du Memory System ou du stack de sortie généré doit passer par les interfaces (`SandboxProvider`, `BackendProvider`, `IntelligenceProvider`, `PaymentProvider`) définies dans `STACK.md`. Les choix de fournisseurs précis derrière ces interfaces restent ouverts et doivent chacun faire l'objet d'une entrée `DECISIONS.md` dédiée au moment de leur implémentation.

### D-2 — Périmètre du MVP (2026-08-21)

**Statut :** acceptée

**Contexte :** L'architecture cible de Naminto IA (`CLAUDE.md` §6) est large. Construire les dix-huit modules avant toute démonstration retarderait indéfiniment la première validation utilisateur. Il fallait trancher un sous-ensemble minimal mais représentatif du pitch du produit (« une intention en langage naturel devient une application fonctionnelle et testée »).

**Décision :** Le MVP (Phase 1) inclut : **Naminto Core** (squelette de coordination + les quatre interfaces `SandboxProvider`/`BackendProvider`/`IntelligenceProvider`/`PaymentProvider`), le **Reasoning Engine** (application du gabarit `WORKFLOW.md`), un **Agent Orchestrator séquentiel** (pas encore parallèle), un seul agent pleinement implémenté — le **Coding Agent** — épaulé par des versions minimales du **Testing Agent** (tests générés automatiquement, pas de stratégie de couverture avancée) et du **Debug Agent** (boucle de correction bornée à 3 tentatives, voir `debug-agent.md`), l'**Execution Engine/Sandbox** avec un seul `SandboxProvider` branché, un **Memory System** minimal (persistance de l'état projet en base, pas encore de recherche sémantique complète), le **File System**, un **User System** minimal (authentification simple) et une **User Interface** minimale (chat d'intention + viewer de code/résultat en streaming).

Sont explicitement **hors MVP** : Design Agent, Architecture Agent, Research Agent et Deployment Agent en tant qu'agents autonomes séparés (leurs responsabilités sont temporairement absorbées par le Coding Agent et le Reasoning Engine) ; Security System avancé au-delà de l'auth de base et de l'isolation du sandbox ; Billing System, Credit System et Administration.

**Alternatives envisagées :** Construire tous les modules en parallèle avant la première démo (rejeté : risque élevé de ne jamais livrer une version testable — contraire au principe « ne jamais présenter un résultat non testé » de `WORKFLOW.md`). Ne construire qu'un prototype non modulaire pour aller vite (rejeté : contredit le principe d'architecture modulaire de `CLAUDE.md` §6 dès le premier jour).

**Conséquences :** `STATE.md` doit désormais suivre l'avancement du MVP tel que défini ici. Toute fonctionnalité hors de ce périmètre proposée avant la fin du MVP doit être signalée comme un écart à ce plan, pas implémentée silencieusement.

### D-3 — SandboxProvider par défaut : fournisseur managé au démarrage, migration auto-hébergée planifiée (2026-08-21)

**Statut :** acceptée

**Contexte :** `STACK.md` a fixé les microVMs type Firecracker comme cible d'isolation, mais restait ouvert entre auto-hébergement et fournisseur managé. Faire fonctionner soi-même une flotte de microVMs (réseau, sécurité, montée en charge) dès le MVP est une charge opérationnelle lourde qui n'apporte aucune valeur produit tant que le volume est faible.

**Décision :** Le MVP démarre avec un **fournisseur de sandboxing managé compatible microVM/Firecracker** derrière `SandboxProvider`. Déclencheur explicite de migration vers un auto-hébergement : lorsque le coût mensuel du sandboxing managé dépasse le coût estimé d'une petite flotte auto-hébergée (généralement autour de quelques milliers de sessions d'exécution actives par mois), ou lorsqu'une contrainte de conformité/donnée impose l'auto-hébergement.

**Alternatives envisagées :** Auto-hébergement dès le MVP (rejeté pour l'instant : charge opérationnelle disproportionnée au stade actuel — voir `STATE.md` Phase 0). Conteneurs Docker+gVisor seuls sans microVM (rejeté comme défaut : isolation plus faible pour de l'exécution de code non fiable par nature).

**Conséquences :** Le choix du fournisseur managé précis (nom, contrat) est un détail d'implémentation à documenter dans `naminto-ops/agents/deployment-agent.md` ou un futur `INFRA.md` au moment de l'implémentation, sans nouvelle entrée `DECISIONS.md` nécessaire tant que l'interface `SandboxProvider` reste stable. Le seuil de migration doit être revu dans `STATE.md` à chaque revue trimestrielle une fois en production.

### D-4 — BackendProvider par défaut : brique open-source auto-hébergée (2026-08-21)

**Statut :** acceptée

**Contexte :** `STACK.md` recommandait un stack de sortie type Postgres + Auth + Storage + Realtime pour les applications générées (inspiré de Lovable/Bolt), sans trancher entre un SaaS propriétaire managé et les briques open-source équivalentes auto-hébergées.

**Décision :** L'implémentation par défaut de `BackendProvider` utilise les **briques open-source auto-hébergées** (moteur Postgres + service d'authentification type GoTrue + API auto-générée type PostgREST + stockage d'objets + canal temps réel), déployées par Naminto lui-même pour chaque application générée, plutôt qu'un service SaaS propriétaire tiers.

**Alternatives envisagées :** Dépendre d'un SaaS propriétaire managé unique (rejeté : recrée exactement le type de dépendance structurelle non substituable interdite par `RULES.md`, cette fois côté applications générées plutôt que côté Naminto Core). Construire un backend framework maison from scratch (rejeté : réinvente des briques déjà matures et éprouvées à grande échelle, sans bénéfice pour l'utilisateur final).

**Conséquences :** L'utilisateur final d'une application générée par Naminto reste maître de ses données et n'est jamais verrouillé chez un fournisseur SaaS imposé par Naminto. Le Coding Agent doit générer les policies de sécurité au niveau base de données (Row Level Security ou équivalent) comme couche de sécurité par défaut, conformément au pattern étudié chez Lovable (`STACK.md`).

### D-5 — IntelligenceProvider : deux adaptateurs dès le MVP pour valider l'interface (2026-08-21)

**Statut :** acceptée

**Contexte :** Une interface `IntelligenceProvider` avec un seul fournisseur branché derrière n'est jamais réellement testée comme abstraction : le risque est de découvrir, au moment d'en ajouter un second fournisseur, que l'interface a été conçue en calquant les spécificités du premier — violant `RULES.md` de fait, même avec une interface qui existe sur le papier.

**Décision :** Le MVP implémente **deux adaptateurs `IntelligenceProvider` dès le départ** (l'un basé sur Claude/Anthropic, l'autre sur un fournisseur concurrent), avec le premier comme implémentation par défaut pour ses performances reconnues en génération de code. Aucune fonctionnalité de Naminto Core ne doit dépendre d'une capacité présente chez un seul des deux adaptateurs.

**Alternatives envisagées :** Un seul adaptateur au MVP, le second « plus tard » (rejeté : l'expérience de nombreux projets montre que « plus tard » découvre souvent une interface mal conçue une fois qu'il est coûteux de la corriger).

**Conséquences :** Le Coding Agent doit être testé contre les deux adaptateurs avant qu'une fonctionnalité de Naminto Core soit considérée comme terminée (voir Definition of Done, `coding-agent.md`). Le choix de fournisseur par défaut est révisable sans impact sur Naminto Core.

### D-6 — PaymentProvider par défaut : prestataire standard du marché (2026-08-21)

**Statut :** acceptée

**Contexte :** Le Billing System et le Credit System sont hors périmètre du MVP (D-2), mais l'interface `PaymentProvider` doit être définie tôt pour ne pas être contournée plus tard par un couplage direct dans le code.

**Décision :** Implémentation par défaut de `PaymentProvider` sur un prestataire de paiement standard du marché (couverture internationale, conformité PCI déléguée) — le même choix que celui observé chez plusieurs des outils étudiés dans `STACK.md`. Le nom du prestataire précis est un détail d'implémentation à fixer au moment de construire le Billing System (Phase 2), sans remettre en cause cette décision.

**Alternatives envisagées :** Gérer soi-même les données de carte bancaire (rejeté catégoriquement : charge de conformité disproportionnée et risque de sécurité inutile).

**Conséquences :** Aucune donnée de paiement sensible ne transite ou n'est stockée par Naminto Core — conforme à `RULES.md` sur les secrets et données sensibles.

### D-7 — Gestionnaire de paquets : npm workspaces au lieu de pnpm (2026-08-21)

**Statut :** acceptée

**Contexte :** `STACK.md` recommandait pnpm workspaces + Turborepo/Nx pour l'organisation du dépôt. À l'initialisation concrète du monorepo, `corepack enable pnpm` échoue avec une erreur `EPERM` dans cet environnement Windows (écriture dans `C:\Program Files\nodejs\pnpx` nécessitant des droits admin non disponibles ici). C'est une contrainte d'environnement, pas un choix de conception.

**Décision :** Le monorepo utilise **npm workspaces** à la place de pnpm, avec **Turborepo** conservé tel quel pour l'orchestration des tâches (agnostique du gestionnaire de paquets, donc aucun autre impact sur `STACK.md`).

**Alternatives envisagées :** Élever les permissions pour installer pnpm (rejeté : pas d'accès admin sur cette machine, pas de raison de bloquer le démarrage du projet pour ça). Yarn (rejeté : n'apporte rien de plus que npm ici, complexité supplémentaire sans bénéfice).

**Conséquences :** Toutes les commandes d'installation/exécution documentées utilisent `npm`, pas `pnpm`/`yarn`. Si un futur environnement a pnpm disponible et qu'il y a une raison de basculer (installs plus rapides, isolation plus stricte des dépendances), cette décision devra être révisée explicitement, pas mélangée silencieusement.

### D-8 — SandboxProvider : fournisseur nommé, E2B (2026-08-21)

**Statut :** acceptée

**Contexte :** D-3 avait acté la catégorie (fournisseur managé compatible microVM/Firecracker) sans nommer de fournisseur précis. Étude comparative menée (E2B, Daytona, Modal, Vercel Sandbox) sur isolation, démarrage à froid, support TypeScript, tarification et adéquation avec un Coding Agent MVP sans besoin GPU.

**Décision :** `SandboxProvider` est branché sur **E2B** (`packages/providers/sandbox-e2b`) : isolation microVM Firecracker (noyau dédié par sandbox, correspond exactement à la cible de `STACK.md`), SDK TypeScript/ESM natif (`e2b`, cœur open-source MIT), palier gratuit (crédit initial + 20 sandbox simultanés/sessions 1h) suffisant pour développer et tester le Coding Agent avant tout coût réel. Un sandbox E2B est créé puis détruit à chaque exécution (jamais réutilisé entre requêtes), pour qu'un run raté ne puisse pas laisser d'état résiduel affecter le suivant.

**Alternatives envisagées :** Daytona (rejeté comme défaut : isolation gVisor/conteneur, pas microVM — ne correspond pas à la cible déjà actée dans `STACK.md`, et bloque le GPU passthrough si jamais nécessaire plus tard). Modal (rejeté : tarifié pour des charges GPU, plus de 10× le coût vCPU d'E2B, alors que le Coding Agent MVP n'a besoin d'aucun GPU).

**Conséquences :** `apps/api` câble désormais `E2bSandboxProvider` comme `SandboxProvider` par défaut de `NamintoCore`, à la place de `sandbox-stub`. Sans `E2B_API_KEY` configurée dans `.env`, l'adaptateur lève une erreur de configuration explicite au premier appel — aucun appel réseau réel tant qu'une clé n'est fournie (même garde-fou que les adaptateurs `IntelligenceProvider`). Le compte E2B et sa clé restent à créer par l'utilisateur (`naminto-ops/STATE.md` § Blocages).

### D-9 — Testing/Debug Agent : base partagée `agent-kit`, retry borné dans l'Agent Orchestrator (2026-08-21)

**Statut :** acceptée

**Contexte :** Ajout du Testing Agent et du Debug Agent (MVP, `DECISIONS.md` D-2). Les trois agents (Coding, Testing, Debug) suivent exactement la même forme — transformer une instruction en script shell via un `IntelligenceProvider`, l'exécuter dans un `SandboxProvider`, décider du succès sur le seul code de sortie réel. Dupliquer cette logique une troisième fois (règle des trois occurrences) aurait été une dette évitable. Par ailleurs, `debug-agent.md` exige une boucle de correction **bornée à 3 tentatives** qui se déclenche sur un échec, pas une tâche planifiée à l'avance — ce comportement doit vivre dans l'orchestrateur, pas dans un agent isolé.

**Décision :** Extraction de la logique partagée dans un nouveau paquet `packages/agent-kit` (`ShellScriptAgent`, classe abstraite implémentant `Agent`) ; `CodingAgent`, `TestingAgent` et `DebugAgent` n'en héritent que le rôle et le prompt système. Cette logique **ne vit pas dans `packages/naminto-core`** — `architecture-agent.md` interdit explicitement de faire grossir Naminto Core avec de la logique métier spécifique à un agent. `SequentialAgentOrchestrator` gagne une boucle de retry bornée : si une tâche échoue et qu'un agent `debug` est enregistré, il est invoqué jusqu'à `maxDebugAttempts` fois (3 par défaut, configurable) avant d'abandonner et de remonter l'historique complet des tentatives — sans agent `debug` enregistré, le comportement est inchangé (arrêt immédiat).

**Alternatives envisagées :** Dupliquer la logique dans chaque agent (rejeté : dette de maintenance, la règle des trois occurrences est atteinte). Faire de `Debug Agent` une tâche ordinaire du `Plan` produite par le Reasoning Engine (rejeté : le Reasoning Engine planifie *avant* l'exécution, il ne peut pas savoir à l'avance qu'une tâche va échouer — la boucle de correction doit être réactive, donc portée par l'orchestrateur).

**Conséquences :** `apps/api` enregistre désormais les trois agents (`coding`, `testing`, `debug`) auprès de l'`AgentOrchestrator`. Tout futur agent au même patron (script shell + sandbox) doit étendre `ShellScriptAgent` plutôt que ré-implémenter `Agent` depuis zéro.

### D-10 — Memory System : persistance fichier (`FileMemoryStore`), pas de base de données au MVP (2026-08-21)

**Statut :** acceptée

**Contexte :** Ajout du Memory System (MVP, `DECISIONS.md` D-2 : "persistance d'état simple, pas encore de recherche sémantique complète"). Aucune infrastructure de base de données réelle n'existe encore (`BackendProvider`/`DATABASE_URL` non configurés, D-4) — attendre cette infra aurait bloqué le Memory System sur la même dépendance externe que `BackendProvider`, sans raison : ce sont deux composants distincts (le Memory System persiste le contexte de *Naminto lui-même*, le `BackendProvider` provisionne le backend des applications *générées pour l'utilisateur final*).

**Décision :** Nouveau contrat `MemoryStore`/`ConversationTurn` dans `packages/naminto-core` (persiste un échange complet : intention → `Plan` → `OrchestrationResult`, horodaté). Implémentation par défaut `FileMemoryStore` (`packages/memory-system`) : un fichier JSON par projet sous un répertoire local (`MEMORY_STORE_DIR`, défaut `.naminto/memory/`, exclu de git), écritures sérialisées par projet (file d'attente en mémoire) pour éviter une course lecture-modification-écriture entre deux sauvegardes quasi simultanées du même projet — protection limitée à un seul processus, pas multi-instance (une vraie base de données serait nécessaire pour ça).

**Alternatives envisagées :** Attendre une vraie base de données (`BackendProvider`/D-4) avant de commencer le Memory System (rejeté : blocage évitable sur une dépendance externe non liée, alors qu'une persistance simple suffisante pour le MVP peut fonctionner immédiatement sans aucun compte ni infrastructure). Persistance en mémoire uniquement, sans fichier (rejeté : perdrait tout l'historique à chaque redémarrage du serveur, ne remplirait pas la promesse "persistance entre sessions" du `GLOSSARY.md`).

**Conséquences :** `apps/api` : `POST /plan` accepte un `projectId` optionnel (`"default"` si absent) et sauvegarde chaque échange ; nouvel endpoint `GET /plan/:projectId` relit l'historique. Une future migration vers une vraie base de données (une fois `BackendProvider`/D-4 réellement provisionné) n'implique de changer que l'implémentation `MemoryStore` branchée dans `apps/api`, pas le contrat ni les appelants — cohérent avec le principe d'interface stable de `RULES.md`.

### D-11 — SandboxProvider : session partagée par Plan, pas un sandbox par commande (2026-08-21)

**Statut :** acceptée

**Contexte :** En commençant le File System, audit du `SandboxProvider` existant (D-3/D-8) : chaque appel `execute()` créait puis détruisait un sandbox E2B complet. Conséquence concrète non testée jusqu'ici : dans un `Plan` à plusieurs tâches (coding → testing → debug, le cas normal), chaque tâche démarrait dans un sandbox **vide** — le Testing Agent ne pouvait pas voir les fichiers écrits par le Coding Agent qui vient de s'exécuter juste avant. Le pipeline multi-tâches était donc cassé silencieusement (jamais démontré avec plus d'une tâche jusqu'ici). Une vraie couche File System n'a de sens que si un espace de fichiers survit au moins le temps d'un `Plan`.

**Décision :** `SandboxProvider.execute(request)` remplacé par `SandboxProvider.createSession(projectId): Promise<SandboxSession>`, où `SandboxSession` reste vivante et expose `execute()`/`close()` pour plusieurs commandes. `SequentialAgentOrchestrator` possède désormais le cycle de vie de la session : une session créée au début de `run(plan, projectId)`, partagée par tous les agents de ce run via un nouveau `AgentRunContext`, fermée dans un `finally` (succès, échec, ou exception). `E2bSandboxProvider` : un seul sandbox E2B créé par session (au lieu d'un par commande), tué explicitement à `close()`.

**Bug additionnel trouvé en vérifiant ce correctif en conditions réelles (pas en mock) :** l'ancien code joignait `[command, ...args]` par de simples espaces avant de les passer à `sandbox.commands.run()` — qui réinterprète cette chaîne comme une ligne de commande shell. Pour un script généré contenant des guillemets ou une redirection (`echo 'x' > fichier`), ce ré-assemblage naïf corrompait silencieusement le script (la redirection s'appliquait au mauvais processus, un test réel a produit un fichier contenant `"\n"` au lieu du contenu attendu). Corrigé par un échappement shell POSIX standard (guillemets simples, `'` interne échappé en `'\''`) de chaque argument avant assemblage — vérifié à nouveau en conditions réelles après correction.

**Alternatives envisagées :** Garder un sandbox par commande et faire porter la persistance par un futur File System qui re-synchronise les fichiers entre chaque appel (rejeté : complexité et latence inutiles — E2B supporte nativement des sessions longues, autant s'en servir directement). Laisser le bug de sandbox isolé de côté et construire le File System à côté (option proposée à l'utilisateur, explicitement refusée en faveur de la correction d'abord).

**Conséquences :** `Agent.run(task, context)` prend désormais un `AgentRunContext` contenant la session — tout agent doit l'utiliser plutôt que garder sa propre référence sandbox (les constructeurs `CodingAgent`/`TestingAgent`/`DebugAgent` ne prennent d'ailleurs plus de `SandboxProvider` du tout, seulement l'`IntelligenceProvider`). `AgentOrchestrator.run()` prend désormais un `projectId` en second paramètre. Le File System (prochaine étape) peut maintenant capturer un état de fichiers cohérent à la fin d'un `Plan`, puisque toutes les tâches ont réellement partagé le même espace.

### D-12 — File System : capture des fichiers du sandbox à la fin d'un Plan, remplacement à chaque run (2026-08-21)

**Statut :** acceptée

**Contexte :** Le sandbox partagé (D-11) fait survivre les fichiers le temps d'un `Plan`, mais le sandbox lui-même est détruit dans le `finally` de l'orchestrateur une fois le run terminé — sans capture explicite, tout ce que les agents ont écrit disparaît quand même. Le File System (MVP, `GLOSSARY.md`) doit exister pour que le travail produit survive au-delà d'une exécution.

**Décision :** Nouveau contrat `FileSystem`/`ProjectFile` dans `packages/naminto-core`, plus une constante partagée `PROJECT_WORKING_DIRECTORY` (`/home/user/project`) que `ShellScriptAgent` utilise comme répertoire de travail (avec un `mkdir -p` idempotent avant chaque tâche) et que `SequentialAgentOrchestrator` relit à la fin du run. `SandboxSession` gagne `listFiles()`/`readFile()`. `SequentialAgentOrchestrator.run()` liste et lit tous les fichiers du sandbox **avant** de le fermer (dans le `finally`, avant `session.close()`), et les sauvegarde via `FileSystem.saveProjectFiles()` — capture faite même si le plan échoue ou si un agent lève une exception (seule une erreur de capture elle-même fait échouer tout le run, pour ne jamais prétendre silencieusement avoir conservé des fichiers qui ne l'ont pas été). Implémentation par défaut `LocalFileSystem` (`packages/file-system`) : un répertoire local par projet, protection anti-traversée de chemin (`../`), `saveProjectFiles` **remplace** l'instantané précédent plutôt que de fusionner — cohérent avec le fait qu'un sandbox ne reprend pas encore l'état d'un run précédent (chaque `Plan` démarre d'un sandbox vide, donc chaque capture représente fidèlement "ce que ce run a produit", pas un historique cumulé).

**Bug trouvé en vérifiant contre un vrai sandbox E2B :** la documentation SDK consultée indiquait `depth: -1` pour un listing récursif illimité ; le SDK réellement installé (`e2b@2.45.0`) rejette toute valeur `depth < 1` (`InvalidArgumentError`). Corrigé avec une profondeur finie généreuse (`depth: 100`, largement suffisante pour l'arborescence d'un projet généré) — la documentation en ligne référençait une version différente du SDK que celle réellement installée.

**Alternatives envisagées :** Capturer les fichiers après chaque tâche plutôt qu'une seule fois à la fin du `Plan` (rejeté pour le MVP : plus d'appels réseau vers E2B sans bénéfice clair tant qu'il n'y a pas de consommateur pour un état intermédiaire). Fusionner les instantanés entre runs successifs (rejeté : suppose une continuité de session qui n'existe pas encore — mentir sur la persistance serait pire que d'assumer clairement la limite actuelle).

**Conséquences :** `apps/api` : nouvel endpoint `GET /plan/:projectId/files` liste les fichiers capturés. Le jour où les sessions sandbox pourront reprendre un état antérieur (hors scope actuel), `saveProjectFiles` en mode "remplacement" devra être revisité pour éviter de perdre des fichiers d'un run précédent que le nouveau run n'a pas touchés.

### D-13 — User System : compte simple fichier, pas encore OAuth2/OIDC (2026-08-21)

**Statut :** acceptée

**Contexte :** Dernière brique MVP listée en `DECISIONS.md` D-2 : "User System minimal (authentification simple)". `STACK.md` visait OAuth2/OIDC + JWT, mais aucune infrastructure d'identité externe n'est provisionnée — même limite que `BackendProvider` (D-4). L'utilisateur a confirmé un périmètre borné : un module autonome, testé et vérifié en conditions réelles, **sans** brancher l'authentification sur `/plan` ni sur le chat pour l'instant (chantier séparé, décidé plus tard).

**Décision :** Nouveau contrat `UserSystem`/`User`/`Session` dans `packages/naminto-core`. Implémentation par défaut `LocalUserSystem` (`packages/user-system`), même patron fichier que `FileMemoryStore`/`LocalFileSystem` : comptes et sessions dans `.naminto/users/{users,sessions}.json`, écritures sérialisées par une file d'attente en mémoire. Mots de passe hashés avec `node:crypto` **scrypt** (sel aléatoire par utilisateur, jamais stocké en clair) — pas de dépendance externe (bcrypt). Jetons de session **opaques** (`randomUUID()`), pas de JWT auto-signé — évite les pièges classiques d'une implémentation JWT maison pour un MVP ; expiration à 7 jours. `authenticate()` renvoie le même message générique pour "email inconnu" et "mauvais mot de passe" (pas d'énumération d'utilisateurs), et compare les hashes avec `crypto.timingSafeEqual`. Endpoints `apps/api` : `POST /auth/register`, `POST /auth/login`, `GET /auth/me` — `/plan` reste inchangé, toujours accessible sans compte.

**Alternatives envisagées :** JWT auto-signé plutôt que jeton opaque (rejeté pour le MVP : un JWT maison ajoute une surface d'erreurs classiques — vérification d'algorithme, expiration, révocation — sans bénéfice réel tant qu'il n'y a qu'un seul serveur API à consulter la session ; un jeton opaque vérifié côté serveur est plus simple et au moins aussi sûr ici). Attendre une vraie infra OAuth2/OIDC avant de commencer (rejeté : même raisonnement que D-10/D-12, ne pas bloquer le MVP sur une infra non provisionnée).

**Conséquences :** Le contrat `UserSystem` reste stable pour un futur fournisseur OAuth2/OIDC réel — seule l'implémentation change le jour venu. Aucune association projet ↔ utilisateur pour l'instant (`/plan` continue d'utiliser un `projectId` libre, pas un compte) ; brancher l'auth sur `/plan` et ajouter un écran de connexion sur `apps/web` restent des chantiers explicitement hors de cette décision.

### D-14 — Authentification branchée sur /plan, isolation par compte (2026-08-21)

**Statut :** acceptée

**Contexte :** Le User System (D-13) existait comme module autonome, non branché. L'utilisateur a demandé de le brancher réellement ("Il faut brancher l'authentification"). Question clarifiée avec l'utilisateur : isolation par compte — sans elle, exiger une connexion aurait été un faux sentiment de sécurité (un utilisateur connecté aurait pu lire l'historique/les fichiers d'un autre en devinant le même `projectId`).

**Décision :** `apps/api/src/auth/session-auth.guard.ts` — `SessionAuthGuard implements CanActivate` : lit l'en-tête `Authorization`, appelle `UserSystem.verifySession(token)`, attache l'utilisateur résolu à `request.user` (401 sinon). `@CurrentUser()` (`current-user.decorator.ts`) lit cet utilisateur dans les contrôleurs. `GET /auth/me` refactorisé pour utiliser ce garde au lieu de reparser le jeton lui-même. `PlanController` porte désormais `@UseGuards(SessionAuthGuard)` sur les trois routes (`POST /plan`, `GET /plan/:projectId`, `GET /plan/:projectId/files`) ; chacune calcule en interne une clé scopée `` `${user.id}:${projectId}` `` utilisée pour tous les appels internes (orchestrateur, `MemoryStore`, `FileSystem`) — la réponse HTTP continue d'exposer le `projectId` choisi par le client, pas la version préfixée, pour ne rien changer côté UI. `apps/web` découpé en trois : `AuthForm.tsx` (connexion/inscription, l'inscription enchaîne automatiquement la connexion), `Chat.tsx` (logique existante + en-tête `Authorization: Bearer <token>` + bouton de déconnexion), `page.tsx` (coquille qui vérifie un jeton `localStorage` via `GET /auth/me` au montage et bascule entre les deux).

**Vérification en conditions réelles (pas seulement en mock) :** serveur API démarré, `curl POST /plan` sans jeton → `401` confirmé sur les trois routes ; `register` → `login` → `GET /auth/me` avec jeton → utilisateur retourné ; navigateur réel — inscription → connexion automatique → chat affiché → session survit à un rechargement de page (revérifiée via `/auth/me`) → déconnexion → jeton effacé du `localStorage` → retour à l'écran de connexion. `POST /plan` authentifié échoue en aval avec `ANTHROPIC_API_KEY is not configured` malgré une clé présente dans `.env` racine — limité au chargement d'environnement de `apps/api` en dev, sans rapport avec le garde d'authentification (qui a laissé passer la requête avant d'échouer plus loin) ; noté comme point à corriger séparément, hors périmètre de cette décision.

**Alternatives envisagées :** Garder `/plan` accessible sans compte et n'ajouter la vérification que côté UI (rejeté : une vérification uniquement côté client n'est pas une vraie protection, contredit `RULES.md`/permission à chaque étape). Un système de projets nommés par utilisateur (liste, renommage, etc.) pour l'isolation (rejeté pour l'instant : le préfixage interne `userId:projectId` suffit à empêcher la fuite de données entre comptes sans construire tout un Project System non demandé).

**Conséquences :** Le flux anonyme démontré jusqu'ici (`POST /plan` sans compte) n'existe plus — un compte est désormais obligatoire pour tout le pipeline plan/chat. Le chargement de `ANTHROPIC_API_KEY` dans `apps/api` reste à corriger avant qu'une démo `/plan` bout-en-bout complète soit possible. Pas de vrai "Project System" (projets nommés, listés, renommables par utilisateur) — hors scope, à décider plus tard.

### D-15 — apps/api charge le .env racine explicitement via dotenv (2026-08-21)

**Statut :** acceptée

**Contexte :** Découvert en vérifiant D-14 en conditions réelles : `POST /plan` authentifié échouait avec `ANTHROPIC_API_KEY is not configured` alors que la clé est bien présente dans le `.env` racine (`.env.example` documente ce fichier comme source unique de vérité pour tous les providers). Cause : NestJS/`nest start` ne charge aucun fichier `.env` par défaut — contrairement à Next.js (`apps/web`) qui charge automatiquement `apps/web/.env.local`. Aucun `dotenv`/`ConfigModule` n'avait jamais été câblé dans `apps/api` ; les vérifications précédentes de `E2B_API_KEY`/`ANTHROPIC_API_KEY` avaient dû passer par des variables d'environnement exportées manuellement dans le shell, jamais par le vrai flux `npm run dev`.

**Décision :** `apps/api/src/main.ts` charge désormais explicitement le `.env` racine via `dotenv` (`config({ path: resolve(__dirname, '../../../.env') })`), en tout premier — avant l'import d'`AppModule` — puisque les providers (`AnthropicIntelligenceProvider`, `E2bSandboxProvider`, etc.) lisent `process.env` dans leur constructeur, invoqué par Nest dès l'instanciation du module. `dotenv` ajouté comme dépendance directe de `apps/api` (pas `@nestjs/config` : un seul fichier à charger, pas de validation de schéma nécessaire pour l'instant — cohérent avec le principe de ne pas ajouter de dépendance non justifiée).

**Vérification en conditions réelles :** log de démarrage confirme `injected env (10) from ..\..\.env` ; `POST /plan` authentifié échoue maintenant avec `AnthropicIntelligenceProvider: request failed with status 400` (un vrai appel réseau part avec la clé) au lieu de `ANTHROPIC_API_KEY is not configured` ; confirmé en appelant directement l'API Anthropic avec la même clé que la cause réelle est bien le blocage crédit déjà connu (`"Your credit balance is too low..."`), pas un problème de configuration.

**Alternatives envisagées :** Dupliquer un `.env` local dans `apps/api/` (comme `apps/web/.env.local` le fait pour une seule valeur publique) — rejeté : dupliquer de vrais secrets (clés API) dans plusieurs fichiers non commités augmente le risque d'incohérence/désynchronisation sans bénéfice, alors qu'un seul fichier racine reste la source de vérité documentée par `.env.example`.

**Conséquences :** Le blocage crédit Anthropic (déjà documenté, non résolu par choix de l'utilisateur) reste la seule chose empêchant une démo `/plan` bout-en-bout complète.

### D-16 — Project System : projets nommés par utilisateur, /plan scoped à un projet réel (2026-08-22)

**Statut :** acceptée

**Contexte :** `/plan` utilisait un `projectId` libre choisi par le client (`DEFAULT_PROJECT_ID = 'default'` si absent), avec pour seule isolation un préfixage `userId:projectId` (D-14) — aucune vérification d'existence ou de propriété. `apps/web/app/Chat.tsx` n'envoyait même pas de `projectId`. `GLOSSARY.md` définissait déjà le Project System comme composant prévu ; D-14 avait explicitement reporté ce chantier. L'utilisateur a choisi ce chantier une fois le périmètre MVP (D-2) et l'authentification (D-14/D-15) complets et vérifiés.

**Décision :** Nouveau contrat `Project`/`ProjectSystem` (`packages/naminto-core/src/project-system.ts`) : `createProject`, `listProjects`, `getProject` — `getProject` renvoie `null` aussi bien pour "n'existe pas" que pour "n'appartient pas à cet utilisateur" (pas d'énumération, même philosophie que `UserSystem.authenticate`, D-13). Implémentation par défaut `LocalProjectSystem` (`packages/project-system`), même patron fichier que `LocalUserSystem` (`.naminto/projects/projects.json`, file d'attente `runExclusive`, IDs `randomUUID()`). Nouveaux endpoints `POST /projects` / `GET /projects` (`apps/api/src/project/`). `PlanController` résout désormais chaque `projectId` via `ProjectSystem.getProject(user.id, projectId)` avant tout accès — `404` (pas 403) si `null`, pour les trois routes (`POST /plan`, `GET /plan/:projectId`, `GET /plan/:projectId/files`) ; `projectId` devient obligatoire dans `POST /plan` (plus de valeur par défaut implicite). Le préfixage `scopeProjectId` (D-14) est **conservé** en défense en profondeur au-dessus de cette vérification réelle, pas remplacé. Côté `apps/web`, nouvel écran `ProjectPicker.tsx` (liste + création, sélection automatique après création comme `AuthForm` enchaîne inscription→connexion) inséré entre la connexion et le chat ; le `projectId` sélectionné est persisté dans `localStorage` (`naminto_project_id`) pour survivre à un rechargement de page, comme le jeton de session (D-14).

**Vérification en conditions réelles :** deux comptes de test via curl — `GET /projects` sans jeton → 401 ; `POST /projects` nom vide → 400 ; `POST /plan` sans `projectId` → 400, `projectId` inconnu → 404, projet d'un **autre** compte → 404 (preuve d'isolation réelle, pas juste du préfixage) ; projet possédé → passe la validation et échoue en aval sur le blocage crédit Anthropic déjà connu (D-15), pas un 400/404. Navigateur réel : inscription → écran de sélection de projet (pas le chat directement) → création → entrée automatique dans le chat → "← Projets" → retour à la liste (toujours connecté) → création d'un second projet → **rechargement de page → le projet reste sélectionné** (pas de retour au picker) → déconnexion → les deux clés `localStorage` (jeton et projet) sont effacées.

**Alternatives envisagées :** Renommage/suppression de projets, unicité du nom de projet — non demandés, non construits (l'identité réelle reste l'id, deux projets peuvent porter le même nom). Ne pas persister le projet sélectionné au rechargement — rejeté : aurait régressé par rapport à D-14, qui avait explicitement testé et valorisé la survie de session au rechargement.

**Conséquences :** Changement cassant sur `POST /plan` : l'ancien projet implicite `"default"` (et tout ce qui avait été écrit dessous en dev) devient définitivement inaccessible — acceptable, stockage local de développement uniquement, aucune vraie donnée utilisateur en jeu. La visualisation de l'historique/des fichiers d'un projet dans l'UI reste une lacune préexistante non traitée ici (les endpoints existent côté serveur depuis D-12, `Chat.tsx` ne les a jamais appelés).

### D-17 — Refonte UI/UX : Tailwind CSS, thème sombre (2026-08-22)

**Statut :** acceptée

**Contexte :** L'interface (`AuthForm.tsx`, `ProjectPicker.tsx`, `Chat.tsx`, `page.tsx`) était fonctionnelle mais visuellement brute (styles inline ad hoc, police système, aucune identité visuelle). L'utilisateur a demandé une refonte pour que l'IA soit « présentable ». Direction confirmée avec l'utilisateur : thème sombre façon outil dev (Linear/Vercel/Anthropic).

**Décision :** Ajout de Tailwind CSS v4 à `apps/web` (`tailwindcss`, `@tailwindcss/postcss`, intégration CSS-first sans `tailwind.config.js`) — reprend un choix déjà acté dans `STACK.md` ("Frontend généré : ... Tailwind CSS ..."), appliqué ici à l'app Naminto elle-même, pas seulement aux apps qu'elle génère. Palette : tons neutres `zinc` (fond/bordures/texte), accent `violet`, `emerald`/`red` pour succès/échec — palettes Tailwind standard, aucune couleur custom à maintenir. Thème unique (pas de bascule clair/sombre), pas de logo image (wordmark texte + un petit carré violet en guise de marque). Les quatre écrans (connexion, sélection de projet, chat, chargement) ont été restylés sans toucher à leur logique : mêmes props, mêmes machines à états, mêmes appels `fetch`. Chaque placeholder/rôle/texte interrogé par les tests (`email@exemple.com`, `Nom du projet`, boutons `Se connecter`/`S'inscrire`/`Créer`/`Envoyer`, `role="alert"`, heading exact `Naminto IA` sur l'écran de connexion, etc.) a été recensé par grep avant modification et préservé — zéro modification nécessaire dans les 4 fichiers de test.

**Vérification :** `npm run check` intégralement vert sans toucher aux tests (35/35 lint+typecheck+test, 19/19 build). Navigateur réel : connexion → sélection de projet → chat → envoi d'un message (échoue comme attendu sur le blocage crédit Anthropic déjà connu, l'alerte d'erreur s'affiche correctement dans le nouveau style) → déconnexion → retour à l'écran de connexion, les trois écrans capturés en captures d'écran.

**Alternatives envisagées :** CSS modules/styled-components (rejeté : Tailwind est déjà le choix retenu dans `STACK.md` pour ce type d'interface, pas de raison d'introduire un second système). Bascule thème clair/sombre (rejeté : non demandé, ajoute une surface de test/maintenance pour un gain non demandé).

**Conséquences :** Aucune régression fonctionnelle — uniquement visuel. Un bug de cache Next.js déjà rencontré une fois cette session (`.next` corrompu après changement de configuration pendant qu'un serveur dev tournait, erreurs `Cannot find module './NNN.js'`) a de nouveau été rencontré pendant la vérification ; résolu par `rm -rf apps/web/.next` + redémarrage propre — pas un bug du code livré, juste un artefact de dev à surveiller après tout changement de config Next.js/PostCSS pendant qu'un serveur tourne.

### D-18 — Connexion Google, bouton direct : `UserSystem` gagne `authenticateExternal` (2026-08-22)

**Statut :** acceptée

**Contexte :** L'utilisateur a demandé un bouton "Continuer avec Google" fonctionnel. D-13 avait explicitement conçu `UserSystem` pour rester stable "pour un futur fournisseur OAuth2/OIDC réel — seule l'implémentation change le jour venu" : c'est ce chantier qui le concrétise, Google étant le premier fournisseur.

**Décision :** Contrat étendu (`packages/naminto-core/src/user-system.ts`) : `ExternalIdentity { provider, externalId, email }` + `UserSystem.authenticateExternal(identity)`. Contrat d'appel documenté explicitement : l'appelant ne doit construire cet objet qu'après que le fournisseur a confirmé la propriété de l'email — `UserSystem` fait une confiance totale à cet email, aucune revérification. Toute la mécanique spécifique à Google (`apps/api/src/auth/google-oauth.service.ts`) vit dans `apps/api`, pas dans `packages/naminto-core` (RULES.md : le contrat reste vendor-neutre) — même niveau que `SessionAuthGuard`. `LocalUserSystem.authenticateExternal` (`packages/user-system`) : email non trouvé → nouveau compte sans mot de passe (`passwordHash`/`passwordSalt` désormais optionnels) ; email trouvé → liaison automatique (compte existant, mot de passe ou non, conserve son historique) ; toute la séquence dans un seul `runExclusive`, comme `register()` (pas le pattern plus léger d'`authenticate()`) pour éviter une double création en cas d'appels concurrents sur un email neuf. `passwordMatches` renvoie `false` sans appel scrypt si le compte n'a pas de hash — un compte Google-only échoue `authenticate()` avec le même message générique existant (pas d'énumération, cohérent D-13).

**Liaison automatique par email vérifié :** comportement standard "bouton direct" (pas d'étape de liaison manuelle séparée). Ne contredit pas la philosophie anti-énumération de D-13 : lier un compte existant ou en créer un nouveau produit la même sortie externe (une session valide), sans jamais révéler lequel des deux s'est produit.

**`state` OAuth sans état serveur :** ce backend n'a aucune infrastructure cookie/session aujourd'hui (API pure à jeton Bearer) ; en ajouter une seulement pour la protection CSRF du flux OAuth aurait été une addition architecturale plus lourde qu'un nonce signé. `state` = `base64url(timestamp.aléatoire) + "." + HMAC-SHA256(..., AUTH_STATE_SECRET)`, vérifié par `timingSafeEqual` (rejet immédiat si les longueurs diffèrent, sans appeler `timingSafeEqual`) + expiration 10 min (+30s de tolérance d'horloge). `AUTH_STATE_SECRET` est une variable dédiée, volontairement indépendante de `GOOGLE_CLIENT_SECRET` (pas de réutilisation de clé entre deux usages cryptographiques distincts). Pas de suivi de rejeu côté serveur : le `code` Google lui-même est à usage unique et lié à `client_id`/`redirect_uri`, le `state` n'a qu'à prouver que ce serveur a bien émis le flux et en borner la durée de vie.

**Fragment (jeton) vs query (erreur) sur la redirection finale :** `googleCallback` renvoie `${APP_URL}/#token=...` en cas de succès — un fragment n'est jamais envoyé au serveur ni loggé (contrairement à un paramètre de requête), stricte amélioration pour transporter un secret sans nouvelle infrastructure. En cas d'échec, `${APP_URL}/?error=...` en query — le message n'est pas sensible, et un paramètre de requête est plus simple à construire uniformément depuis le `catch` du contrôleur. Asymétrie intentionnelle, pas une incohérence.

**`@Redirect()` plutôt que `@Res()` :** permet de tester les deux routes par appel direct de méthode (`{ url }` en retour), comme le reste des specs de ce contrôleur — pas de mock Express `Response` à introduire. `googleLogin()` n'a pas de `try/catch` : si `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`AUTH_STATE_SECRET` manquent, l'erreur part avant toute redirection (le navigateur n'a pas quitté l'app) — une réponse JSON Nest normale suffit, même logique que `/plan` avec `ANTHROPIC_API_KEY` manquante. `googleCallback()` avale systématiquement toute erreur et redirige avec `?error=`, car le navigateur est déjà hors domaine à ce stade — une page d'erreur JSON y serait une impasse.

**Alternatives envisagées :** Cookie de session pour le `state` CSRF (rejeté : introduirait une infrastructure cookie entièrement nouvelle dans un backend 100% Bearer token, pour un seul flux) . Étape de liaison manuelle explicite avant d'autoriser Google sur un compte existant (rejeté : contredit "bouton direct", et la liaison par email vérifié est le standard SaaS). Jeton dans un paramètre de requête plutôt qu'un fragment (rejeté : le fragment est strictement meilleur ici sans coût supplémentaire).

**Conséquences :** Nécessite un vrai client OAuth Google (Google Cloud Console → OAuth consent screen → Credentials → OAuth Client ID, type Web application, redirect URI exactement `http://localhost:3001/auth/google/callback` en dev) — étape manuelle réservée à l'utilisateur, comme `ANTHROPIC_API_KEY`/`E2B_API_KEY` cette session. Sans ces identifiants, `/auth/google` échoue avec une erreur de configuration claire (pas de repli silencieux) ; le bouton navigue bien jusqu'à l'écran réel de Google même avec des identifiants factices, ce qui suffit à vérifier le câblage. Autres fournisseurs OAuth (GitHub, etc.), liaison/déliaison manuelle depuis l'UI, et rafraîchissement de token Google restent hors scope.

<!-- Prochaine entrée : D-19 -->
