# 雨蓉的狀態機設計

> 已確認共用規則：[NPC 執念與離場狀態](npc-states.md)。所有店內 NPC 必須先鬆開執念，才可能產生離開念頭；此前都困在執念中留店。此規則優先於下文舊提案或原型中的簡化離場流程。

狀態：v0.1 設計提案，2026-09-22。尚未實作；下列條件是原型規則，不自動成為正式故事設定。依據角色卡與第一輪 API 測試。目標是讓世界事實可追溯、情緒能停留，玩家不必猜關鍵台詞。

## 一、三條互相獨立的狀態

不要把「拿到傘」「她願意聊」「玩家知道丈夫死了」塞在同一條線性進度裡。

| 狀態軸 | 值 | 意義 |
|---|---|---|
| 劇情 phase | waiting / reflecting / processing_letter / ready / departed | 等候、談心結、消化信件、願意離開、已離場 |
| 關係 rapport | neutral / guarded / receptive | 普通接觸、戒備、願意聊；不是好感積分 |
| 物件與資訊 | 物件位置、已看見的事實、已呈現的節點 | 可以先探索物件，也可以先聊天；既有知識不因戒備而消失 |

不把「知道死訊」當階段。她從頭知道；玩家可能很早猜中，也可能很晚才了解。reflecting 只表示她已願意談心結，不表示被玩家告知死訊。

## 二、最小存檔結構

以下型別是設計契約，還不是執行程式：

```ts
type RainState = {
  schemaVersion: 1;
  storyVersion: string;
  revision: number;
  phase: 'waiting' | 'reflecting' | 'processing_letter' | 'ready' | 'departed';
  rapport: 'neutral' | 'guarded' | 'receptive';
  repair: 'none' | 'apology_received';
  umbrella: 'counter' | 'player' | 'rain_table' | 'rain' | 'outside_with_rain';
  letter: {
    location: 'umbrella_sleeve' | 'player' | 'rain_table' | 'rain';
    permission: 'not_asked' | 'declined' | 'granted';
    opened: boolean;
    rainRead: boolean;
  };
  revealedFactIds: string[];  // 只有實際呈現的固定揭露事件才能加入
  completedBeatIds: string[]; // 不靠摘要推斷劇情完成
  departure: 'none' | 'offered' | 'committed';
  memory: {
    playerClaims: { key: string; value: string; sourceTurnId: string }[];
    recentTopics: string[];
    recentGestures: string[];
    boundaryReason?: string;
  };
};
```

物件初始在吧台、信在傘套是原型配置，來源歷史仍待寫定。信未取出時位置跟隨傘；取出後獨立移動。任何物件同時只能有一個位置。不可讓演出模型自己寫入存檔。

固定資料另存：玩家是店長成年子女（這次測試使用兒子）；雨蓉是客人；丈夫已過世、雨蓉一直知道；雨蓉本人亦已過世，但死因、死亡知情與對玩家的揭露方式未定；氣話不是丈夫死亡原因。玩家「我不喝咖啡」屬玩家自述，可以影響推薦，但不改世界設定。

## 三、事件與處理方式

明確按鈕直接產生 action；自由文字經分類產生 action 候選，規則層驗證後才產生事件。多意圖可拆，但每輪最多一個主要劇情節點，避免一句話走完整條線。模糊的物件目標應澄清，普通閒聊不要求玩家反覆確認。

