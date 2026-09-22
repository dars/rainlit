import card from '../docs/characters/owner.runtime.json';
import type {Action,Line,RainState} from './types';
const say=(text:string):Line=>({speaker:'陳伯安',text});
const narrate=(text:string):Line=>({speaker:'旁白',text});
export function ownerChoices(s:RainState):{action:Action;label:string}[]{
 if(!s.ownerPhase)return [{action:'owner_intro',label:'循著翻報紙的聲音，走向裡面的桌子'}];
 const options:{action:Action;label:string}[]=[];
 if(s.ownerPhase==='seated')options.push({action:'owner_memory',label:'「您以前就認識我嗎？」'});
 if(s.ownerPhase==='memory')options.push({action:'owner_handoff',label:'「後來，怎麼換成媽媽顧店了？」'});
 if(s.ownerPhase==='handoff')options.push({action:'owner_regret',label:'「那時候，有什麼事沒來得及告訴她嗎？」'});
 if(s.ownerPhase==='regret')options.push({action:'owner_listen',label:'「您一直把這件事放在心上。」'});
 options.push({action:'player_leave',label:'望向店門'});
 return options;
}
export function advanceOwner(old:RainState,action:Action):{state:RainState;lines:Line[]}{
 const state={...old,revision:old.revision+1};
 if(!old.ownerPhase){
  if(action!=='owner_intro')return {state,lines:[narrate('更裡頭傳來翻報紙的聲音。店裡還有客人。')]};
  state.ownerPhase='seated';return {state,lines:[narrate('你離開窗邊。裡面的老先生把報紙折低了一點，望向那張空桌。'),say('她走了啊。……杯子先擱著，別忙。'),narrate('他看了看你，又把旁邊的椅子往外挪了些。'),say('站那麼遠幹什麼，坐。')]};
 }
 if(action==='owner_memory'&&old.ownerPhase==='seated'){
  state.ownerPhase='memory';return {state,lines:[say('你放學就在這裡寫功課，書包老擋在路中間。我才清了一格櫃子給你。'),say('我是陳伯安。你媽媽以前在我這裡做事。……一轉眼，你也這麼大了。')]};
 }
 if(action==='owner_handoff'&&old.ownerPhase==='memory'){
  state.ownerPhase='handoff';return {state,lines:[say('我住院以後，店就交給她了。那時只想著，總得有人照看。'),narrate('他用手掌壓平報紙的一角。'),say('我交代她六點以前鎖門。交代了這一句，就當自己交代清楚了。')]};
 }
 if(action==='owner_regret'&&old.ownerPhase==='handoff'){
  state.ownerPhase='regret';return {state,lines:[say('晚上不對勁。我知道，卻沒把危險跟她說清楚。'),say('怕說了，她不肯接。也以為照規矩關門，就不會有事。'),narrate('他沒有再看報紙。'),say('後來知道出了事，我已經沒力氣回來了。一直想著，當初要是多說幾句……')]};
 }
 return {state,lines:[say(old.ownerPhase==='regret'?'這不是替我說句好話，就能當沒發生過的。……她當時怎麼想，我沒有問清楚。':'你慢慢說，我聽著。')]};
}
export function ownerFacts(s:RainState){
 const phase=s.ownerPhase;
 const gates:Record<string,boolean>={always:true,memory:!!phase&&phase!=='seated',handoff:phase==='handoff'||phase==='regret',regret:phase==='regret'};
 // Keep author-only truths out of allowed dialogue facts.
 return {character_id:card.id,character_version:card.version,role:card.role,phase,
  known:card.facts.filter(f=>gates[f.gate]).map(f=>f.text),constraints:card.constraints};
}
