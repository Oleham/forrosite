var app=function(){"use strict";function t(){}const e=t=>t;function n(t){return t()}function r(){return Object.create(null)}function o(t){t.forEach(n)}function l(t){return"function"==typeof t}function s(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}let c;function i(t,e){return c||(c=document.createElement("a")),c.href=e,t===c.href}function a(t){return null==t?"":t}const u="undefined"!=typeof window;let h=u?()=>window.performance.now():()=>Date.now(),f=u?t=>requestAnimationFrame(t):t;const d=new Set;function p(t){d.forEach((e=>{e.c(t)||(d.delete(e),e.f())})),0!==d.size&&f(p)}let m=!1;function g(t,e,n,r){for(;t<e;){const o=t+(e-t>>1);n(o)<=r?t=o+1:e=o}return t}function v(t){if(!t)return document;const e=t.getRootNode?t.getRootNode():t.ownerDocument;return e&&e.host?e:t.ownerDocument}function $(t){const e=w("style");return function(t,e){!function(t,e){t.appendChild(e)}(t.head||t,e)}(v(t),e),e}function _(t,e){if(m){for(!function(t){if(t.hydrate_init)return;t.hydrate_init=!0;let e=t.childNodes;if("HEAD"===t.nodeName){const t=[];for(let n=0;n<e.length;n++){const r=e[n];void 0!==r.claim_order&&t.push(r)}e=t}const n=new Int32Array(e.length+1),r=new Int32Array(e.length);n[0]=-1;let o=0;for(let t=0;t<e.length;t++){const l=e[t].claim_order,s=(o>0&&e[n[o]].claim_order<=l?o+1:g(1,o,(t=>e[n[t]].claim_order),l))-1;r[t]=n[s]+1;const c=s+1;n[c]=t,o=Math.max(c,o)}const l=[],s=[];let c=e.length-1;for(let t=n[o]+1;0!=t;t=r[t-1]){for(l.push(e[t-1]);c>=t;c--)s.push(e[c]);c--}for(;c>=0;c--)s.push(e[c]);l.reverse(),s.sort(((t,e)=>t.claim_order-e.claim_order));for(let e=0,n=0;e<s.length;e++){for(;n<l.length&&s[e].claim_order>=l[n].claim_order;)n++;const r=n<l.length?l[n]:null;t.insertBefore(s[e],r)}}(t),(void 0===t.actual_end_child||null!==t.actual_end_child&&t.actual_end_child.parentElement!==t)&&(t.actual_end_child=t.firstChild);null!==t.actual_end_child&&void 0===t.actual_end_child.claim_order;)t.actual_end_child=t.actual_end_child.nextSibling;e!==t.actual_end_child?void 0===e.claim_order&&e.parentNode===t||t.insertBefore(e,t.actual_end_child):t.actual_end_child=e.nextSibling}else e.parentNode===t&&null===e.nextSibling||t.appendChild(e)}function b(t,e,n){t.insertBefore(e,n||null)}function y(t,e,n){m&&!n?_(t,e):e.parentNode===t&&e.nextSibling==n||t.insertBefore(e,n||null)}function k(t){t.parentNode.removeChild(t)}function E(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function w(t){return document.createElement(t)}function x(t){return document.createTextNode(t)}function T(){return x(" ")}function N(){return x("")}function j(t,e,n,r){return t.addEventListener(e,n,r),()=>t.removeEventListener(e,n,r)}function D(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function I(t){return Array.from(t.childNodes)}function S(t){void 0===t.claim_info&&(t.claim_info={last_index:0,total_claimed:0})}function A(t,e,n,r,o=!1){S(t);const l=(()=>{for(let r=t.claim_info.last_index;r<t.length;r++){const l=t[r];if(e(l)){const e=n(l);return void 0===e?t.splice(r,1):t[r]=e,o||(t.claim_info.last_index=r),l}}for(let r=t.claim_info.last_index-1;r>=0;r--){const l=t[r];if(e(l)){const e=n(l);return void 0===e?t.splice(r,1):t[r]=e,o?void 0===e&&t.claim_info.last_index--:t.claim_info.last_index=r,l}}return r()})();return l.claim_order=t.claim_info.total_claimed,t.claim_info.total_claimed+=1,l}function O(t,e,n){return function(t,e,n,r){return A(t,(t=>t.nodeName===e),(t=>{const e=[];for(let r=0;r<t.attributes.length;r++){const o=t.attributes[r];n[o.name]||e.push(o.name)}e.forEach((e=>t.removeAttribute(e)))}),(()=>r(e)))}(t,e,n,w)}function B(t,e){return A(t,(t=>3===t.nodeType),(t=>{const n=""+e;if(t.data.startsWith(n)){if(t.data.length!==n.length)return t.splitText(n.length)}else t.data=n}),(()=>x(e)),!0)}function P(t){return B(t," ")}function V(t,e,n){for(let r=n;r<t.length;r+=1){const n=t[r];if(8===n.nodeType&&n.textContent.trim()===e)return r}return t.length}function F(t){const e=V(t,"HTML_TAG_START",0),n=V(t,"HTML_TAG_END",e);if(e===n)return new R;S(t);const r=t.splice(e,n+1);k(r[0]),k(r[r.length-1]);const o=r.slice(1,r.length-1);for(const e of o)e.claim_order=t.claim_info.total_claimed,t.claim_info.total_claimed+=1;return new R(o)}function H(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}function C(t,e,n,r){t.style.setProperty(e,n,r?"important":"")}function L(t,e,n){t.classList[n?"add":"remove"](e)}function M(t,e,n=!1){const r=document.createEvent("CustomEvent");return r.initCustomEvent(t,n,!1,e),r}class R extends class{constructor(){this.e=this.n=null}c(t){this.h(t)}m(t,e,n=null){this.e||(this.e=w(e.nodeName),this.t=e,this.c(t)),this.i(n)}h(t){this.e.innerHTML=t,this.n=Array.from(this.e.childNodes)}i(t){for(let e=0;e<this.n.length;e+=1)b(this.t,this.n[e],t)}p(t){this.d(),this.h(t),this.i(this.a)}d(){this.n.forEach(k)}}{constructor(t){super(),this.e=this.n=null,this.l=t}c(t){this.l?this.n=this.l:super.c(t)}i(t){for(let e=0;e<this.n.length;e+=1)y(this.t,this.n[e],t)}}const U=new Set;let G,z=0;function X(t,e){const n=(t.style.animation||"").split(", "),r=n.filter(e?t=>t.indexOf(e)<0:t=>-1===t.indexOf("__svelte")),o=n.length-r.length;o&&(t.style.animation=r.join(", "),z-=o,z||f((()=>{z||(U.forEach((t=>{const e=t.__svelte_stylesheet;let n=e.cssRules.length;for(;n--;)e.deleteRule(n);t.__svelte_rules={}})),U.clear())})))}function q(t){G=t}function W(){if(!G)throw new Error("Function called outside component initialization");return G}function Z(){const t=W();return(e,n)=>{const r=t.$$.callbacks[e];if(r){const o=M(e,n);r.slice().forEach((e=>{e.call(t,o)}))}}}const Y=[],K=[],J=[],Q=[],tt=Promise.resolve();let et=!1;function nt(t){J.push(t)}let rt=!1;const ot=new Set;function lt(){if(!rt){rt=!0;do{for(let t=0;t<Y.length;t+=1){const e=Y[t];q(e),st(e.$$)}for(q(null),Y.length=0;K.length;)K.pop()();for(let t=0;t<J.length;t+=1){const e=J[t];ot.has(e)||(ot.add(e),e())}J.length=0}while(Y.length);for(;Q.length;)Q.pop()();et=!1,rt=!1,ot.clear()}}function st(t){if(null!==t.fragment){t.update(),o(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(nt)}}let ct;function it(t,e,n){t.dispatchEvent(M(`${e?"intro":"outro"}${n}`))}const at=new Set;let ut;function ht(){ut={r:0,c:[],p:ut}}function ft(){ut.r||o(ut.c),ut=ut.p}function dt(t,e){t&&t.i&&(at.delete(t),t.i(e))}function pt(t,e,n,r){if(t&&t.o){if(at.has(t))return;at.add(t),ut.c.push((()=>{at.delete(t),r&&(n&&t.d(1),r())})),t.o(e)}}const mt={duration:0};function gt(n,r,o){let s,c,i=r(n,o),a=!1,u=0;function m(){s&&X(n,s)}function g(){const{delay:r=0,duration:o=300,easing:l=e,tick:g=t,css:_}=i||mt;_&&(s=function(t,e,n,r,o,l,s,c=0){const i=16.666/r;let a="{\n";for(let t=0;t<=1;t+=i){const r=e+(n-e)*l(t);a+=100*t+`%{${s(r,1-r)}}\n`}const u=a+`100% {${s(n,1-n)}}\n}`,h=`__svelte_${function(t){let e=5381,n=t.length;for(;n--;)e=(e<<5)-e^t.charCodeAt(n);return e>>>0}(u)}_${c}`,f=v(t);U.add(f);const d=f.__svelte_stylesheet||(f.__svelte_stylesheet=$(t).sheet),p=f.__svelte_rules||(f.__svelte_rules={});p[h]||(p[h]=!0,d.insertRule(`@keyframes ${h} ${u}`,d.cssRules.length));const m=t.style.animation||"";return t.style.animation=`${m?`${m}, `:""}${h} ${r}ms linear ${o}ms 1 both`,z+=1,h}(n,0,1,o,r,l,_,u++)),g(0,1);const b=h()+r,y=b+o;c&&c.abort(),a=!0,nt((()=>it(n,!0,"start"))),c=function(t){let e;return 0===d.size&&f(p),{promise:new Promise((n=>{d.add(e={c:t,f:n})})),abort(){d.delete(e)}}}((t=>{if(a){if(t>=y)return g(1,0),it(n,!0,"end"),m(),a=!1;if(t>=b){const e=l((t-b)/o);g(e,1-e)}}return a}))}let _=!1;return{start(){_||(_=!0,X(n),l(i)?(i=i(),(ct||(ct=Promise.resolve(),ct.then((()=>{ct=null}))),ct).then(g)):g())},invalidate(){_=!1},end(){a&&(m(),a=!1)}}}function vt(t,e){const n=e.token={};function r(t,r,o,l){if(e.token!==n)return;e.resolved=l;let s=e.ctx;void 0!==o&&(s=s.slice(),s[o]=l);const c=t&&(e.current=t)(s);let i=!1;e.block&&(e.blocks?e.blocks.forEach(((t,n)=>{n!==r&&t&&(ht(),pt(t,1,1,(()=>{e.blocks[n]===t&&(e.blocks[n]=null)})),ft())})):e.block.d(1),c.c(),dt(c,1),c.m(e.mount(),e.anchor),i=!0),e.block=c,e.blocks&&(e.blocks[r]=c),i&&lt()}if((o=t)&&"object"==typeof o&&"function"==typeof o.then){const n=W();if(t.then((t=>{q(n),r(e.then,1,e.value,t),q(null)}),(t=>{if(q(n),r(e.catch,2,e.error,t),q(null),!e.hasCatch)throw t})),e.current!==e.pending)return r(e.pending,0),!0}else{if(e.current!==e.then)return r(e.then,1,e.value,t),!0;e.resolved=t}var o}function $t(t){t&&t.c()}function _t(t,e){t&&t.l(e)}function bt(t,e,r,s){const{fragment:c,on_mount:i,on_destroy:a,after_update:u}=t.$$;c&&c.m(e,r),s||nt((()=>{const e=i.map(n).filter(l);a?a.push(...e):o(e),t.$$.on_mount=[]})),u.forEach(nt)}function yt(t,e){const n=t.$$;null!==n.fragment&&(o(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function kt(t,e){-1===t.$$.dirty[0]&&(Y.push(t),et||(et=!0,tt.then(lt)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function Et(e,n,l,s,c,i,a,u=[-1]){const h=G;q(e);const f=e.$$={fragment:null,ctx:null,props:i,update:t,not_equal:c,bound:r(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(n.context||(h?h.$$.context:[])),callbacks:r(),dirty:u,skip_bound:!1,root:n.target||h.$$.root};a&&a(f.root);let d=!1;if(f.ctx=l?l(e,n.props||{},((t,n,...r)=>{const o=r.length?r[0]:n;return f.ctx&&c(f.ctx[t],f.ctx[t]=o)&&(!f.skip_bound&&f.bound[t]&&f.bound[t](o),d&&kt(e,t)),n})):[],f.update(),d=!0,o(f.before_update),f.fragment=!!s&&s(f.ctx),n.target){if(n.hydrate){m=!0;const t=I(n.target);f.fragment&&f.fragment.l(t),t.forEach(k)}else f.fragment&&f.fragment.c();n.intro&&dt(e.$$.fragment),bt(e,n.target,n.anchor,n.customElement),m=!1,lt()}q(h)}class wt{$destroy(){yt(this,1),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}function xt(t,e,n){const r=t.slice();return r[4]=e[n],r}function Tt(t,e,n){const r=t.slice();return r[4]=e[n],r}function Nt(t){let e,n,r,o,l,s=t[4].id+"";function c(){return t[3](t[4])}return{c(){e=w("button"),n=x(s),this.h()},l(t){e=O(t,"BUTTON",{class:!0});var r=I(e);n=B(r,s),r.forEach(k),this.h()},h(){D(e,"class",r=a(t[4].id===t[0]?"tab active":"tab")+" svelte-16kitl9")},m(t,r){y(t,e,r),_(e,n),o||(l=j(e,"click",c),o=!0)},p(n,o){t=n,1&o&&r!==(r=a(t[4].id===t[0]?"tab active":"tab")+" svelte-16kitl9")&&D(e,"class",r)},d(t){t&&k(e),o=!1,l()}}}function jt(e){let n,r,o,l,s,c,i,a,u=e[4].text+"",h=e[4].cta+"";return{c(){n=w("div"),r=new R,o=T(),l=w("p"),s=w("button"),c=x(h),i=T(),this.h()},l(t){n=O(t,"DIV",{class:!0,id:!0});var e=I(n);r=F(e),o=P(e),l=O(e,"P",{});var a=I(l);s=O(a,"BUTTON",{class:!0});var u=I(s);c=B(u,h),u.forEach(k),a.forEach(k),i=P(e),e.forEach(k),this.h()},h(){r.a=o,D(s,"class","btn svelte-16kitl9"),D(n,"class","box svelte-16kitl9"),D(n,"id",a=e[4].id)},m(t,e){y(t,n,e),r.m(u,n),_(n,o),_(n,l),_(l,s),_(s,c),_(n,i)},p:t,d(t){t&&k(n)}}}function Dt(t){let e,n=t[0]===t[4].id&&jt(t);return{c(){n&&n.c(),e=N()},l(t){n&&n.l(t),e=N()},m(t,r){n&&n.m(t,r),y(t,e,r)},p(t,r){t[0]===t[4].id?n?n.p(t,r):(n=jt(t),n.c(),n.m(e.parentNode,e)):n&&(n.d(1),n=null)},d(t){n&&n.d(t),t&&k(e)}}}function It(e){let n,r,o,l=e[1],s=[];for(let t=0;t<l.length;t+=1)s[t]=Nt(Tt(e,l,t));let c=e[1],i=[];for(let t=0;t<c.length;t+=1)i[t]=Dt(xt(e,c,t));return{c(){n=w("div");for(let t=0;t<s.length;t+=1)s[t].c();r=T();for(let t=0;t<i.length;t+=1)i[t].c();o=N(),this.h()},l(t){n=O(t,"DIV",{class:!0});var e=I(n);for(let t=0;t<s.length;t+=1)s[t].l(e);e.forEach(k),r=P(t);for(let e=0;e<i.length;e+=1)i[e].l(t);o=N(),this.h()},h(){D(n,"class","tab-wrap svelte-16kitl9")},m(t,e){y(t,n,e);for(let t=0;t<s.length;t+=1)s[t].m(n,null);y(t,r,e);for(let n=0;n<i.length;n+=1)i[n].m(t,e);y(t,o,e)},p(t,[e]){if(7&e){let r;for(l=t[1],r=0;r<l.length;r+=1){const o=Tt(t,l,r);s[r]?s[r].p(o,e):(s[r]=Nt(o),s[r].c(),s[r].m(n,null))}for(;r<s.length;r+=1)s[r].d(1);s.length=l.length}if(3&e){let n;for(c=t[1],n=0;n<c.length;n+=1){const r=xt(t,c,n);i[n]?i[n].p(r,e):(i[n]=Dt(r),i[n].c(),i[n].m(o.parentNode,o))}for(;n<i.length;n+=1)i[n].d(1);i.length=c.length}},i:t,o:t,d(t){t&&k(n),E(s,t),t&&k(r),E(i,t),t&&k(o)}}}function St(t,e,n){let r="Forro";function o(t){n(0,r=t)}return[r,[{id:"Forro",text:"<h2>Klar for å danse?</h2>\n        <p>Forro er en lett tilgjengelig og populær dans fra Brasil. Den har blitt meget populær i Europa i løpet av de seneste årene. I Norge har ikke dansen vært så populær ennå.</p>\n        <p>Mer informasjon om Forro kommer på denne siden. Her kan du bli kjent med dansen og finne arrangementer her i Oslo.</p>",cta:"Les mer om Forro her"},{id:"Trinnene",text:"<h2>Trinnene?</h2>\n        <p>Forro er en pardans med en sånn og sånn rytme.</p>\n        <p>Trinnene er avslappede og med mindre hoftebevegelser enn f.eks. salsa.</p>",cta:"Se trinnene"},{id:"Musikken",text:"<h2>Trekkspill!</h2>\n    <p>Musikksjangeren Forro dreier seg stort sett om instrumentene trekkspill, tamburin og triangel.</p>\n    <p>Her ser du noen kjente Forro-artister.</p>",cta:"Hør musikken"}],o,t=>{o(t.id)}]}class At extends wt{constructor(t){super(),Et(this,t,St,It,s,{})}}function Ot(t,{delay:n=0,duration:r=400,easing:o=e}={}){const l=+getComputedStyle(t).opacity;return{delay:n,duration:r,easing:o,css:t=>"opacity: "+t*l}}function Bt(t,e,n){const r=t.slice();return r[4]=e[n],r}function Pt(e){let n,r;return{c(){n=w("button"),r=x("X"),this.h()},l(t){n=O(t,"BUTTON",{style:!0,class:!0});var e=I(n);r=B(e,"X"),e.forEach(k),this.h()},h(){C(n,"opacity","0"),D(n,"class","svelte-1su6ojj")},m(t,e){y(t,n,e),_(n,r)},p:t,d(t){t&&k(n)}}}function Vt(t){let e,n,r,o,l,s=t[0],c=[];for(let e=0;e<s.length;e+=1)c[e]=Ft(Bt(t,s,e));return{c(){for(let t=0;t<c.length;t+=1)c[t].c();e=T(),n=w("button"),r=x("X"),this.h()},l(t){for(let e=0;e<c.length;e+=1)c[e].l(t);e=P(t),n=O(t,"BUTTON",{style:!0,class:!0});var o=I(n);r=B(o,"X"),o.forEach(k),this.h()},h(){C(n,"color","red"),D(n,"class","svelte-1su6ojj")},m(s,i){for(let t=0;t<c.length;t+=1)c[t].m(s,i);y(s,e,i),y(s,n,i),_(n,r),o||(l=j(n,"click",t[2]),o=!0)},p(t,n){if(3&n){let r;for(s=t[0],r=0;r<s.length;r+=1){const o=Bt(t,s,r);c[r]?c[r].p(o,n):(c[r]=Ft(o),c[r].c(),c[r].m(e.parentNode,e))}for(;r<c.length;r+=1)c[r].d(1);c.length=s.length}},d(t){E(c,t),t&&k(e),t&&k(n),o=!1,l()}}}function Ft(t){let e,n,r,o,s=t[4].lang+"";return{c(){e=w("button"),n=x(s),this.h()},l(t){e=O(t,"BUTTON",{class:!0});var r=I(e);n=B(r,s),r.forEach(k),this.h()},h(){D(e,"class","svelte-1su6ojj")},m(s,c){y(s,e,c),_(e,n),r||(o=j(e,"click",(function(){l(t[1](t[4]))&&t[1](t[4]).apply(this,arguments)})),r=!0)},p(e,r){t=e,1&r&&s!==(s=t[4].lang+"")&&H(n,s)},d(t){t&&k(e),r=!1,o()}}}function Ht(e){let n;function r(t,e){return 0!=t[0].length?Vt:Pt}let o=r(e),l=o(e);return{c(){n=w("div"),l.c(),this.h()},l(t){n=O(t,"DIV",{class:!0});var e=I(n);l.l(e),e.forEach(k),this.h()},h(){D(n,"class","container svelte-1su6ojj")},m(t,e){y(t,n,e),l.m(n,null)},p(t,[e]){o===(o=r(t))&&l?l.p(t,e):(l.d(1),l=o(t),l&&(l.c(),l.m(n,null)))},i:t,o:t,d(t){t&&k(n),l.d()}}}function Ct(t,e,n){let{translations:r=[]}=e;const o=Z();return t.$$set=t=>{"translations"in t&&n(0,r=t.translations)},[r,function(t){o("changeLang",t)},function(){o("revertLang",{})}]}class Lt extends wt{constructor(t){super(),Et(this,t,Ct,Ht,s,{translations:0})}}function Mt(e){let n,r;return{c(){n=w("iframe"),this.h()},l(t){n=O(t,"IFRAME",{title:!0,width:!0,height:!0,style:!0,loading:!0,src:!0}),I(n).forEach(k),this.h()},h(){D(n,"title","map"),D(n,"width","200"),D(n,"height","200"),C(n,"border","0"),D(n,"loading","lazy"),n.allowFullscreen=!0,i(n.src,r="https://www.google.com/maps/embed/v1/place?key=AIzaSyAuhsOpwBdUmjiiDSDRnXZZOSHPhG9YD1s\n  &q="+e[0]+", Oslo+No")||D(n,"src",r)},m(t,e){y(t,n,e)},p(t,[e]){1&e&&!i(n.src,r="https://www.google.com/maps/embed/v1/place?key=AIzaSyAuhsOpwBdUmjiiDSDRnXZZOSHPhG9YD1s\n  &q="+t[0]+", Oslo+No")&&D(n,"src",r)},i:t,o:t,d(t){t&&k(n)}}}function Rt(t,e,n){let{adress:r="Uhørt"}=e;return t.$$set=t=>{"adress"in t&&n(0,r=t.adress)},[r]}class Ut extends wt{constructor(t){super(),Et(this,t,Rt,Mt,s,{adress:0})}}function Gt(e){let n,r,o,l,s,c,i,a;return r=new Lt({props:{translations:e[7]}}),r.$on("changeLang",e[10]),r.$on("revertLang",e[11]),{c(){n=w("div"),$t(r.$$.fragment),o=T(),l=w("div"),s=x("❌"),this.h()},l(t){n=O(t,"DIV",{class:!0});var e=I(n);_t(r.$$.fragment,e),o=P(e),l=O(e,"DIV",{class:!0});var c=I(l);s=B(c,"❌"),c.forEach(k),e.forEach(k),this.h()},h(){D(l,"class","exit-btn svelte-1vpe8w"),D(n,"class","lang-menu")},m(t,u){y(t,n,u),bt(r,n,null),_(n,o),_(n,l),_(l,s),c=!0,i||(a=j(l,"dblclick",e[9]),i=!0)},p:t,i(t){c||(dt(r.$$.fragment,t),c=!0)},o(t){pt(r.$$.fragment,t),c=!1},d(t){t&&k(n),yt(r),i=!1,a()}}}function zt(t){let e,n,r,o,l,s,c,i;return l=new Ut({props:{adress:t[4]}}),{c(){e=w("button"),n=x("Onde?"),r=T(),o=w("div"),$t(l.$$.fragment),this.h()},l(t){e=O(t,"BUTTON",{class:!0});var s=I(e);n=B(s,"Onde?"),s.forEach(k),r=P(t),o=O(t,"DIV",{style:!0});var c=I(o);_t(l.$$.fragment,c),c.forEach(k),this.h()},h(){D(e,"class","btn svelte-1vpe8w"),C(o,"display",t[3]?"block":"none")},m(a,u){y(a,e,u),_(e,n),y(a,r,u),y(a,o,u),bt(l,o,null),s=!0,c||(i=j(e,"click",t[12]),c=!0)},p(t,e){(!s||8&e)&&C(o,"display",t[3]?"block":"none")},i(t){s||(dt(l.$$.fragment,t),s=!0)},o(t){pt(l.$$.fragment,t),s=!1},d(t){t&&k(e),t&&k(r),t&&k(o),yt(l),c=!1,i()}}}function Xt(e){let n,r,o,l,s,c,i;return{c(){n=w("div"),r=w("h4"),o=x("Info:"),l=T(),s=w("p"),c=x(e[1]),this.h()},l(t){n=O(t,"DIV",{class:!0});var i=I(n);r=O(i,"H4",{});var a=I(r);o=B(a,"Info:"),a.forEach(k),l=P(i),s=O(i,"P",{class:!0});var u=I(s);c=B(u,e[1]),u.forEach(k),i.forEach(k),this.h()},h(){D(s,"class","svelte-1vpe8w"),D(n,"class","textbox svelte-1vpe8w")},m(t,e){y(t,n,e),_(n,r),_(r,o),_(n,l),_(n,s),_(s,c)},p(t,e){2&e&&H(c,t[1])},i(t){i||nt((()=>{i=gt(s,Ot,{delay:300}),i.start()}))},o:t,d(t){t&&k(n)}}}function qt(t){let e,n,r,o,l,s,c,a,u,h,f,d,p,m,g,v,$,b,E,N,S,A,V,F,C,M,R,U,G=t[2]&&Gt(t),z=t[2]&&zt(t),X=t[2]&&Xt(t);return{c(){e=w("div"),n=w("div"),r=w("div"),G&&G.c(),o=T(),l=w("h3"),s=x(t[0]),c=T(),a=w("div"),u=w("p"),h=x("🌎"),f=T(),d=w("p"),p=x(t[4]),m=T(),g=w("p"),v=x("🕔"),$=T(),b=w("p"),E=x(t[5]),N=T(),z&&z.c(),S=T(),X&&X.c(),A=T(),V=w("div"),F=w("img"),this.h()},l(i){e=O(i,"DIV",{class:!0});var _=I(e);n=O(_,"DIV",{class:!0});var y=I(n);r=O(y,"DIV",{class:!0});var w=I(r);G&&G.l(w),o=P(w),l=O(w,"H3",{});var x=I(l);s=B(x,t[0]),x.forEach(k),c=P(w),a=O(w,"DIV",{class:!0});var T=I(a);u=O(T,"P",{class:!0});var j=I(u);h=B(j,"🌎"),j.forEach(k),f=P(T),d=O(T,"P",{class:!0});var D=I(d);p=B(D,t[4]),D.forEach(k),m=P(T),g=O(T,"P",{class:!0});var H=I(g);v=B(H,"🕔"),H.forEach(k),$=P(T),b=O(T,"P",{class:!0});var C=I(b);E=B(C,t[5]),C.forEach(k),T.forEach(k),N=P(w),z&&z.l(w),w.forEach(k),S=P(y),X&&X.l(y),A=P(y),V=O(y,"DIV",{class:!0});var L=I(V);F=O(L,"IMG",{src:!0,alt:!0}),L.forEach(k),y.forEach(k),_.forEach(k),this.h()},h(){D(u,"class","svelte-1vpe8w"),D(d,"class","svelte-1vpe8w"),D(g,"class","svelte-1vpe8w"),D(b,"class","svelte-1vpe8w"),D(a,"class","infobox svelte-1vpe8w"),D(r,"class","card-header"),i(F.src,C=t[6].src)||D(F,"src",C),D(F,"alt",t[6].alt),D(V,"class","image-box svelte-1vpe8w"),D(n,"class","card svelte-1vpe8w"),L(n,"selected",t[2]),D(e,"class","wrapper svelte-1vpe8w"),L(e,"overlay",t[2])},m(i,k){y(i,e,k),_(e,n),_(n,r),G&&G.m(r,null),_(r,o),_(r,l),_(l,s),_(r,c),_(r,a),_(a,u),_(u,h),_(a,f),_(a,d),_(d,p),_(a,m),_(a,g),_(g,v),_(a,$),_(a,b),_(b,E),_(r,N),z&&z.m(r,null),_(n,S),X&&X.m(n,null),_(n,A),_(n,V),_(V,F),M=!0,R||(U=j(e,"click",t[8]),R=!0)},p(t,[l]){t[2]?G?(G.p(t,l),4&l&&dt(G,1)):(G=Gt(t),G.c(),dt(G,1),G.m(r,o)):G&&(ht(),pt(G,1,1,(()=>{G=null})),ft()),(!M||1&l)&&H(s,t[0]),t[2]?z?(z.p(t,l),4&l&&dt(z,1)):(z=zt(t),z.c(),dt(z,1),z.m(r,null)):z&&(ht(),pt(z,1,1,(()=>{z=null})),ft()),t[2]?X?(X.p(t,l),4&l&&dt(X,1)):(X=Xt(t),X.c(),dt(X,1),X.m(n,A)):X&&(X.d(1),X=null),4&l&&L(n,"selected",t[2]),4&l&&L(e,"overlay",t[2])},i(t){M||(dt(G),dt(z),dt(X),M=!0)},o(t){pt(G),pt(z),M=!1},d(t){t&&k(e),G&&G.d(),z&&z.d(),X&&X.d(),R=!1,U()}}}function Wt(t,e,n){let{event:r}=e,{title:o,where:l,when:s,img:c,description:i}=r,a=r.translations,u=!1;let h=!1;return t.$$set=t=>{"event"in t&&n(13,r=t.event)},[o,i,u,h,l,s,c,a,function(){n(2,u=!0)},function(){n(2,u=!1)},function(t){n(0,o=t.detail.title),n(1,i=t.detail.description)},function(){n(0,o=r.title),n(1,i=r.description)},function(){n(3,h=!h)},r]}class Zt extends wt{constructor(t){super(),Et(this,t,Wt,qt,s,{event:13})}}function Yt(t,e,n){const r=t.slice();return r[4]=e[n],r}function Kt(e){let n,r;return n=new Zt({props:{event:e[4]}}),{c(){$t(n.$$.fragment)},l(t){_t(n.$$.fragment,t)},m(t,e){bt(n,t,e),r=!0},p:t,i(t){r||(dt(n.$$.fragment,t),r=!0)},o(t){pt(n.$$.fragment,t),r=!1},d(t){yt(n,t)}}}function Jt(t){let e,n,r,o,l,s,c,i,a,u,h=t[0],f=[];for(let e=0;e<h.length;e+=1)f[e]=Kt(Yt(t,h,e));const d=t=>pt(f[t],1,1,(()=>{f[t]=null}));return{c(){e=w("h2"),n=x("Se de neste arrangementene --\x3e"),r=T(),o=w("div");for(let t=0;t<f.length;t+=1)f[t].c();l=T(),s=w("div"),c=x("+"),this.h()},l(t){e=O(t,"H2",{});var i=I(e);n=B(i,"Se de neste arrangementene --\x3e"),i.forEach(k),r=P(t),o=O(t,"DIV",{class:!0});var a=I(o);for(let t=0;t<f.length;t+=1)f[t].l(a);l=P(a),s=O(a,"DIV",{class:!0});var u=I(s);c=B(u,"+"),u.forEach(k),a.forEach(k),this.h()},h(){D(s,"class","more svelte-1vuf3ji"),D(o,"class","container svelte-1vuf3ji")},m(h,d){y(h,e,d),_(e,n),y(h,r,d),y(h,o,d);for(let t=0;t<f.length;t+=1)f[t].m(o,null);_(o,l),_(o,s),_(s,c),i=!0,a||(u=j(s,"click",t[1]),a=!0)},p(t,[e]){if(1&e){let n;for(h=t[0],n=0;n<h.length;n+=1){const r=Yt(t,h,n);f[n]?(f[n].p(r,e),dt(f[n],1)):(f[n]=Kt(r),f[n].c(),dt(f[n],1),f[n].m(o,l))}for(ht(),n=h.length;n<f.length;n+=1)d(n);ft()}},i(t){if(!i){for(let t=0;t<h.length;t+=1)dt(f[t]);i=!0}},o(t){f=f.filter(Boolean);for(let t=0;t<f.length;t+=1)pt(f[t]);i=!1},d(t){t&&k(e),t&&k(r),t&&k(o),E(f,t),a=!1,u()}}}function Qt(t,e,n){const r=Z();let{events:o=[{title:"Tittel",where:"Address",when:"01.02.04 10:00",img:{src:"image.jpeg",alt:"Alternativ tekst"},description:"Ta med danseskoene og kom!",translations:[{lang:"en",title:"Title",description:"Bring your dancing shoes!!"},{lang:"po",title:"Título",description:"Traga seus sapatos de dança!"}]}]}=e,l=o.slice(-3);return t.$$set=t=>{"events"in t&&n(2,o=t.events)},[l,function(){r("more")},o]}class te extends wt{constructor(t){super(),Et(this,t,Qt,Jt,s,{events:2})}}function ee(e){let n,r,o,l,s,c,a,u,h,f,d,p,m,g=e[0].title+"",v=e[0].ingress+"",$=e[0].body+"";return{c(){n=w("div"),r=w("img"),s=T(),c=w("h1"),a=x(g),u=T(),h=w("p"),f=w("strong"),d=x(v),p=T(),m=new R,this.h()},l(t){n=O(t,"DIV",{class:!0});var e=I(n);r=O(e,"IMG",{src:!0,alt:!0}),s=P(e),c=O(e,"H1",{});var o=I(c);a=B(o,g),o.forEach(k),u=P(e),h=O(e,"P",{});var l=I(h);f=O(l,"STRONG",{});var i=I(f);d=B(i,v),i.forEach(k),l.forEach(k),p=P(e),m=F(e),e.forEach(k),this.h()},h(){i(r.src,o=e[0].img.src)||D(r,"src",o),D(r,"alt",l=e[0].img.alt),m.a=null,D(n,"class","container svelte-11wsuqt")},m(t,e){y(t,n,e),_(n,r),_(n,s),_(n,c),_(c,a),_(n,u),_(n,h),_(h,f),_(f,d),_(n,p),m.m($,n)},p(t,[e]){1&e&&!i(r.src,o=t[0].img.src)&&D(r,"src",o),1&e&&l!==(l=t[0].img.alt)&&D(r,"alt",l),1&e&&g!==(g=t[0].title+"")&&H(a,g),1&e&&v!==(v=t[0].ingress+"")&&H(d,v),1&e&&$!==($=t[0].body+"")&&m.p($)},i:t,o:t,d(t){t&&k(n)}}}function ne(t,e,n){let{post:r={title:"Tittel",ingress:"Ingress",body:"<p>Body Text</p>",img:{src:"",alt:""}}}=e;var o;return o=()=>{n(0,r.body=function(t){let e=[];return t.split("\r\n\r\n").forEach((t=>{t.startsWith("# ")?e.push(t.replace("# ","<h3>")+"</h3>"):t.startsWith("![")&&t.endsWith(")")?e.push(t.replace("![",'<img alt="').replace("](",'" src="').replace(")",'"<br>')):e.push("<p>"+t+"</p>")})),e.join("\n")}(r.body),r)},W().$$.after_update.push(o),t.$$set=t=>{"post"in t&&n(0,r=t.post)},[r]}class re extends wt{constructor(t){super(),Et(this,t,ne,ee,s,{post:0})}}function oe(e){let n,r,o=e[6].message+"";return{c(){n=w("p"),r=x(o)},l(t){n=O(t,"P",{});var e=I(n);r=B(e,o),e.forEach(k)},m(t,e){y(t,n,e),_(n,r)},p(t,e){2&e&&o!==(o=t[6].message+"")&&H(r,o)},i:t,o:t,d(t){t&&k(n)}}}function le(t){let e,n;return e=new te({props:{events:t[5]}}),e.$on("more",t[2]),{c(){$t(e.$$.fragment)},l(t){_t(e.$$.fragment,t)},m(t,r){bt(e,t,r),n=!0},p(t,n){const r={};2&n&&(r.events=t[5]),e.$set(r)},i(t){n||(dt(e.$$.fragment,t),n=!0)},o(t){pt(e.$$.fragment,t),n=!1},d(t){yt(e,t)}}}function se(e){let n,r;return{c(){n=w("p"),r=x("venter")},l(t){n=O(t,"P",{});var e=I(n);r=B(e,"venter"),e.forEach(k)},m(t,e){y(t,n,e),_(n,r)},p:t,i:t,o:t,d(t){t&&k(n)}}}function ce(t){let e,n,r,o,l,s,c,i,a;e=new At({});let u={ctx:t,current:null,token:null,hasCatch:!0,pending:se,then:le,catch:oe,value:5,error:6,blocks:[,,,]};return vt(r=t[1],u),i=new re({props:{post:t[0]}}),{c(){$t(e.$$.fragment),n=T(),u.block.c(),o=T(),l=w("p"),s=x("Some static element"),c=T(),$t(i.$$.fragment)},l(t){_t(e.$$.fragment,t),n=P(t),u.block.l(t),o=P(t),l=O(t,"P",{});var r=I(l);s=B(r,"Some static element"),r.forEach(k),c=P(t),_t(i.$$.fragment,t)},m(t,r){bt(e,t,r),y(t,n,r),u.block.m(t,u.anchor=r),u.mount=()=>o.parentNode,u.anchor=o,y(t,o,r),y(t,l,r),_(l,s),y(t,c,r),bt(i,t,r),a=!0},p(e,[n]){t=e,u.ctx=t,2&n&&r!==(r=t[1])&&vt(r,u)||function(t,e,n){const r=e.slice(),{resolved:o}=t;t.current===t.then&&(r[t.value]=o),t.current===t.catch&&(r[t.error]=o),t.block.p(r,n)}(u,t,n);const o={};1&n&&(o.post=t[0]),i.$set(o)},i(t){a||(dt(e.$$.fragment,t),dt(u.block),dt(i.$$.fragment,t),a=!0)},o(t){pt(e.$$.fragment,t);for(let t=0;t<3;t+=1){pt(u.blocks[t])}pt(i.$$.fragment,t),a=!1},d(t){yt(e,t),t&&k(n),u.block.d(t),u.token=null,u=null,t&&k(o),t&&k(l),t&&k(c),yt(i,t)}}}function ie(t,e,n){let r={title:"Title",ingress:"Text",body:"Text",img:{src:"media/event-images/plassholder.jpg",alt:"Folkefest med forro"}};let o=async function(t){return(await fetch(`api/${t}`).catch((t=>{console.log(t)}))).json()}("events");return async function(){await fetch("api/posts").then((t=>t.json())).then((t=>{n(0,r=t[0])})).catch((t=>{console.log(t)}))}(),[r,o,function(){n(1,o=getEvents())}]}return new class extends wt{constructor(t){super(),Et(this,t,ie,ce,s,{})}}({target:document.getElementById("sap-app"),hydrate:!0})}();
//# sourceMappingURL=bundle.js.map
