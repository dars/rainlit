import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const tmp=mkdtempSync(join(tmpdir(),'owner-test-'));
try{execFileSync('./node_modules/.bin/tsc',['game/rain.ts','game/owner.ts','--outDir',tmp,'--module','commonjs','--target','es2020','--skipLibCheck','--resolveJsonModule','--esModuleInterop']);const require=createRequire(import.meta.url);const {initial,advance,choices,restore}=require(join(tmp,'game/rain.js'));const {ownerFacts,ownerReplyValid}=require(join(tmp,'game/owner.js'));
let s=initial();assert.equal(advance(s,'owner_intro').state.ownerPhase,null);
s={...s,phase:'departed',umbrella:'outside',attachment:'released',wantsLeave:true};assert.equal(choices(s)[0].action,'owner_intro');s=advance(s,'owner_intro').state;assert.equal(s.ownerPhase,'seated');assert(!JSON.stringify(ownerFacts(s)).includes('只叮嚀六點'));
assert.equal(advance(s,'owner_regret').state.ownerPhase,'seated');
for(const a of ['owner_memory','owner_handoff','owner_regret'])s=advance(s,a).state;
assert.equal(s.ownerPhase,'regret');assert.equal(s.phase,'departed');assert.equal(s.umbrella,'outside');assert.equal(restore(s).ownerPhase,'regret');
s=advance(s,'player_leave').state;assert(s.exitAttempt);s=advance(s,'stay').state;assert.equal(s.ownerPhase,'regret');assert(!s.exitAttempt);assert.equal(advance(s,'leave').state.ownerPhase,'regret');const blocked=s;
for(const action of ['owner_release','owner_goodbye','owner_exit'])assert.equal(advance(blocked,action).state.ownerPhase,'regret');
assert.equal(advance(s,'owner_life').state.ownerPhase,'regret');
s=advance(s,'owner_mother').state;
for(const action of ['owner_life','owner_response'])s=advance(s,action).state;
assert.equal(s.ownerAttachment,'shaken');assert(!s.ownerWantsLeave);
assert(!ownerReplyValid('我該回去了。',s));assert(!ownerReplyValid('我已經死了。',s));
s=advance(s,'owner_release').state;
assert.equal(s.ownerAttachment,'released');assert(s.ownerWantsLeave);assert.equal(s.ownerPhase,'ready');
assert(ownerReplyValid('嗯，我也該回去了，走之前再聊兩句。',s));
assert.equal(advance(s,'chat').state.ownerPhase,'ready');assert.equal(restore(s).ownerPhase,'ready');
s=advance(s,'owner_goodbye').state;assert.equal(s.ownerPhase,'key');
const {cafeGuests,canPlayerLeave}=require(join(tmp,'game/cafe.js'));
assert(!cafeGuests(s).guest_owner.departed);assert.equal(advance(s,'owner_release').state.ownerPhase,'key');
s=advance(s,'owner_exit').state;assert.equal(s.ownerPhase,'departed');assert(cafeGuests(s).guest_owner.departed);assert(!canPlayerLeave(cafeGuests(s)));
s=advance(s,'owner_end').state;assert.equal(s.ownerPhase,'afterword');assert.equal(advance(s,'owner_intro').state.ownerPhase,'afterword');assert(advance(s,'player_leave').state.exitAttempt);
const legacy={...blocked};delete legacy.ownerVersion;assert.equal(restore(legacy).ownerPhase,'seated');assert.equal(restore(legacy).phase,'departed');
console.log('PASS owner full arc, prerequisite gates, farewell chat, key/exit distinction, legacy migration, Xiaohe exit lock');

}finally{rmSync(tmp,{recursive:true,force:true})}
