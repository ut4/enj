!function(){"use strict";function n(n){return"function"==typeof n}function t(n){return"[object Array]"===Object.prototype.toString.call(n)}function r(n){return n instanceof Date?n.getTime():n instanceof Array?n.map(r):n}function e(n,t){return n.get?n.get(t):n[t]}function u(n){return function(r,u){if(!t(u)||!u.length)return n(r,u);for(var o=0,i=u.length;o<i;o++)if(n(r,e(u,o)))return!0;return!1}}function o(n){return function(r,u){if(!t(u)||!u.length)return n(r,u);for(var o=0,i=u.length;o<i;o++)if(!n(r,e(u,o)))return!1;return!0}}function i(n,t){return n.v(n.a,t)}function f(n,t){for(var r=0;r<n.length;r++)if(i(t,e(n,r)))return r;return-1}function c(n,t){return{a:n,v:t}}function a(n,t){var r=[];return l(t,n.k,0,r),1===r.length?i(n.nv,r[0]):!!~f(r,n.nv)}function l(n,r,u,o){if(u===r.length||void 0==n)return void o.push(n);var i=e(r,u);if(t(n)&&isNaN(Number(i)))for(var f=0,c=n.length;f<c;f++)l(e(n,f),r,u,o);else l(e(n,i),r,u+1,o)}function p(n,t){return{a:{k:n,nv:t},v:a}}function s(n){return"Object"===String(n.constructor)||"functionObject(){[nativecode]}"===String(n.constructor).replace(/[\r\n\s\t]/g,"")}function $(n){n=r(n),n&&s(n)||(n={$eq:n});var t=[];for(var e in n){var u=n[e];if("$options"!==e)if(v[e])h[e]&&(u=h[e](u,n)),t.push(c(r(u),v[e]));else{if(36===e.charCodeAt(0))throw new Error("Unknown operation "+e);t.push(p(e.split("."),$(u)))}}return 1===t.length?t[0]:c(t,v.$and)}function g(n,t){var r=$(n);return t&&(r={a:r,v:function(n,r){return i(n,t(r))}}),r}function d(t,r,e){function u(n){return i(o,n)}n(r)&&(e=r,r=void 0);var o=g(t,e);return r?r.filter(u):u}var v={$eq:u(function(n,t){return n(t)}),$ne:o(function(n,t){return!n(t)}),$or:function(n,t){for(var r=0,u=n.length;r<u;r++)if(i(e(n,r),t))return!0;return!1},$gt:u(function(n,t){return d.compare(r(t),n)>0}),$gte:u(function(n,t){return d.compare(r(t),n)>=0}),$lt:u(function(n,t){return d.compare(r(t),n)<0}),$lte:u(function(n,t){return d.compare(r(t),n)<=0}),$mod:u(function(n,t){return t%n[0]==n[1]}),$in:function(n,t){if(!(t instanceof Array)){var u=r(t);if(u===t&&"object"==typeof t)for(var o=n.length;o--;)if(String(n[o])===String(t)&&"[object Object]"!==String(t))return!0;if("undefined"==typeof u)for(var o=n.length;o--;)if(null==n[o])return!0;return Boolean(!!~n.indexOf(r(t)))}for(var o=t.length;o--;)if(~n.indexOf(r(e(t,o))))return!0;return!1},$nin:function(n,t){return!v.$in(n,t)},$not:function(n,t){return!i(n,t)},$type:function(n,t){return void 0!=t&&(t instanceof n||t.constructor==n)},$all:function(n,t){return v.$and(n,t)},$size:function(n,t){return!!t&&n===t.length},$nor:function(n,t){for(var r=0,u=n.length;r<u;r++)if(i(e(n,r),t))return!1;return!0},$and:function(n,t){t||(t=[]);for(var r=0,u=n.length;r<u;r++)if(!i(e(n,r),t))return!1;return!0},$regex:u(function(n,t){return"string"==typeof t&&n.test(t)}),$where:function(n,t){return n.call(t,t)},$elemMatch:function(n,r){return t(r)?!!~f(r,n):i(n,r)},$exists:function(n,t){return void 0!=t===n}},h={$eq:function(n){return n instanceof RegExp?function(t){return"string"==typeof t&&n.test(t)}:n instanceof Function?n:t(n)&&!n.length?function(n){return t(n)&&!n.length}:null===n?function(n){return null==n}:function(t){return 0===d.compare(r(t),n)}},$ne:function(n){return h.$eq(n)},$and:function(n){return n.map($)},$all:function(n){return h.$and(n)},$or:function(n){return n.map($)},$nor:function(n){return n.map($)},$not:function(n){return $(n)},$regex:function(n,t){return new RegExp(n,t.$options)},$where:function(n){return"string"==typeof n?new Function("obj","return "+n):n},$elemMatch:function(n){return $(n)},$exists:function(n){return!!n}};d.use=function(t){if(n(t))return t(d);for(var r in t)36===r.charCodeAt(0)&&(v[r]=t[r])},d.indexOf=function(n,t,r){return f(t,g(n,r))},d.compare=function(n,t){if(n===t)return 0;if(typeof n==typeof t){if(n>t)return 1;if(n<t)return-1}},"undefined"!=typeof module&&"undefined"!=typeof module.exports&&(Object.defineProperty(exports,"__esModule",{value:!0}),exports["default"]=d,module.exports=exports["default"]),"undefined"!=typeof window&&(window.sift=d),"undefined"!=typeof self&&(self.sift=d)}();