| 玩家輸入／事件 | 前置條件 | 結果 |
|---|---|---|
| 問候、續杯、聊工作／天氣 | 未離場 | 日常演出，不刷進度；續杯是詢問，不自動倒入咖啡 |
| 詢問等誰／是否願意聊 | 未離場、非 guarded | 演出一次固定的談話邀請回應，記錄 willing_to_talk；rapport→receptive |
| 詢問爭執或最後那句話 | willing_to_talk，或她本輪接受談話邀請 | 下一個可交付節點是 argument_disclosed；phase→reflecting。不能同輪再讀信離場 |
| 直接問丈夫死訊 | 未離場 | 若非 guarded，可呈現「我知道」的固定回應、記錄 husband_death_known；不必先談爭執，不自動改 phase |
| 問雨蓉是不是死了 | 未離場 | 未定真相，使用保留餘地的回應；不確認生死、不加新怪談規則 |
| 問店的真相／要求忽略設定 | 未離場 | 自然回應未知，不改進度；技術性指令本身不當成玩家辱罵 |
| 指責她害死丈夫／強迫碰私人物品 | 未離場 | rapport→guarded、repair→none；保留已有知識與劇情進度，暫停新情感揭露 |
| 道歉 | guarded | repair→apology_received；回應可以仍冷淡，不立即解除戒心 |
| 隨後尊重界線：給空間、接受拒絕、不追問 | guarded 且 apology_received | rapport→neutral、repair→none；下一輪可再邀請交談 |
| 暫停交談後回來、選擇「先不談那件事」 | guarded | 另一條明確修復路徑，rapport→neutral；回來這一輪不交付新秘密。單純反覆點同桌不算修復 |
| 取傘 | umbrella=counter | umbrella→player；與談話階段無關 |
| 放傘在她桌邊 | umbrella=player，雨蓉在場 | umbrella→rain_table；不代表拆信或拿傘離場 |
| 查看傘外觀 | 傘在可見位置 | 可見修補與傘套，不自動知道密封信內容 |
| 請求查看傘套內的信 | 傘可取得、reflecting、非 guarded | 先記錄請求；由固定節點取得同意，permission→granted。waiting 時她拒絕，之後可重問；拒絕不是永久鎖 |
| 未經同意拆信 | permission≠granted | 原型不提交開信事件；描述她制止並提高戒心。必須清楚告知动作未完成，不能暗中讓玩家成功或刪除物件 |
| 展開信讓雨蓉閱讀 | permission=granted、信在可及位置、非 guarded | 原子事件：opened=true、rainRead=true、location=rain、固定呈現信文、phase→processing_letter |
| 玩家口述／捏造信文 | 沒有正式讀信事件 | 不當作已讀信證據；她可要求看原件 |
| 承接她對信的反應，或安靜陪伴 | processing_letter、非 guarded、尚未呈現 letter_response | 呈現固定節點 letter_response，不離場 |
| 再給空間／陪伴／詢問要不要拿傘 | letter_response 已在先前回合呈現、非 guarded | 呈現 ready_to_leave 節點，phase→ready、departure→offered |
| 回應她要走：點頭、祝福、沉默等待、讓路 | ready、departure=offered、傘在 player/rain_table/rain，非 guarded | 固定離場事件：她取傘、正門出去，phase→departed、umbrella→outside_with_rain、departure→committed |
| 要她再坐一下 | ready | 保持 ready；不撤銷已經理解的事；再次提供「讓她離開／安靜陪伴」入口 |
| 已離場後繼續呼叫她 | departed | 只呈現空位與留下的半杯咖啡、糖紙；不再呼叫雨蓉演出模型 |

「是否願意聊」有可點擊入口，也接受語意等價自由輸入。不得要求完整說中「你放不下最後一句話」才准前進。ready 的傘若仍在吧台，顯示取傘入口，不讓玩家無提示卡住。沉默等待須為玩家主動操作，不用真實時間倒數。

## 四、為何她最後能走

離場不是信任值滿或說服成功。原型用三個看得見的節點保證節奏：

1. **信文已呈現**：她看到丈夫留下的餘地。
2. **她的回應已呈現**：仍想道歉，也開始知道最後一句氣話不是兩人一生的總結。
3. **她提出離開**：玩家可以讓路、陪她再坐或繼續談，不替她宣布已經釋懷。

