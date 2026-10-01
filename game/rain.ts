import {advanceOwner,ownerChoices} from './owner';
import {cafeGuests,canPlayerLeave} from './cafe';
import type {Action,RainState,Line,Topic} from './types';
export const initial=():RainState=>({version:1,ownerPhase:null,ownerVersion:2,ownerAttachment:'held',ownerWantsLeave:false,ownerMotherKnown:false,exitAttempt:false,revision:0,topic:'everyday',boundary:'open',phase:'waiting',rapport:'neutral',apology:false,greeted:false,coffeeAsked:false,umbrellaKnown:false,waitingHeard:false,willing:false,umbrella:'counter',permission:false,read:false,processed:false,attachment:'held',letterUnderstood:false,bondRemembered:false,wantsLeave:false,deathCauseHeard:false,deathKnown:false});
const say=(text:string):Line=>({speaker:'雨蓉',text});
const narrate=(text:string):Line=>({speaker:'旁白',text});
export const welcome=[narrate('窗邊的女人抬起頭，面前放著半杯冷咖啡。'),narrate('她看了你一眼，似乎在等你先開口。')];
export function choices(s:RainState):{action:Action;label:string}[]{
 if(s.exitAttempt)return [{action:'stay',label:'留在店裡，回到座位旁'}];
 if(s.phase==='departed')return ownerChoices(s);
 if(s.umbrella==='player')return [{action:'give',label:'把傘交給雨蓉，放到她桌邊'}];
 if(s.boundary==='paused')return [
  ...(s.rapport==='guarded'?[{action:'apology' as Action,label:'為剛才的追問道歉'}]:[{action:'respect' as Action,label:'好，不急，妳想說時再說'}]),
  {action:'sit',label:'安靜陪她坐一會'},{action:'smalltalk',label:'換個話題，聊聊店裡的咖啡'}];
 if(s.boundary==='settled')return [{action:'invite',label:'問她現在願不願意聊聊'},{action:'smalltalk',label:'繼續聊些日常的事'}];
 const c:{action:Action;label:string}[]=[];
 if(!s.greeted)return [{action:'greet',label:'走近，先向她打聲招呼'}];
 if(s.rapport!=='guarded'&&!s.coffeeAsked)c.push({action:'coffee',label:'問她需不需要續杯'});
 if(s.rapport!=='guarded'&&s.coffeeAsked&&!s.umbrellaKnown)c.push({action:'weather',label:'望向窗外，聊聊這場雨'});
 if(s.rapport!=='guarded'&&s.coffeeAsked&&!s.waitingHeard)c.push({action:'waiting',label:'問她是不是在等人'});
 if(s.umbrellaKnown&&s.umbrella==='counter')c.push({action:'take',label:'去吧台拿傘'});
 if(s.rapport==='guarded')return [...c,{action:'apology',label:'為剛才的話道歉'},{action:'space',label:'暫時不追問，給她空間'}];
 if(s.waitingHeard&&!s.willing)c.push({action:'invite',label:'問她願不願意聊一會'});
 else if(s.willing&&s.phase==='waiting')c.push({action:'argument',label:'問起她和丈夫的事'});
 if(s.phase==='reflecting'&&!s.permission&&s.umbrella==='table')c.push({action:'permission',label:'詢問能否一起看看傘套裡的信'});
 if(s.permission&&!s.read&&s.umbrella==='table')c.push({action:'open',label:'一起展開信'});
 if(s.phase==='processing'){
  if(!s.letterUnderstood)c.push({action:'letter_meaning',label:'問她怎麼理解信裡的「再講」'});
  if(!s.bondRemembered)c.push({action:'shared_life',label:'陪她回想，那些平常的星期三'});
  if(s.letterUnderstood&&s.bondRemembered&&s.attachment!=='released')c.push({action:'last_words',label:'陪她想想，那句話之外的兩人'});
  c.push({action:'sit',label:s.attachment==='released'?'留一點安靜，讓她自己決定':'安靜陪她坐一會'});
 }
 if(s.phase==='ready')c.push({action:'leave',label:'「路上小心。」送她到門口'});
 // Suggestions respond to the last exchange; story actions still use the gates above.
 const contextual:{action:Action;label:string}[]=[];
 if(s.topic==='letter'&&s.umbrella==='table'&&!s.permission&&!s.read)
  contextual.push({action:'hold',label:'先把信放著，答應她不拆'});
 if(s.topic==='grief'&&s.phase!=='ready')contextual.push({action:'sit',label:'不急著安慰，陪她坐一會'});
 if(s.topic==='quiet'&&s.phase==='waiting'&&!s.willing){
  const next=c.find(x=>x.action===(s.waitingHeard?'invite':'waiting'));
  if(next)next.label=s.waitingHeard?'等她緩一緩，再問願不願意聊聊':'換個話題，問她今晚在等誰';
 }
 if(s.topic==='waiting'){
  const next=c.find(x=>x.action==='invite');if(next)next.label='順著她的話，問能不能陪她聊聊';
 }
 if(s.topic==='letter'){
  const next=c.find(x=>x.action==='waiting'||x.action==='invite');
  if(next)next.label=next.action==='waiting'?'不追問信，聊聊她在等的人':'先不談信，問她願不願意聊聊';
 }
 return [...contextual,...c.filter(x=>!contextual.some(y=>y.action===x.action))].slice(0,3);
}
export function advance(old:RainState,action:Action):{state:RainState;lines:Line[]}{
 const s={...old};
 if(action==='player_leave'){
  s.revision++;
  if(!canPlayerLeave(cafeGuests(s))){s.exitAttempt=true;return {state:s,lines:[narrate('你望向門外。雨還在下，店裡也還有客人。'),narrate('你停在門前，沒有跨過門檻。現在還不是離開的時候。')]};}
 }
 if(s.exitAttempt){
  s.revision++;
  if(action==='stay'){s.exitAttempt=false;return {state:s,lines:[narrate(s.phase==='departed'?(s.ownerPhase==='departed'||s.ownerPhase==='afterword'?'你回到店裡。鑰匙留在桌上，更裡頭還有一位小客人。':s.ownerPhase?'你回到老先生的桌旁。':'你回到店裡。窗邊的座位已經空了，裡面還坐著一位老先生。'):'你回到窗邊。雨蓉仍坐在原處。')]};}
  return {state:s,lines:[narrate('店裡還有客人。你仍留在門內。')]};
 }
 if(s.phase==='departed')return advanceOwner(s,action);
 s.revision++;let lines:Line[]=[];
 // Finish the physical handoff before resuming conversation or emotional transitions.
 if(s.umbrella==='player'&&action!=='give')return {state:s,lines:[say('傘先放我桌邊就好，不用一直拿著。')]};

 if(s.boundary!=='open'){
  const sensitive:Action[]=['letter_meaning','shared_life','last_words','waiting','argument','death','death_confirm','death_cause','permission','open','leave'];
  if(sensitive.includes(action)||(action==='invite'&&s.boundary==='paused'))
   return {state:s,lines:[say('我現在還不想談。先陪我坐一下，好嗎？')]};
  if(s.boundary==='settled'&&action==='invite'){
   s.boundary='open';s.willing=s.waitingHeard;s.rapport='receptive';s.topic='waiting';
   return {state:s,lines:[say('嗯，現在可以。你慢慢問，我慢慢說。')]};
  }
  if(['respect','sit','space','smalltalk','hold'].includes(action)){
   s.boundary='settled';s.rapport='neutral';s.apology=false;s.topic='quiet';
   return {state:s,lines:[narrate('你沒有再追問。兩人聽了一會兒雨聲。'),say(action==='smalltalk'?'這裡的咖啡，我喝習慣了。……謝謝你，沒有急著問下去。':'嗯，謝謝。讓我慢慢想，你先坐。')]};
  }
 }
 switch(action){
 case 'respect':lines=[say('嗯，謝謝你。')];break;
 case 'smalltalk':lines=[say('這裡的咖啡，我喝習慣了。坐著聽雨，也不一定要一直說話。')];break;
 case 'hold':if(s.umbrella==='table'&&!s.read){s.topic='quiet';lines=[say('嗯，謝謝。放著就好。'),narrate('你把手收回來，沒有碰那個信封。')];}else lines=[narrate('你沒有碰她的東西。')];break;
 case 'greet':s.greeted=true;lines=[say('你好。……你是她的孩子吧？長這麼大了。'),narrate('她把放在旁邊椅子上的包往自己身邊挪了挪。')];break;
 case 'coffee':if(!s.greeted){lines=[narrate('你走近窗邊，她抬眼等你開口。')];break;}s.coffeeAsked=true;lines=[say('不用了，這杯還沒喝完。你今天來幫忙啊？'),narrate('杯子上方已經沒有熱氣。她卻沒有催你把它收走。')];break;
 case 'weather':if(s.umbrella==='table'){lines=[say('雨還在下。傘就在旁邊，剛才謝謝你替我拿過來。')];break;}if(!s.coffeeAsked||s.rapport==='guarded'){lines=[say('嗯，還在下。')];break;}s.umbrellaKnown=true;lines=[say('剛才還以為快停了。……我有把深藍色的傘，之前留在這裡。'),say('你要是去吧台，替我看看在不在。不急。')];break;
 case 'waiting':if(!s.coffeeAsked||s.rapport==='guarded'){lines=[say('我再坐一會。你先忙。')];break;}s.waitingHeard=true;lines=[say('以前下班，他都會來這裡接我。有時候晚一點，我就多坐一下。'),narrate('她說完，留了一小段安靜。')];break;
 case 'take':if(!s.umbrellaKnown){lines=[narrate('你還不知道她有沒有帶傘。也許可以先和她聊聊。')];break;}if(s.umbrella==='counter'){s.umbrella='player';lines=[narrate('你從吧台拿起深藍色的傘。傘帶上有一小段紅色補線。'),say('找到了啊。放我桌邊就好，謝謝。')];}else lines=[narrate('傘已經不在吧台上了。')];break;
 case 'give':if(s.umbrella==='player'){s.umbrella='table';lines=[narrate('你把傘放在她桌邊。傘套裡露出一角信封。'),say('放這裡就好。……傘套裡的東西，先別拆。')];}else lines=[narrate(s.umbrella==='table'?'傘已在她桌邊，不必再拿一次。':(s.umbrellaKnown?'你手上沒有傘，可以先去吧台看看。':'你手上沒有傘，也還不知道她是否需要。'))];break;
 case 'hurt':s.rapport='guarded';s.apology=false;lines=[say('那句話，我自己已經想過很多遍了。你先別說了。')];break;
 case 'apology':if(s.rapport==='guarded'){s.apology=true;lines=[say('……我聽到了。讓我靜一下，好嗎？')];}else lines=[say('嗯。先坐吧。')];break;
 case 'space':if(s.rapport==='guarded'){s.rapport='neutral';s.apology=false;lines=[narrate('你退開一點，先整理旁邊的桌面。過了一會兒，她的肩膀慢慢放鬆。'),say('你忙完了？……也不用一直站著。')];}else lines=[say('好，你先忙。有需要我會叫你。')];break;
 case 'death_confirm':if(s.rapport==='guarded'){pauseConversation(s);lines=[say('這件事，我現在還不想談。')];}else{s.deathKnown=true;lines=[say('嗯，他已經過世了。……我知道他不會再來接我。')];}break;
 case 'death_cause':if(s.rapport==='guarded'||(!s.willing&&s.phase==='waiting')){pauseConversation(s);lines=[say('那天的事……我現在還不太想說。')];}else{s.deathKnown=true;s.deathCauseHeard=true;lines=[say('那晚，他在車庫突然發病，就這麼走了。')];}break;
 case 'death':if(s.rapport==='guarded')lines=[say('這件事先別問了。')];else{s.deathKnown=true;lines=[say('我知道。……不是不知道，才坐在這裡的。')];}break;
 case 'invite':if(!s.waitingHeard){lines=[say('你先忙吧。我只是坐一會。')];break;}if(s.rapport==='guarded')lines=[say('我現在不想談。先讓我安靜一下。')];else{s.willing=true;s.rapport='receptive';lines=[say('坐吧。那時每個星期三，他都繞過來。有時路上塞車，我還會嫌他慢。……最後一次，卻是我叫他別來。')];}break;
 case 'argument':if(!s.willing||s.rapport==='guarded')lines=[say('才剛坐下，就問這些啊。先聊點別的吧。')];else if(s.phase==='waiting'){s.phase='reflecting';s.deathKnown=true;s.deathCauseHeard=true;lines=[say('他想退休後搬回老家，我不肯。吵到最後，我說了「今天不用來接我」。'),say('他那晚在車庫突然發病。……我知道不是那句話害的，可最後跟他說的，偏偏就是那句。')];}else lines=[say('事情我記得。只是每次想起來，都還是會停在那一句。')];break;
 case 'permission':if(s.phase==='reflecting'&&s.rapport!=='guarded'&&s.umbrella==='table'){s.permission=true;lines=[say('那個信封，我認得。一直以為又是要勸我搬家。……好吧，一起看。')];}else lines=[say('先放著吧。我還不想拆。')];break;
 case 'open':if(s.read)lines=[narrate('信已經讀過了，字跡仍留在紙背。')];else if(s.permission&&s.umbrella==='table'&&s.rapport!=='guarded'){s.read=true;s.phase='processing';lines=[narrate('搬家估價單的背面，是丈夫留下的字：'),narrate('「我先問價錢而已，沒有答應。妳不想搬就不搬，星期三吃飯再講。」')];}else{s.rapport='guarded';s.apology=false;lines=[say('等一下。那是我的東西，先別拆。'),narrate('你停下動作，信仍沒有展開。')];}break;
 case 'letter_meaning':if(!s.read||s.phase!=='processing'||s.rapport==='guarded'){lines=[say('先不急著說這些。')];break;}
 if(s.letterUnderstood){lines=[say('他想跟我再談，沒有替我決定。這回，我看懂了。')];break;}
 s.letterUnderstood=true;if(s.attachment==='held')s.attachment='shaken';
 lines=[say('他寫「再講」，沒有替我決定，也沒打算就這樣不理我。'),say('可是……他寫的時候，還沒聽見我叫他別來。那句話，我還是說了。')];break;
 case 'shared_life':if(!s.read||s.phase!=='processing'||s.rapport==='guarded'){lines=[say('這些事，讓我慢慢想。')];break;}
 if(s.bondRemembered){lines=[say('那些星期三，我也記得。不只有最後那一天。')];break;}
 s.bondRemembered=true;if(s.attachment==='held')s.attachment='shaken';
 lines=[say('每個星期三，他都繞過來接我。我有時還嫌他慢。'),say('現在想起他，卻老是只剩最後那一次。前面那些平常的日子，好像都被我擠到旁邊去了。')];break;
 case 'last_words':if(!s.read||s.phase!=='processing'||!s.letterUnderstood||!s.bondRemembered||s.rapport==='guarded'){lines=[say('我知道你想安慰我。可是那句話，我還是放不下。')];break;}
 if(s.attachment==='released'){lines=[say('嗯，不只那一句。那些日子，我也記得。')];break;}
 s.attachment='released';s.wantsLeave=true;s.phase='ready';
 lines=[say('我一直以為，要等他回來，把那句話收回去，我們才不算停在那場爭吵裡。'),narrate('她低頭看著信，這次沒有再急著替那句氣話辯解。'),say('可是他想和我再談，我也只是怕離開熟悉的地方。……我們過了那麼多日子，不只剩那一句啊。'),say('那句話收不回來了。我還是會難過，可不用再等他回來，證明我們不只有那場爭吵。'),narrate('她將信摺好，抬頭看向你。'),say('……我該回去了。謝謝你陪我說這些。')];break;
 case 'sit':if(s.phase==='ready'){lines=[narrate('她收好信，向你點了點頭。'),say('謝謝你。時間不早了，我也該走了。')];break;}if(s.rapport==='guarded'){lines=[say('先讓我自己待一下。')];}
 else if(s.phase==='processing'&&s.attachment==='released'){
 s.wantsLeave=true;s.phase='ready';lines=[narrate('安靜了一會兒，她將信收好。這次，她的目光沒有停在窗外等待。'),say('……我想回去了。今天，我自己走。')];
 }else lines=[narrate('你沒有急著接話，讓雨聲留在兩人之間。'),...(s.phase==='processing'?[say('我還是會想到那句話。……讓我再想一想。')]:[])];break;
 case 'leave':if(s.phase==='ready'&&s.attachment==='released'&&s.wantsLeave&&s.umbrella==='table'&&s.rapport!=='guarded'){s.phase='departed';s.umbrella='outside';lines=[narrate('她拿起傘，在門前停了一下。'),say('謝謝你，自己也多照顧一點。那孩子的紙巾，記得放近一點。'),narrate('門闔上了。桌上留下半杯冷咖啡，與一張剝開的糖紙。')];}else lines=[say('我還想再坐一下。')];break;
 case 'chat':lines=[say(s.rapport==='guarded'?'這個話題先放一放吧。':s.phase==='ready'?'嗯，你說。我也該走了，走之前再聊兩句。':s.read?'不用急著找話安慰我。陪我坐一下就好。':'雨下得真久。你也別一直站著，找張椅子坐。')];
 }
 if(action==='hurt'||lines.some(l=>l.speaker==='雨蓉'&&asksForSpace(l.text)))pauseConversation(s);
 if(action!=='chat'&&action!=='hold')s.topic=inferTopic(lines,s);
 return {state:s,lines};
}

