import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const tmp=mkdtempSync(join(tmpdir(),'owner-test-'));
try{execFileSync('./node_modules/.bin/tsc',['game/rain.ts','game/owner.ts','--outDir',tmp,'--module','commonjs','--target','es2020','--skipLibCheck','--resolveJsonModule','--esModuleInterop']);const require=createRequire(import.meta.url);const {initial,advance,choices,restore}=require(join(tmp,'game/rain.js'));const {ownerFacts}=require(join(tmp,'game/owner.js'));
let s=initial();assert.equal(advance(s,'owner_intro').state.ownerPhase,null);
s={...s,phase:'departed',umbrella:'outside',attachment:'released',wantsLeave:true};assert.equal(choices(s)[0].action,'owner_intro');s=advance(s,'owner_intro').state;assert.equal(s.ownerPhase,'seated');assert(!JSON.stringify(ownerFacts(s)).includes('只叮嚀六點'));
assert.equal(advance(s,'owner_regret').state.ownerPhase,'seated');
for(const a of ['owner_memory','owner_handoff','owner_regret'])s=advance(s,a).state;
assert.equal(s.ownerPhase,'regret');assert.equal(s.phase,'departed');assert.equal(s.umbrella,'outside');assert.equal(restore(s).ownerPhase,'regret');
s=advance(s,'player_leave').state;assert(s.exitAttempt);s=advance(s,'stay').state;assert.equal(s.ownerPhase,'regret');assert(!s.exitAttempt);assert.equal(advance(s,'leave').state.ownerPhase,'regret');console.log('PASS owner transition, gates, persistence, no Rain resurrection, player exit remains blocked');
}finally{rmSync(tmp,{recursive:true,force:true})}
