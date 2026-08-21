# STATE.md — État courant du projet Naminto IA

> Document vivant. À lire en tout premier en début de session. À mettre à jour avant de clore toute session de vibecoding.
> Ne raconte pas l'historique ici (ça, c'est `DECISIONS.md`) : ce fichier décrit **où on en est maintenant**.

## Dernière mise à jour

- Date : 2026-08-21
- Par : session de bootstrap — squelette de dépôt initialisé (npm workspaces + Turborepo, cf. D-7), **Naminto Core** créé avec les 4 interfaces Provider et leurs adaptateurs par défaut, les deux adaptateurs `IntelligenceProvider` (D-5) en place. `npm run lint`, `typecheck`, `test` et `build` passent tous (14/14 tâches). Le dépôt a changé d'emplacement : le pilotage se fait désormais depuis `C:\Users\ASUS\Desktop\Naminto IA` (remote GitHub `namintoia-eng/Namintoia`, accès encore à débloquer — voir « Blocages »), l'ancien dépôt `D:\ADF\Naminto.AI` (Supabase, npm, Phase 0 "Foundation") n'est plus la référence.

## Phase actuelle

**Étapes 1-2 de la "Prochaine étape recommandée" ci-dessous : faites.** Reste à faire : Reasoning Engine, Agent Orchestrator, Coding Agent (étapes 3-5), volontairement laissés pour une session suivante (périmètre MVP `DECISIONS.md` D-2, principe de plus petit changement correct).

## Ce qui existe

- [x] Instructions maîtresses de projet (rôle IA, architecture cible, principes d'indépendance)
- [x] Kit de pilotage IA : `CLAUDE.md`, `AGENTS.md`, `naminto-ops/*` (à la racine du dépôt)
- [x] Stack technique tranchée, basée sur l'étude des outils IA du marché (`STACK.md`, `DECISIONS.md` D-1), avec l'écart npm-vs-pnpm documenté en D-7
- [x] Périmètre du MVP défini (`DECISIONS.md` D-2)
- [x] Implémentations par défaut choisies pour `SandboxProvider`, `BackendProvider`, `IntelligenceProvider`, `PaymentProvider` (`DECISIONS.md` D-3 à D-6)
- [x] Squelette de dépôt de code (backend `apps/api` NestJS, frontend `apps/web` Next.js, `packages/naminto-core`, `packages/providers/*`)
- [x] Naminto Core — squelette de coordination (`packages/naminto-core/src/core.ts`) + les 4 interfaces Provider (MVP), chacune avec un adaptateur par défaut : `intelligence-anthropic` (défaut), `intelligence-openai` (2ᵉ adaptateur, D-5), `sandbox-stub` (refuse d'exécuter tant qu'aucun vrai microVM managé n'est branché, D-3), `backend-selfhosted` (contrat Postgres/GoTrue/PostgREST, D-4, pas encore d'infra réelle), `payment-stub` (D-6, Billing hors MVP)
- [ ] Reasoning Engine — application du gabarit `WORKFLOW.md` (MVP)
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

## Prochaine étape recommandée

1. ~~Initialiser le monorepo~~ — fait (npm workspaces, D-7).
2. ~~Créer le squelette de Naminto Core avec les 4 interfaces Provider~~ — fait.
3. ~~Implémenter le second adaptateur `IntelligenceProvider`~~ — fait (`intelligence-openai`).
4. Appliquer `WORKFLOW.md` à la première fonctionnalité concrète : le **Coding Agent** capable de transformer une spécification simple en code exécuté dans le sandbox et testé (boucle complète objectif → validation). Prérequis réel : un vrai `SandboxProvider` (D-3) pour remplacer `sandbox-stub`, sinon le Coding Agent n'a rien où exécuter le code généré.
5. Brancher le **Reasoning Engine** minimal et une **User Interface** de chat pour obtenir une démonstration bout-en-bout du pitch (`CONTEXT.md`), même sur un périmètre fonctionnel volontairement restreint.

## Blocages / questions ouvertes

- **Accès au dépôt distant `namintoia-eng/Namintoia` (GitHub) non débloqué.** Le remote `origin` est configuré localement, mais le compte GitHub utilisé par l'agent IA (`Academienaminto`) n'a toujours pas accès (dépôt privé, invitation à confirmer côté propriétaire) — `git push` échouera tant que ce n'est pas réglé. Rien n'a encore été committé/poussé.
- Aucune clé réelle configurée (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`, etc.) — attendu à ce stade (`.env.example` uniquement), mais bloque tout appel réel des adaptateurs `IntelligenceProvider`/`BackendProvider` tant que ce n'est pas fourni.
- Pas encore de fournisseur `SandboxProvider` réel choisi/branché (nom précis du fournisseur managé, voir `DECISIONS.md` D-3) — nécessaire avant de commencer le Coding Agent (étape 4 ci-dessus).

## Comment mettre à jour ce fichier

À chaque fin de session : mettre à jour « Dernière mise à jour », cocher les cases nouvellement complètes, réviser « Prochaine étape recommandée », et ajouter toute nouvelle question ouverte. Toute décision structurante prise pendant la session doit en plus être ajoutée à `DECISIONS.md`.
