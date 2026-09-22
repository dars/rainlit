import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:8787';
async function post(path,body){const r=await fetch(`${origin}/api/${path}`,{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.126'},body:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
let g=await post('start',{});const session=g.session;
async function turn(action){const body={session,revision:g.state.revision,turnId:crypto.randomUUID(),action};g=await post('turn',body);return body;}
for(const a of ['greet','coffee','waiting','invite','hurt','respect'])await turn(a);
assert.equal(g.state.boundary,'settled');
const replies=[];
for(let i=0;i<3;i++){
 const body=await turn('smalltalk');
 assert.equal(g.fallback,false);assert.equal(g.state.boundary,'settled');assert.equal(g.state.phase,'waiting');assert.equal(g.state.read,false);assert.equal(g.state.permission,false);
 assert(!g.choices.some(c=>c.action==='argument'));
 const text=g.lines.map(l=>l.text).join('');assert(!replies.includes(text));replies.push(text);
 assert.deepEqual(await post('turn',body),g);
}
assert.deepEqual((await post('load',{session})).state,g.state);
console.log(JSON.stringify(replies,null,2));console.log('PASS consecutive live smalltalk, no repeat, boundary preserved, replay cache and reload');
