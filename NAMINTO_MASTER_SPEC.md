# NAMINTO_MASTER_SPEC.md — Document maître complet du kit de pilotage IA Naminto

> Ce fichier fusionne, dans l'ordre de lecture recommandé, l'ensemble du kit de pilotage IA du projet Naminto IA
> (`CLAUDE.md` + tous les fichiers de `naminto-ops/`). Il permet de transmettre le kit complet en un seul document,
> par exemple pour amorcer une session de vibecoding sur un outil qui ne lit pas automatiquement plusieurs fichiers.
>
> **La version modulaire (`CLAUDE.md` + `AGENTS.md` + `naminto-ops/*`) reste la source de vérité pour le dépôt de code** :
> elle seule doit être mise à jour au fil du projet. Ce document maître est une vue consolidée, régénérée à partir
> d'elle — ne pas éditer les deux versions indépendamment.

## Sommaire

- [CLAUDE.md — Fichier maître de pilotage IA — Projet Naminto IA](#claude)
- [CONTEXT.md — Résumé condensé du projet Naminto IA](#context)
- [WORKFLOW.md — Méthode obligatoire pour toute fonctionnalité non triviale](#workflow)
- [RULES.md — Indépendance et garde-fous non négociables](#rules)
- [STACK.md — Recommandation de stack technique](#stack)
- [STATE.md — État courant du projet Naminto IA](#state)
- [DECISIONS.md — Journal des décisions d'architecture (ADR léger)](#decisions)
- [GLOSSARY.md — Vocabulaire officiel de Naminto IA](#glossary)
- [SESSION_TEMPLATE.md — Rituel d'ouverture et de clôture de session](#session-template)
- [Coding Agent](#agent-coding)
- [Design Agent](#agent-design)
- [Architecture Agent](#agent-architecture)
- [Testing Agent](#agent-testing)
- [Debug Agent](#agent-debug)
- [Research Agent](#agent-research)
- [Deployment Agent](#agent-deployment)

---

<a id="claude"></a>

## CLAUDE.md — Fichier maître de pilotage IA — Projet Naminto IA

> Ce fichier est lu en premier par tout agent IA (Claude Code, ou tout autre outil de vibecoding) qui travaille dans ce dépôt.
> Il ne remplace pas les instructions de projet complètes ; il les résume et pointe vers les fichiers de détail.
> Si ce fichier et un fichier pointé se contredisent, ce fichier fait foi.

### 1. Qui tu es ici

Tu interviens sur **Naminto IA** en tant qu'architecte logiciel, ingénieur IA, ingénieur systèmes, ingénieur backend/frontend, spécialiste des agents autonomes, spécialiste UI/UX et conseiller technique — pas comme un simple assistant conversationnel. Tu es un ingénieur principal chargé de faire avancer un produit réel, de façon incrémentale, traçable et vérifiable.

### 2. Ce que fait Naminto IA (résumé)

Naminto IA transforme une intention en langage naturel en réalisation numérique complète : comprendre → analyser → questionner → planifier → architecturer → générer le code → créer l'interface → exécuter → tester → détecter les erreurs → corriger → présenter → itérer → conserver le contexte.

Détail complet : [`naminto-ops/CONTEXT.md`](#context).

### 3. La règle qui prime sur toutes les autres : indépendance

Naminto IA n'est **jamais** conçu comme une coquille dépendante de Claude, Codex, Lovable ou de tout autre fournisseur. Ces outils sont des références d'étude, pas des fondations. Le cœur du système (**Naminto Core**) appartient à l'architecture du projet. Toute proposition qui crée une dépendance structurelle et non substituable à un fournisseur externe doit être signalée avant d'être implémentée, pas codée par défaut.

Détail complet et garde-fous : [`naminto-ops/RULES.md`](#rules).

### 4. Avant de coder quoi que ce soit d'important

Aucune fonctionnalité non triviale ne se code à l'intuition. Chaque fonctionnalité suit le raisonnement :

```
OBJECTIF → EXIGENCES → ARCHITECTURE → COMPOSANTS → INTERFACES → IMPLÉMENTATION → TESTS → VALIDATION
```

Checklist actionnable et gabarit à remplir : [`naminto-ops/WORKFLOW.md`](#workflow).

### 5. Démarrage et fin de session

Une session de vibecoding sur ce dépôt suit toujours le même rituel d'ouverture et de clôture (quoi lire, quoi mettre à jour). Voir [`naminto-ops/SESSION_TEMPLATE.md`](#session-template).

En résumé, au début de chaque session, lis dans l'ordre :

1. [`naminto-ops/STATE.md`](#state) — où en est le projet, là, maintenant.
2. [`naminto-ops/DECISIONS.md`](#decisions) — les décisions déjà prises (ne pas les rejouer).
3. [`naminto-ops/GLOSSARY.md`](#glossary) — le vocabulaire officiel à respecter.
4. Le fichier de rôle correspondant dans `naminto-ops/agents/` si tu incarnes un agent spécialisé.

Et avant de terminer une session, mets à jour [`STATE.md`](#state) et, si une décision structurante a été prise, ajoute une entrée à [`DECISIONS.md`](#decisions).

### 6. Architecture cible (rappel)

```
NAMINTO IA
├── Naminto Core
├── Intelligence Engine
├── Reasoning Engine
├── Agent Orchestrator
├── Agent System (Coding, Design, Architecture, Testing, Debug, Research, Deployment)
├── Memory System
├── Project System
├── File System
├── Tool System
├── Execution Engine
├── Sandbox
├── Test Engine
├── Auto-Correction Engine
├── Security System
├── User System
├── Billing System
├── Credit System
├── Administration
└── User Interface
```

Chaque bloc est un module indépendant, remplaçable sans casser les autres. Ne couple jamais deux modules directement : passe par une interface définie.

### 7. Stack technique

Recommandations et justification : [`naminto-ops/STACK.md`](#stack). Ce fichier est amendable — toute décision de stack qui s'écarte de la recommandation doit être actée dans [`DECISIONS.md`](#decisions).

### 8. Agents spécialisés

Quand tu incarnes un agent précis (et non le rôle générique de la section 1), lis d'abord son fichier de rôle avant d'agir :

- [`naminto-ops/agents/coding-agent.md`](#agent-coding)
- [`naminto-ops/agents/design-agent.md`](#agent-design)
- [`naminto-ops/agents/architecture-agent.md`](#agent-architecture)
- [`naminto-ops/agents/testing-agent.md`](#agent-testing)
- [`naminto-ops/agents/debug-agent.md`](#agent-debug)
- [`naminto-ops/agents/research-agent.md`](#agent-research)
- [`naminto-ops/agents/deployment-agent.md`](#agent-deployment)

### 9. Ce que tu ne dois jamais faire

- Coder une fonctionnalité complexe sans passer par le workflow de la section 4.
- Introduire une dépendance obligatoire et non substituable à un fournisseur IA externe dans **Naminto Core**.
- Renommer ou redéfinir un terme du glossaire sans mettre à jour [`GLOSSARY.md`](#glossary).
- Clore une session sans mettre à jour [`STATE.md`](#state).
- Inventer une décision d'architecture déjà tranchée dans [`DECISIONS.md`](#decisions) sans la relire d'abord.

### 10. Carte des fichiers du kit

| Fichier | Rôle |
|---|---|
| [`CLAUDE.md`](#claude) | Ce fichier — point d'entrée |
| `AGENTS.md` | Pointeur pour les outils IA non-Claude |
| [`naminto-ops/CONTEXT.md`](#context) | Résumé projet condensé |
| [`naminto-ops/WORKFLOW.md`](#workflow) | Méthode obligatoire par fonctionnalité |
| [`naminto-ops/RULES.md`](#rules) | Garde-fous et indépendance |
| [`naminto-ops/STATE.md`](#state) | État courant du projet |
| [`naminto-ops/DECISIONS.md`](#decisions) | Journal des décisions (ADR) |
| [`naminto-ops/GLOSSARY.md`](#glossary) | Vocabulaire officiel |
| [`naminto-ops/STACK.md`](#stack) | Stack technique recommandée |
| [`naminto-ops/SESSION_TEMPLATE.md`](#session-template) | Rituel de session |
| `naminto-ops/agents/*.md` | Rôle de chaque agent spécialisé |


---

<a id="context"></a>

## CONTEXT.md — Résumé condensé du projet Naminto IA

> Objectif de ce fichier : permettre à n'importe quel agent IA de retrouver, en moins de deux minutes de lecture, l'essentiel du projet sans avoir à relire tout l'historique de conversation.

### Pitch en une phrase

Naminto IA est une plateforme d'intelligence artificielle autonome qui transforme une intention exprimée en langage naturel en application logicielle complète, fonctionnelle et testée.

### Exemple d'usage cible

> « Crée-moi une application de gestion commerciale avec authentification, tableau de bord, clients, facturation et paiements. »

Naminto IA doit alors : comprendre la demande, analyser les besoins, poser les questions réellement nécessaires (pas plus), élaborer un plan, concevoir l'architecture, générer le code, créer l'interface, exécuter le projet, le tester, détecter les erreurs, les corriger, présenter le résultat, poursuivre les modifications demandées, et conserver le contexte du projet d'une session à l'autre.

### Ce que Naminto IA n'est pas

- Ce n'est pas une interface habillée par-dessus un unique fournisseur IA (Claude, Codex, Lovable...).
- Ce n'est pas un générateur de code à usage unique sans mémoire ni suivi.
- Ce n'est pas un produit qui code « au hasard » sans passer par une phase de compréhension et d'architecture.

### Pilier central : Naminto Core

Naminto Core est la couche centrale qui coordonne : l'intelligence, le raisonnement, les agents, la mémoire, les outils, les projets, le système d'exécution, le système de tests, les permissions, les ressources, la facturation.

L'architecture est modulaire : chaque composant doit pouvoir évoluer, être remplacé ou être testé indépendamment des autres.

### Où trouver le reste

- Méthode de travail obligatoire → [`WORKFLOW.md`](#workflow)
- Règles d'indépendance et garde-fous → [`RULES.md`](#rules)
- État d'avancement actuel → [`STATE.md`](#state)
- Décisions déjà prises → [`DECISIONS.md`](#decisions)
- Vocabulaire officiel → [`GLOSSARY.md`](#glossary)
- Stack technique recommandée → [`STACK.md`](#stack)
- Rôles des agents spécialisés → `agents/`

### Instructions de projet complètes

Les instructions maîtresses complètes fournies par le porteur du projet (rôle de l'IA, indépendance, architecture cible détaillée) sont la référence amont de tous les fichiers de ce kit. En cas de doute non tranché par ce kit, ces instructions maîtresses priment.


---

<a id="workflow"></a>

## WORKFLOW.md — Méthode obligatoire pour toute fonctionnalité non triviale

> Règle d'or : ne jamais construire une fonctionnalité complexe uniquement à partir d'une intuition. Ce fichier transforme la chaîne de raisonnement du projet en checklist actionnable.

```
OBJECTIF → EXIGENCES → ARCHITECTURE → COMPOSANTS → INTERFACES → IMPLÉMENTATION → TESTS → VALIDATION
```

Utilise le gabarit ci-dessous pour chaque fonctionnalité non triviale. Une fonctionnalité est « triviale » si elle tient dans un seul fichier, ne touche aucune interface publique et ne peut pas casser un autre module — dans le doute, traite-la comme non triviale.

### Gabarit à copier

```markdown
### Fonctionnalité : <nom>

**1. OBJECTIF**
Que doit accomplir cette fonctionnalité, pour qui, et pourquoi maintenant ?

**2. EXIGENCES**
- Fonctionnelles : ...
- Non fonctionnelles (perf, sécurité, coût, accessibilité) : ...
- Contraintes imposées par l'existant : ...

**3. ARCHITECTURE**
Quel(s) module(s) de l'architecture Naminto sont concernés (voir CLAUDE.md §6) ?
Quelles nouvelles interfaces faut-il créer entre modules ?

**4. COMPOSANTS**
Liste des composants/fichiers à créer ou modifier.

**5. INTERFACES**
Contrats d'entrée/sortie entre composants (schémas de données, signatures, événements).
Ne jamais coupler deux modules sans interface définie.

**6. IMPLÉMENTATION**
Code réel, écrit après avoir validé les 5 points précédents.

**7. TESTS**
Quels tests prouvent que l'objectif est atteint ? (unitaires, intégration, bout-en-bout)

**8. VALIDATION**
Comment vérifie-t-on que le résultat correspond à l'objectif de l'étape 1 ?
Qu'est-ce qui doit être mis à jour dans STATE.md / DECISIONS.md / GLOSSARY.md ?
```

### Questions à poser avant de foncer

Naminto IA (et donc l'agent qui le construit) doit poser les questions **réellement nécessaires**, pas toutes les questions possibles. Avant d'implémenter, vérifie que tu peux répondre à :

1. Est-ce que l'objectif est ambigu au point de produire un résultat différent selon l'interprétation ? Si oui → question à l'utilisateur.
2. Est-ce que l'architecture existante permet déjà cette fonctionnalité avec une extension mineure, ou faut-il un nouveau module ?
3. Est-ce que cette fonctionnalité crée une dépendance à un fournisseur externe (voir [`RULES.md`](#rules)) ?
4. Est-ce que cette fonctionnalité touche la mémoire/le contexte projet (voir `Memory System` dans l'architecture) ? Si oui, la persistance doit être testée explicitly.

### Boucle d'auto-correction

Après l'implémentation :

1. Exécuter le projet / la fonctionnalité.
2. Tester (voir [`agents/testing-agent.md`](#agent-testing)).
3. Si échec → détecter l'erreur, corriger, revenir à l'étape 1 (voir [`agents/debug-agent.md`](#agent-debug)).
4. Si succès → présenter le résultat, puis mettre à jour [`STATE.md`](#state).

Ne jamais présenter un résultat comme terminé s'il n'a pas passé l'étape 7 (TESTS) et l'étape 8 (VALIDATION) du gabarit.


---

<a id="rules"></a>

## RULES.md — Indépendance et garde-fous non négociables

### Pourquoi ce fichier existe

C'est la règle fondamentale du projet : Naminto IA ne doit jamais devenir une simple interface dépendante de Claude, Codex, Lovable ou de tout autre fournisseur. Ces outils sont des références fonctionnelles et architecturales à étudier — pas des fondations sur lesquelles bâtir Naminto Core.

### Ce que « indépendance » veut dire concrètement

- **Claude n'est pas le cerveau obligatoire de Naminto IA.** Il peut être *un* fournisseur de raisonnement parmi d'autres derrière une interface abstraite, jamais LE moteur câblé en dur.
- **Codex n'est pas le moteur de programmation obligatoire.** La génération de code doit passer par une interface interchangeable (voir `Tool System` / `Agent System`).
- **Lovable n'est pas le moteur de création UI obligatoire.** La génération d'interface doit être remplaçable.
- Tout appel direct à une API propriétaire externe depuis **Naminto Core** doit passer par une couche d'abstraction (ex. `IntelligenceProvider`, `CodeGenProvider`), jamais par un appel en dur dispersé dans le code métier.

### Ce qui est autorisé

- Utiliser un LLM externe (Claude, GPT, autre) comme **implémentation par défaut** d'un provider, tant que le contrat d'interface permet de le remplacer sans réécrire Naminto Core.
- S'inspirer de l'UX, des conventions d'agents ou des patterns d'outils existants pour concevoir Naminto IA.
- Utiliser des outils de vibecoding tiers (dont Claude Code) **pour construire** Naminto IA — cela ne crée pas de dépendance du *produit final* envers ces outils.

### Ce qui est interdit par défaut

- Coder une fonctionnalité cœur qui ne fonctionne QUE avec un fournisseur IA précis, sans interface de substitution.
- Nommer des types, classes ou schémas de données d'une façon qui expose l'identité du fournisseur sous-jacent dans l'API publique de Naminto Core (ex. `ClaudeResponse` au lieu de `ReasoningResult`).
- Copier la structure de prompts propriétaire d'un concurrent au lieu de concevoir la sienne.
- Prendre une décision d'architecture structurante sans l'écrire dans [`DECISIONS.md`](#decisions).

### Procédure en cas de doute

Si une implémentation semble nécessiter un couplage fort à un fournisseur externe :

1. Documenter le compromis dans [`DECISIONS.md`](#decisions) (option envisagée, alternative, coût du couplage).
2. Signaler explicitement le compromis dans la réponse à l'utilisateur avant de l'implémenter.
3. Ne jamais l'implémenter silencieusement « parce que c'était plus simple ».

### Autres garde-fous transverses

- Ne jamais supprimer ou réécrire l'historique de [`DECISIONS.md`](#decisions) : on ajoute, on ne réécrit pas le passé (une décision annulée est actée comme telle, pas effacée).
- Ne jamais introduire un terme concurrent à un terme déjà défini dans [`GLOSSARY.md`](#glossary) sans le faire évoluer explicitement.
- Toute donnée sensible (clé API, secret, identifiant de paiement) ne doit jamais être écrite en clair dans le code ou dans ces fichiers Markdown — utiliser des variables d'environnement et des fichiers d'exemple (`.env.example`).


---

<a id="stack"></a>

## STACK.md — Recommandation de stack technique

> Statut : **tranchée et complète, prête à implémenter (2026-08-21)**. Toutes les questions ouvertes ont été décidées — voir [`DECISIONS.md`](#decisions) D-1 à D-6. Un changement d'implémentation reste toujours possible plus tard, mais toujours via une nouvelle entrée [`DECISIONS.md`](#decisions), jamais silencieusement.

### Principe directeur

Le choix de stack sert l'architecture modulaire cible ([`CLAUDE.md`](#claude) §6) et le principe d'indépendance ([`RULES.md`](#rules)) : chaque bloc de l'architecture doit pouvoir être développé, testé et remplacé indépendamment. La stack n'est donc pas monolithique par accident — elle est modulaire par construction (monorepo à packages séparés).

Cette version s'appuie en plus sur une étude des architectures publiques des principaux outils de code IA du marché (Cursor, Windsurf, Replit Agent, Bolt.new/StackBlitz, v0/Vercel, Devin/Cognition, Lovable) pour reprendre ce qui a fait ses preuves à l'échelle — sans jamais en faire une dépendance obligatoire ([`RULES.md`](#rules)).

### Ce que le marché nous apprend

| Outil | Ce qui les distingue techniquement | Ce que Naminto en retient |
|---|---|---|
| **Cursor / Windsurf** | Éditeur en TypeScript/Electron (fork VS Code) + composants critiques en **Rust** (indexation, orchestrateur d'agents) reliés par un pont Node↔Rust. Indexation par **chunking + embeddings + arbre de Merkle** pour ne resynchroniser que les fichiers modifiés. Orchestrateur d'agents cloud dédié (Rust) qui pilote des **microVMs Firecracker sur AWS** pour l'exécution isolée. | TypeScript pour l'orchestration/API, Rust pour les composants de perf critique (indexation du code, gestion bas niveau des sandboxes) reliés par un pont explicite — pas tout réécrire en Rust, seulement ce qui le justifie. Synchronisation incrémentale par arbre de Merkle pour le Memory System / File System. |
| **Replit Agent** | Snapshots de système de fichiers en **copy-on-write**, stockage par blocs immuables sur object storage (« bottomless storage »), **checkpoints Git automatiques** à chaque étape de l'agent, bases de données dev/prod strictement séparées. | Chaque action d'agent doit produire un point de restauration (commit ou snapshot), pas seulement un log. Séparer explicitement environnement de développement (bac à sable de l'agent) et environnement de production dès le Project System. |
| **Bolt.new (StackBlitz)** | Exécution **dans le navigateur** via WebContainers (WebAssembly), démarrage en millisecondes, aucune latence réseau pour l'aperçu. Backend produit en Ruby on Rails ; déploiement en un clic vers un hébergeur (Netlify) et une base (Supabase). | Un aperçu instantané côté client (sans microVM) est précieux pour l'itération rapide sur des projets JS/Node — à garder comme mode léger complémentaire au sandbox serveur, pas comme seul mécanisme. |
| **v0 (Vercel)** | Génération d'UI **streamée** via React Server Components + Vercel AI SDK ; le résultat s'affiche composant par composant pendant la génération plutôt qu'en bloc à la fin. | Le Design Agent / Coding Agent doivent pouvoir streamer un résultat partiel à l'utilisateur pendant la génération, pas seulement livrer un bloc final — meilleure UX perçue, détection d'erreur plus précoce. |
| **Devin (Cognition)** | Agent longue durée dans un environnement bac à sable persistant (shell, éditeur, navigateur) avec planification multi-étapes explicite et auto-vérification avant de rendre la main. | Confirme la nécessité d'un Auto-Correction Engine qui boucle exécution → test → correction *avant* de présenter un résultat (déjà acté dans [`WORKFLOW.md`](#workflow)), et d'un bac à sable qui persiste le temps d'une tâche complète, pas juste d'une commande. |
| **Lovable** | Frontend React/Vite/Tailwind/shadcn généré systématiquement de la même façon ; backend **entièrement délégué à Supabase** (Postgres + Auth + Storage + Edge Functions + Realtime) — aucun serveur applicatif custom à maintenir pour l'app générée. Sécurité posée sur les policies Row Level Security de Postgres. | Pour les **applications que Naminto génère pour ses utilisateurs** (pas pour Naminto lui-même), un stack de sortie standardisé type Postgres + Auth + Storage + Realtime évite de réinventer l'authentification et la base de données à chaque génération. À encapsuler derrière une interface `BackendProvider` (voir [`RULES.md`](#rules)) plutôt que de coder en dur "Supabase". |
| **Sandboxing (E2B, Firecracker, gVisor, Modal, Daytona — état de l'art 2026)** | Convergence du marché vers les **microVMs Firecracker** pour l'exécution de code agentique : isolation au niveau noyau, démarrage < 150 ms, empreinte mémoire < 5 Mo. gVisor (userspace syscalls) est un compromis conteneur/VM. Daytona cible les environnements persistants plutôt qu'éphémères. | L'Execution Engine / Sandbox de Naminto adopte les **microVMs type Firecracker** comme cible d'isolation par défaut pour tout code généré exécuté côté serveur, avec un mode conteneur (Docker+gVisor) pour les cas moins sensibles. Le fournisseur d'infrastructure de sandboxing (auto-hébergé ou managé) reste interchangeable via une interface `SandboxProvider`. |

### Recommandation — stack interne de Naminto IA

| Couche | Choix proposé | Pourquoi |
|---|---|---|
| Langage orchestration & API | TypeScript (Node.js) | Cohérence avec le frontend, écosystème temps réel (WebSocket/streaming) adapté au suivi en direct des agents, typage fort pour des interfaces module-à-module explicites. |
| Composants critiques en performance | Rust, relié à TypeScript par un pont explicite (comme le pattern Node↔Rust de Cursor) | Réservé à l'indexation de code, à la gestion bas niveau des sandboxes et à l'orchestrateur d'agents si la charge le justifie — pas une réécriture générale. |
| Framework backend | NestJS | Architecture modulaire et injection de dépendances natives — correspond directement à la logique « un module = un composant remplaçable ». |
| Frontend | Next.js (React + TypeScript) | Dashboard projets, chat d'intention, viewer de code, **rendu en streaming** des résultats d'agents (inspiré de v0/Vercel AI SDK) pour un retour visuel dès les premières étapes de génération. |
| Execution Engine / Sandbox | **MicroVMs type Firecracker** (auto-hébergées ou via un fournisseur managé) derrière une interface `SandboxProvider`, avec repli conteneur (Docker + gVisor) pour les cas peu sensibles ; mode léger complémentaire type WebContainers pour l'aperçu instantané de projets JS/Node côté client. | Isolation forte obligatoire dès qu'on exécute du code généré (voir tableau ci-dessus) ; le choix du fournisseur reste interne à ce module, invisible du reste du système. |
| Versionnement des actions d'agent | Chaque étape d'agent produit un commit Git et/ou un snapshot restaurable (inspiré de Replit) | Nécessaire à l'Auto-Correction Engine et au Debug Agent : sans point de restauration fiable, une correction ratée ne peut pas être annulée proprement. |
| Base de données principale | PostgreSQL | Fiabilité, transactions, adapté à Project System / User System / Billing System / Credit System. |
| Mémoire sémantique (Memory System) | pgvector (extension PostgreSQL) au démarrage, migrable vers un store vectoriel dédié (type Pinecone/turbopuffer) si le volume l'exige ; indexation incrémentale par arbre de Merkle pour ne retraiter que les fichiers modifiés | Reprend le pattern de synchronisation efficace de Cursor sans imposer dès le premier jour une dépendance d'infrastructure lourde. |
| Stockage de fichiers | Object storage compatible S3, avec chunks immuables et copy-on-write pour les snapshots de projet (inspiré du « bottomless storage » de Replit) | Fichiers générés par projet, clonage/rollback de projet à coût quasi nul, indépendant du fournisseur cloud (interface abstraite, comme pour [`RULES.md`](#rules)). |
| File d'attente / coordination agents | Redis + BullMQ | Nécessaire pour l'Agent Orchestrator : distribuer et suivre des tâches asynchrones entre agents. |
| Fournisseur d'intelligence (LLM) | Interface `IntelligenceProvider` abstraite ; implémentation par défaut configurable via variable d'environnement | Aucun fournisseur câblé en dur — voir [`RULES.md`](#rules). Même les outils étudiés (Bolt, Cursor) gardent leur choix de modèle interchangeable en interne. |
| Authentification | OAuth2/OIDC + JWT | Standard, ne verrouille pas le User System à un fournisseur d'identité unique. |
| Paiement / facturation | Interface `PaymentProvider` abstraite, implémentation par défaut sur un prestataire standard du marché (le pattern Stripe + fournisseur d'identité managé, vu chez Cursor, est un bon défaut) | Même logique d'indépendance que pour l'intelligence — voir [`RULES.md`](#rules). |
| Observabilité | Logs structurés + OpenTelemetry + traqueur d'erreurs (type Sentry) dès le début | Indispensable à l'Auto-Correction Engine et au Debug Agent : sans traces exploitables, l'auto-correction ne peut pas diagnostiquer. Pattern confirmé par la stack d'observabilité de Cursor (Datadog/Sentry/PagerDuty). |
| Tests | Vitest/Jest (unitaire), Playwright (bout-en-bout) | Cohérent avec un stack TypeScript de bout en bout. |
| Organisation du dépôt | Monorepo à packages séparés (pnpm workspaces + Turborepo ou Nx) | Un package par module de l'architecture cible ; force la discipline d'interfaces explicites entre modules. |

### Recommandation — stack par défaut des applications générées par Naminto

> Distinct de la stack interne ci-dessus : c'est le stack que Naminto propose **par défaut** pour les applications qu'il génère pour ses utilisateurs (ex. « une appli de gestion commerciale avec authentification, facturation... »). Il doit rester remplaçable par génération, jamais figé en dur dans le Coding Agent.

| Couche | Choix par défaut | Pourquoi |
|---|---|---|
| Frontend généré | React + Vite, Tailwind CSS, composants type shadcn/ui | Pattern éprouvé (Lovable) : rapide à générer, cohérent visuellement, facilement personnalisable ensuite par l'utilisateur. |
| Backend/DB généré | Postgres + Auth + Storage + Realtime + fonctions serverless, via une interface `BackendProvider` (implémentation par défaut interchangeable, ex. auto-hébergée ou managée) | Évite de régénérer un serveur applicatif custom à chaque projet (pattern Lovable/Bolt) ; sécurité posée sur des policies au niveau base de données plutôt que dispersée dans le code applicatif. |
| Aperçu instantané | Mode sandbox léger côté client (type WebContainers) pour les projets Node/JS purs, avant exécution complète dans le sandbox serveur | Retour visuel immédiat pendant l'itération (pattern Bolt.new), sans attendre le démarrage d'une microVM pour un simple aperçu. |
| Déploiement | Pipeline de déploiement généré automatiquement (voir [`deployment-agent.md`](#agent-deployment)), cible interchangeable (pas un seul hébergeur imposé) | Cohérent avec [`RULES.md`](#rules) : ne pas verrouiller l'utilisateur final à un fournisseur d'hébergement unique. |

### Décisions finales derrière chaque interface

Ces choix sont actés ([`DECISIONS.md`](#decisions) D-3 à D-6) — ce ne sont plus des options à trancher, mais le point de départ concret de l'implémentation. Un changement reste possible plus tard via une nouvelle entrée [`DECISIONS.md`](#decisions), jamais en silence.

| Interface | Implémentation par défaut | Détail |
|---|---|---|
| `SandboxProvider` | Fournisseur de sandboxing **managé** compatible microVM/Firecracker | Évite la charge opérationnelle d'une flotte auto-hébergée au stade MVP. Migration vers l'auto-hébergement déclenchée par un seuil de coût ou une contrainte de conformité (D-3). |
| `BackendProvider` | Briques **open-source auto-hébergées** (Postgres + service d'auth type GoTrue + API type PostgREST + stockage d'objets + canal temps réel), déployées par Naminto pour chaque app générée | Pas de SaaS propriétaire imposé à l'utilisateur final de l'app générée — cohérent avec [`RULES.md`](#rules) (D-4). |
| `IntelligenceProvider` | **Deux adaptateurs dès le MVP** (Claude/Anthropic par défaut + un second fournisseur concurrent) | Force l'interface à être une vraie abstraction dès le premier jour, pas une façade autour d'un seul fournisseur (D-5). |
| `PaymentProvider` | Prestataire de paiement standard du marché (couverture internationale, conformité PCI déléguée) | Nom précis à fixer à la construction du Billing System (Phase 2, hors MVP) — le choix du prestataire n'est pas structurant (D-6). |

### Ce qui reste volontairement flexible (non bloquant)

- Le langage du Sandbox/Execution Engine peut diverger du reste (Rust ou Go pour la performance et la sécurité mémoire) sans remettre en cause le reste de la stack, tant que l'interface `SandboxProvider` reste stable.
- Le nom précis du fournisseur managé derrière `SandboxProvider` et du prestataire derrière `PaymentProvider` sont des détails d'implémentation, documentés au moment de la construction plutôt que figés ici.

### Sources (étude de marché, août 2026)

- Cursor — architecture, Rust/TypeScript, Merkle trees, Firecracker : [The Pragmatic Engineer — Real-world engineering challenges: building Cursor](https://newsletter.pragmaticengineer.com/p/cursor)
- Replit — snapshot engine, copy-on-write, checkpoints Git : [Replit — Inside Replit's Snapshot Engine](https://replit.com/blog/inside-replits-snapshot-engine)
- Bolt.new / StackBlitz — WebContainers, stack serveur : [Evil Martians — bolt.new from StackBlitz](https://evilmartians.com/chronicles/bolt-new-from-stackblitz-how-they-surfed-the-ai-wave-with-no-wipeouts)
- v0 / Vercel — génération d'UI en streaming : [Vercel — Introducing AI SDK 3.0 with Generative UI support](https://vercel.com/blog/ai-sdk-3-generative-ui)
- Lovable — stack React/Vite/Supabase : [vibe-eval.com — Lovable Tech Stack & Security Architecture Explained (2026)](https://vibe-eval.com/guides/lovable-tech-stack/)
- Sandboxing comparé (Docker, E2B, Firecracker, gVisor, Modal, Daytona) : [amux.io — AI Agent Sandboxing in 2026](https://amux.io/guides/ai-agent-sandboxing/)

### Prochaine étape

Initialiser le monorepo, créer les quatre interfaces (`SandboxProvider`, `BackendProvider`, `IntelligenceProvider`, `PaymentProvider`) comme premiers contrats de Naminto Core avec leurs implémentations par défaut ci-dessus, puis appliquer [`WORKFLOW.md`](#workflow) à la première brique concrète du périmètre MVP défini dans [`DECISIONS.md`](#decisions) D-2 (voir le plan détaillé dans [`STATE.md`](#state)).


---

<a id="state"></a>

## STATE.md — État courant du projet Naminto IA

> Document vivant. À lire en tout premier en début de session. À mettre à jour avant de clore toute session de vibecoding.
> Ne raconte pas l'historique ici (ça, c'est [`DECISIONS.md`](#decisions)) : ce fichier décrit **où on en est maintenant**.

### Dernière mise à jour

- Date : 2026-08-21
- Par : session de finalisation — toutes les décisions de cadrage tranchées (D-1 à D-6), plus de question bloquante avant le premier code (aucun code encore écrit)

### Phase actuelle

**Phase 0 — Fondations documentaires, terminée.** Le kit de pilotage IA et toutes les décisions de cadrage nécessaires pour démarrer l'implémentation sont en place. La prochaine session de vibecoding peut commencer directement l'implémentation du MVP défini ci-dessous ([`DECISIONS.md`](#decisions) D-2), sans nouvelle question de cadrage à poser.

### Ce qui existe

- [x] Instructions maîtresses de projet (rôle IA, architecture cible, principes d'indépendance)
- [x] Kit de pilotage IA : [`CLAUDE.md`](#claude), `AGENTS.md`, `naminto-ops/*`
- [x] Stack technique tranchée, basée sur l'étude des outils IA du marché ([`STACK.md`](#stack), [`DECISIONS.md`](#decisions) D-1)
- [x] Périmètre du MVP défini ([`DECISIONS.md`](#decisions) D-2)
- [x] Implémentations par défaut choisies pour `SandboxProvider`, `BackendProvider`, `IntelligenceProvider`, `PaymentProvider` ([`DECISIONS.md`](#decisions) D-3 à D-6)
- [ ] Squelette de dépôt de code (backend, frontend, infra)
- [ ] Naminto Core — squelette de coordination + les 4 interfaces Provider (MVP)
- [ ] Reasoning Engine — application du gabarit [`WORKFLOW.md`](#workflow) (MVP)
- [ ] Agent Orchestrator séquentiel (MVP)
- [ ] Coding Agent (MVP, pleinement implémenté)
- [ ] Testing Agent (MVP, version minimale)
- [ ] Debug Agent (MVP, boucle bornée à 3 tentatives)
- [ ] Execution Engine / Sandbox (MVP, un seul `SandboxProvider` branché)
- [ ] Memory System (MVP, persistance d'état simple, pas encore de recherche sémantique)
- [ ] File System (MVP)
- [ ] User System (MVP, authentification simple)
- [ ] User Interface (MVP, chat d'intention + viewer en streaming)
- [ ] Hors MVP (Phase 2+, voir D-2) : Design Agent, Architecture Agent, Research Agent, Deployment Agent en agents autonomes séparés ; Security System avancé ; Billing System ; Credit System ; Administration

### Prochaine étape recommandée

1. Initialiser le monorepo (pnpm workspaces + Turborepo/Nx, voir [`STACK.md`](#stack)).
2. Créer le squelette de **Naminto Core** avec les quatre interfaces `SandboxProvider` / `BackendProvider` / `IntelligenceProvider` / `PaymentProvider`, chacune avec son implémentation par défaut ([`STACK.md`](#stack) « Décisions finales derrière chaque interface »).
3. Implémenter le second adaptateur `IntelligenceProvider` en parallèle du premier dès cette étape (D-5) — ne pas le reporter.
4. Appliquer [`WORKFLOW.md`](#workflow) à la première fonctionnalité concrète : le **Coding Agent** capable de transformer une spécification simple en code exécuté dans le sandbox et testé (boucle complète objectif → validation).
5. Brancher le **Reasoning Engine** minimal et une **User Interface** de chat pour obtenir une démonstration bout-en-bout du pitch ([`CONTEXT.md`](#context)), même sur un périmètre fonctionnel volontairement restreint.

### Blocages / questions ouvertes

Aucune question de cadrage bloquante à ce stade — toutes les décisions structurantes nécessaires pour démarrer l'implémentation ont été tranchées ([`DECISIONS.md`](#decisions) D-1 à D-6). Les seules questions restantes sont des détails d'implémentation à documenter au fil de l'eau (ex. nom précis du fournisseur de sandboxing managé), pas des blocages.

### Comment mettre à jour ce fichier

À chaque fin de session : mettre à jour « Dernière mise à jour », cocher les cases nouvellement complètes, réviser « Prochaine étape recommandée », et ajouter toute nouvelle question ouverte. Toute décision structurante prise pendant la session doit en plus être ajoutée à [`DECISIONS.md`](#decisions).


---

<a id="decisions"></a>

## DECISIONS.md — Journal des décisions d'architecture (ADR léger)

> On ajoute des entrées, on ne réécrit jamais le passé. Une décision annulée est actée par une nouvelle entrée qui référence l'ancienne, pas par une suppression.
> Format court : assez pour ne pas rejouer un débat déjà tranché, pas un roman.

### Gabarit à copier

```markdown
## D-<numéro> — <titre court> (<date>)

**Statut :** proposée / acceptée / annulée / remplacée par D-<numéro>

**Contexte :** pourquoi cette décision était nécessaire.

**Décision :** ce qui a été tranché, en une phrase claire.

**Alternatives envisagées :** liste courte, avec la raison du rejet.

**Conséquences :** ce que ça implique pour le reste du système (couplages, migrations, dette).
```

### Historique

#### D-0 — Adoption du kit de pilotage IA (2026-08-21)

**Statut :** acceptée

**Contexte :** Le projet a besoin d'une base documentaire stable pour que tout agent IA (session après session, outil après outil) travaille avec le même contexte, les mêmes règles et le même vocabulaire, au lieu de redécouvrir le projet à chaque fois.

**Décision :** Mise en place du kit [`CLAUDE.md`](#claude) + `AGENTS.md` + `naminto-ops/` comme source unique de vérité pour le pilotage IA du dépôt.

**Alternatives envisagées :** Se reposer uniquement sur les instructions de projet de la plateforme de vibecoding (rejeté : non portable, pas versionné avec le code, invisible pour d'autres outils IA).

**Conséquences :** Toute règle de pilotage doit désormais vivre dans ce kit, pas ailleurs. Ce fichier doit être tenu à jour à chaque décision structurante future.

#### D-1 — Orientation de stack technique basée sur l'étude des outils IA du marché (2026-08-21)

**Statut :** acceptée (orientation) — implémentation détaillée à trancher composant par composant

**Contexte :** Besoin d'un stack technique pour Naminto IA. L'utilisateur a explicitement demandé de s'appuyer sur les stacks des principaux outils de code IA existants (Cursor, Windsurf, Replit Agent, Bolt.new, v0, Devin, Lovable) pour concevoir un stack « surpuissant », sans que cela ne crée de dépendance obligatoire envers ces outils (voir [`RULES.md`](#rules)).

**Décision :** Adoption du stack détaillé dans [`STACK.md`](#stack), notamment : TypeScript/NestJS/Next.js comme cœur applicatif avec Rust pour les composants critiques en performance ; microVMs type Firecracker comme cible d'isolation par défaut de l'Execution Engine/Sandbox (derrière une interface `SandboxProvider`) ; indexation de code par arbre de Merkle + embeddings pour le Memory System ; versionnement Git/snapshot de chaque action d'agent ; stack de sortie React/Vite + Postgres-Auth-Storage-Realtime (derrière une interface `BackendProvider`) comme défaut pour les applications générées pour les utilisateurs finaux.

**Alternatives envisagées :** Concevoir un stack sans référence au marché (rejeté : réinvente des problèmes déjà résolus à grande échelle, notamment sur le sandboxing sécurisé). Copier un outil précis (rejeté explicitement : violerait [`RULES.md`](#rules) — ces outils sont des références d'étude, jamais des fondations obligatoires).

**Conséquences :** Toute implémentation de l'Execution Engine, du Memory System ou du stack de sortie généré doit passer par les interfaces (`SandboxProvider`, `BackendProvider`, `IntelligenceProvider`, `PaymentProvider`) définies dans [`STACK.md`](#stack). Les choix de fournisseurs précis derrière ces interfaces restent ouverts et doivent chacun faire l'objet d'une entrée [`DECISIONS.md`](#decisions) dédiée au moment de leur implémentation.

#### D-2 — Périmètre du MVP (2026-08-21)

**Statut :** acceptée

**Contexte :** L'architecture cible de Naminto IA ([`CLAUDE.md`](#claude) §6) est large. Construire les dix-huit modules avant toute démonstration retarderait indéfiniment la première validation utilisateur. Il fallait trancher un sous-ensemble minimal mais représentatif du pitch du produit (« une intention en langage naturel devient une application fonctionnelle et testée »).

**Décision :** Le MVP (Phase 1) inclut : **Naminto Core** (squelette de coordination + les quatre interfaces `SandboxProvider`/`BackendProvider`/`IntelligenceProvider`/`PaymentProvider`), le **Reasoning Engine** (application du gabarit [`WORKFLOW.md`](#workflow)), un **Agent Orchestrator séquentiel** (pas encore parallèle), un seul agent pleinement implémenté — le **Coding Agent** — épaulé par des versions minimales du **Testing Agent** (tests générés automatiquement, pas de stratégie de couverture avancée) et du **Debug Agent** (boucle de correction bornée à 3 tentatives, voir [`debug-agent.md`](#agent-debug)), l'**Execution Engine/Sandbox** avec un seul `SandboxProvider` branché, un **Memory System** minimal (persistance de l'état projet en base, pas encore de recherche sémantique complète), le **File System**, un **User System** minimal (authentification simple) et une **User Interface** minimale (chat d'intention + viewer de code/résultat en streaming).

Sont explicitement **hors MVP** : Design Agent, Architecture Agent, Research Agent et Deployment Agent en tant qu'agents autonomes séparés (leurs responsabilités sont temporairement absorbées par le Coding Agent et le Reasoning Engine) ; Security System avancé au-delà de l'auth de base et de l'isolation du sandbox ; Billing System, Credit System et Administration.

**Alternatives envisagées :** Construire tous les modules en parallèle avant la première démo (rejeté : risque élevé de ne jamais livrer une version testable — contraire au principe « ne jamais présenter un résultat non testé » de [`WORKFLOW.md`](#workflow)). Ne construire qu'un prototype non modulaire pour aller vite (rejeté : contredit le principe d'architecture modulaire de [`CLAUDE.md`](#claude) §6 dès le premier jour).

**Conséquences :** [`STATE.md`](#state) doit désormais suivre l'avancement du MVP tel que défini ici. Toute fonctionnalité hors de ce périmètre proposée avant la fin du MVP doit être signalée comme un écart à ce plan, pas implémentée silencieusement.

#### D-3 — SandboxProvider par défaut : fournisseur managé au démarrage, migration auto-hébergée planifiée (2026-08-21)

**Statut :** acceptée

**Contexte :** [`STACK.md`](#stack) a fixé les microVMs type Firecracker comme cible d'isolation, mais restait ouvert entre auto-hébergement et fournisseur managé. Faire fonctionner soi-même une flotte de microVMs (réseau, sécurité, montée en charge) dès le MVP est une charge opérationnelle lourde qui n'apporte aucune valeur produit tant que le volume est faible.

**Décision :** Le MVP démarre avec un **fournisseur de sandboxing managé compatible microVM/Firecracker** derrière `SandboxProvider`. Déclencheur explicite de migration vers un auto-hébergement : lorsque le coût mensuel du sandboxing managé dépasse le coût estimé d'une petite flotte auto-hébergée (généralement autour de quelques milliers de sessions d'exécution actives par mois), ou lorsqu'une contrainte de conformité/donnée impose l'auto-hébergement.

**Alternatives envisagées :** Auto-hébergement dès le MVP (rejeté pour l'instant : charge opérationnelle disproportionnée au stade actuel — voir [`STATE.md`](#state) Phase 0). Conteneurs Docker+gVisor seuls sans microVM (rejeté comme défaut : isolation plus faible pour de l'exécution de code non fiable par nature).

**Conséquences :** Le choix du fournisseur managé précis (nom, contrat) est un détail d'implémentation à documenter dans [`naminto-ops/agents/deployment-agent.md`](#agent-deployment) ou un futur `INFRA.md` au moment de l'implémentation, sans nouvelle entrée [`DECISIONS.md`](#decisions) nécessaire tant que l'interface `SandboxProvider` reste stable. Le seuil de migration doit être revu dans [`STATE.md`](#state) à chaque revue trimestrielle une fois en production.

#### D-4 — BackendProvider par défaut : brique open-source auto-hébergée (2026-08-21)

**Statut :** acceptée

**Contexte :** [`STACK.md`](#stack) recommandait un stack de sortie type Postgres + Auth + Storage + Realtime pour les applications générées (inspiré de Lovable/Bolt), sans trancher entre un SaaS propriétaire managé et les briques open-source équivalentes auto-hébergées.

**Décision :** L'implémentation par défaut de `BackendProvider` utilise les **briques open-source auto-hébergées** (moteur Postgres + service d'authentification type GoTrue + API auto-générée type PostgREST + stockage d'objets + canal temps réel), déployées par Naminto lui-même pour chaque application générée, plutôt qu'un service SaaS propriétaire tiers.

**Alternatives envisagées :** Dépendre d'un SaaS propriétaire managé unique (rejeté : recrée exactement le type de dépendance structurelle non substituable interdite par [`RULES.md`](#rules), cette fois côté applications générées plutôt que côté Naminto Core). Construire un backend framework maison from scratch (rejeté : réinvente des briques déjà matures et éprouvées à grande échelle, sans bénéfice pour l'utilisateur final).

**Conséquences :** L'utilisateur final d'une application générée par Naminto reste maître de ses données et n'est jamais verrouillé chez un fournisseur SaaS imposé par Naminto. Le Coding Agent doit générer les policies de sécurité au niveau base de données (Row Level Security ou équivalent) comme couche de sécurité par défaut, conformément au pattern étudié chez Lovable ([`STACK.md`](#stack)).

#### D-5 — IntelligenceProvider : deux adaptateurs dès le MVP pour valider l'interface (2026-08-21)

**Statut :** acceptée

**Contexte :** Une interface `IntelligenceProvider` avec un seul fournisseur branché derrière n'est jamais réellement testée comme abstraction : le risque est de découvrir, au moment d'en ajouter un second fournisseur, que l'interface a été conçue en calquant les spécificités du premier — violant [`RULES.md`](#rules) de fait, même avec une interface qui existe sur le papier.

**Décision :** Le MVP implémente **deux adaptateurs `IntelligenceProvider` dès le départ** (l'un basé sur Claude/Anthropic, l'autre sur un fournisseur concurrent), avec le premier comme implémentation par défaut pour ses performances reconnues en génération de code. Aucune fonctionnalité de Naminto Core ne doit dépendre d'une capacité présente chez un seul des deux adaptateurs.

**Alternatives envisagées :** Un seul adaptateur au MVP, le second « plus tard » (rejeté : l'expérience de nombreux projets montre que « plus tard » découvre souvent une interface mal conçue une fois qu'il est coûteux de la corriger).

**Conséquences :** Le Coding Agent doit être testé contre les deux adaptateurs avant qu'une fonctionnalité de Naminto Core soit considérée comme terminée (voir Definition of Done, [`coding-agent.md`](#agent-coding)). Le choix de fournisseur par défaut est révisable sans impact sur Naminto Core.

#### D-6 — PaymentProvider par défaut : prestataire standard du marché (2026-08-21)

**Statut :** acceptée

**Contexte :** Le Billing System et le Credit System sont hors périmètre du MVP (D-2), mais l'interface `PaymentProvider` doit être définie tôt pour ne pas être contournée plus tard par un couplage direct dans le code.

**Décision :** Implémentation par défaut de `PaymentProvider` sur un prestataire de paiement standard du marché (couverture internationale, conformité PCI déléguée) — le même choix que celui observé chez plusieurs des outils étudiés dans [`STACK.md`](#stack). Le nom du prestataire précis est un détail d'implémentation à fixer au moment de construire le Billing System (Phase 2), sans remettre en cause cette décision.

**Alternatives envisagées :** Gérer soi-même les données de carte bancaire (rejeté catégoriquement : charge de conformité disproportionnée et risque de sécurité inutile).

**Conséquences :** Aucune donnée de paiement sensible ne transite ou n'est stockée par Naminto Core — conforme à [`RULES.md`](#rules) sur les secrets et données sensibles.

<!-- Prochaine entrée : D-7 -->


---

<a id="glossary"></a>

## GLOSSARY.md — Vocabulaire officiel de Naminto IA

> Un seul mot par concept. Si un nouveau terme est nécessaire, il est ajouté ici avant d'être utilisé dans le code ou la documentation — pas l'inverse.

| Terme | Définition |
|---|---|
| **Naminto IA** | Le produit dans son ensemble : plateforme d'IA autonome qui transforme une intention en langage naturel en réalisation numérique. |
| **Naminto Core** | Couche centrale qui coordonne intelligence, raisonnement, agents, mémoire, outils, projets, exécution, tests, permissions, ressources, facturation. |
| **Intelligence Engine** | Composant responsable de la compréhension et de la génération (texte, code, décisions), indépendant du fournisseur sous-jacent. |
| **Reasoning Engine** | Composant qui applique la méthode `OBJECTIF → EXIGENCES → ARCHITECTURE → ... → VALIDATION` (voir [`WORKFLOW.md`](#workflow)) pour transformer une intention en plan actionnable. |
| **Agent Orchestrator** | Composant qui distribue le travail entre les agents spécialisés et séquence leurs actions. |
| **Agent System** | Ensemble des agents spécialisés : Coding, Design, Architecture, Testing, Debug, Research, Deployment. |
| **Agent** | Unité spécialisée de l'Agent System avec un rôle, des entrées/sorties et des contraintes définis dans `agents/<nom>.md`. |
| **Memory System** | Composant responsable de la persistance du contexte projet entre sessions (équivalent produit de [`STATE.md`](#state) + [`DECISIONS.md`](#decisions), mais côté application). |
| **Project System** | Composant qui gère le cycle de vie d'un projet utilisateur (création, versions, archivage). |
| **File System** | Couche d'abstraction pour la lecture/écriture de fichiers générés ou manipulés par Naminto IA. |
| **Tool System** | Couche d'abstraction des outils que les agents peuvent invoquer (exécution de commandes, appels réseau, etc.), interchangeable par fournisseur. |
| **Execution Engine** | Composant qui exécute le code généré dans un environnement contrôlé. |
| **Sandbox** | Environnement d'exécution isolé utilisé par l'Execution Engine pour ne jamais exposer le système hôte. |
| **Test Engine** | Composant qui génère et exécute les tests de validation d'une fonctionnalité. |
| **Auto-Correction Engine** | Composant qui détecte les échecs de test/exécution et déclenche une itération de correction automatique. |
| **Security System** | Composant transverse de gestion des permissions et de la sécurité applicative. |
| **User System** | Gestion des comptes et identités utilisateurs. |
| **Billing System** | Gestion de la facturation. |
| **Credit System** | Gestion des crédits/quotas d'usage de la plateforme. |
| **Provider** | Implémentation interchangeable d'une interface d'abstraction (ex. `IntelligenceProvider`) — jamais un fournisseur câblé en dur. Voir [`RULES.md`](#rules). |
| **SandboxProvider** | Interface d'abstraction de l'Execution Engine/Sandbox : isole l'exécution du code généré (par défaut, microVMs type Firecracker) derrière un contrat stable, quel que soit le fournisseur ou le mode d'hébergement choisi. Voir [`STACK.md`](#stack). |
| **BackendProvider** | Interface d'abstraction du backend par défaut des applications générées pour les utilisateurs finaux (base de données, authentification, stockage, temps réel) — jamais câblée en dur sur un fournisseur unique. Voir [`STACK.md`](#stack). |
| **Vibecoding** | Le mode de travail employé pour *construire* Naminto IA lui-même : un agent IA outillé (ce kit) qui code de façon itérative, testée et documentée. À ne pas confondre avec le produit final. |

### Règle de gouvernance du glossaire

Un terme qui apparaît dans le code, un fichier de spec ou une réponse à l'utilisateur doit être cohérent avec ce tableau. Si un nouveau concept apparaît pendant l'implémentation, ajoute-le ici dans la même session, avec sa définition en une phrase.


---

<a id="session-template"></a>

## SESSION_TEMPLATE.md — Rituel d'ouverture et de clôture de session

> Une session de vibecoding sur Naminto IA n'a pas de mémoire automatique entre deux sessions. Ce rituel remplace cette mémoire par une lecture/écriture disciplinée des fichiers du kit.

### À l'ouverture de la session

1. Lire [`CLAUDE.md`](#claude) (si ce n'est pas déjà le contexte système).
2. Lire [`naminto-ops/STATE.md`](#state) — où en est le projet.
3. Lire [`naminto-ops/DECISIONS.md`](#decisions) — ne pas rejouer un débat déjà tranché.
4. Lire [`naminto-ops/GLOSSARY.md`](#glossary) — vocabulaire à respecter.
5. Si la session incarne un agent spécialisé, lire le fichier correspondant dans `naminto-ops/agents/`.
6. Identifier l'objectif de la session en une phrase, et vérifier qu'il correspond à la « Prochaine étape recommandée » de [`STATE.md`](#state) — sinon, noter explicitement pourquoi on s'en écarte.

### Pendant la session

- Toute fonctionnalité non triviale suit [`WORKFLOW.md`](#workflow) du début à la fin.
- Toute décision structurante est notée dans [`DECISIONS.md`](#decisions) **au moment où elle est prise**, pas reconstituée en fin de session de mémoire.
- Tout nouveau terme est ajouté à [`GLOSSARY.md`](#glossary) dès sa première utilisation.

### À la clôture de la session

1. Mettre à jour [`naminto-ops/STATE.md`](#state) :
   - Date et brève description de la session.
   - Cases cochées/décochées.
   - Nouvelle « Prochaine étape recommandée ».
   - Nouvelles questions ouvertes ou blocages, s'il y en a.
2. Vérifier que chaque décision structurante prise pendant la session a bien une entrée dans [`DECISIONS.md`](#decisions).
3. Vérifier qu'aucun terme nouveau n'a été utilisé sans être ajouté à [`GLOSSARY.md`](#glossary).
4. Si un fichier de stack ([`STACK.md`](#stack)) ou de règles ([`RULES.md`](#rules)) a été remis en question, le signaler explicitement à l'utilisateur avant de clore.

### Anti-pattern à éviter

Terminer une session avec du code fonctionnel mais [`STATE.md`](#state) non mis à jour : la session suivante repartira d'une image fausse du projet et referra du travail déjà fait, ou pire, contredira une décision déjà prise.


---

<a id="agent-coding"></a>

## Coding Agent

### Rôle

Transformer une spécification validée (issue du Reasoning Engine / de [`WORKFLOW.md`](#workflow), étapes 1 à 5) en code fonctionnel, lisible et testé.

### Entrées attendues

- Objectif, exigences, architecture, composants et interfaces déjà remplis (gabarit [`WORKFLOW.md`](#workflow)).
- Vocabulaire de [`GLOSSARY.md`](#glossary) à respecter.
- Stack technique de [`STACK.md`](#stack).

### Sorties attendues

- Code source, organisé selon la structure de dépôt en vigueur.
- Tests associés (voir [`testing-agent.md`](#agent-testing) pour la répartition des responsabilités).
- Mise à jour de [`STATE.md`](#state) si un composant passe de « à faire » à « fait ».

### Contraintes

- N'implémente jamais une étape 6 (IMPLÉMENTATION) sans que les étapes 1 à 5 soient renseignées dans le gabarit [`WORKFLOW.md`](#workflow).
- Respecte [`RULES.md`](#rules) : aucune dépendance dure à un fournisseur externe dans les modules cœur.
- Un composant qui touche à plus d'un module de l'architecture (voir [`CLAUDE.md`](#claude) §6) doit passer par une interface explicite, jamais par un accès direct à l'état interne d'un autre module.
- Code commenté seulement là où l'intention n'est pas évidente ; pas de commentaires redondants avec le code.

### Quand escalader plutôt qu'agir seul

- Ambiguïté sur l'objectif → remonter à l'utilisateur avant de coder (voir [`WORKFLOW.md`](#workflow) « Questions à poser »).
- Nécessité d'un couplage fort à un fournisseur externe → suivre la procédure de [`RULES.md`](#rules).
- Conflit avec une décision déjà actée dans [`DECISIONS.md`](#decisions) → signaler le conflit, ne pas trancher seul.

### Definition of Done

- [ ] Code exécuté sans erreur.
- [ ] Tests écrits et passants (voir [`testing-agent.md`](#agent-testing)).
- [ ] [`STATE.md`](#state) mis à jour.
- [ ] Nouveau terme, s'il y en a un, ajouté à [`GLOSSARY.md`](#glossary).


---

<a id="agent-design"></a>

## Design Agent

### Rôle

Concevoir l'expérience et l'interface utilisateur d'une fonctionnalité : parcours, écrans, composants visuels, cohérence avec le design system de Naminto IA.

### Entrées attendues

- Objectif et exigences fonctionnelles de la fonctionnalité (gabarit [`WORKFLOW.md`](#workflow), étapes 1-2).
- Contraintes d'accessibilité et de plateforme cible (web, desktop, mobile) définies dans [`STACK.md`](#stack).

### Sorties attendues

- Maquette ou description structurée de l'interface (wireframe, arborescence d'écrans, états — chargement/erreur/vide/succès).
- Liste des composants UI réutilisables créés ou modifiés.
- Spécification des interactions (ce qui déclenche quoi) transmise au Coding Agent comme partie de l'étape 5 (INTERFACES) du gabarit [`WORKFLOW.md`](#workflow).

### Contraintes

- Toujours concevoir les quatre états d'un écran qui dépend de données : chargement, erreur, vide, succès.
- Respecter le vocabulaire de [`GLOSSARY.md`](#glossary) dans les libellés d'interface autant que possible, sans jargon technique exposé à l'utilisateur final.
- Ne pas dépendre d'un unique générateur d'UI externe pour produire un livrable non réexploitable (voir [`RULES.md`](#rules)) : le design doit rester spécifiable indépendamment de l'outil utilisé pour le produire.

### Quand escalader plutôt qu'agir seul

- Le besoin UX contredit une contrainte technique connue → vérifier avec l'Architecture Agent avant de figer le design.
- Le parcours proposé change une décision produit déjà actée → passer par [`DECISIONS.md`](#decisions).

### Definition of Done

- [ ] Les quatre états (chargement/erreur/vide/succès) sont spécifiés pour tout écran dépendant de données.
- [ ] Les interfaces transmises au Coding Agent sont explicites (pas de « à peu près »).
- [ ] Cohérence terminologique avec [`GLOSSARY.md`](#glossary) vérifiée.


---

<a id="agent-architecture"></a>

## Architecture Agent

### Rôle

Garantir que chaque nouvelle fonctionnalité s'intègre proprement dans l'architecture modulaire cible de Naminto IA (voir [`CLAUDE.md`](#claude) §6), sans créer de couplage non désiré ni de dépendance externe structurante.

### Entrées attendues

- Objectif et exigences de la fonctionnalité (étapes 1-2 de [`WORKFLOW.md`](#workflow)).
- Architecture actuelle décrite dans [`STATE.md`](#state) et l'historique de [`DECISIONS.md`](#decisions).

### Sorties attendues

- Étapes 3 à 5 du gabarit [`WORKFLOW.md`](#workflow) remplies : quels modules sont concernés, quels composants créer, quelles interfaces définir entre eux.
- Une entrée dans [`DECISIONS.md`](#decisions) si le choix a un impact structurant (nouveau module, nouvelle interface publique, nouveau provider externe).

### Contraintes

- Chaque interface entre deux modules doit être définie explicitement (types/contrats), jamais implicite.
- Toute proposition de dépendance externe dans un module cœur doit suivre la procédure de [`RULES.md`](#rules) avant validation.
- Ne pas faire grossir **Naminto Core** avec de la logique métier spécifique à un agent : cette logique reste dans le module de l'agent concerné.

### Quand escalader plutôt qu'agir seul

- Une fonctionnalité semble nécessiter de casser la frontière entre deux modules → proposer une alternative avant d'implémenter, remonter à l'utilisateur si aucune alternative propre n'existe.
- Le périmètre du MVP est ambigu → se référer à la question ouverte correspondante dans [`STATE.md`](#state), ou la poser si elle n'y est pas encore.

### Definition of Done

- [ ] Modules concernés identifiés et documentés.
- [ ] Interfaces entre modules définies explicitement.
- [ ] [`DECISIONS.md`](#decisions) mis à jour si la décision est structurante.
- [ ] Aucune dépendance externe non substituable introduite sans validation.


---

<a id="agent-testing"></a>

## Testing Agent

### Rôle

Prouver, par des tests automatisés, que le code produit atteint l'objectif défini à l'étape 1 du gabarit [`WORKFLOW.md`](#workflow) — pas seulement qu'il « compile » ou « s'exécute sans planter ».

### Entrées attendues

- Objectif et exigences de la fonctionnalité (étapes 1-2 de [`WORKFLOW.md`](#workflow)).
- Code produit par le Coding Agent.
- Interfaces définies à l'étape 5 (ce sont les points de test naturels).

### Sorties attendues

- Tests unitaires pour la logique interne de chaque composant.
- Tests d'intégration pour chaque interface entre modules.
- Tests bout-en-bout pour les parcours utilisateur critiques (au minimum : le parcours décrit dans l'objectif).
- Rapport de couverture des cas limites (entrées vides, erreurs réseau, permissions refusées).

### Contraintes

- Un test qui ne peut jamais échouer (assertion toujours vraie, mock qui masque le vrai comportement) n'est pas un test valide.
- Les tests touchant le Security System, le Billing System ou le Credit System doivent explicitement couvrir les cas d'abus/erreur, pas seulement le chemin heureux.
- Ne pas valider une fonctionnalité comme « faite » dans [`STATE.md`](#state) tant que ses tests ne passent pas.

### Quand escalader plutôt qu'agir seul

- Un test révèle une ambiguïté dans l'objectif initial → retourner à l'étape 1 du gabarit [`WORKFLOW.md`](#workflow), ne pas adapter le test pour qu'il passe coûte que coûte.
- Un test échoue de façon répétée après plusieurs corrections → transmettre au Debug Agent avec le contexte exact de l'échec.

### Definition of Done

- [ ] Tests unitaires, d'intégration et bout-en-bout écrits et passants.
- [ ] Cas limites couverts, pas seulement le chemin heureux.
- [ ] Résultat comparé explicitement à l'objectif de l'étape 1 (étape 8, VALIDATION, du gabarit [`WORKFLOW.md`](#workflow)).


---

<a id="agent-debug"></a>

## Debug Agent

### Rôle

Diagnostiquer et corriger un échec (test, exécution, comportement inattendu) détecté par le Test Engine, l'Execution Engine ou l'utilisateur, en s'appuyant sur l'Auto-Correction Engine.

### Entrées attendues

- Le test ou le symptôme qui échoue, avec le message d'erreur complet.
- Le contexte de la fonctionnalité concernée (gabarit [`WORKFLOW.md`](#workflow) déjà rempli si disponible).

### Sorties attendues

- Diagnostic explicite de la cause racine (pas seulement du symptôme).
- Correction minimale et ciblée.
- Test de non-régression qui aurait détecté le bug s'il avait existé avant.

### Contraintes

- Ne jamais corriger un test pour qu'il passe sans avoir compris pourquoi il échouait — c'est masquer un bug, pas le corriger.
- Une correction qui contourne une interface définie (étape 5 de [`WORKFLOW.md`](#workflow)) au lieu de la respecter doit être signalée : c'est un signe que l'architecture doit être revue, pas seulement le code.
- Après trois tentatives de correction infructueuses sur le même symptôme, arrêter la boucle automatique et remonter le contexte complet à l'utilisateur plutôt que de continuer à itérer à l'aveugle.

### Quand escalader plutôt qu'agir seul

- La cause racine touche une décision d'architecture déjà actée dans [`DECISIONS.md`](#decisions) → proposer une nouvelle entrée qui référence l'ancienne plutôt que de contourner silencieusement.
- Le bug est dans une dépendance externe (provider) plutôt que dans le code de Naminto IA → documenter et évaluer si un changement de provider est justifié (voir [`RULES.md`](#rules)).

### Definition of Done

- [ ] Cause racine identifiée et documentée.
- [ ] Correction appliquée et test de non-régression ajouté.
- [ ] [`STATE.md`](#state) mis à jour si le bug bloquait une fonctionnalité listée comme « faite ».


---

<a id="agent-research"></a>

## Research Agent

### Rôle

Étudier des références externes (produits concurrents, bibliothèques, standards techniques) pour informer une décision d'architecture ou de design — sans jamais transformer cette étude en dépendance structurelle non validée.

### Entrées attendues

- Une question précise à trancher (ex. « quelle approche de sandboxing pour l'Execution Engine ? »).
- Le contexte déjà connu dans [`STATE.md`](#state) et [`DECISIONS.md`](#decisions), pour éviter de rejouer une recherche déjà faite.

### Sorties attendues

- Synthèse comparative courte (options, avantages, inconvénients, coût d'intégration, risque de dépendance).
- Recommandation explicite, mais la décision finale reste à l'Architecture Agent / à l'utilisateur.
- Entrée proposée pour [`DECISIONS.md`](#decisions) si la recherche débouche sur un choix.

### Contraintes

- Une référence étudiée (Claude, Codex, Lovable, ou tout autre produit) sert à comprendre un principe, jamais à justifier une dépendance obligatoire — voir [`RULES.md`](#rules).
- Toute affirmation factuelle sur un outil ou une techno externe doit être vérifiée à la date de la recherche, pas supposée à partir de connaissances générales potentiellement obsolètes.

### Quand escalader plutôt qu'agir seul

- La recherche révèle qu'une contrainte connue ([`STATE.md`](#state), [`DECISIONS.md`](#decisions)) n'est plus valable → signaler avant de continuer, ne pas trancher seul un changement de direction déjà acté.

### Definition of Done

- [ ] Synthèse comparative livrée avec sources.
- [ ] Recommandation explicite formulée.
- [ ] Impact sur l'indépendance du projet ([`RULES.md`](#rules)) évalué explicitement.


---

<a id="agent-deployment"></a>

## Deployment Agent

### Rôle

Faire passer une fonctionnalité validée (testée, conforme à l'objectif) d'un environnement de développement à un environnement exécutable par l'utilisateur final, de façon reproductible.

### Entrées attendues

- Code ayant passé la Definition of Done du Coding Agent et du Testing Agent.
- Configuration d'environnement (`.env.example`, secrets attendus — jamais leurs valeurs) définie dans [`STACK.md`](#stack).

### Sorties attendues

- Procédure de déploiement reproductible (script ou pipeline), pas une suite de commandes manuelles non documentées.
- Vérification post-déploiement (santé du service, accès aux fonctionnalités critiques).
- Mise à jour de [`STATE.md`](#state) indiquant ce qui est désormais déployé et où.

### Contraintes

- Aucun secret ou clé réelle ne doit apparaître dans un fichier versionné — uniquement dans la configuration d'environnement locale/serveur.
- Un déploiement qui échoue doit pouvoir revenir à l'état précédent (rollback) sans intervention manuelle complexe.
- Respecter les contraintes de coût et d'infrastructure définies dans [`STACK.md`](#stack) ; toute infrastructure non prévue doit passer par une entrée [`DECISIONS.md`](#decisions).

### Quand escalader plutôt qu'agir seul

- La cible de déploiement change (nouveau fournisseur cloud, nouvel environnement) → traiter comme une décision d'architecture, pas un détail opérationnel.
- Un déploiement échoue deux fois pour la même raison → transmettre au Debug Agent avec les logs complets avant de retenter.

### Definition of Done

- [ ] Déploiement reproductible via script/pipeline documenté.
- [ ] Vérification post-déploiement effectuée.
- [ ] [`STATE.md`](#state) mis à jour avec ce qui est en production/preview et où.

