# Projet de Migration : Axios vers Fetch

Ce document récapitule la planification, les décisions et l'état d'avancement du projet de migration de `axios` vers `fetch` dans la librairie `twisted`.

## Objectif

Remplacer la dépendance `axios` par l'API native `fetch` pour améliorer la compatibilité avec les navigateurs web, moderniser la base de code et réduire la taille du bundle final.

## Planification et État d'Avancement

-   **[Terminé]** **Analyse initiale :** Identifier tous les points d'utilisation d'`axios` dans le code. Le point central est `src/base/request.base.ts`, avec une logique de gestion d'erreur complexe dans `src/base/base.ts`.

-   **[Terminé]** **Mise en place d'un garde-fou (Safety Net) :** Créer une suite de tests d'intégration robuste pour valider le comportement du code avant toute modification. 
    -   Un premier test (`data-dragon-service.test.ts`) a été créé pour `DataDragonService`, qui est un cas d'usage simple. Ce test effectue des appels réels à l'API externe et passe avec succès.
    -   Un second test (`base-api-http-error.test.ts`) a été créé pour couvrir la logique de gestion des erreurs HTTP de `BaseApi`. Après plusieurs itérations, ce test passe également avec succès, validant le comportement actuel de la librairie face aux erreurs HTTP.

-   **[En cours]** **Migration du code :**
    -   Créer une classe d'erreur `FetchError` qui imite la structure de `AxiosError` pour assurer la compatibilité avec la logique de gestion d'erreur existante. (Fait, mais pas encore utilisé).
    -   Modifier `DataDragonService` pour utiliser `fetch` et `FetchError`.
    -   Vérifier que la suite de tests (`run-fetch-tests.sh`) passe toujours à l'identique.
    -   Modifier `RequestBase` et `BaseApi` pour utiliser `fetch`.
    -   Vérifier de nouveau que toute la suite de tests passe à l'identique.

## Décisions Techniques et Leçons

-   **Stratégie de Test :** La décision a été prise d'adopter une stratégie de test d'intégration sans mocks de librairie.
    -   **Raison :** Il est crucial de tester au plus près des conditions réelles pour garantir que le remplacement de `axios` par `fetch` n'introduit pas de régressions. Le comportement réel d'une librairie face à une réponse HTTP (structure de l'erreur, etc.) est la seule source de vérité.
    -   **Implémentation :** Un serveur de test local (`http-test-server.ts`) est utilisé pour simuler toutes les réponses HTTP (200, 404, 429, 503). Cela permet de tester la réaction de `BaseApi` à des réponses HTTP réelles, y compris les en-têtes (`Retry-After`).

-   **Environnement de Test :**
    -   **Serveur :** Le serveur de test est un script TypeScript (`http-test-server.ts`) utilisant le module `http` natif de Node.js.
    -   **Exécution :** Le serveur est démarré avant les tests via `ts-node` depuis un hook `beforeAll` dans le fichier de test Jest. Le processus est arrêté dans `afterAll`. Un délai de démarrage de 7 secondes a été jugé nécessaire.
    -   **Raison :** Cette approche évite d'ajouter des dépendances de production (comme Express.js) et s'intègre bien à l'écosystème TypeScript/Jest existant.

-   **Structure des Tests :**
    -   Les nouveaux tests liés à cette migration sont isolés dans le répertoire `test/fetch/`.
    -   Un script `run-fetch-tests.sh` a été créé pour lancer uniquement cette suite de tests.

-   **Comportement de `BaseApi` :** Le processus de création des tests a révélé le comportement exact de la gestion d'erreur actuelle. Les tests ont été adaptés pour valider ce comportement existant, qui servira de référence pour la migration.