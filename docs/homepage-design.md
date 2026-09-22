# 首頁試作

主題：雨夜咖啡館的遊戲標題頁。唯一主要任務是進入故事。

視覺：以空椅子為主角，左側文字與選單保持安靜；不使用動畫、卡片或行銷型區塊。背景由既有主視覺移除標題，真實 HTML 呈現文字。手機保留咖啡館背景，優先保障文字對比。

色彩：雨夜墨色 #101a1c、紙色 #f3ead5、灰褐 #c1b8a7、燈光琥珀 #d3ac72。
字體：標題用系統宋體 Songti TC，英文 Georgia，操作文字 PingFang TC。

已實作：首頁、故事介紹對話框、三段開場試閱、試閱進度本機保存與繼續閱讀。開場文案為試作，不新增正式故事設定。尚無完整遊戲、AI 對話或音訊。

背景：public/images/cafe-night.png，使用內建 imagegen 編輯 assets/key-visuals/before-closing-v1.png。提示詞：Remove ONLY the Chinese title lettering in the upper left and restore the underlying rain-streaked glass and timber naturally. Preserve exact composition, cafe, chair, lighting, coffee, umbrella, textures, colors and landscape aspect ratio. No text anywhere. No other changes.

## 美術方向修訂：2026-09-22

使用者指定所有當晚遊玩場景均為雨夜，窗外不得呈現白天或明亮灰白日光。室內以暖色燈具照明，窗外使用深藍黑夜色、雨痕與零星街燈。

雨蓉外觀以 assets/references/rain-approved-reference.png 左側女性為依據：深棕色低髮髻、臉旁鬆散髮絲、米褐色針織外套、深色 V 領上衣及沉思神情。這取代先前新生成的灰髮年長女性形象；不據外觀自行改動人物年表。
