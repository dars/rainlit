import assert from 'node:assert/strict';
const base=process.env.TEST_ORIGIN||'http://127.0.0.1:8787';
async function post(path,body){const r=await fetch(`${base}/api/${path}`,{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.195'},body:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
let g=await post('start',{});const session=g.session;
async function turn(action,text){g=await post('turn',{session,revision:g.state.revision,turnId:crypto.randomUUID(),...(action?{action}:{text})});return g.lines.map(l=>l.text).join('');}
for(const a of ['greet','coffee','waiting','invite','argument'])await turn(a);
for(const q of ['妳丈夫是怎麼離開的？','他怎麼走的？','他是因為生病過世的嗎？']){const answer=await turn(null,q);assert.match(answer,/車庫突然發病/);assert.equal(g.fallback,false);console.log(q,answer);}
assert.match(await turn(null,'他是不是已經過世了？'),/嗯，他已經過世了/);
assert.match(await turn(null,'他已經走了，妳知道嗎？'),/不是不知道/);
await turn('hurt');const before=g.state.phase;
for(const a of ['death','death_confirm','death_cause']){assert.match(await turn(a),/現在還不想談/);assert.equal(g.state.boundary,'paused');assert.equal(g.state.phase,before);}
console.log('PASS euphemistic cause questions, confirmation, notification, paused boundary');
