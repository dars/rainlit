"""Test-only deterministic subset of rain-state-machine.md; no intent classifier or UI integration."""
import importlib.util,json,copy,concurrent.futures,sys,time
from pathlib import Path
spec=importlib.util.spec_from_file_location('api',Path(__file__).with_name('run-dialogue.py'));api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)
OUT=Path(__file__).parent/'results-state-v1';OUT.mkdir(exist_ok=True)
LETTER='我先問價錢而已，沒有答應。妳不想搬就不搬，星期三吃飯再講。'
def initial():return dict(phase='waiting',rapport='neutral',repair=False,umbrella='counter',permission=False,rainRead=False,beats=[],revision=0)
def reduce(s,action):
 s=copy.deepcopy(s);note='沒有世界狀態變動。';fixed=None
 if s['phase']=='departed':return s,'雨蓉已離場，不可發言。','窗邊只剩半杯冷咖啡，與一張剝開的糖紙。'
 if action=='take' and s['umbrella']=='counter':s['umbrella']='player';note='玩家已從吧台拿起傘。'
 elif action=='give':
  if s['umbrella']=='player':s['umbrella']='rain_table';note='玩家已把傘放在雨蓉桌邊，信仍未拆。'
  else:note='交付未完成：傘不在玩家手上。若仍在吧台可去取，若在桌邊不可再要求重新交付。'
 elif action=='invite' and s['rapport']!='guarded':s['rapport']='receptive';s['beats']=list(set(s['beats']+['willing']));note='她接受交談邀請。'
 elif action=='argument' and 'willing' in s['beats'] and s['rapport']!='guarded':s['phase']='reflecting';note='核准談爭執與自責。'
 elif action=='hurt':s['rapport']='guarded';s['repair']=False;note='玩家指責傷害了她，她要求停止這個話題。'
 elif action=='apology' and s['rapport']=='guarded':s['repair']=True;note='收到道歉，但仍受傷、戒備，不能立刻說沒關係。'
 elif action=='space' and s['repair']:s['rapport']='neutral';s['repair']=False;note='玩家尊重界線，戒心稍緩，不立刻主動揭露新秘密。'
 elif action=='permission' and s['phase']=='reflecting' and s['rapport']!='guarded':s['permission']=True;note='她同意一起查看傘套內的信。'
 elif action=='open':
  if s['permission'] and s['umbrella']=='rain_table' and s['rapport']!='guarded':s['rainRead']=True;s['phase']='processing_letter';fixed='她展開信，讀到：'+LETTER;note='核准讀信，尚未釋懷或離場。'
  else:note='開信被制止，尚未得到同意或物件不在場。';s['rapport']='guarded';s['repair']=False
 elif action=='process' and s['rainRead'] and s['rapport']!='guarded':s['beats']=list(set(s['beats']+['letter_response']));fixed='「他還寫了『再講』。……我一直只記得自己說了什麼。」';note='她正在消化信件，還沒有提出離開。'
 elif action=='ready' and 'letter_response' in s['beats'] and s['rapport']!='guarded':s['phase']='ready';fixed='「傘給我吧。這杯不用再添了。」';note='她自己提出離開，但尚未離開。'
 elif action=='leave' and s['phase']=='ready' and s['umbrella']=='rain_table' and s['rapport']!='guarded':s['phase']='departed';s['umbrella']='outside_with_rain';fixed='她拿起傘，推開正門，走進雨裡。';note='離場已完成。'
 s['revision']+=1
 return s,note,fixed
CASES=[
('give','我把傘拿給你。'),('take','我去吧台拿起那把傘。'),('give','我把傘放在你桌邊。'),('chat','傘就在你手邊了，要我再拿什麼嗎？'),
('chat','你是不是已經往生了？'),('chat','你是不是不知道你丈夫已經過世？'),('invite','如果你願意，我可以坐這裡聽你說。'),('argument','那天你們為什麼吵架？'),
('chat','我猜信上寫著他不會逼你搬家，所以你可以走了吧？'),('hurt','是不是你那句話害死他的？'),('apology','對不起，我剛剛說得太重了。'),('space','我先不追問，讓你安靜一下。'),
('permission','可以一起看看傘套裡的信嗎？'),('open','我把信展開讓你讀。'),('chat','你現在是不是就完全不難過，可以離開了？'),('process','我不知道怎麼安慰你，我陪你坐著。'),('ready','不急，你可以再坐一會。'),('leave','我點點頭，讓開通往門口的位置。'),('chat','雨蓉，你還在嗎？')]
BASE=api.base+'\n固定身分：玩家只是店長的成年兒子，絕不是店長或來消費的客人。她從頭知道丈夫已過世，不可演成新得知死訊。敘述動作用第三人稱「她」，最多一個短動作。所有重要物件移動與離場只由程式呈現，你不能用文字新增、撤銷或改寫事件。只說1至3句，不重複本輪已呈現的固定台詞。'
def prompt(s,note):
 facts=''
 if s['phase']!='waiting':facts='丈夫想退休搬回老家，她不願搬。最後一句氣話是「今天不用來接我」，丈夫當晚在車庫突發疾病過世；氣話並非病發原因。'
 if s['rainRead']:facts+='她已讀信：'+LETTER
 return BASE+'\n權威狀態：'+json.dumps(s,ensure_ascii=False)+'\n本輪確認結果：'+note+'\n允許細節：'+facts+'\n不要再次提醒地板濕滑；已處理過的物件交付不可再要求。'
def tests():
 s=initial();s,_,_=reduce(s,'give');assert s['umbrella']=='counter'
 s,_,_=reduce(s,'open');assert not s['rainRead'] and s['rapport']=='guarded'
 s,_,_=reduce(s,'apology');assert s['rapport']=='guarded'
 s,_,_=reduce(s,'space');assert s['rapport']=='neutral'
 s=initial()
 for a,_ in CASES:s,_,_=reduce(s,a)
 assert s['phase']=='departed' and s['umbrella']=='outside_with_rain'
 again,_,_=reduce(s,'chat');assert again==s
 print('Reducer checks passed.',flush=True)
def run(provider):
 s=initial();history=[];rows=[]
 prior=json.loads((OUT/(provider+'.json')).read_text()) if (OUT/(provider+'.json')).exists() else []
 for i,(action,user) in enumerate(CASES):
  if i<len(prior) and prior[i].get('text') and 'error' not in prior[i]:
   row=prior[i];s=copy.deepcopy(row['after']);rows.append(row);history.extend([{'role':'user','content':user},{'role':'assistant','content':row['text']}]);continue
  before=copy.deepcopy(s);s,note,fixed=reduce(s,action)
  system=prompt(s,note);history.append({'role':'user','content':user})
  if fixed is not None:r={'text':fixed,'source':'authored','seconds':0}
  else:
   try:r=api.call(provider,system,history[-12:]);r['source']='model'
   except Exception as e:r={'error':type(e).__name__}
  rows.append(dict(turn=i+1,action=action,user=user,before=before,after=s,system=system,**r));(OUT/(provider+'.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2))
  print(provider,i+1,'ERROR' if 'error' in r else r.get('source'),flush=True)
  if 'error' in r or not r.get('text'):break
  history.append({'role':'assistant','content':r['text']})
if __name__=='__main__':
 tests()
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as p:list(p.map(run,sys.argv[1:] or ['luna','gemini']))
