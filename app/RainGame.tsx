'use client';
import ArrowIcon from './ArrowIcon';
import {useEffect,useRef,useState} from 'react';
import SceneExplore,{sceneSpots} from './SceneExplore';
import {passages,openingKey} from '../game/prologue';
import type {Action,Snapshot} from '../game/types';
type Pending={session:string;turnId:string;revision:number;action?:Action;text:string};
export default function RainGame({onHome}:{onHome:()=>void}){
 const [selected,setSelected]=useState<string|null>(null);
 const [game,setGame]=useState<Snapshot|null>(null);const [session,setSession]=useState('');const [busy,setBusy]=useState(true);const [error,setError]=useState('');const [text,setText]=useState('');const [log,setLog]=useState(false);const [storageWarning,setStorageWarning]=useState(false);const lock=useRef(false);const pending=useRef<Pending|null>(null);const started=useRef(false);
 async function api(path:string,body:unknown){const r=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});const d=await r.json() as Snapshot & {session:string;error?:string;reload?:boolean};if(!r.ok){if(d.reload){pending.current=null;await load();}throw Error(d.error||'連線中斷，請重試。');}return d;}
 async function load(){let id='';try{id=localStorage.getItem('rainlit-session')??'';}catch{setStorageWarning(true);}const d=await api(id?'load':'start',id?{session:id}:{});id=id||d.session;setSession(id);setGame(d);try{localStorage.setItem('rainlit-session',id);localStorage.setItem(openingKey,String(passages.length));}catch{setStorageWarning(true);} }
 useEffect(()=>{if(started.current)return;started.current=true;load().catch(e=>setError(e.message)).finally(()=>setBusy(false));},[]); // one session per mount
 async function turn(action?:Action){if(!game||lock.current)return;const message=text.trim();if(!action&&!message&&!pending.current)return;setSelected(null);lock.current=true;setBusy(true);setError('');const request=pending.current??{session,turnId:crypto.randomUUID(),revision:game.state.revision,action,text:action?'':message};pending.current=request;
 try{const d=await api('turn',request);setGame(d);setText('');pending.current=null;}catch(e){setError(e instanceof Error?e.message:'連線中斷，請重試。');}finally{lock.current=false;setBusy(false);}}
 const departed=game?.state.phase==='departed';
 const owner=!!game?.state.ownerPhase;
 const cinematic=!!game&&['key','departed','afterword'].includes(game.state.ownerPhase??'');
 const ownerDone=game?.state.ownerPhase==='afterword';
 const observation=game&&(!departed||owner)&&!cinematic?sceneSpots(game).find(p=>p.id===selected):undefined;
 return <section className={'rain-game'+(owner?` owner owner-${game?.state.ownerPhase}${cinematic?' cinematic':''}`:departed?' departed':game?.state.attachment==='released'?' released':'')} aria-label={owner?'陳伯安的故事':'雨蓉的故事'}>
 <div className="game-top"><button className="back" onClick={onHome} disabled={busy}><ArrowIcon direction="left"/>回到首頁</button><span className="desktop-table-title">{owner?'第二桌 · 未說完的交代':'第一桌 · 窗邊的客人'}</span><span className="mobile-cafe-title">雨夜咖啡館</span><button className="back" onClick={()=>setLog(!log)} aria-expanded={log}>對話紀錄</button></div>
 {storageWarning&&<p className="game-warning">瀏覽器無法儲存進度；離開頁面後可能需要重新開始。</p>}
 {log&&<div className="conversation-log" role="region" aria-label="對話紀錄">{game?.history.map((l,i)=><p key={i}><small>{l.speaker}</small>{l.text}</p>)}<button onClick={()=>setLog(false)}>收起紀錄</button></div>}
 {game&&(!departed||owner)&&!cinematic&&<SceneExplore key={owner?'owner':'rain'} game={game} disabled={busy||!!pending.current||game.state.exitAttempt} selected={selected} onSelect={setSelected}/>}
 <div className="scene-caption"><span>{owner?(game?.state.ownerPhase==='seated'?'老先生':cinematic?'留下的溫度':'陳伯安'):departed?'空下來的座位':'林雨蓉'}</span><small>{owner?(cinematic?'鑰匙留了下來，他還有自己的日子。':game?.state.ownerPhase==='ready'?'他終於鬆開了握著鑰匙的手。':'桌上只有一份菜單。'):departed?'雨仍然下著。':'她似乎已經坐了很久。'}</small></div>
 <div className="game-bottom">
 <div className={'objects'+(game?.state.umbrellaKnown?' has-items':'')}><span>隨身與桌邊</span><p>{owner?(cinematic?'備用鑰匙 · 留在桌上':'菜單 · 桌上／備用鑰匙 · 他身上'):game?(game.state.umbrellaKnown?({counter:'深藍色雨傘 · 吧台旁',player:'深藍色雨傘 · 你手中',table:'深藍色雨傘 · 她桌邊',outside:'雨傘 · 已隨她離開'}[game.state.umbrella]):'窗邊的桌上，放著一杯冷咖啡。'):'正在推開店門…'}</p>{!owner&&game?.state.read&&<details><summary>讀過的信</summary><p>我先問價錢而已，沒有答應。妳不想搬就不搬，星期三吃飯再講。</p></details>}</div>
 <div className="dialogue-panel" id="scene-dialogue">
 <p className="dialogue-name">{game?.state.exitAttempt?'店門前':observation?`環顧店內 · ${observation.name}`:owner?(game?.state.ownerPhase==='seated'?'裡面的桌子 · 老先生':cinematic?'未說完的交代 · 尾聲':'裡面的桌子 · 陳伯安'):departed?'雨夜咖啡館':'窗邊 · 雨蓉'}</p>
 <div className="current-lines" aria-live="polite" aria-busy={busy}>{observation?<p className="narration">{observation.text}</p>:game?.lines.map((l,i)=><p className={l.speaker==='旁白'?'narration':''} key={i}>{l.text}</p>)}{!game&&!error&&<p>門裡的燈還亮著。</p>}</div>
 {busy&&<p role="status" className="thinking">等一會，對方正在回應……</p>}
 {error&&<div role="alert" className="game-error"><p>{error}</p><button disabled={busy} onClick={()=>{if(game)void turn();else{setBusy(true);setError('');load().catch(e=>setError(e.message)).finally(()=>setBusy(false));}}}>重試</button>{!game&&<button onClick={()=>{try{localStorage.removeItem('rainlit-session');}catch{}setBusy(true);setError('');load().catch(e=>setError(e.message)).finally(()=>setBusy(false));}}>重新進店</button>}</div>}
 {game?.fallback&&<p className="game-warning">這次以預寫對話接續。你仍可選擇下方動作。</p>}
 {game?.state.exitAttempt?<div className="game-choices"><button disabled={busy||!!pending.current} onClick={()=>turn('stay')}>留在店裡，回到座位旁<ArrowIcon direction="return"/></button></div>:observation?<div className="game-choices">{observation.action&&<button disabled={busy||!!pending.current} onClick={()=>turn(observation.action)}>{observation.label}<ArrowIcon/></button>}<button onClick={()=>setSelected(null)}>回到對話<ArrowIcon direction="return"/></button></div>:departed&&!owner?<div className="chapter-end"><p>雨聲裡，你注意到更裡面的桌旁坐著一位老先生。</p>{game?.choices.map(c=><button key={c.action} disabled={busy} onClick={()=>turn(c.action)}>{c.label}<ArrowIcon/></button>)}<button disabled={busy} onClick={()=>turn('player_leave')}>望向店門<ArrowIcon/></button></div>:<>
 <div className="game-choices">{game?.choices.map(c=><button key={c.action} disabled={busy||!!pending.current} onClick={()=>turn(c.action)}>{c.label}<ArrowIcon/></button>)}</div>
 {ownerDone&&<p className="chapter-note">陳伯安的故事已結束。小禾篇仍在製作，進度已保存。</p>}
 {!cinematic&&<form className="free-input" onSubmit={e=>{e.preventDefault();void turn();}}><label className="sr-only" htmlFor="rain-input">你想說什麼，或做什麼？</label><input id="rain-input" placeholder="或是，說些你想說的話……" value={text} maxLength={400} disabled={!game||busy||!!pending.current} onChange={e=>setText(e.target.value)}/><button disabled={!game||busy||!text.trim()||!!pending.current} type="submit" aria-label="送出對話"><ArrowIcon/></button></form>}
 </>}
 </div></div>
 </section>
}
