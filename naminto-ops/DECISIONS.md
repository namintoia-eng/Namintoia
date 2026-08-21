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

<!-- Prochaine entrée : D-9 -->
