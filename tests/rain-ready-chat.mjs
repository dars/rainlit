import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:8787';
async function post(path,body){const r=await fetch(origin+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.91'},body:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
let game=await post('start',{});const session=game.session;
async function turn(action,text){game=await post('turn',{session,revision:game.state.revision,turnId:crypto.randomUUID(),...(action?{action}:{text})});}
for(const a of ['greet','coffee','weather','waiting','take','give','invite','argument','permission','open','letter_meaning','shared_life','last_words','sit'])await turn(a);
assert.equal(game.state.phase,'ready');
for(const text of ['妳要去哪裡？','等等，妳還會回來嗎？']){await turn(null,text);assert.equal(game.state.phase,'ready');assert.equal(game.state.umbrella,'table');assert(!game.fallback,'Expected actual model answer');assert(game.lines.some(l=>l.speaker==='雨蓉'));console.log(text,game.lines);}
await turn(null,'謝謝妳，路上小心。');assert.equal(game.state.phase,'departed');console.log('PASS ready questions answered without departure, natural farewell departs');
