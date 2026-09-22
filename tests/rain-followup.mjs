import assert from 'node:assert/strict';
const base=process.env.TEST_ORIGIN||'http://127.0.0.1:8787';
async function post(path,body){const r=await fetch(`${base}/api/${path}`,{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.203'},body:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
let g=await post('start',{});const session=g.session;
async function turn(action,text){g=await post('turn',{session,revision:g.state.revision,turnId:crypto.randomUUID(),...(action?{action}:{text})});return g.lines.map(l=>l.text).join('');}
for(const a of ['greet','coffee','weather','waiting','take','give','invite','argument','permission','open'])await turn(a);
assert.equal(g.state.phase,'processing');
for(const q of ['妳不想搬家嗎？','為什麼不願意搬？','那他原本想搬去哪裡？']){
 const before={...g.state};const answer=await turn(null,q);assert(!g.fallback);assert(!answer.includes('事情我記得'));assert.match(answer,/搬|熟悉|老家/);assert.equal(g.state.phase,before.phase);assert.equal(g.state.processed,before.processed);assert.equal(g.state.umbrella,before.umbrella);assert(g.state.read);console.log(q,answer);
}
console.log('PASS post-letter follow-ups use character context without replay or advancement');