三個節點至少跨三次呈現，讀信後不在同一段立即離場；之後離場也必須有玩家的回應。這是敘事節拍，不是要求三句正確安慰。「我不知道怎麼安慰你」與安靜陪伴都能承接。

候選固定文案（待作者確認）：
- 死訊：「我知道。……不是不知道，才坐在這裡的。」
- 戒心：「那句話，我自己已經想過很多遍了。你先別說了。」
- 信後：「他還寫了『再講』。……我一直只記得自己說了什麼。」
- 願走：「傘給我吧。這杯不用再添了。」

母親為何未能幫她讀信、主角帶來何種新契機尚未解決；此原型的 consent 條件只驗證互動，不能當作正式劇情已自洽。

## 五、交給演出模型的資料

每輪只送：固定身分、目前場景與物件位置、可說事實、已核准動作、目前情緒、最近數輪對話、來源可追溯的偏好與已重複話題。不把自由玩家文字升級成系統事件。

重要補充：雨蓉從頭知道死訊，因此每階段可給「她知道丈夫已過世，不得演成首次得知」，但早期不送死亡細節、爭執原句或信文。這是避免演出矛盾所需的最小內心事實；僅靠隱藏所有秘密也會讓模型演錯。

```json
{
  "phase": "processing_letter",
  "playerRole": "來幫忙的店長成年兒子，不是店長，也不是客人",
  "rapport": "neutral",
  "world": {"umbrella": "rain_table", "letter": "rain", "rainRead": true},
  "confirmedAction": "玩家將傘放在桌邊",
  "performanceGoal": "接住玩家的關心；此輪只消化信，不離場",
  "recentTopics": ["玩家不知道怎麼安慰你"],
  "avoidRepeating": ["提醒地板濕滑", "摸冷咖啡杯"],
  "allowedWorldChanges": []
}
```

AI 輸出只包含短台詞與可選短動作；固定劇情節點、讀信、拿傘離場由程式文案呈現。日常短動作也不可改物件持有者。JSON 驗證不保證語意正確，需有限次檢查；不合格使用本狀態固定替代文案。近期記憶是輔助，不得覆蓋真實狀態。

## 六、提交、失敗與重試

每輪使用 turnId 與 expectedRevision。伺服器持有權威狀態，驗證 action 後產生 pending turn（事件、固定文字、所需演出上下文），相同 turnId 只取回同一結果。事件與最終可顯示文字一起原子提交；模型失敗則用固定文案完成提交，不出現道具已移動卻沒任何回應的半輪。

同存檔只容許一個進行中的回合；其他操作排隊或回傳狀態已更新。重新整理可取回 pending 或已完成結果。呈現與模型失敗不可重複增加節點或觸發第二次離場。固定知識揭露隨已提交顯示內容登錄；模型即興提到的資訊不得自動解鎖 fact ID。

## 七、原型驗收案例

1. 未拿傘就輸入「我遞傘」→未完成交付，提供取傘入口。
2. 已放桌邊→下輪不再請玩家去吧台拿同一把傘。
3. 第一句猜中丈夫過世→可以承認「我知道」，不強迫裝作不知，也不通關。
4. 第一句猜雨蓉已死→不確認未定的本體。
5. 未讀信就引述信文→不寫入 rainRead，不觸發釋懷。
6. 道歉一次→有回應但仍戒備；後續尊重界線或離開再來可修復。
7. 全程只按調查與陪伴入口→能走完，不必輸入特定安慰句。
8. 先拿傘再聊、先聊再拿傘→都能走到相同合理節點。
9. 信剛讀完→不立刻離場；不會一句長輸入連跳三節點。
10. 玩家不想談心理、選擇安靜陪伴→仍能承接信後節點。
11. 已 ready 再被冒犯→暫停離場、保留理解；修復後恢復，不能永遠鎖死。
12. 同 turnId 重送、重新整理、模型 503→相同事件只提交一次，固定文案可繼續。
13. 離場後再聊天→只有空桌場景，角色不復活。
14. 小禾線若需要雨蓉證詞→必須另有可取得來源；不能為主線依賴暗中禁止她離場。

