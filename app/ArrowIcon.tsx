type Direction='diagonal'|'right'|'left'|'return';
const paths:Record<Direction,string>={diagonal:'M6 18 18 6M6 6h12v12',right:'M4 12h16m-6-6 6 6-6 6',left:'M20 12H4m6-6-6 6 6 6',return:'M9 5 4 10l5 5M4 10h10a5 5 0 0 1 0 10h-3'};
export default function ArrowIcon({direction='diagonal',className=''}:{direction?:Direction;className?:string}){
 return <svg className={`ui-arrow ${className}`} aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d={paths[direction]} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
