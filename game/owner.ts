import card from '../docs/characters/owner.runtime.json';
import type {Action,Line,RainState} from './types';
const say=(text:string):Line=>({speaker:'陳伯安',text});
const narrate=(text:string):Line=>({speaker:'旁白',text});
export const ownerOpening:Line[]=[narrate('你離開窗邊，才注意到裡面的桌旁坐著一位老先生。桌上沒有飲料，只有一份菜單。'),say('今天是你顧店？……我以前常在這裡。坐吧，不用忙著倒水。')];
export const ownerCinematic=(s:RainState)=>['key','departed','afterword'].includes(s.ownerPhase??'');
export const ownerCanGoodbye=(s:RainState)=>s.ownerPhase==='ready'&&s.ownerAttachment==='released'&&s.ownerWantsLeave;
export function ownerChoices(s:RainState):{action:Action;label:string}[]{
 if(!s.ownerPhase)return [{action:'owner_intro',label:'走近裡面那位老先生'}];
 if(s.ownerPhase==='key')return [{action:'owner_exit',label:'目送他走向店門'}];
 if(s.ownerPhase==='departed')return [{action:'owner_end',label:'回望店內'}];
 if(s.ownerPhase==='afterword')return [{action:'player_leave',label:'望向店門'}];
 const options:{action:Action;label:string}[]=[];
 if(!s.ownerMotherKnown)options.push({action:'owner_mother',label:'「我是她的孩子。媽媽前陣子過世了。」'});
 const next:Partial<Record<NonNullable<RainState['ownerPhase']>,{action:Action;label:string}>>={
 seated:{action:'owner_memory',label:'「您看起來很面熟，以前在這裡工作嗎？」'},
 memory:{action:'owner_handoff',label:'「後來，怎麼換成媽媽顧店了？」'},
 handoff:{action:'owner_regret',label:'「那把鑰匙，您一直留著嗎？」'},
 regret:{action:'owner_life',label:'和他說說，母親晚年疲倦卻滿足的樣子'},
 life:{action:'owner_response',label:'「您一直想聽她說些什麼呢？」'},
 response:{action:'owner_release',label:'「沒能聽到她回答，您就得一直守在這裡嗎？」'},
 ready:{action:'owner_goodbye',label:'「路上小心，也要照顧自己。」'},
 };
 if(next[s.ownerPhase]&&(s.ownerPhase!=='regret'||s.ownerMotherKnown))options.push(next[s.ownerPhase]!);
 return options;
}
export function advanceOwner(old:RainState,action:Action):{state:RainState;lines:Line[]}{
 const state={...old,revision:old.revision+1};
 const result=(lines:Line[])=>({state,lines});
 if(!old.ownerPhase){
  if(action!=='owner_intro')return result([narrate('裡面的桌旁還坐著一位老先生。')]);
  state.ownerPhase='seated';return result(ownerOpening);
 }
 if(action==='owner_mother'&&!old.ownerMotherKnown&&!ownerCinematic(old)){
  state.ownerMotherKnown=true;return result([say('……原來是她的孩子。她已經過世了啊。'),narrate('他的手停在菜單上，過了一會儿才開口。'),say('她以前總叫我先把身體顧好。我一直覺得，她只是客氣。現在，有些話也來不及問了。')]);
 }
 if(action==='owner_memory'&&old.ownerPhase==='seated'){
  state.ownerPhase='memory';return result([say('我是陳伯安。以前這間店是我顧，你媽媽在這裡做事。'),say('你放學總把書包放椅子上，我才清了一格櫃子給你。……一轉眼，你也這麼大了。')]);
 }
 if(action==='owner_handoff'&&old.ownerPhase==='memory'){
  state.ownerPhase='handoff';return result([say('那次突然生病住院，原本只請她替我顧幾天。我出院後，身體已經做不來了，才正式退下來。'),say('晚上有些特殊的客人，我一直自己接待。我只交代六點前關門，想著回去再說清楚。……結果拖著，讓她自己碰上。')]);
 }
 if(action==='owner_regret'&&old.ownerPhase==='handoff'){
  state.ownerPhase='regret';return result([narrate('他摸了摸口袋裡的備用鑰匙，沒有拿出來。'),say('總覺得有事，還該由我回來處理。她叫我休息，我卻一直當她是在替我扛。'),say('沒說清楚，是我的責任。可我越想補好，越不知道該怎麼問她，後來那些年究竟過得好不好。')]);
 }
 if(action==='owner_life'&&old.ownerPhase==='regret'&&old.ownerMotherKnown){
  state.ownerPhase='life';state.ownerAttachment='shaken';return result([narrate('你說起母親晚年的樣子：她常很晚才回來，雖然疲倦，卻也有幸福、滿足的時候。'),say('她在你面前，會不會只是沒說？……不，你看見的，也不能因為我擔心就不算。'),say('我老想著自己留了多少麻煩，倒沒有好好問過，她那些日子是怎麼過的。')]);
 }
 if(action==='owner_response'&&old.ownerPhase==='life'){
  state.ownerPhase='response';return result([say('我想聽她親口說，後來到底怎麼樣。有沒有哪件事，是我還能補上的。'),say('她其實叫過我回去休息。我卻總覺得，事情沒補好，就不能當真。'),narrate('他低頭看著自己的手。'),say('我該早點說清楚。這句對不起，還是欠她的。可你不用替她回答。')]);
 }
 if(action==='owner_release'&&old.ownerPhase==='response'&&old.ownerAttachment==='shaken'&&old.ownerMotherKnown){
  state.ownerAttachment='released';state.ownerWantsLeave=true;state.ownerPhase='ready';return result([say('她以前叫我回去休息，我總覺得，是她不好意思讓我做。……也許她是真的覺得，剩下的事，她能自己決定。'),say('沒說清楚的，我還是對不起她。可是她後來的日子，不能全讓我的自責說了算。'),say('有些話再也問不到了。我也不能一直守在這裡，當作還能把過去補好。'),narrate('他鬆開握著鑰匙的手，抬起頭。'),say('……我也該回去了。謝謝你願意跟我說她的事。')]);
 }
 if(action==='owner_goodbye'&&ownerCanGoodbye(old)){
  state.ownerPhase='key';return result([narrate('他把備用鑰匙輕輕放在吧台旁的桌面上。'),say('這把放這裡就好。也沒什麼非得等我回來處理的了。你不用接。'),narrate('他將菜單收齊，扶正一張歪掉的椅子。這一次，沒有再找下一件事忙。')]);
 }
 if(action==='owner_exit'&&old.ownerPhase==='key'&&old.ownerAttachment==='released'&&old.ownerWantsLeave){
  state.ownerPhase='departed';return result([narrate('他走到店門前，回頭向你點了點頭。'),say('你也別一直站著。……又把你當小孩了。'),narrate('門鈴輕輕響起。他踏進騎樓，背影走過雨中的街燈。往後，他還有自己的日子要過。')]);
 }
 if(action==='owner_end'&&old.ownerPhase==='departed'){
  state.ownerPhase='afterword';return result([narrate('你回望店內。菜單擺整齊了，那把鑰匙安靜地留在桌上。'),narrate('更裡頭傳來鉛筆滾落的聲音。還有一位小客人，留在燈下。')]);
 }
 if(ownerCinematic(old))return result([narrate(old.ownerPhase==='key'?'鑰匙留在桌上。他已道別，正走向店門。':'陳伯安已經離開，桌上留下他的備用鑰匙。')]);
 return result([say(ownerCanGoodbye(old)?'嗯，你說。我也該回去了，走之前再聊兩句。':'你慢慢說，我聽著。')]);
}
export function ownerFacts(s:RainState){
 const order=['seated','memory','handoff','regret','life','response','ready','key','departed','afterword'];
 const rank=order.indexOf(s.ownerPhase??'');
 const gates:Record<string,boolean>={always:true,memory:rank>=1,handoff:rank>=2,regret:rank>=3,life:rank>=4,response:rank>=5,ready:ownerCanGoodbye(s)};
 return {character_id:card.id,character_version:card.version,role:card.role,phase:s.ownerPhase,attachment:s.ownerAttachment,wantsLeave:s.ownerWantsLeave,motherKnown:s.ownerMotherKnown,
 known:card.facts.filter(f=>gates[f.gate]).map(f=>f.text),constraints:card.constraints};
}
export function ownerReplyValid(reply:string,s:RainState){
 if(!reply.trim()||reply.length>260||/[{}<>]|\n/.test(reply))return false;
 if(/我.{0,8}(已經死|過世|死了|鬼魂)|你媽媽.{0,4}(原諒|沒怪)|小禾.{0,4}(分身|思念體)|我走了|走出店門|把鑰匙.{0,6}(交給|放在|放下)/.test(reply))return false;
 if(!ownerCanGoodbye(s)&&/我.{0,8}(要走|該走|想回家|該回去|不等了|放下)|不用再守|不必再等/.test(reply))return false;
 return true;
}
