import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:8787';
async function post(path,body){const r=await fetch(`${origin}/api/${path}`,{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.73'},body:JSON.stringify(body)});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;}
let game=await post('start',{});const session=game.session;
async function turn(action,text){game=await post('turn',{session,turnId:crypto.randomUUID(),revision:game.state.revision,...(action?{action}:{text})});}
for(const a of ['greet','coffee','weather','take','give'])await turn(a);
assert.ok(game.choices.some(c=>c.action==='hold'));
assert.ok(!game.choices.some(c=>c.action==='open'||c.action==='permission'));
await turn('hold');assert.equal(game.state.topic,'quiet');assert.ok(!game.choices.some(c=>c.action==='hold'));
await turn(null,'傘套裡那封信是什麼？我只是好奇，沒有要拆。');
assert.equal(game.fallback,false);
if(game.state.boundary==='paused'){assert.equal(game.state.topic,'quiet');assert.ok(game.choices.some(c=>c.action==='respect'));assert.ok(!game.choices.some(c=>c.action==='argument'));}
else{assert.equal(game.state.topic,'letter');assert.ok(game.choices.some(c=>c.action==='hold'));}
assert.equal(game.state.read,false);assert.equal(game.state.permission,false);
console.log(JSON.stringify({lines:game.lines,choices:game.choices},null,2));
const loaded=await post('load',{session});assert.deepEqual(loaded.choices,game.choices);
if(game.state.boundary==='paused'){await turn('respect');await turn('invite');}else await turn('hold');
await turn('waiting');assert.ok(game.choices.some(c=>c.action==='invite'));assert.ok(!game.choices.some(c=>c.action==='waiting'));
console.log('PASS: contextual suggestions, live Luna topic, no premature letter unlock, reload, consumed topic progression.');
