import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:8787';
async function post(path,body){const r=await fetch(`${origin}/api/${path}`,{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.181'},body:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
let g=await post('start',{});const session=g.session;
async function turn(action,text){g=await post('turn',{session,turnId:crypto.randomUUID(),revision:g.state.revision,...(action?{action}:{text})});}
for(const action of ['greet','coffee','weather','take'])await turn(action);
assert.deepEqual(g.choices.map(c=>c.action),['give']);assert(g.lines.some(l=>l.speaker==='雨蓉'&&l.text.includes('桌邊')));
for(const action of ['waiting','smalltalk','argument','sit','open']){await turn(action);assert.equal(g.state.umbrella,'player');assert.equal(g.state.phase,'waiting');assert.equal(g.state.waitingHeard,false);assert.equal(g.state.permission,false);assert.deepEqual(g.choices.map(c=>c.action),['give']);}
await turn(null,'妳以前在哪裡工作？');assert(g.lines.some(l=>l.text.includes('不用一直拿著')));assert.equal(g.state.umbrella,'player');
const loaded=await post('load',{session});assert.deepEqual(loaded.choices,g.choices);
await turn(null,'好，我把傘放到妳桌邊。');assert.equal(g.state.umbrella,'table');assert(!g.state.read);assert(!g.state.permission);assert(g.choices.some(c=>c.action==='waiting'));assert(!g.choices.some(c=>c.action==='give'));
console.log('PASS pickup reminder, priority handoff, blocked topic progression, live text handoff, reload, no letter permission');
