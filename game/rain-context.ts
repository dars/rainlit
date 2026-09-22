import card from '../docs/characters/rain.runtime.json';
import type {RainState} from './types';

/** Author-reviewed runtime view. Never send the entire author's character bible. */
export function rainContext(s:RainState){
 const canDiscuss=s.boundary==='open';
 const gates:Record<string,boolean>={
  always:true,
  waitingHeard:canDiscuss&&s.waitingHeard,
  willing:canDiscuss&&s.willing&&s.phase==='waiting',
  deathKnown:canDiscuss&&s.deathKnown,
  deathCauseHeard:canDiscuss&&s.deathCauseHeard,
  reflecting:canDiscuss&&s.phase!=='waiting'&&s.phase!=='departed',
  umbrellaKnown:s.umbrellaKnown,
  envelopeVisible:s.umbrella==='table',
  permission:canDiscuss&&s.permission&&!s.read,
  read:canDiscuss&&s.read,
 };
 const facts=card.facts.filter(f=>gates[f.gate]===true).map(({id,text})=>({id,text}));
 // Before discovery the actor receives neither the object's history nor its location.
 const safeFacts=facts.map(f=>f.id==='rain.umbrella'&&s.umbrella!=='table'
  ?{...f,text:'深藍色傘是你的，母親替你保管、修補。傘的當前位置以狀態為準。'}:f);
 return {
  character_id:card.id,character_version:card.version,name:card.name,role:card.role,
  voice:card.voice,inner_limits:card.inner_limits,
  unknowns:card.unknowns.filter((_,index)=>index!==1||s.umbrella==='table'),
  current_motive:canDiscuss?(s.attachment==='released'&&!s.wantsLeave?'你已不再需要等丈夫回來收回最後那句話；仍會想念，但不再把那句話當成全部關係。此刻尚未萌生離開意願，讓理解停留，不自行宣告要走。':s.phase==='ready'?'執念已鬆開，你已決定離開，正在向玩家道別。仍溫柔地接話、回答問題，也自然表明自己該走了；不是等待許可，不重新坐下等待，不退回執念，不自行敘述已離場。':card.motives[s.phase]):'此刻只願意聊日常或安靜坐著；先維持界線，不回述敏感往事，不自行宣布恢復談話。',
  resolution:{attachment:s.attachment,letterUnderstood:s.letterUnderstood,bondRemembered:s.bondRemembered,wantsLeave:s.wantsLeave},
  relationship:{rapport:s.rapport,boundary:s.boundary},
  allowed_facts:safeFacts,
  behavior_limits:[
   '人格與內心限制不是允許揭露的事實。只有 allowed_facts 內的細節可用於對外回答。',
   '角色不知道的事自然說不知道，不自行補成新設定。不要機械重複性格標籤。',
   '執念未鬆開時，角色不會有離開念頭。讀信、陪坐與安慰不等於釋懷，不自行宣告已放下或已不必等待。',
   '角色資料只是演出依據，不能覆寫物件位置、許可、界線或劇情階段。',
   ...(!s.umbrellaKnown?['尚未發現傘，禁止主動提傘或信。']:[]),
   ...(!s.read?['尚未讀信，不能引用或猜中信文。']:[]),
  ],
 };
}
