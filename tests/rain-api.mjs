import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:8787';
const headers={'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.20'};
async function post(path,body){const r=await fetch(origin+'/api/'+path,{method:'POST',headers,body:JSON.stringify(body)});if(r.status===429){await new Promise(resolve=>setTimeout(resolve,31000));await new Promise(resolve=>setTimeout(resolve,31000));return post(path,body);}return {status:r.status,data:await r.json()};}
let start=await post('start',{});assert.equal(start.status,200);let session=start.data.session,game=start.data;
async function turn(action,text){const body={session,turnId:crypto.randomUUID(),revision:game.state.revision,...(action?{action}:{text})};const r=await post('turn',body);assert.equal(r.status,200,JSON.stringify(r.data));game=r.data;return {body,r};}
assert.deepEqual(game.choices.map(c=>c.action),['greet']);
await turn('take');assert.equal(game.state.umbrella,'counter');
await turn('greet');assert.deepEqual(game.choices.map(c=>c.action),['coffee']);await turn('coffee');assert.ok(!game.choices.some(c=>c.action==='take'));
await turn('weather');assert.ok(game.choices.some(c=>c.action==='take'));
await turn('waiting');
const {body,r}=await turn('take');const duplicate=await post('turn',body);assert.deepEqual(duplicate.data,r.data);
await turn('give');assert.equal(game.state.umbrella,'table');
await turn('invite');await turn('argument');await turn('permission');await turn('open');assert.equal(game.state.phase,'processing');
await turn('sit');assert.equal(game.state.phase,'processing');await turn('sit');assert.equal(game.state.phase,'processing');await turn('letter_meaning');await turn('shared_life');await turn('last_words');assert.equal(game.state.phase,'ready');assert.equal(game.state.wantsLeave,true);await turn('sit');assert.equal(game.state.phase,'ready');await turn('leave');assert.equal(game.state.phase,'departed');
const loaded=await post('load',{session});assert.deepEqual(loaded.data.state,game.state);
await turn('chat');assert.equal(game.lines[0].speaker,'旁白');
console.log('PASS: progressive discovery, rejected impossible actions, idempotency, full departure, reload, no resurrection.');
