# Revue de Conversation : Apprentissages et Règles

Ce document récapitule les règles de développement et de méthode établies au cours de notre conversation, ainsi que les corrections apportées et les leçons tirées.

## Règles Générales de Développement et de Méthode

-   **Conventions de nommage des fichiers `.md` :** Minuscules séparées par des tirets (kebab-case).
-   **Conventions de nommage des entités de code :** Éviter les termes génériques ou vides de sens (ex: "mock", "impl", "test"). Utiliser des termes spécifiques qui décrivent la fonctionnalité ou la nature de l'entité (ex: "http-test-server" au lieu de "mock-server").
-   **Chemins absolus dans les fichiers source :** Ne jamais utiliser de chemins absolus en dur dans les fichiers source soumis à Git. Utiliser des chemins relatifs ou des variables d'environnement comme `__dirname`.
-   **Modifications du code existant :** Ne pas modifier le code existant (y compris les tests) tant que ce n'est pas strictement nécessaire à la tâche principale. Créer de nouveaux fichiers pour les nouveaux tests.
-   **Correction d'erreurs :** Corriger une seule erreur à la fois et re-tester pour vérifier la validité de la correction.
-   **Commentaires dans le code :**
    -   Ajouter des commentaires avec parcimonie.
    -   Se concentrer sur le *pourquoi* quelque chose est fait, pas sur le *quoi*.
    -   Ne jamais décrire les modifications apportées ou parler à l'utilisateur via des commentaires dans le code.
    -   Supprimer les commentaires inutiles ou redondants.
-   **Tests `instanceof` :** L'utilisation de `expect(...).toBeInstanceOf()` est acceptable dans les tests. La consigne d'éviter `instanceof` concerne l'utilisation du mot-clé `instanceof` dans le code de production lui-même.
-   **Listes dans les documents :** Ne pas utiliser de chiffres pour les listes si l'ordre séquentiel n'est pas important. Utiliser des puces (`-`).

## Corrections et Leçons Apprises

-   **Correction : Structure du projet (Git dans Git)**
    -   **Mon action :** J'ai travaillé sur un dépôt Git cloné à l'intérieur d'un autre.
    -   **Raison de la correction :** C'est une mauvaise pratique qui mène à la confusion.
    -   **Ce que j'aurais dû faire :** Identifier le problème et proposer de déplacer le dépôt dans un répertoire frère immédiatement.

-   **Correction : Stratégie de test (Mocks vs Réel)**
    -   **Mon action :** J'ai initialement proposé de mocker `axios`, puis j'ai été bloqué sur la manière de tester les erreurs 429/503 sans mocks.
    -   **Raison de la correction :** La consigne est de tester au plus proche des conditions réelles. Un compromis a été trouvé : utiliser un serveur HTTP réel pour les erreurs reproductibles (404) et ne mocker que la couche la plus basse (`RequestBase.request`) pour les erreurs non reproductibles (429, 503) afin de tester la logique de `retry`.
    -   **Ce que j'aurais dû faire :** Proposer une stratégie de test mixte (réel + mock ciblé) en justifiant pourquoi certaines parties sont impossibles à tester en conditions réelles de manière fiable.

-   **Correction : Environnement d'exécution du serveur de test (Deno vs Node.js)**
    -   **Mon action :** J'ai supposé l'environnement Deno pour le serveur de test.
    -   **Raison de la correction :** Erreur fondamentale de compréhension de l'environnement d'exécution du projet (Node.js).
    -   **Ce que j'aurais dû faire :** Vérifier systématiquement l'environnement d'exécution (ex: `package.json`, `npm test`) avant de proposer des solutions spécifiques à un runtime.

-   **Correction : Typage des erreurs dans les `catch`**
    -   **Mon action :** J'ai utilisé `catch (e: any)`.
    -   **Raison de la correction :** Non-respect des bonnes pratiques TypeScript. Il est préférable de vérifier le type de l'erreur avec `toBeInstanceOf` puis de caster la variable pour accéder à ses propriétés de manière sûre.
    -   **Ce que j'aurais dû faire :** Appliquer les bonnes pratiques TypeScript pour le typage des erreurs.

-   **Correction : Format de réponse ("JUSTE LES MODIFICATIONS")**
    -   **Mon action :** J'ai fourni le contenu complet du fichier au lieu des modifications précises.
    -   **Raison de la correction :** Non-respect d'une consigne explicite et répétée sur le format de la réponse.
    -   **Ce que j'aurais dû faire :** Fournir les modifications sous forme d'opérations de remplacement précises ou de diff, comme demandé.

-   **Correction : Modification de fichiers de documentation (`axios-to-fetch.md`)**
    -   **Mon action :** J'ai proposé de réécrire complètement le fichier, supprimant des informations valides.
    -   **Raison de la correction :** La consigne est de ne faire que des ajouts ou des corrections factuelles, pas des réécritures complètes qui pourraient entraîner une perte d'information.
    -   **Ce que j'aurais dû faire :** Utiliser `read_file` puis `replace` pour ajouter ou corriger des sections spécifiques, en préservant le contenu existant.

-   **Correction : Analyse des échecs de test**
    -   **Mon action :** Face à des tests qui échouaient de manière inattendue, j'ai conclu à tort que le code source était défectueux et j'ai proposé de le "corriger".
    -   **Raison de la correction :** Le code source de référence est la seule source de vérité. Si les tests échouent, c'est que le comportement réel est différent de celui attendu par les tests. Le but est d'abord de comprendre ce comportement réel et de faire en sorte que les tests le valident, avant de modifier le code source.
    -   **Ce que j'aurais dû faire :** Toujours faire confiance au comportement du code source comme étant la référence. Adapter les tests pour qu'ils reflètent et valident ce comportement réel, même s'il semble incorrect. Cela crée un garde-fou fiable avant toute refactorisation.

-   **Correction : Descriptions des tests (`it(...)`)**
    -   **Mon action :** J'ai écrit des descriptions de test qui décrivaient le résultat attendu (ex: "should return GenericError...").
    -   **Raison de la correction :** La description d'un test doit décrire le scénario testé ou le cas d'utilisation, pas le résultat attendu. Le code du test est là pour vérifier le résultat.
    -   **Ce que j'aurais dû faire :** Écrire des descriptions de test concises et centrées sur le cas d'utilisation (ex: "404 Not Found HTTP response").

-   **Correction : Simplicité des tests**
    -   **Mon action :** J'ai ajouté une assertion `.toBeDefined()` dans un test de succès qui n'en avait pas besoin.
    -   **Raison de la correction :** Un test doit être aussi simple que possible et ne valider que la condition strictement nécessaire. Pour un test de succès, vérifier que la promesse se résout (c'est-à-dire que `await` ne lance pas d'erreur) est suffisant.
    -   **Ce que j'aurais dû faire :** Éviter les assertions superflues et garder les tests focalisés sur leur objectif principal.