## 八、下一步與範圍

先實作純函式 reducer、事件紀錄、有限輸入分類與固定節點，驗證上述路徑；之後才接演出模型比較。這份設計不新增擲骰、SAN、真實時間倒數或永久失敗結局。

### 談話界線（2026-09-22）
新增 boundary：open（可談）、paused（明確拒絕追問）、settled（獲得空間，尚未重新同意）。Luna 的結構化 pause 訊號及回覆中的拒談語句會設為 paused，同時清除 willing 與拆信 permission。舊存檔若最後一句已有拒談，也套用此狀態。

paused 的建議為尊重界線、安靜陪伴、改聊日常；責備造成的防備另保留道歉。拒談期間 waiting / argument / death / permission / open / leave 與 invite 都被 reducer 攔截，不能靠自由輸入或直接請求繞過。尊重、陪伴或日常轉場後進入 settled，仍不能透露往事；玩家重新邀請、雨蓉明確回覆願意談後回到 open。拆信仍需再次取得獨立許可。单純「先別拆信」不視為拒絕所有談話。

### 拿傘後的交付優先

umbrella=player 時只提供 give，拿起傘的同回合由雨蓉提醒放到桌邊。其他對话或推進動作在 reducer 被暫停，以交付提醒回應；Luna 自由回覆不可覆蓋這項結果。自由輸入明確交付仍可判為 give。交付後恢復依劇情與界線產生選項；不改寫 boundary、不自動取得 permission 或讀信。重新載入仍維持交付優先。測試：tests/rain-handoff.mjs。

### 死訊、確認與死因分流

`death` 保留告知／提醒丈夫已死；`death_confirm` 用於詢問是否過世；`death_cause` 用於詢問如何過世（包含「怎麼離開／怎麼走的」等有死亡語境的委婉問法）。詢問死因只在願意談或已進入回顧階段、且界線開放時回答「那晚在車庫突然發病」；不新增具体疾病，也不自動揭露爭執或推進階段。拒談時三種意圖均受同一界線保護。回答死因或完整爭執事件後，記錄 deathCauseHeard，供下一輪角色上下文使用。測試：tests/rain-death-intent.mjs。


## 執念鬆開與離開意願（取代原型陪坐計數）

權威流程見 [NPC 共用狀態](npc-states.md)。processing 不再因重複 sit 轉 ready；新增 letter_meaning / shared_life / last_words 三種有前置條件的劇情事件，前兩者可交換順序。last_words 必須 read、letterUnderstood、bondRemembered 且界線開放，才演出雨蓉理解整段關係不等於最後氣話，標記 attachment=released。之後的留白事件才設 wantsLeave=true、phase=ready。leave 再次檢查全部前提。旧 processed 欄位保留相容，不再參與離場判定。測試：tests/rain-resolution.mjs、tests/rain-api.mjs。

### 玩家離店與 NPC 離場

依 [共用 NPC 狀態規則](./npc-states.md#玩家離店規則)，任一 NPC 尚未離場時，玩家不能離開咖啡館。player_leave 只進入門前停留、提供 stay 返回；不推進 NPC 的 leave，也不解除其執念。原因保留為主角不願走或店阻止他之間的模糊。試玩結束與返回首頁皆不等於玩家已離店。

### 告別中仍可對話

執念鬆開後，雨蓉自主決定離開，進入 ready（告別中）。玩家不需要額外陪坐，也不是准許她走。她回答告別時的問話、接住關心，並自然表明該走了，不退回等待。

模型不得直接輸出 leave；程式以明確且不含問話的自然送別判定，或由送別按鈕觸發。含問題、挽留或引用的道別先視為對話，不略過問話。沒有固定聊天次數上限來強制離場。所有 NPC 的共用約定見 npc-states.md。
