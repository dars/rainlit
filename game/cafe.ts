import type {RainState} from './types';
export const guestIds=['guest_rain','guest_owner','guest_xiaohe'] as const;
export type CafeGuests=Record<typeof guestIds[number],{departed:boolean}>;
export function canPlayerLeave(guests:CafeGuests){
 return guestIds.every(id=>guests[id]?.departed===true);
}
export function cafeGuests(rain:RainState):CafeGuests{
 // Xiaohe remains unfinished; the key close-up is not a completed departure.
 return {guest_rain:{departed:rain.phase==='departed'},guest_owner:{departed:rain.ownerPhase==='departed'||rain.ownerPhase==='afterword'},guest_xiaohe:{departed:false}};
}
