import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const tmp=mkdtempSync(join(tmpdir(),'rain-character-'));
try{
 execFileSync('./node_modules/.bin/tsc',['game/farewell.ts','game/rain-context.ts','game/rain.ts','game/types.ts','--outDir',tmp,'--module','commonjs','--target','es2020','--resolveJsonModule','--esModuleInterop','--skipLibCheck']);
 const require=createRequire(import.meta.url);
 const {rainContext}=require(join(tmp,'game/rain-context.js'));
 const {initial,advance,pauseConversation}=require(join(tmp,'game/rain.js'));
 const {choices,restore}=require(join(tmp,'game/rain.js'));
 const {isFarewell}=require(join(tmp,'game/farewell.js'));
 for(const text of ['路上小心','謝謝妳，慢走。','嗯，好，晚安！'])assert(isFarewell(text),text);
 for(const text of ['路上小心，妳還會回來嗎？','再見是什麼意思','我想說「慢走」','等等，先別走','妳要去哪裡'])assert(!isFarewell(text),text);

 let s=initial();for(const a of ['greet','coffee','weather','waiting','take','give','invite','argument','permission','open'])s=advance(s,a).state;
 for(let i=0;i<8;i++)s=advance(s,'sit').state;
 assert.equal(s.phase,'processing');assert.equal(s.attachment,'held');assert(!s.wantsLeave);
 for(const a of ['last_words','leave']){s=advance(s,a).state;assert.equal(s.phase,'processing');assert.equal(s.attachment,'held');}
 s=advance(s,'shared_life').state;assert.equal(s.attachment,'shaken');s=advance(s,'last_words').state;assert.notEqual(s.attachment,'released');
 s=advance(s,'letter_meaning').state;
 const paused={...s};pauseConversation(paused);assert.equal(advance(paused,'last_words').state.attachment,'shaken');
 s=advance(s,'last_words').state;assert.equal(s.attachment,'released');assert.equal(s.phase,'ready');assert(s.wantsLeave);assert(choices(s).some(c=>c.action==='leave'));
 s=advance(s,'chat').state;assert.equal(s.phase,'ready');s=advance(s,'sit').state;assert.equal(s.phase,'ready');assert(s.wantsLeave);
 assert.equal(restore({...s,phase:'processing',wantsLeave:false}).phase,'ready');
 s=advance(s,'leave').state;assert.equal(s.phase,'departed');
 const legacy={...s,phase:'ready',umbrella:'table'};delete legacy.attachment;delete legacy.wantsLeave;delete legacy.letterUnderstood;delete legacy.bondRemembered;
 assert.equal(restore(legacy).phase,'processing');assert.equal(restore({...legacy,phase:'departed'}).phase,'departed');
 console.log('PASS: repeated sitting cannot release, prerequisite evidence, boundary, release before intent, departure, legacy saves');
}finally{rmSync(tmp,{recursive:true,force:true});}
