# GLOSSARY.md — Vocabulaire officiel de Naminto IA

> Un seul mot par concept. Si un nouveau terme est nécessaire, il est ajouté ici avant d'être utilisé dans le code ou la documentation — pas l'inverse.

| Terme | Définition |
|---|---|
| **Naminto IA** | Le produit dans son ensemble : plateforme d'IA autonome qui transforme une intention en langage naturel en réalisation numérique. |
| **Naminto Core** | Couche centrale qui coordonne intelligence, raisonnement, agents, mémoire, outils, projets, exécution, tests, permissions, ressources, facturation. |
| **Intelligence Engine** | Composant responsable de la compréhension et de la génération (texte, code, décisions), indépendant du fournisseur sous-jacent. |
| **Reasoning Engine** | Composant qui applique la méthode `OBJECTIF → EXIGENCES → ARCHITECTURE → ... → VALIDATION` (voir `WORKFLOW.md`) pour transformer une intention en plan actionnable. |
| **Agent Orchestrator** | Composant qui distribue le travail entre les agents spécialisés et séquence leurs actions. |
| **Agent System** | Ensemble des agents spécialisés : Coding, Design, Architecture, Testing, Debug, Research, Deployment. |
| **Agent** | Unité spécialisée de l'Agent System avec un rôle, des entrées/sorties et des contraintes définis dans `agents/<nom>.md`. |
| **Memory System** | Composant responsable de la persistance du contexte projet entre sessions (équivalent produit de `STATE.md` + `DECISIONS.md`, mais côté application). |
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
| **Provider** | Implémentation interchangeable d'une interface d'abstraction (ex. `IntelligenceProvider`) — jamais un fournisseur câblé en dur. Voir `RULES.md`. |
| **SandboxProvider** | Interface d'abstraction de l'Execution Engine/Sandbox : isole l'exécution du code généré (par défaut, microVMs type Firecracker) derrière un contrat stable, quel que soit le fournisseur ou le mode d'hébergement choisi. Voir `STACK.md`. |
| **BackendProvider** | Interface d'abstraction du backend par défaut des applications générées pour les utilisateurs finaux (base de données, authentification, stockage, temps réel) — jamais câblée en dur sur un fournisseur unique. Voir `STACK.md`. |
| **MemoryStore** | Interface d'abstraction du Memory System : persiste et relit les `ConversationTurn` d'un projet. Implémentation MVP par défaut : `FileMemoryStore` (un fichier JSON par projet, aucune base de données requise, `DECISIONS.md` D-2). |
| **ConversationTurn** | Un échange complet capturé par le Memory System : intention utilisateur → `Plan` produit par le Reasoning Engine → `OrchestrationResult` produit par l'Agent Orchestrator, horodaté. |
| **FileSystem** | Interface d'abstraction du File System : sauvegarde et relit les `ProjectFile` d'un projet une fois le sandbox de la session détruit. Implémentation MVP par défaut : `LocalFileSystem` (un dossier local par projet, `DECISIONS.md` D-12). |
| **ProjectFile** | Un fichier capturé depuis le `SandboxSession` d'un `Plan` à la fin de son exécution — chemin relatif à `PROJECT_WORKING_DIRECTORY`, plus son contenu. |
| **UserSystem** | Interface d'abstraction du User System : inscription, authentification (mot de passe ou fournisseur externe), vérification de session. Implémentation MVP par défaut : `LocalUserSystem` (comptes/sessions en fichier local, mots de passe hashés scrypt, `DECISIONS.md` D-13/D-18). |
| **Session** | Jeton de session opaque émis par `UserSystem.authenticate()`/`authenticateExternal()`, associé à un `userId` et une expiration — pas un JWT (D-13). |
| **ExternalIdentity** | Identité confirmée par un fournisseur OAuth2/OIDC externe (`provider`, `externalId`, `email`) passée à `UserSystem.authenticateExternal()` — Google est le premier fournisseur branché (`DECISIONS.md` D-18). L'appelant ne doit la construire qu'après vérification de l'email par le fournisseur ; le contrat lui-même reste vendor-neutre. |
| **Vibecoding** | Le mode de travail employé pour *construire* Naminto IA lui-même : un agent IA outillé (ce kit) qui code de façon itérative, testée et documentée. À ne pas confondre avec le produit final. |

## Règle de gouvernance du glossaire

Un terme qui apparaît dans le code, un fichier de spec ou une réponse à l'utilisateur doit être cohérent avec ce tableau. Si un nouveau concept apparaît pendant l'implémentation, ajoute-le ici dans la même session, avec sa définition en une phrase.
