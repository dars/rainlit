'use client';
import ArrowIcon from './ArrowIcon';
import RainGame from './RainGame';
import { useEffect, useRef, useState } from 'react';
import {passages,openingKey} from '../game/prologue';
export default function Home() {
 const [page,setPage]=useState<number|null>(null);
 const [saved,setSaved]=useState<number|null>(null);
 const [notice,setNotice]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{try {if(localStorage.getItem('rainlit-session')){setSaved(passages.length);return;}const n=Number(localStorage.getItem(openingKey)); if(localStorage.getItem(openingKey)!==null && Number.isInteger(n)&&n>=0&&n<=passages.length)setSaved(n);}catch{}},[]);
 function go(n:number){setPage(n);setSaved(n);try{localStorage.setItem(openingKey,String(n));}catch{setNotice('目前無法儲存進度；仍可繼續閱讀。');}}
 return <main className={page===null?'scene':page===passages.length?'scene playing':'scene reading'}>
  <div className="backdrop" aria-hidden="true"/><div className="shade" aria-hidden="true"/>
  <header className="masthead"><a href="/" aria-label="回到首頁" className="brand"><svg className="brand-mark" viewBox="0 0 36 44" fill="none" aria-hidden="true" focusable="false"><path d="M5 39V18a13 13 0 0 1 26 0v21M3 39h30" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M18 6v13" stroke="currentColor" strokeWidth="1.4"/><path d="M14 20h8l5 7H9l5-7Z" fill="currentColor"/><path d="M15 29h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M11 30h14l3 7H8l3-7Z" fill="currentColor" fillOpacity=".09"/></svg><span>雨夜咖啡館<small>THE RAINLIT CAFÉ</small></span></a><span className="edition">一段關於等待的故事</span></header>
  {page===null ? <section className="title-screen" aria-label="遊戲主選單">
    <p className="eyebrow"><span/> 今晚，燈還亮著</p>
    <h1>打烊前，<br/>還有一位客人</h1>
    <p className="english">One Last Guest<br className="mobile-break"/> Before Closing</p>
    <p className="invitation">雨還沒停。<br/>進來坐一會吧。</p>
    <nav className="menu" aria-label="主選單">
      <button className="start" onClick={()=>{try{localStorage.removeItem('rainlit-session');}catch{}go(0);}}><span className="menu-dash"/>開始遊戲<ArrowIcon className="arrow"/></button>
      <button disabled={saved===null} onClick={()=>go(saved??0)}>繼續故事 <span className="menu-note">{saved===null?'尚無紀錄':'繼續上次的夜晚'}</span></button>
      <button onClick={()=>{dialog.current?.showModal();dialog.current?.querySelector<HTMLElement>('#about-title')?.focus();}}>關於這個故事</button>
    </nav>
  </section> : page===passages.length ? <RainGame onHome={()=>setPage(null)}/> : <section className="opening" aria-label="開場試閱">
    <button className="back" onClick={()=>setPage(null)}><ArrowIcon direction="left"/>回到首頁</button>
    <div className="passage" key={page} aria-live="polite"><p className="eyebrow">序幕 · {passages[page][0]}</p><h2>{passages[page][1]}</h2><p>{passages[page][2]}</p></div>
    <div className="passage-controls"><span>楔子 · {page+1} / {passages.length}</span>{page<passages.length-1?<button onClick={()=>go(page+1)}>繼續 <ArrowIcon direction="right"/></button>:<button onClick={()=>go(passages.length)}>走向窗邊 <ArrowIcon/></button>}</div>
  </section>}
  <footer><span>單人敘事 · 探索 · 自由對話</span><span className="preview">故事試玩 <i/> 早期版本</span></footer>
  {notice&&<p role="status" className="notice">{notice}</p>}
  <dialog className="about-dialog" aria-labelledby="about-title" ref={dialog} onClick={e=>{if(e.target===dialog.current)dialog.current?.close()}}><div className="dialog-inner"><p className="eyebrow">THE RAINLIT CAFÉ</p><h2 id="about-title" tabIndex={-1}>有些等待，<br/>是為了好好告別。</h2><div className="about-copy"><p>母親過世後，你回到停業七年的咖啡館。<br/>燈還亮著，似乎仍有人在等。</p><p>探索店裡留下的物件，聽客人說話，慢慢拼起那些你未曾知道的日常。</p><p className="content-note">故事包含親人離世與詭異情節。<br/>目前可體驗雨蓉的故事，以及接續的陳伯安前段。自由對話由 AI 演出，進度會保存於此瀏覽器的專屬存檔。完整遊戲尚在製作。</p></div><form method="dialog"><button className="close">回到咖啡館 <ArrowIcon/></button></form></div></dialog>
 </main>
}
