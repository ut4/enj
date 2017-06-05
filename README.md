# Enj: Treeni + ravintopäiväkirja

UBERPWA: Inferno + JSX, serviceWorker, Jersey

## Riippuvuudet

* Backend: Java 8, MariaDb
* Dev-ympäristö: Node v6+

## Frontend

* Run:
    * `npm start < nul` -> selaimella osoitteeseen http://localhost:8080
* Test:
    * Ks. ylempi ja -> selaimella osoitteeseen http://localhost:8080/tests.html
* Build:
    * `npm run build < nul` — Kirjoittaa käännetyn applikaation vendor-riippuvuuksineen public/bundle.js-tiedostoon (muistiin)
    * `java -jar D:/code2/compiler/compiler.jar --js public/bundle.js --js_output_file public/bundle.min.js --language_in=ES6 --language_out=ES5` - minify

## Backend

* Test:
    * `mvn test`
* Build:
    * `mvn compile`
* Run:
    * `mvn exec:java`

## MariaDb

* TODO