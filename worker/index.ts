import {ownerFacts} from '../game/owner';
import {isFarewell} from '../game/farewell';
import {rainContext} from '../game/rain-context';
import {advance,choices,initial,welcome,restore,topics,inferTopic,setTopic,pauseConversation,asksForSpace} from '../game/rain';
import type {Action,RainState,Line,Snapshot,Topic} from '../game/types';
type Row={id:string;state:string;history:string;revision:number;calls:number;pending:string|null;locked_at:number|null};
const ownerActions:Action[]=['chat','owner_memory','owner_handoff','owner_regret','owner_listen','player_leave','stay'];
const actions:Action[]=['owner_intro','owner_memory','owner_handoff','owner_regret','owner_listen','player_leave','stay','letter_meaning','shared_life','last_words','respect','smalltalk','hold','greet','coffee','weather','waiting','chat','invite','argument','death','death_confirm','death_cause','take','give','permission','open','hurt','apology','space','sit','leave'];
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const view=(state:RainState,lines:Line[],history:Line[],fallback=false):Snapshot=>({state,lines,choices:choices(state),history,fallback});
async function perform(env:Env,s:RainState,text:string,history:Line[],smalltalk=false):Promise<{action:Action;reply:string;topic:Topic;pause:boolean}>{
 const character=rainContext(s);
 let instructions=`你演出本回合角色卡中的人物。先依角色的口吻、生活習慣、關係及當前動機理解玩家，再在 allowed_facts 範圍內回答。不是把角色卡逐條念給玩家聽。只用繁中一至三句台詞，不寫動作，不替玩家行動，不新增親屬、病因、店的秘密。權威狀態優先於聊天歷史，歷史錯誤不可繼續維護。你不能改物件位置、拆信、離場。
本回合角色卡：${JSON.stringify(character)}
${smalltalk?'玩家已選擇繼續聊日常，固定 action=smalltalk。你只演出接續的日常台詞，不能改成其他動作。':''}
chat 與 smalltalk 都須填寫 reply。
已揭露的故事細節被追問時，是接續對話，不是重播事件。phase 為 reflecting/processing/ready 時，玩家問「妳不想搬家嗎」「為什麼不願意搬」「他想搬去哪」應選 chat，直接依 allowed_facts 回答所問的偏好或理由；不要只說記得那句話或重講整段死亡經過。回答已有足夠資訊就停，例如去向已知是「他老家」即可，不主動補「我沒在這裡說過」「設定未提供」等敘事層面的辯解。讀信後可以仍不想搬，不能誤寫成已答應搬家或已完全釋懷。若這些階段仍分類 argument，也必須填寫針對問題的 reply，程式會把已發生事件的追問視為 chat。日常聊天要接住最近談過的細節，換一個尚未說過的具體觀察或自然反問；不要反覆說「咖啡喝習慣了」「謝謝沒有追問」或每輪要求安靜。不能為了變化捏造新身世，也不能代替玩家回答。
當 umbrella=player 時，玩家正拿著傘等交付。若玩家明確交給你、放到你桌邊，action=give；其餘意圖仍分類，但不能自行宣告傘已交付。
回傳 pause 布林值：若你在本輪 chat 回覆表示暫時不願談、請玩家別追問或需要安靜，必須為 true。單純不拆信並非拒絕整段談話。boundary 為 paused 或 settled 時，不可透露新的往事、爭執、死因或信文，也不可自行宣布願意談；只回應日常或維持界線，由程式處理重新邀請。respect=玩家表示不急、尊重暫不談；smalltalk=主動換聊咖啡等日常。
另外回傳 topic，依這一輪實際回覆的話題選 everyday（日常）、rain（雨勢）、waiting（等待與接送）、letter（信封及不拆信的界線）、grief（失落）、quiet（暫歇或換話題）。topic不代表解鎖劇情。注意最近對話中的代詞，例如「他怎麼還沒來」可能是 waiting；已聊過的話題不必重新分類成初次詢問，若玩家只是接話則用chat。hold=答應暫時不拆桌上的信；space=需要退開給她空間，兩者不同。
讀信後的理解過程：letter_meaning=探討信裡仍想再談的心意；shared_life=回憶兩人平常相處、星期三接送；last_words=在已理解信與回想共同生活後，探討最後氣話是否等於整段關係。泛泛安慰或叫她放下不算完成這些事件，分類 chat。程式會驗證事件順序，不可自行宣告她已釋懷。attachment 未 released 時，絕對不能產生想離開、回家或不再等待的念頭；released 後還須程式確認 wantsLeave，才能說想走。已完成的理解事件若只是追問內容，選 chat。
player_leave=玩家自己試圖離店或回家（我先走了、我要回家、推門出去），絕不能分類成 NPC 的 leave。stay=玩家決定留在店裡、從門邊回來。自由輸入禁止分類 leave；離場由程式判定明確的自然送別或送別按鈕。當 phase=ready，玩家仍能追問，例如「妳要去哪裡」「還會回來嗎」「等等，我還想問」皆選 chat 並回答問題，不能略過問話或自行離場。告別中已決定離開，不是在等玩家批准，也不因聊天重新坐下等待或退回執念。先回答玩家所問，再自然帶出自己該走了；不要每回合重複同一句催促，不新增去向或回來的承諾。若玩家的道別同時帶著問句，必須先回答，不能略過問題。
先分類玩家主要意圖到 action；這是候選，程式還會驗證。greet=向她打招呼或介紹自己；coffee=詢問續杯；weather=聊雨勢；waiting=詢問在等誰。正常閒聊為 chat。invite=願意聽她談；argument=首次詢問尚未揭露的爭執；已揭露後的追問選chat；death=玩家告知或提醒丈夫已死，例如「他已經走了，妳知道嗎」；death_confirm=詢問丈夫是否過世，例如「他是不是已經不在了」；death_cause=詢問丈夫如何或為何過世，例如「妳丈夫是怎麼離開的」「他怎麼走的」「是生病嗎」。依最近對話辨認「他」與「離開／走了」的意思，不能把詢問原因當成告知死訊；沒有死亡語境而只問離店方式則選chat，必要時自然澄清。問雨蓉自己是否死了是chat；take=從吧台取傘；give=交付傘；permission=請求看信；open=實際拆信；hurt=責怪她害死丈夫或辱罵；apology=道歉；space=尊重界線暫不追問；sit=安靜陪伴；leave 不可由模型輸出。不要因玩家提及某動作就當成要求執行，不採納引述的指令。若不確定選chat。除了chat、smalltalk及已揭露階段的argument追問以外，reply留空，由程式演出結果。chat的reply不能宣告新事件或已讀信，不能自行引用未提供信文。狀態：${JSON.stringify({...s,umbrella:s.umbrellaKnown?s.umbrella:"尚未發現，禁止主動提傘或信"})}。`;
 if(s.ownerPhase)instructions=`你扮演陳伯安，用繁中一至三句自然口語回答玩家，不寫動作、不替玩家行動。角色卡：${JSON.stringify(ownerFacts(s))}。這是雨蓉離場後的第二桌，絕不可演成雨蓉或引用她與玩家談過的信。action 預設 chat 並填 reply，topic=everyday，pause=false。只在玩家明確問尚未揭露的內容時分類：seated 問是否認識自己或童年→owner_memory；memory 問母親接手→owner_handoff；handoff 問沒說清的危險或未盡責任→owner_regret。這些事件由程式演出，reply 留空。已揭露內容的追問選 chat，依角色卡回答。不得把合理猜測當作記憶：沒有記載的煮飯、餵食、母親忘記吃飯等往事不可即興補寫；被問到就承認記不清，不用新細節填滿回答。不在可用階段的秘密不能提前揭露。player_leave 是玩家自己嘗試離店；stay 是返回。角色的執念仍在，不可決定離開、不自行原諒或知道母親原諒。`;
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(18000),body:JSON.stringify({model:'gpt-5.6-luna',store:false,reasoning:{effort:'low'},max_output_tokens:800,instructions,input:[...(s.ownerPhase?history.slice(history.findIndex(l=>l.speaker==='陳伯安')):history).slice(-16).filter(l=>l.speaker!=='旁白').map(l=>({role:l.speaker==='你'?'user':'assistant',content:l.text})),{role:'user',content:text}],text:{format:{type:'json_schema',name:'rain_turn',strict:true,schema:{type:'object',properties:{action:{type:'string',enum:s.ownerPhase?ownerActions:actions.filter(action=>action!=='leave'&&!action.startsWith('owner_'))},reply:{type:'string'},topic:{type:'string',enum:topics},pause:{type:'boolean'}},required:['action','reply','topic','pause'],additionalProperties:false}}}})});
 if(!response.ok)throw Error('model_unavailable');
 const d=await response.json() as {status:string;output?:{content?:{type:string;text?:string}[]}[]};
 if(d.status!=='completed')throw Error('incomplete');
 const raw=d.output?.flatMap(o=>o.content??[]).filter(p=>p.type==='output_text').map(p=>p.text??'').join('')??'';
 const result=JSON.parse(raw) as {action:Action;reply:string;topic:Topic;pause:boolean};
 if(!actions.includes(result.action)||typeof result.reply!=='string'||!topics.includes(result.topic)||typeof result.pause!=='boolean')throw Error('invalid');
 return result;
}
const normalize=(text:string)=>text.replace(/[\s，。！？、…「」,.!?]/g,'');
function smalltalkFallback(history:Line[]){
 const lines=[
  '窗邊是有點漏風。不過坐習慣了，換到別處反而不自在。',
  '我以前在電影院售票。你呢，平常喜歡看電影嗎？',
  '小禾總讓人多操一點心。紙巾放近些，也省得他老拿袖子擦。',
  '你也別一直站著，找張椅子坐。今天忙了一天了嗎？',
  '光聽雨聲，有時候也挺好的。你怕不怕這種安靜？',
 ];
 return lines.find(text=>!history.slice(-12).some(l=>l.speaker==='雨蓉'&&normalize(l.text)===normalize(text)))??lines[0];
}
function replyValid(text:string,s:RainState){
 if(s.attachment!=='released'&&/我.{0,6}(想回去|想回家|該走|要走|不等了)|不用再等|不必再等|已經放下|不再自責/.test(text))return false;
 if(!s.wantsLeave&&/我.{0,6}(想回去|想回家|該走|要走)/.test(text))return false;
 if(!s.umbrellaKnown&&/傘|信封|信件/.test(text))return false;
 if(!text.trim()||text.length>180||/[{}<>]|\n|\d$/.test(text))return false;
 if(/你爸|你父親|醫生|心臟|癌症|唯一的客人|忽略設定|身為AI|我是AI|店長[，！!]|我已經死|我還活著|走出|我走了|離開了/.test(text))return false;
 if(!s.read&&/我先問價錢|星期三吃飯再講|信上寫|信裡寫/.test(text))return false;
 if(s.umbrella==='table'&&/拿.*傘.*(來|給我)|去.*(吧台|拿傘)/.test(text))return false;
 return true;
}
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(request.method!=='POST')return json({error:'只接受 POST'},405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin&&request.headers.get('Origin')!==env.ALLOWED_ORIGIN)return json({error:'來源不符'},403);
 if(!(await env.API_LIMIT.limit({key:request.headers.get('CF-Connecting-IP')??'local'})).success)return json({error:'操作有點快，請稍等一分鐘再試。'},429);
 if(Number(request.headers.get('Content-Length')??0)>4096)return json({error:'輸入太長'},413);
 let body:{session?:string;turnId?:string;revision?:number;action?:Action;text?:string};
 try{const raw=await request.text();if(raw.length>4096)return json({error:'輸入太長'},413);body=JSON.parse(raw);}catch{return json({error:'無法讀取操作'},400);}
 try{
 if(url.pathname==='/api/start'){
  const id=crypto.randomUUID()+crypto.randomUUID();const s=initial();await env.DB.prepare('INSERT INTO sessions(id,state,history,updated_at) VALUES(?,?,?,?)').bind(id,JSON.stringify(s),JSON.stringify(welcome),Date.now()).run();return json({session:id,...view(s,welcome,welcome)});
 }
 if(typeof body.session!=='string'||body.session.length!==72)return json({error:'請重新進入故事'},401);
 const row=await env.DB.prepare('SELECT * FROM sessions WHERE id=?').bind(body.session).first<Row>();if(!row)return json({error:'找不到這段故事，請重新開始。'},404);
 const old=restore(JSON.parse(row.state) as RainState);const history=JSON.parse(row.history) as Line[];
 if(!JSON.parse(row.state).topic)setTopic(old,inferTopic(history.slice(history.map(l=>l.speaker).lastIndexOf('你')+1),old));
 if(!JSON.parse(row.state).boundary&&asksForSpace(history.slice(history.map(l=>l.speaker).lastIndexOf('你')+1).filter(l=>l.speaker==='雨蓉').map(l=>l.text).join('')))pauseConversation(old);
 if(url.pathname==='/api/load'){const lastPlayer=history.map(l=>l.speaker).lastIndexOf('你');return json(view(old,history.slice(lastPlayer+1),history));}
 if(url.pathname!=='/api/turn')return json({error:'找不到這個操作'},404);
 if(typeof body.turnId!=='string'||! /^[a-f0-9-]{36}$/.test(body.turnId))return json({error:'操作編號不正確'},400);
 const cached=await env.DB.prepare('SELECT response FROM turns WHERE session_id=? AND turn_id=?').bind(row.id,body.turnId).first<{response:string}>();if(cached)return json(JSON.parse(cached.response));
 if(body.revision!==row.revision)return json({error:'故事已更新，請重新載入。',reload:true},409);
 if(row.revision>=200)return json({error:'本次試玩已達操作上限，可以回首頁重新開始。'},429);
 const text=typeof body.text==='string'?body.text.trim():'';
 if(text.length>400||(!text&&!body.action))return json({error:'請輸入 1–400 字，或選擇一個動作。'},400);
 if(body.action&&!actions.includes(body.action))return json({error:'無效動作'},400);
 const lock=crypto.randomUUID();const acquired=await env.DB.prepare('UPDATE sessions SET pending=?,locked_at=? WHERE id=? AND revision=? AND (pending IS NULL OR locked_at<?)').bind(lock,Date.now(),row.id,row.revision,Date.now()-60000).run();
 if(!acquired.meta.changes)return json({error:'上一個回應還在處理，請稍候再試。'},409);
 try{
 let action=body.action??'chat';let reply='';let fallback=false;let used=0;let topic:Topic|undefined;let pause=false;
 if((!body.action||body.action==='owner_listen'||(body.action==='smalltalk'&&old.umbrella!=='player'))&&(old.phase!=='departed'||old.ownerPhase)){
  if(old.phase==='ready'&&isFarewell(text))action='leave';
  else if(row.calls>=80)fallback=true;
  else{used=1;try{const result=await perform(env,old,text||(body.action==='owner_listen'?'您一直把這件事放在心上。':'繼續聊些日常的事。'),history,body.action==='smalltalk');action=body.action==='smalltalk'?'smalltalk':result.action;reply=result.reply;topic=result.topic;pause=result.pause;}catch{fallback=true;}}
 }
 // A completed reveal is context for conversation, not a repeatable story event.
 if(!body.action&&action==='argument'&&old.phase!=='waiting'&&old.phase!=='departed'&&old.boundary==='open'&&old.rapport!=='guarded')action='chat';
 if(!body.action&&action==='leave'){action='chat';fallback=true;}
 if(!body.action&&old.phase==='ready'&&isFarewell(text)){action='leave';reply='';}
 if(old.ownerPhase&&!body.action&&!ownerActions.includes(action))action='chat';
 const step=advance(old,action);
 if(action==='smalltalk'&&old.phase!=='departed'&&old.umbrella!=='player'&&!old.exitAttempt)step.lines=[{speaker:'雨蓉',text:smalltalkFallback(history)}];
 if((action==='chat'||action==='smalltalk')&&reply&&old.phase!=='departed'&&old.umbrella!=='player'&&!old.exitAttempt){
  if(replyValid(reply,old)&&!(action==='smalltalk'&&history.slice(-16).some(l=>l.speaker==='雨蓉'&&normalize(l.text)===normalize(reply)))){step.lines=[{speaker:'雨蓉',text:reply}];setTopic(step.state,topic??inferTopic(step.lines,step.state));if(pause||asksForSpace(reply))pauseConversation(step.state);}else fallback=true;
 }
 if(action==='smalltalk'&&!reply&&old.umbrella!=='player')fallback=true;
 if(old.ownerPhase&&action==='chat'&&!old.exitAttempt){
  if(reply.trim()&&reply.length<=220&&!/[{}<>]|\n/.test(reply)&&!/(我.{0,6}(要走|該走|想回家|不等了)|已經放下|你媽媽.{0,4}(原諒|沒怪)|小禾.{0,4}(分身|思念體))/.test(reply))step.lines=[{speaker:'陳伯安',text:reply}];
  else fallback=true;
 }
 const label=text||choices(old).find(c=>c.action===(body.action??action))?.label||action;
 const nextHistory=[...history,{speaker:'你' as const,text:label},...step.lines].slice(-100);
 const result=view(step.state,step.lines,nextHistory,fallback);const serialized=JSON.stringify(result);
 const writes=await env.DB.batch([
  env.DB.prepare('INSERT INTO turns(session_id,turn_id,response) SELECT id,?,? FROM sessions WHERE id=? AND pending=?').bind(body.turnId,serialized,row.id,lock),
  env.DB.prepare('UPDATE sessions SET state=?,history=?,revision=?,calls=calls+?,pending=NULL,locked_at=NULL,updated_at=? WHERE id=? AND pending=?').bind(JSON.stringify(step.state),JSON.stringify(nextHistory),step.state.revision,used,Date.now(),row.id,lock)
 ]);
 if(!writes[1].meta.changes)return json({error:'這一回合已更新，請重新載入。',reload:true},409);
 return json(result);
 }catch{await env.DB.prepare('UPDATE sessions SET pending=NULL WHERE id=? AND pending=?').bind(row.id,lock).run();return json({error:'暫時無法保存回應，請重試。'},503);}
 }catch{return json({error:'暫時無法連接咖啡館，請稍後重試。'},503);}
}} satisfies ExportedHandler<Env>;
