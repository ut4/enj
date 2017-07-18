# Enj: Treeni + ravintopäiväkirja

UBERPWA: Inferno + TSX, serviceWorker, Jersey

## Riippuvuudet

* Backend: Java 8, maven, MariaDb
* Dev-ympäristö: Node v6+

## Frontend

* Run:
    * `npm start` -> selaimella osoitteeseen http://localhost:8080
* Test:
    * Sama kuin yllä -> selaimella osoitteeseen http://localhost:8080/tests.html
* Build:
    * `npm run build` - Kirjoittaa käännetyn applikaation vendor-riippuvuuksineen public/bundle.js-tiedostoon

## Backend

* Test:
    * `mvn test`
* Build:
    * `mvn compile`
* Run:
    * `mvn exec:java`

## MariaDb

* TODO