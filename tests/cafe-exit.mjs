import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const tmp=mkdtempSync(join(tmpdir(),'rain-character-'));
try{
 execFileSync('./node_modules/.bin/tsc',['game/rain-context.ts','game/rain.ts','game/types.ts','--outDir',tmp,'--module','commonjs','--target','es2020','--resolveJsonModule','--esModuleInterop','--skipLibCheck']);
 const require=createRequire(import.meta.url);
 const {rainContext}=require(join(tmp,'game/rain-context.js'));
 const {initial,advance,pauseConversation}=require(join(tmp,'game/rain.js'));
 const {choices}=require(join(tmp,'game/rain.js'));
 const {canPlayerLeave}=require(join(tmp,'game/cafe.js'));
 let s=initial();for(const a of ['greet','coffee','waiting','invite'])s=advance(s,a).state;
 const original={...s};s=advance(s,'player_leave').state;assert(s.exitAttempt);assert.equal(s.phase,original.phase);assert.equal(s.attachment,original.attachment);
 assert.deepEqual(choices(s).map(c=>c.action),['stay']);assert(advance(s,'argument').state.exitAttempt);
 s=advance(s,'stay').state;assert(!s.exitAttempt);assert.equal(s.phase,original.phase);
 s={...s,phase:'departed',attachment:'released',wantsLeave:true,umbrella:'outside'};
 s=advance(s,'player_leave').state;assert(s.exitAttempt);assert.equal(s.phase,'departed');s=advance(s,'stay').state;assert.equal(s.phase,'departed');
 assert(!canPlayerLeave({guest_rain:{departed:true},guest_owner:{departed:false},guest_xiaohe:{departed:true}}));
 assert(canPlayerLeave({guest_rain:{departed:true},guest_owner:{departed:true},guest_xiaohe:{departed:true}}));
 const table={...initial(),coffeeAsked:true,umbrellaKnown:true,umbrella:'table',phase:'processing',attachment:'released',read:true};
 const weather=advance(table,'weather');assert.equal(weather.state.umbrella,'table');assert(!weather.lines.some(l=>/吧台|替我看看/.test(l.text)));assert(weather.lines.some(l=>/就在旁邊/.test(l.text)));
 assert(!choices(weather.state).some(c=>c.action==='take'));
 console.log('PASS player exit blocked, stay resume, no NPC departure mutation, all-guest gate');
}finally{rmSync(tmp,{recursive:true,force:true});}
