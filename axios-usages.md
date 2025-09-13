# Analyse de l'utilisation d'Axios

Ce document détaille les différents points d'intégration de la librairie `axios`
dans le projet et esquisse la stratégie de migration vers `fetch`.

## Utilisation Principale

L'utilisation d'`axios` est centralisée autour de deux fichiers principaux dans
`src/base/`.

### `src/base/request.base.ts`

- **Rôle :** C'est le wrapper de plus bas niveau pour les appels réseau.
- **Implémentation :** Il exporte une classe `RequestBase` qui utilise une
  `PromiseQueue` pour limiter le nombre de requêtes concurrentes. La méthode
  statique `sendRequest` encapsule l'appel `Axios(options)`.
- **Stratégie de migration :** La fonction `sendRequest` est le point central à
  modifier. L'appel `Axios(options)` doit être remplacé par un appel
  `fetch(options.url, fetchOptions)`. Il faudra construire l'objet
  `fetchOptions` à partir de `AxiosRequestConfig` (notamment pour les headers,
  la méthode, et le corps de la requête).

### `src/base/base.ts`

- **Rôle :** C'est la classe mère de toutes les APIs (LOL, TFT, etc.). Elle
  contient la logique métier la plus importante.
- **Implémentation :**
  - Elle construit l'objet de configuration `AxiosRequestConfig`.
  - Elle implémente la logique de **nouvelles tentatives (retry)** en cas
    d'erreur `429 (Too Many Requests)` ou `503 (Service Unavailable)`.
  - Elle interprète les en-têtes de réponse pour extraire les informations de
    "rate limiting".
  - Elle appelle `RequestBase.request` pour exécuter la requête.
- **Stratégie de migration :**
  - La logique de `retry` existante est fonctionnelle. Pour la préserver, la
    nouvelle implémentation basée sur `fetch` devra lancer une erreur lorsque
    `!response.ok`.
- Cette erreur devra avoir une structure similaire à `AxiosError` (notamment les
  propriétés `response.status` et `response.headers`) pour que les méthodes
  `getError`, `isRateLimitError` et `isServiceUnavailableError` continuent de
  fonctionner à l\'identique.

## Utilisations Secondaires (plus simples)

Certains fichiers utilisent `axios` de manière directe et simple, ce qui en fait
de bons candidats pour une première étape de migration.

### `src/apis/lol/dataDragon/DataDragonService.ts` et `src/apis/lol/seed/seed.ts`

- **Rôle :** Récupérer des données statiques depuis des APIs publiques.
- **Implémentation :** Appellent directement `(await Axios(options)).data`.
- **Stratégie de migration :** Remplacer l'appel par
  `(await fetch(options.url)).json()`. En cas d'erreur HTTP (`!response.ok`),
  une `FetchError` sera lancée.

### `src/constants/champions.ts`

- **Rôle :** Mettre à jour périodiquement la liste des champions.
- **Implémentation :** Un simple appel `Axios(URL)`.
- **Stratégie de migration :** Remplacer par `fetch(URL)`. Également très
  direct.

## Gestion des Erreurs

### `src/errors/Generic.error.ts`

- **Rôle :** Définir une classe d'erreur personnalisée.
- **Implémentation :** Le constructeur prend une erreur de type
  `Axios.AxiosError` en paramètre pour en extraire le statut et le corps de la
  réponse.
- **Stratégie de migration :** Une classe d'erreur personnalisée, `FetchError`,
  a été créée. Elle est instanciée à partir de l'objet `Response` de `fetch` et
  expose une structure de données (`response.status`, `response.data`,
  `response.headers`) similaire à celle d'`AxiosError` pour garantir la
  compatibilité avec la logique de `BaseApi`.
