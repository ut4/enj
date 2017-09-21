declare var Inferno: any;
declare var Pikaday: any;
declare var Chartist: any;

declare module "pikaday" {
    export default Pikaday;
}
declare module "chartist" {
    export default Chartist;
}
declare module "history" {
    var createHashHistory: Function;
    export { createHashHistory };
}
declare module "dexie" {
    export default Dexie;
}
declare module "sinon" {
    export default sinon;
}
declare module "qunitjs" {
    export default QUnit;
}
declare module "sw" {
    export default SWManager;
}