// Legacy saves retain discovered objects and completed story beats.
export function restore(saved:RainState):RainState{const progressed=saved.willing||saved.phase!=='waiting'||saved.umbrella!=='counter';return {...initial(),...saved,...(saved.ownerPhase&&saved.ownerVersion!==2?{ownerVersion:2 as const,ownerPhase:'seated' as const,ownerAttachment:'held' as const,ownerWantsLeave:false,ownerMotherKnown:false}:{}),wantsLeave:saved.attachment==='released'?true:(saved.wantsLeave??false),phase:saved.attachment==='released'&&saved.phase!=='departed'?'ready':saved.phase==='ready'&&(!saved.wantsLeave||saved.attachment!=='released')?'processing':saved.phase,greeted:saved.greeted??progressed,coffeeAsked:saved.coffeeAsked??progressed,umbrellaKnown:saved.umbrellaKnown??(saved.umbrella!=='counter'||saved.phase!=='waiting'),waitingHeard:saved.waitingHeard??(saved.willing||saved.phase!=='waiting')};}

export const topics:Topic[]=['everyday','rain','waiting','letter','grief','quiet'];
// Topic can change suggestion wording, never discoveries, permission, or phase.
export function inferTopic(lines:Line[],s:RainState):Topic{
 const text=lines.map(l=>l.text).join('');
 if(s.umbrella==='table'&&/信|拆|紙背/.test(text))return 'letter';
 if(s.deathKnown&&/過世|那句|自己說|安慰|死/.test(text))return 'grief';
 if(/先忙|靜一下|空隙|不用一直站|放著就好/.test(text))return 'quiet';
 if(/接我|接她|星期三|等誰|等人/.test(text))return 'waiting';
 if(/雨|傘/.test(text))return 'rain';
 return 'everyday';
}
export function setTopic(s:RainState,topic:Topic){
 s.topic=topic==='letter'&&s.umbrella!=='table'?'everyday':topic==='grief'&&!s.deathKnown?'everyday':topic;
}

export function pauseConversation(s:RainState){
 if(s.phase==='departed')return;
 s.boundary='paused';s.willing=false;s.permission=false;s.topic='quiet';
}
export function asksForSpace(text:string){
 return /先別.{0,5}(問|追問)|先不.{0,3}(談|說)|不想.{0,4}(談|說|聊)|還不.{0,3}(會說|想說)|讓我.{0,3}(靜|安靜)|先讓我|話題先放/.test(text);
}
