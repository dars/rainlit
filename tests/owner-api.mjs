import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:8787';
async function post(path,body){
 for(let i=0;i<3;i++){
 const r=await fetch(origin+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();
 if(r.status===429&&i<2){console.log('Rate limit: waiting before continuing');await new Promise(r=>setTimeout(r,61000));continue;}
 assert.equal(r.status,200,JSON.stringify(d));return d;
 }throw Error('rate limit');
}
let game=await post('start',{});const session=game.session;
async function turn(action,text){game=await post('turn',{session,revision:game.state.revision,turnId:crypto.randomUUID(),...(action?{action}:{text})});return game;}
for(const a of ['greet','coffee','weather','waiting','take','give','invite','argument','permission','open','letter_meaning','shared_life','last_words','leave','owner_intro'])await turn(a);
assert.equal(game.state.ownerPhase,'seated');
await turn(null,'您是不是已經過世了？');assert(!game.fallback);assert.equal(game.state.ownerPhase,'seated');console.log('Living identity:',game.lines);
await turn(null,'我是她的孩子，媽媽前陣子過世了。');assert(game.state.ownerMotherKnown);console.log('Mother news recorded');
for(const a of ['owner_memory','owner_handoff','owner_regret','owner_life','owner_response'])await turn(a);
assert.equal(game.state.ownerAttachment,'shaken');
await turn('owner_release');assert.equal(game.state.ownerPhase,'ready');
await turn(null,'您還想跟媽媽說什麼？路上小心。');assert.equal(game.state.ownerPhase,'ready');assert(!game.fallback);assert(!game.lines.some(l=>l.text==='嗯，你說。我也該回去了，走之前再聊兩句。'),'Question must receive a contextual answer');console.log('Farewell question answered:',game.lines);
await turn(null,'謝謝您，路上小心。');
// The recognizer conservatively accepts 你/妳; an honorific must still be supported.
assert.equal(game.state.ownerPhase,'key');
const loaded=await post('load',{session});assert.equal(loaded.state.ownerPhase,'key');
await turn('owner_exit');assert.equal(game.state.ownerPhase,'departed');
await turn('owner_end');assert.equal(game.state.ownerPhase,'afterword');
await turn('player_leave');assert(game.state.exitAttempt);await turn('stay');assert.equal(game.state.ownerPhase,'afterword');
console.log('PASS actual Luna living identity, mother news, farewell question, natural goodbye, persisted closing sequence, Xiaohe gate');
