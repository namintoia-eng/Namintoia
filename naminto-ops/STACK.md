# STACK.md — Recommandation de stack technique

> Statut : **tranchée et complète, prête à implémenter (2026-08-21)**. Toutes les questions ouvertes ont été décidées — voir `DECISIONS.md` D-1 à D-6. Un changement d'implémentation reste toujours possible plus tard, mais toujours via une nouvelle entrée `DECISIONS.md`, jamais silencieusement.

## Principe directeur

Le choix de stack sert l'architecture modulaire cible (`CLAUDE.md` §6) et le principe d'indépendance (`RULES.md`) : chaque bloc de l'architecture doit pouvoir être développé, testé et remplacé indépendamment. La stack n'est donc pas monolithique par accident — elle est modulaire par construction (monorepo à packages séparés).

Cette version s'appuie en plus sur une étude des architectures publiques des principaux outils de code IA du marché (Cursor, Windsurf, Replit Agent, Bolt.new/StackBlitz, v0/Vercel, Devin/Cognition, Lovable) pour reprendre ce qui a fait ses preuves à l'échelle — sans jamais en faire une dépendance obligatoire (`RULES.md`).

## Ce que le marché nous apprend

| Outil | Ce qui les distingue techniquement | Ce que Naminto en retient |
|---|---|---|
| **Cursor / Windsurf** | Éditeur en TypeScript/Electron (fork VS Code) + composants critiques en **Rust** (indexation, orchestrateur d'agents) reliés par un pont Node↔Rust. Indexation par **chunking + embeddings + arbre de Merkle** pour ne resynchroniser que les fichiers modifiés. Orchestrateur d'agents cloud dédié (Rust) qui pilote des **microVMs Firecracker sur AWS** pour l'exécution isolée. | TypeScript pour l'orchestration/API, Rust pour les composants de perf critique (indexation du code, gestion bas niveau des sandboxes) reliés par un pont explicite — pas tout réécrire en Rust, seulement ce qui le justifie. Synchronisation incrémentale par arbre de Merkle pour le Memory System / File System. |
| **Replit Agent** | Snapshots de système de fichiers en **copy-on-write**, stockage par blocs immuables sur object storage (« bottomless storage »), **checkpoints Git automatiques** à chaque étape de l'agent, bases de données dev/prod strictement séparées. | Chaque action d'agent doit produire un point de restauration (commit ou snapshot), pas seulement un log. Séparer explicitement environnement de développement (bac à sable de l'agent) et environnement de production dès le Project System. |
| **Bolt.new (StackBlitz)** | Exécution **dans le navigateur** via WebContainers (WebAssembly), démarrage en millisecondes, aucune latence réseau pour l'aperçu. Backend produit en Ruby on Rails ; déploiement en un clic vers un hébergeur (Netlify) et une base (Supabase). | Un aperçu instantané côté client (sans microVM) est précieux pour l'itération rapide sur des projets JS/Node — à garder comme mode léger complémentaire au sandbox serveur, pas comme seul mécanisme. |
| **v0 (Vercel)** | Génération d'UI **streamée** via React Server Components + Vercel AI SDK ; le résultat s'affiche composant par composant pendant la génération plutôt qu'en bloc à la fin. | Le Design Agent / Coding Agent doivent pouvoir streamer un résultat partiel à l'utilisateur pendant la génération, pas seulement livrer un bloc final — meilleure UX perçue, détection d'erreur plus précoce. |
| **Devin (Cognition)** | Agent longue durée dans un environnement bac à sable persistant (shell, éditeur, navigateur) avec planification multi-étapes explicite et auto-vérification avant de rendre la main. | Confirme la nécessité d'un Auto-Correction Engine qui boucle exécution → test → correction *avant* de présenter un résultat (déjà acté dans `WORKFLOW.md`), et d'un bac à sable qui persiste le temps d'une tâche complète, pas juste d'une commande. |
| **Lovable** | Frontend React/Vite/Tailwind/shadcn généré systématiquement de la même façon ; backend **entièrement délégué à Supabase** (Postgres + Auth + Storage + Edge Functions + Realtime) — aucun serveur applicatif custom à maintenir pour l'app générée. Sécurité posée sur les policies Row Level Security de Postgres. | Pour les **applications que Naminto génère pour ses utilisateurs** (pas pour Naminto lui-même), un stack de sortie standardisé type Postgres + Auth + Storage + Realtime évite de réinventer l'authentification et la base de données à chaque génération. À encapsuler derrière une interface `BackendProvider` (voir `RULES.md`) plutôt que de coder en dur "Supabase". |
| **Sandboxing (E2B, Firecracker, gVisor, Modal, Daytona — état de l'art 2026)** | Convergence du marché vers les **microVMs Firecracker** pour l'exécution de code agentique : isolation au niveau noyau, démarrage < 150 ms, empreinte mémoire < 5 Mo. gVisor (userspace syscalls) est un compromis conteneur/VM. Daytona cible les environnements persistants plutôt qu'éphémères. | L'Execution Engine / Sandbox de Naminto adopte les **microVMs type Firecracker** comme cible d'isolation par défaut pour tout code généré exécuté côté serveur, avec un mode conteneur (Docker+gVisor) pour les cas moins sensibles. Le fournisseur d'infrastructure de sandboxing (auto-hébergé ou managé) reste interchangeable via une interface `SandboxProvider`. |

## Recommandation — stack interne de Naminto IA

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
| Stockage de fichiers | Object storage compatible S3, avec chunks immuables et copy-on-write pour les snapshots de projet (inspiré du « bottomless storage » de Replit) | Fichiers générés par projet, clonage/rollback de projet à coût quasi nul, indépendant du fournisseur cloud (interface abstraite, comme pour `RULES.md`). |
| File d'attente / coordination agents | Redis + BullMQ | Nécessaire pour l'Agent Orchestrator : distribuer et suivre des tâches asynchrones entre agents. |
| Fournisseur d'intelligence (LLM) | Interface `IntelligenceProvider` abstraite ; implémentation par défaut configurable via variable d'environnement | Aucun fournisseur câblé en dur — voir `RULES.md`. Même les outils étudiés (Bolt, Cursor) gardent leur choix de modèle interchangeable en interne. |
| Authentification | OAuth2/OIDC + JWT | Standard, ne verrouille pas le User System à un fournisseur d'identité unique. |
| Paiement / facturation | Interface `PaymentProvider` abstraite, implémentation par défaut sur un prestataire standard du marché (le pattern Stripe + fournisseur d'identité managé, vu chez Cursor, est un bon défaut) | Même logique d'indépendance que pour l'intelligence — voir `RULES.md`. |
| Observabilité | Logs structurés + OpenTelemetry + traqueur d'erreurs (type Sentry) dès le début | Indispensable à l'Auto-Correction Engine et au Debug Agent : sans traces exploitables, l'auto-correction ne peut pas diagnostiquer. Pattern confirmé par la stack d'observabilité de Cursor (Datadog/Sentry/PagerDuty). |
| Tests | Vitest/Jest (unitaire), Playwright (bout-en-bout) | Cohérent avec un stack TypeScript de bout en bout. |
| Organisation du dépôt | Monorepo à packages séparés (pnpm workspaces + Turborepo ou Nx) | Un package par module de l'architecture cible ; force la discipline d'interfaces explicites entre modules. |

## Recommandation — stack par défaut des applications générées par Naminto

> Distinct de la stack interne ci-dessus : c'est le stack que Naminto propose **par défaut** pour les applications qu'il génère pour ses utilisateurs (ex. « une appli de gestion commerciale avec authentification, facturation... »). Il doit rester remplaçable par génération, jamais figé en dur dans le Coding Agent.

| Couche | Choix par défaut | Pourquoi |
|---|---|---|
| Frontend généré | React + Vite, Tailwind CSS, composants type shadcn/ui | Pattern éprouvé (Lovable) : rapide à générer, cohérent visuellement, facilement personnalisable ensuite par l'utilisateur. |
| Backend/DB généré | Postgres + Auth + Storage + Realtime + fonctions serverless, via une interface `BackendProvider` (implémentation par défaut interchangeable, ex. auto-hébergée ou managée) | Évite de régénérer un serveur applicatif custom à chaque projet (pattern Lovable/Bolt) ; sécurité posée sur des policies au niveau base de données plutôt que dispersée dans le code applicatif. |
| Aperçu instantané | Mode sandbox léger côté client (type WebContainers) pour les projets Node/JS purs, avant exécution complète dans le sandbox serveur | Retour visuel immédiat pendant l'itération (pattern Bolt.new), sans attendre le démarrage d'une microVM pour un simple aperçu. |
| Déploiement | Pipeline de déploiement généré automatiquement (voir `deployment-agent.md`), cible interchangeable (pas un seul hébergeur imposé) | Cohérent avec `RULES.md` : ne pas verrouiller l'utilisateur final à un fournisseur d'hébergement unique. |

## Décisions finales derrière chaque interface

Ces choix sont actés (`DECISIONS.md` D-3 à D-6) — ce ne sont plus des options à trancher, mais le point de départ concret de l'implémentation. Un changement reste possible plus tard via une nouvelle entrée `DECISIONS.md`, jamais en silence.

| Interface | Implémentation par défaut | Détail |
|---|---|---|
| `SandboxProvider` | Fournisseur de sandboxing **managé** compatible microVM/Firecracker | Évite la charge opérationnelle d'une flotte auto-hébergée au stade MVP. Migration vers l'auto-hébergement déclenchée par un seuil de coût ou une contrainte de conformité (D-3). |
| `BackendProvider` | Briques **open-source auto-hébergées** (Postgres + service d'auth type GoTrue + API type PostgREST + stockage d'objets + canal temps réel), déployées par Naminto pour chaque app générée | Pas de SaaS propriétaire imposé à l'utilisateur final de l'app générée — cohérent avec `RULES.md` (D-4). |
| `IntelligenceProvider` | **Deux adaptateurs dès le MVP** (Claude/Anthropic par défaut + un second fournisseur concurrent) | Force l'interface à être une vraie abstraction dès le premier jour, pas une façade autour d'un seul fournisseur (D-5). |
| `PaymentProvider` | Prestataire de paiement standard du marché (couverture internationale, conformité PCI déléguée) | Nom précis à fixer à la construction du Billing System (Phase 2, hors MVP) — le choix du prestataire n'est pas structurant (D-6). |

## Ce qui reste volontairement flexible (non bloquant)

- Le langage du Sandbox/Execution Engine peut diverger du reste (Rust ou Go pour la performance et la sécurité mémoire) sans remettre en cause le reste de la stack, tant que l'interface `SandboxProvider` reste stable.
- Le nom précis du fournisseur managé derrière `SandboxProvider` et du prestataire derrière `PaymentProvider` sont des détails d'implémentation, documentés au moment de la construction plutôt que figés ici.

## Sources (étude de marché, août 2026)

- Cursor — architecture, Rust/TypeScript, Merkle trees, Firecracker : [The Pragmatic Engineer — Real-world engineering challenges: building Cursor](https://newsletter.pragmaticengineer.com/p/cursor)
- Replit — snapshot engine, copy-on-write, checkpoints Git : [Replit — Inside Replit's Snapshot Engine](https://replit.com/blog/inside-replits-snapshot-engine)
- Bolt.new / StackBlitz — WebContainers, stack serveur : [Evil Martians — bolt.new from StackBlitz](https://evilmartians.com/chronicles/bolt-new-from-stackblitz-how-they-surfed-the-ai-wave-with-no-wipeouts)
- v0 / Vercel — génération d'UI en streaming : [Vercel — Introducing AI SDK 3.0 with Generative UI support](https://vercel.com/blog/ai-sdk-3-generative-ui)
- Lovable — stack React/Vite/Supabase : [vibe-eval.com — Lovable Tech Stack & Security Architecture Explained (2026)](https://vibe-eval.com/guides/lovable-tech-stack/)
- Sandboxing comparé (Docker, E2B, Firecracker, gVisor, Modal, Daytona) : [amux.io — AI Agent Sandboxing in 2026](https://amux.io/guides/ai-agent-sandboxing/)

## Prochaine étape

Initialiser le monorepo, créer les quatre interfaces (`SandboxProvider`, `BackendProvider`, `IntelligenceProvider`, `PaymentProvider`) comme premiers contrats de Naminto Core avec leurs implémentations par défaut ci-dessus, puis appliquer `WORKFLOW.md` à la première brique concrète du périmètre MVP défini dans `DECISIONS.md` D-2 (voir le plan détaillé dans `STATE.md`).
