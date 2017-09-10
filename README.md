# Enj: Treenipäiväkirja

Inferno + TSX, serviceWorker, Jersey

## Riippuvuudet

* Backend: Java 8, maven, MariaDb
* Dev-ympäristö: Node.js v6+

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
* Run:
    * `mvn exec:java`
* Build:
    * `mvn clean compile assembly:single`

## MariaDb

* `mysql mydb < backend/schema.mariadb.sql`
* `mysql mydb < backend/default-data.sql`