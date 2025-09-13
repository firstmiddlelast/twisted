# Notes Diverses

-   **Déclenchement des erreurs 429 :** Il a été noté qu'il serait théoriquement possible de déclencher une erreur 429 (Rate Limit) en "floodant" les API Riot de requêtes. Cependant, cette approche a été écartée pour ne pas risquer la révocation de la clé API.

-   **`instanceof` vs `.toBeInstanceOf()` :** Clarification a été faite que la consigne d'éviter `instanceof` s'applique au code de production. L'utilisation de l'assertion Jest `.toBeInstanceOf()` est la méthode encouragée pour vérifier les types d'erreur dans les tests.
