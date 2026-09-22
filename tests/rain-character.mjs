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
 let s=initial();const ids=()=>rainContext(s).allowed_facts.map(f=>f.id);
 assert(ids().includes('rain.job'));assert(rainContext(s).voice.some(v=>v.includes('漏風')));
 assert(!ids().includes('rain.pickup'));assert(!ids().includes('rain.argument'));assert(!JSON.stringify(rainContext(s)).includes('我先問價錢'));
 for(const a of ['greet','coffee','weather','waiting','take','give','invite','argument','permission'])s=advance(s,a).state;
 assert(ids().includes('rain.argument'));assert(ids().includes('rain.recognition'));assert(!ids().includes('rain.letter'));
 s=advance(s,'open').state;assert(ids().includes('rain.letter'));assert(!ids().includes('rain.recognition'));
 pauseConversation(s);assert(!ids().includes('rain.letter'));assert(!ids().includes('rain.argument'));assert(!rainContext(s).current_motive.includes('重新理解'));
 assert(rainContext(s).unknowns.some(v=>v.includes('小禾的本質')));
 console.log('PASS: character voice, staged facts, unread letter exclusion, boundary filtering, unknowns');
}finally{rmSync(tmp,{recursive:true,force:true});}
