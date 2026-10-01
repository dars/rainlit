// Only a clear farewell without an accompanying question completes a goodbye.
// Ambiguous or quoted words remain conversation; the visible farewell choice is always available.
export function isFarewell(text:string):boolean{
 const value=text.trim();
 if(/[?？嗎麼呢何誰哪怎]|要不要|會不會|能不能|可不可以|等一下|等等|別走|不要走|先別|「|」|“|”|"/.test(value))return false;
 return /^(?:嗯[，,。\s]*)?(?:好[的啊吧]?[，,。\s]*)?(?:謝謝[妳你您]?[，,。\s]*)?(?:那[妳你您][，,。\s]*)?(?:路上小心|慢走|一路平安|再見|保重|晚安)(?:[，,。\s]*(?:謝謝[妳你您]?|路上小心|慢走|一路平安|再見|保重|晚安))*[。！!，,～~\s]*$/.test(value);
}
