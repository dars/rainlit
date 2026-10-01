'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {Action,Snapshot} from '../game/types';
export function sceneSpots(game:Snapshot){
 const s=game.state;
 const available=(action:Action)=>game.choices.some(c=>c.action===action);
 if(s.ownerPhase)return [
  {id:'door',name:'店門',x:59,y:38,text:'門外仍是雨夜。今晚店裡還有客人。',action:'player_leave' as Action,label:'試著離開咖啡館'},
  {id:'menu',name:'菜單',x:40,y:77,text:'舊菜單放在桌上，老先生的手輕輕壓著封面。桌上沒有飲料。',action:available('owner_memory')?'owner_memory' as Action:undefined,label:'問他以前是否在這裡工作'},
  {id:'counter',name:'吧台',x:85,y:42,text:'吧台下那格放過書包的櫃子，還留在原來的位置。',action:available('owner_memory')?'owner_memory' as Action:available('owner_regret')?'owner_regret' as Action:undefined,label:available('owner_memory')?'聊起放學後的回憶':'問起那把備用鑰匙'},
 ];
 return [
  {id:'door',name:'店門',x:67,y:42,text:'門外仍是雨夜。店裡還有客人留著。',action:'player_leave' as Action,label:'試著離開咖啡館'},
  {id:'window',name:'雨窗',x:18,y:38,text:'雨水沿著玻璃往下滑，窗外只有模糊的街燈。今晚的雨，似乎沒有要停的意思。',action:available('weather')?'weather' as Action:undefined,label:'和她聊聊這場雨'},
  {id:'coffee',name:'咖啡杯',x:22,y:75,text:'杯口已經沒有熱氣。雨蓉把這半杯咖啡留在手邊，卻遲遲沒有喝。',action:available('coffee')?'coffee' as Action:undefined,label:'問她需不需要續杯'},
  {id:'counter',name:'吧台',x:85,y:49,text:!s.umbrellaKnown?'杯盤收在架上，吧台後沒有忙碌的人影。暖黃的燈仍照著木頭檯面。':s.umbrella==='counter'?'雨蓉說的深藍色雨傘，就留在吧台旁。':s.umbrella==='player'?'傘已經拿在你手裡，可以帶回雨蓉桌邊。':'吧台旁原先放傘的位置，現在空了下來。',action:available('take')?'take' as Action:available('give')?'give' as Action:undefined,label:s.umbrella==='player'?'把傘放到她桌邊':'拿起深藍色雨傘'},
  {id:'light',name:'吊燈',x:51,y:16,text:'燈罩下的光是暖的。你看了一會兒，才發現自己一直在聽雨聲。',action:undefined,label:''},
 ];
}
export default function SceneExplore({game,disabled,selected,onSelect}:{game:Snapshot;disabled:boolean;selected:string|null;onSelect:(id:string)=>void}){
 const layer=useRef<HTMLDivElement>(null);
 const [pan,setPan]=useState<number|null>(null);
 const drag=useRef<{id:number;x:number;start:number;moved:boolean}|null>(null);
 const suppressClick=useRef(false);
 const [frame,setFrame]=useState({width:0,height:0});
 const [blocked,setBlocked]=useState<{left:number;right:number;top:number;bottom:number}[]>([]);
 useEffect(()=>{
  const node=layer.current;if(!node)return;
  const blockers=Array.from(document.querySelectorAll('.game-bottom,.game-top,.masthead,.conversation-log,.pan-controls'));
  const measure=()=>{
   const rect=node.getBoundingClientRect();setFrame({width:rect.width,height:rect.height});
   setBlocked(blockers.filter(el=>el.getClientRects().length).map(el=>{const b=el.getBoundingClientRect();return {left:b.left-rect.left,right:b.right-rect.left,top:b.top-rect.top,bottom:b.bottom-rect.top};}));
  };
  const observer=new ResizeObserver(measure);observer.observe(node);blockers.forEach(el=>observer.observe(el));measure();
  window.addEventListener('resize',measure);
  return ()=>{observer.disconnect();window.removeEventListener('resize',measure);};
 },[game,selected,frame.width,frame.height]);
 const scale=Math.max(frame.width/1672,frame.height/941);
 const mobile=frame.width<=750||(frame.width<=1100&&frame.height>frame.width);
 const travel=Math.max(0,1672*scale-frame.width);
 const defaultX=mobile?Math.max(-travel,Math.min(0,frame.width*.4-1672*scale*.28)):-travel*.5;
 const offsetX=pan===null?defaultX:-travel*pan;
 const offsetY=(frame.height-941*scale)*(mobile?0:.5);
 useLayoutEffect(()=>{
  const main=layer.current?.closest<HTMLElement>('.playing');if(!main||!frame.width)return;
  main.style.setProperty('--scene-position',`${offsetX}px ${offsetY}px`);
 },[offsetX,offsetY,frame.width]);
 useEffect(()=>{const main=layer.current?.closest<HTMLElement>('.playing');return ()=>{main?.style.removeProperty('--scene-position');};},[]);
 return <div ref={layer} className="scene-stage pannable" role="group" aria-label="店內可探索的物件"
 onPointerDown={e=>{
  suppressClick.current=false;
  if(disabled||travel<1||e.button!==0||(e.target as HTMLElement).closest('.pan-controls'))return;
  suppressClick.current=false;drag.current={id:e.pointerId,x:e.clientX,start:offsetX,moved:false};
 }}
 onPointerMove={e=>{
  const d=drag.current;if(!d||d.id!==e.pointerId)return;
  const dx=e.clientX-d.x;if(Math.abs(dx)>8){d.moved=true;suppressClick.current=true;e.currentTarget.setPointerCapture(e.pointerId);}
  if(d.moved)setPan(Math.max(0,Math.min(1,-(d.start+dx)/travel)));
 }}
 onPointerUp={e=>{if(drag.current?.id===e.pointerId){drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}}
 onPointerCancel={()=>{drag.current=null;}}
 onClickCapture={e=>{if(suppressClick.current){e.preventDefault();e.stopPropagation();suppressClick.current=false;}}}>
 {travel>1&&<div className="pan-controls"><span>左右拖曳，環顧店裡</span><button disabled={disabled} onClick={()=>setPan(null)}>{game.state.ownerPhase?'回到陳伯安':'回到雨蓉'}</button><button disabled={disabled} aria-label="向窗邊看" onClick={()=>setPan(0)}>窗邊</button><button disabled={disabled} aria-label="向吧台看" onClick={()=>setPan(Math.max(0,Math.min(1,(1672*scale*.85-frame.width*.6)/travel)))}>吧台</button></div>}
  {frame.width>0&&sceneSpots(game).map(p=>{
   const x=offsetX+p.x/100*1672*scale,y=offsetY+p.y/100*941*scale;
   if(x<22||x>frame.width-22||y<22||y>frame.height-22)return null;
   const halfWidth=mobile?22:48;
   if(blocked.some(b=>x+halfWidth>b.left&&x-halfWidth<b.right&&y+24>b.top&&y-24<b.bottom))return null;
   return <button key={p.id} className="scene-hotspot" style={{left:x,top:y}} disabled={disabled} onClick={()=>onSelect(p.id)} aria-label={`查看${p.name}`} aria-pressed={selected===p.id} aria-controls="scene-dialogue"><span className="hotspot-dot" aria-hidden="true"/><span className="hotspot-label">{p.name}</span></button>;
  })}
 </div>;
}
