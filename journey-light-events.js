/* Date-aware light and encounter events for every train-search edition. */
(()=>{
  'use strict';
  const M=window.MADO_NIGHT_JOURNEY_MODEL,S=window.SPARKLING_DREAMS_CALCULATOR;
  const byId=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const q=new URLSearchParams(location.search),seed=M.jstParts();
  let rideDate=q.get('rideDate')||seed.date,ready=false,cache=null,view={status:'unselected'};
  const COPY={
  "ja": {
    "sunrise": "日の出",
    "sunset": "日の入り",
    "dateTime": "乗車日・出発時刻",
    "dateLabel": "乗車日（日本時間）",
    "timeLabel": "出発時刻（日本時間）",
    "now": "現在",
    "reset": "日付と時刻を現在の日本時間へ戻す",
    "panel": "乗車日の光とすれ違い",
    "along": "沿線",
    "near": "{0}付近",
    "between": "{0}〜{1}付近",
    "pass": "ディズニー新幹線とすれ違う見込み。",
    "encounter": "ディズニー新幹線とすれ違い",
    "estimate": "見込み",
    "about": "頃",
    "seat": "{0}席側",
    "tolerance": "前後約5分",
    "depart": "{0}発",
    "check": "乗車日を確認してください（JST）",
    "unselected": "まだ列車は未選択です",
    "jst": "日本時間（JST）。",
    "invalid": "乗車日を正しく選んでください。太陽計算の範囲は1901〜2099年です。",
    "before": "時刻表データの対象開始日より前です。この日の便とすれ違いは判定できません。",
    "past": "過去日です。当時のダイヤは未照合。",
    "future": "未来日です。その日の便の運行は未確認。",
    "today": "今日の運行変更・遅延は未反映。",
    "month": "10月固定ダイヤで走ると仮定した参考です。",
    "next": "翌日",
    "previous": "前日",
    "noNext": "翌日の便は自動で足しません。必要なら日付を進めてください。",
    "basis": "日時と日の出・日の入りについて",
    "basisTime": "日時は日本時間（JST）。日付と便を選ぶまで実時刻の太陽・すれ違いイベントは表示しません。23時台以降に候補がない場合、翌日の便を自動表示しません。",
    "basisData": "時刻表は2026-10-10確認の10月固定データ。全列車の運転日・臨時便・遅延は未収録です。過去日と未来日、その月以外の計算は同じダイヤで走ると仮定した参考です。",
    "basisSun": "太陽は各時刻の列車位置を線路形状へ対応させて計算。日の出・日の入りは太陽中心高度−0.833°の目安です。山・トンネル・建物・標高・雲は反映せず、実際に太陽が見える時刻を保証しません。",
    "source": "太陽計算の根拠（NOAA/Meeus）",
    "definition": "日の出・日の入りの定義（USNO）",
    "open": "ディズニー新幹線のページを見る"
  },
  "en": {
    "sunrise": "Sunrise",
    "sunset": "Sunset",
    "dateTime": "Travel date & departure",
    "dateLabel": "Travel date (Japan time)",
    "timeLabel": "Departure time (Japan time)",
    "now": "Now",
    "reset": "Reset to the current date and time in Japan",
    "panel": "Light and passing trains on your travel date",
    "along": "Along the route",
    "near": "Near {0}",
    "between": "Between {0} and {1}",
    "pass": "A Disney Shinkansen is expected to pass.",
    "encounter": "Passing a Disney Shinkansen",
    "estimate": "Expected",
    "about": "approx.",
    "seat": "Seat {0} side",
    "tolerance": "about ±5 min",
    "depart": "from {0}",
    "check": "Check your travel date (JST)",
    "unselected": "No train selected yet",
    "jst": "Japan time (JST). ",
    "invalid": "Choose a valid travel date between 1901 and 2099.",
    "before": "This date precedes the timetable data. Services and passing trains cannot be checked.",
    "past": "Past date: the historical timetable has not been checked. ",
    "future": "Future date: services for that day are unconfirmed. ",
    "today": "Today’s service changes and delays are not reflected. ",
    "month": "Reference only, assuming the fixed October timetable.",
    "next": "Next day",
    "previous": "Previous day",
    "noNext": "Next-day trains are not added automatically. Advance the date if needed.",
    "basis": "About dates, sunrise and sunset",
    "basisTime": "All times use Japan time (JST). Solar and passing-train events appear after you choose a date and train. If no trains are found after 23:00, next-day services are not added automatically.",
    "basisData": "The fixed October timetable was checked on 10 October 2026. Individual operating dates, extra services and delays are not included. Past, future and other-month results assume the same timetable.",
    "basisSun": "Solar position follows the train along the track. Sunrise and sunset use a solar-centre altitude of −0.833°. Mountains, tunnels, buildings, elevation and clouds are excluded; these estimates do not guarantee when the sun is visible.",
    "source": "Solar calculation (NOAA/Meeus)",
    "definition": "Sunrise and sunset definitions (USNO)",
    "open": "Read about the Disney Shinkansen"
  },
  "fr": {
    "sunrise": "Lever du soleil",
    "sunset": "Coucher du soleil",
    "dateTime": "Date et heure de départ",
    "dateLabel": "Date du voyage (heure du Japon)",
    "timeLabel": "Heure de départ (heure du Japon)",
    "now": "Maintenant",
    "reset": "Revenir à la date et à l’heure actuelles au Japon",
    "panel": "Lumière et croisements le jour du voyage",
    "along": "Le long de la ligne",
    "near": "Près de {0}",
    "between": "Entre {0} et {1}",
    "pass": "Croisement prévu avec un Shinkansen Disney.",
    "encounter": "Croisement avec un Shinkansen Disney",
    "estimate": "Prévision",
    "about": "env.",
    "seat": "Côté siège {0}",
    "tolerance": "environ ±5 min",
    "depart": "départ de {0}",
    "check": "Vérifiez la date du voyage (JST)",
    "unselected": "Aucun train sélectionné",
    "jst": "Heure du Japon (JST). ",
    "invalid": "Choisissez une date valide entre 1901 et 2099.",
    "before": "Cette date précède les données horaires. Impossible de vérifier les trains et les croisements.",
    "past": "Date passée : les horaires de l’époque n’ont pas été vérifiés. ",
    "future": "Date future : la circulation des trains reste à confirmer. ",
    "today": "Les changements et retards du jour ne sont pas pris en compte. ",
    "month": "Estimation fondée sur les horaires fixes d’octobre.",
    "next": "Lendemain",
    "previous": "Veille",
    "noNext": "Les trains du lendemain ne sont pas ajoutés automatiquement. Avancez la date si nécessaire.",
    "basis": "Dates, lever et coucher du soleil",
    "basisTime": "Toutes les heures sont celles du Japon (JST). Choisissez une date et un train pour afficher les événements solaires et les croisements. Sans résultat après 23 h, les trains du lendemain ne sont pas ajoutés automatiquement.",
    "basisData": "Horaires fixes d’octobre vérifiés le 10 octobre 2026. Les jours de circulation de chaque train, les trains supplémentaires et les retards ne sont pas inclus. Les calculs pour le passé, le futur ou un autre mois supposent les mêmes horaires.",
    "basisSun": "La position du soleil est calculée selon la position du train sur la voie. Le lever et le coucher correspondent à une hauteur du centre solaire de −0,833°. Relief, tunnels, bâtiments, altitude et nuages ne sont pas pris en compte ; la visibilité du soleil n’est pas garantie.",
    "source": "Calcul solaire (NOAA/Meeus)",
    "definition": "Définitions du lever et du coucher (USNO)",
    "open": "En savoir plus sur le Shinkansen Disney"
  },
  "de": {
    "sunrise": "Sonnenaufgang",
    "sunset": "Sonnenuntergang",
    "dateTime": "Reisedatum und Abfahrt",
    "dateLabel": "Reisedatum (japanische Zeit)",
    "timeLabel": "Abfahrtszeit (japanische Zeit)",
    "now": "Jetzt",
    "reset": "Auf das aktuelle Datum und die Uhrzeit in Japan zurücksetzen",
    "panel": "Licht und Zugbegegnungen am Reisetag",
    "along": "Entlang der Strecke",
    "near": "Bei {0}",
    "between": "Zwischen {0} und {1}",
    "pass": "Ein Disney-Shinkansen kommt voraussichtlich entgegen.",
    "encounter": "Begegnung mit einem Disney-Shinkansen",
    "estimate": "Voraussichtlich",
    "about": "ca.",
    "seat": "Sitzseite {0}",
    "tolerance": "etwa ±5 Min.",
    "depart": "ab {0}",
    "check": "Reisedatum prüfen (JST)",
    "unselected": "Noch kein Zug ausgewählt",
    "jst": "Japanische Zeit (JST). ",
    "invalid": "Bitte ein gültiges Datum zwischen 1901 und 2099 wählen.",
    "before": "Das Datum liegt vor dem Fahrplandatensatz. Züge und Begegnungen lassen sich nicht prüfen.",
    "past": "Vergangenes Datum: Der damalige Fahrplan wurde nicht geprüft. ",
    "future": "Zukünftiges Datum: Der Zugbetrieb ist noch unbestätigt. ",
    "today": "Heutige Fahrplanänderungen und Verspätungen sind nicht berücksichtigt. ",
    "month": "Schätzung unter Annahme des festen Oktoberfahrplans.",
    "next": "Folgetag",
    "previous": "Vortag",
    "noNext": "Züge des Folgetags werden nicht automatisch ergänzt. Bei Bedarf das Datum ändern.",
    "basis": "Zu Datum, Sonnenaufgang und Sonnenuntergang",
    "basisTime": "Alle Zeiten gelten für Japan (JST). Sonnenereignisse und Zugbegegnungen erscheinen nach der Auswahl von Datum und Zug. Gibt es nach 23 Uhr keine Treffer, werden Züge des Folgetags nicht automatisch ergänzt.",
    "basisData": "Fester Oktoberfahrplan, geprüft am 10. Oktober 2026. Einzelne Verkehrstage, Zusatzfahrten und Verspätungen fehlen. Für vergangene, zukünftige und andere Monate wird derselbe Fahrplan angenommen.",
    "basisSun": "Die Sonnenposition wird entlang der Zugstrecke berechnet. Sonnenaufgang und Sonnenuntergang entsprechen einer Höhe des Sonnenzentrums von −0,833°. Berge, Tunnel, Gebäude, Höhenlage und Wolken bleiben unberücksichtigt; die Sichtbarkeit der Sonne ist nicht garantiert.",
    "source": "Sonnenberechnung (NOAA/Meeus)",
    "definition": "Definitionen von Auf- und Untergang (USNO)",
    "open": "Mehr über den Disney-Shinkansen"
  },
  "es": {
    "sunrise": "Amanecer",
    "sunset": "Puesta de sol",
    "dateTime": "Fecha y hora de salida",
    "dateLabel": "Fecha del viaje (hora de Japón)",
    "timeLabel": "Hora de salida (hora de Japón)",
    "now": "Ahora",
    "reset": "Volver a la fecha y hora actuales de Japón",
    "panel": "Luz y cruces de trenes el día del viaje",
    "along": "A lo largo de la línea",
    "near": "Cerca de {0}",
    "between": "Entre {0} y {1}",
    "pass": "Se prevé un cruce con un Shinkansen Disney.",
    "encounter": "Cruce con un Shinkansen Disney",
    "estimate": "Previsión",
    "about": "aprox.",
    "seat": "Lado del asiento {0}",
    "tolerance": "unos ±5 min",
    "depart": "salida de {0}",
    "check": "Comprueba la fecha del viaje (JST)",
    "unselected": "Aún no has elegido un tren",
    "jst": "Hora de Japón (JST). ",
    "invalid": "Elige una fecha válida entre 1901 y 2099.",
    "before": "La fecha es anterior a los datos del horario. No se pueden comprobar los trenes ni los cruces.",
    "past": "Fecha pasada: no se ha comprobado el horario de entonces. ",
    "future": "Fecha futura: los servicios de ese día no están confirmados. ",
    "today": "No se reflejan los cambios ni los retrasos de hoy. ",
    "month": "Estimación basada en el horario fijo de octubre.",
    "next": "Día siguiente",
    "previous": "Día anterior",
    "noNext": "Los trenes del día siguiente no se añaden automáticamente. Cambia la fecha si es necesario.",
    "basis": "Sobre la fecha, el amanecer y la puesta de sol",
    "basisTime": "Todas las horas son de Japón (JST). Elige una fecha y un tren para ver los eventos solares y los cruces. Si no hay resultados después de las 23:00, no se añaden automáticamente los trenes del día siguiente.",
    "basisData": "Horario fijo de octubre, comprobado el 10 de octubre de 2026. No incluye los días de circulación de cada tren, los servicios adicionales ni los retrasos. Los cálculos para fechas pasadas, futuras o de otros meses suponen el mismo horario.",
    "basisSun": "La posición solar sigue al tren a lo largo de la vía. El amanecer y la puesta de sol se calculan con una altura del centro solar de −0,833°. No se tienen en cuenta montañas, túneles, edificios, altitud ni nubes; no se garantiza la visibilidad del sol.",
    "source": "Cálculo solar (NOAA/Meeus)",
    "definition": "Definiciones de salida y puesta de sol (USNO)",
    "open": "Más sobre el Shinkansen Disney"
  },
  "zh-Hant": {
    "sunrise": "日出",
    "sunset": "日落",
    "dateTime": "乘車日期・出發時間",
    "dateLabel": "乘車日期（日本時間）",
    "timeLabel": "出發時間（日本時間）",
    "now": "現在",
    "reset": "重設為日本目前的日期與時間",
    "panel": "乘車當天的日照與列車交會",
    "along": "沿線",
    "near": "{0}附近",
    "between": "{0}～{1}附近",
    "pass": "預計與迪士尼新幹線交會。",
    "encounter": "與迪士尼新幹線交會",
    "estimate": "預計",
    "about": "左右",
    "seat": "{0}座側",
    "tolerance": "前後約5分鐘",
    "depart": "從{0}出發",
    "check": "請確認乘車日期（JST）",
    "unselected": "尚未選擇列車",
    "jst": "日本時間（JST）。",
    "invalid": "請選擇1901～2099年間的有效日期。",
    "before": "此日期早於時刻表資料的適用起日，無法判斷當天班次與列車交會。",
    "past": "過去日期，尚未核對當時的時刻表。",
    "future": "未來日期，尚未確認當天班次是否行駛。",
    "today": "未反映今天的班次變更與延誤。",
    "month": "僅供參考，假設依10月固定時刻表行駛。",
    "next": "翌日",
    "previous": "前一日",
    "noNext": "不會自動加入隔日班次，需要時請調整日期。",
    "basis": "關於日期、日出與日落",
    "basisTime": "日期與時間皆為日本時間（JST）。選擇日期與列車後，才會顯示太陽與列車交會事件。23時以後若無符合班次，不會自動顯示隔日列車。",
    "basisData": "使用2026年10月10日確認的10月固定時刻表，未收錄各班次的行駛日期、加班車與延誤。過去、未來及其他月份的計算，皆假設依相同時刻表行駛。",
    "basisSun": "依列車各時刻在線路上的位置計算太陽位置。日出、日落以太陽中心高度−0.833°為估計值。不考慮山脈、隧道、建築、海拔與雲層，無法保證實際看見太陽的時間。",
    "source": "太陽計算依據（NOAA/Meeus）",
    "definition": "日出與日落定義（USNO）",
    "open": "查看迪士尼新幹線介紹"
  },
  "zh-Hans": {
    "sunrise": "日出",
    "sunset": "日落",
    "dateTime": "乘车日期・出发时间",
    "dateLabel": "乘车日期（日本时间）",
    "timeLabel": "出发时间（日本时间）",
    "now": "现在",
    "reset": "重设为日本当前的日期与时间",
    "panel": "乘车当天的日照与列车交会",
    "along": "沿线",
    "near": "{0}附近",
    "between": "{0}～{1}附近",
    "pass": "预计与迪士尼新干线交会。",
    "encounter": "与迪士尼新干线交会",
    "estimate": "预计",
    "about": "左右",
    "seat": "{0}座侧",
    "tolerance": "前后约5分钟",
    "depart": "从{0}出发",
    "check": "请确认乘车日期（JST）",
    "unselected": "尚未选择列车",
    "jst": "日本时间（JST）。",
    "invalid": "请选择1901～2099年间的有效日期。",
    "before": "此日期早于时刻表数据的适用起始日，无法判断当天班次与列车交会。",
    "past": "过去日期，尚未核对当时的时刻表。",
    "future": "未来日期，尚未确认当天班次是否运行。",
    "today": "未反映今天的班次变更与延误。",
    "month": "仅供参考，假设按10月固定时刻表运行。",
    "next": "次日",
    "previous": "前一日",
    "noNext": "不会自动加入次日班次，需要时请调整日期。",
    "basis": "关于日期、日出与日落",
    "basisTime": "日期与时间均为日本时间（JST）。选择日期与列车后，才会显示太阳与列车交会事件。23时以后若无符合班次，不会自动显示次日列车。",
    "basisData": "使用2026年10月10日确认的10月固定时刻表，未收录各班次的运行日期、加班车与延误。过去、未来及其他月份的计算，均假设按相同时刻表运行。",
    "basisSun": "根据列车各时刻在线路上的位置计算太阳位置。日出、日落以太阳中心高度−0.833°为估计值。不考虑山脉、隧道、建筑、海拔与云层，无法保证实际看见太阳的时间。",
    "source": "太阳计算依据（NOAA/Meeus）",
    "definition": "日出与日落定义（USNO）",
    "open": "查看迪士尼新干线介绍"
  },
  "ko": {
    "sunrise": "일출",
    "sunset": "일몰",
    "dateTime": "승차일·출발 시각",
    "dateLabel": "승차일(일본 시간)",
    "timeLabel": "출발 시각(일본 시간)",
    "now": "현재",
    "reset": "일본의 현재 날짜와 시각으로 재설정",
    "panel": "승차일의 햇빛과 열차 교행",
    "along": "노선 주변",
    "near": "{0} 부근",
    "between": "{0}~{1} 부근",
    "pass": "디즈니 신칸센과 교행할 것으로 예상됩니다.",
    "encounter": "디즈니 신칸센과 교행",
    "estimate": "예상",
    "about": "경",
    "seat": "{0}석 쪽",
    "tolerance": "약 ±5분",
    "depart": "{0} 출발",
    "check": "승차일을 확인해 주세요(JST)",
    "unselected": "아직 열차를 선택하지 않았습니다",
    "jst": "일본 시간(JST). ",
    "invalid": "1901~2099년 사이의 올바른 날짜를 선택해 주세요.",
    "before": "시간표 데이터 적용 시작일 이전입니다. 해당 날짜의 열차와 교행은 확인할 수 없습니다.",
    "past": "지난 날짜입니다. 당시 시간표는 확인하지 않았습니다. ",
    "future": "미래 날짜입니다. 해당 날짜의 운행 여부는 미확인입니다. ",
    "today": "오늘의 운행 변경과 지연은 반영하지 않습니다. ",
    "month": "10월 고정 시간표대로 운행한다고 가정한 참고 정보입니다.",
    "next": "다음 날",
    "previous": "전날",
    "noNext": "다음 날 열차는 자동으로 추가하지 않습니다. 필요하면 날짜를 변경해 주세요.",
    "basis": "날짜와 일출·일몰 안내",
    "basisTime": "모든 날짜와 시각은 일본 시간(JST)입니다. 날짜와 열차를 선택하면 태양 및 교행 이벤트를 표시합니다. 23시 이후 검색 결과가 없어도 다음 날 열차를 자동으로 표시하지 않습니다.",
    "basisData": "2026년 10월 10일 확인한 10월 고정 시간표입니다. 개별 열차의 운행일, 임시편, 지연은 포함하지 않습니다. 과거·미래 및 다른 달의 계산은 같은 시간표로 운행한다고 가정합니다.",
    "basisSun": "각 시각의 선로상 열차 위치를 기준으로 태양 위치를 계산합니다. 일출·일몰은 태양 중심 고도 −0.833°를 기준으로 추정합니다. 산, 터널, 건물, 고도, 구름은 반영하지 않으며 실제로 해가 보이는 시각을 보장하지 않습니다.",
    "source": "태양 계산 근거(NOAA/Meeus)",
    "definition": "일출·일몰 정의(USNO)",
    "open": "디즈니 신칸센 자세히 보기"
  }
};
  const edition=document.documentElement.lang,copy=COPY[edition]||Object.fromEntries(Object.entries(COPY.en).map(([key,value])=>[key,window.MADO_UTILITY_LOCALE?.t(value)||value]));
  const text=(key,...args)=>copy[key].replace(/\{(\d+)\}/g,(_,i)=>args[Number(i)]);
  function clockLabel(date,minute){
    const label=M.clockLabel(date,minute);
    return label.replace('翌日',copy.next).replace('前日',copy.previous);
  }
  const solarNames={sunrise:['☀↑',copy.sunrise],sunset:['☀↓',copy.sunset]};
  const table=window.SHINKANSEN_TIMETABLE;
  const options=()=>({date:rideDate,journey:typeof journey==='undefined'?null:journey,track:window.MADO_TRACK,trainSelect:window.MADO_TRAIN_SELECT,sparkling:S,timetable:table});
  function model(){
    const o=options(),j=o.journey,key=JSON.stringify([rideDate,j?.preview,j?.direction,j?.boardId,j?.train?.type,j?.train?.number,j?.depMin,j?.stops]);
    if(cache?.key===key)return cache.value;
    const context=M.context(rideDate,table),actual=!!(j?.train&&j.mode==='train'&&!j.preview);
    const solar=actual&&context.status==='reference'?M.movingSolar(o):{status:'unselected',events:[],segments:[],at:()=>null};
    const disney=M.disney(o);cache={key,value:{context,actual,solar,disney}};return cache.value;
  }
  function place(point){
    const s=point?.segment;if(!s)return copy.along;
    const name=x=>x?.id?stationLabel(x.id):(edition==='ja'?x?.ja:x?.en)||copy.along;
    return s.at?text('near',name(s.at)):text('between',name(s.from),name(s.to));
  }
  function encounterPlace(segment){
    const station=name=>{const found=table.stations?.find(s=>s.ja===name||s.en===name);return found?stationLabel(found.id):window.MADO_UTILITY_LOCALE?.stationName(name)||name;};
    const from=edition==='ja'?segment.from:segment.fromEn||copy.along,to=edition==='ja'?segment.to:segment.toEn||copy.along;
    return from===to?text('near',station(from)):text('between',station(from),station(to));
  }
  function datedLink(page){return edition==='ja'?page:window.MADO_UTILITY_LOCALE?.href(page)||'en/'+page;}
  function dateNote(){
    const ctx=M.context(rideDate,table),time=byId('departTime')?.value||'';
    const noNext=time>='23:00'?' '+copy.noNext:'';
    const message=ctx.status==='invalid'?copy.invalid:ctx.status==='before-dataset'?copy.before:copy[ctx.relation]+(ctx.monthMatch?'':copy.month);
    byId('nd-date-note').textContent=copy.jst+message+noNext;
    byId('nd-date-note').dataset.status=ctx.status;
    byId('nd-date-note').classList.toggle('nd-warning',ctx.status!=='reference'||ctx.relation!=='today'||!ctx.monthMatch);
  }
  function saveDate(){
    try{const u=new URL(location.href);u.searchParams.set('rideDate',rideDate);history.replaceState(history.state,'',u);}catch{}
  }
  function updateDate(){
    rideDate=byId('nd-date').value;cache=null;saveDate();dateNote();
    if(typeof renderTimeline==='function'&&typeof journey!=='undefined'&&journey)renderTimeline();else enrich();
  }
  function disneyEventId(minute){
    const train=typeof journey==='undefined'?null:journey?.train;
    return ['nd-encounter',rideDate,train?.type,train?.number,Math.round(minute*60)].join('-').replace(/[^a-zA-Z0-9-]/g,'');
  }
  function disneyHTML(r){
    if(r.status!=='encounter')return '';
    return r.matches.map(x=>'<p><a href="#'+disneyEventId(x.time)+'" data-nd-event-target>'+escape(clockLabel(rideDate,x.time))+' '+escape(copy.about)+' · '+escape(copy.pass)+'</a></p>').join('');
  }
  function jumpToEncounter(event){
    const anchor=event.target.closest('a[data-nd-event-target]');if(!anchor)return;
    // Preserve normal modified-click behavior and the existing article link on the target card.
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const target=byId(anchor.hash.slice(1)),link=target?.querySelector('.nd-event-link');
    if(!target||!link)return;
    event.preventDefault();
    const header=document.querySelector('.topbar'),style=header&&getComputedStyle(header);
    const offset=header&&['fixed','sticky'].includes(style.position)?header.getBoundingClientRect().height+Math.max(0,parseFloat(style.top)||0)+16:16;
    target.style.scrollMarginTop=offset+'px';link.classList.add('nd-jump-target');link.focus({preventScroll:true});
    target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function prepareName(li){
    const name=li.querySelector('.tl-name');
    const nameChunks={'浜名湖越しの富士山':[['浜名湖越しの'],['富士山']],'豊橋〜蒲郡のビニールハウス':[['豊橋〜蒲郡の'],['ビニールハウス']],'洛西浄化センターの卵形タンク':[['洛西浄化センターの'],['卵形タンク']],'大塚製薬のポカリスエット工場':[['大塚製薬の'],['ポカリスエット工場']]};
    li.classList.toggle('nd-wide-title',!!name&&[...name.textContent].length>=9);
    const chunks=name&&nameChunks[name.textContent];
    if(edition==='ja'&&chunks)name.innerHTML=chunks.map(part=>'<span class="copy-chunk nd-name-chunk">'+part.map(escape).join('<wbr>')+'</span>').join('');
  }
  function cardLight(li,clock,solar){
    const point=solar.at(clock);if(!point||!Number.isFinite(point.altitude))return;
    const a=point.altitude,next=solar.at(Math.min(clock+1,solar.end));
    const rising=next?next.altitude>point.altitude:false;
    const period=a>=3?'day':a>=-6?(rising?'dawn':'evening'):'night';
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
    const cool=smooth((-a-.833)/(6-.833)),warm=Math.exp(-(((a+.833)/3.7)**2))*.8;
    const mix=(x,y,t)=>x.map((v,i)=>v+(y[i]-v)*t),rgb=x=>x.map(Math.round).join(' ');
    const tint=mix(mix([255,255,253],[255,242,224],warm),[231,238,248],cool);
    const face=mix(mix([255,255,255],[255,251,246],warm),[246,249,253],cool);
    const edge=mix(mix([222,219,213],[215,177,136],warm),[137,155,183],cool);
    li.classList.add('nd-ambient');li.dataset.light=period;li.dataset.solarAltitude=a;
    li.style.setProperty('--nd-tint',rgb(tint));li.style.setProperty('--nd-edge',rgb(edge));li.style.setProperty('--nd-face',rgb(face));
    const time=li.querySelector('.tl-time-big');
    if(time){const row=document.createElement('span');row.className='nd-time-row';time.before(row);row.append(time);}
  }
  function insertEvent(event){
    const li=document.createElement('li');li.className='nd-event nd-event-'+event.kind;li.dataset.event=event.kind;li.dataset.clock=event.minute;
    const disney=event.kind==='disney',eventCopy=disney?['✦',copy.encounter,event.detail]:solarNames[event.kind];
    const clock=clockLabel(rideDate,event.minute)+' '+copy.about+(disney?' '+copy.estimate:'');
    const title=disney&&edition==='ja'?'<span class="copy-chunk">ディズニー新幹線と</span><span class="copy-chunk">すれ違い</span>':escape(eventCopy[1]);
    const detail=disney?event.detail.split(' · ').map(x=>edition==='ja'?'<span class="copy-chunk">'+escape(x)+'</span>':escape(x)).join(' · '):escape(place(event.point));
    const time='<time class="tl-time tl-time-big"><span>'+escape(clockLabel(rideDate,event.minute))+'</span><span class="tl-time-suffix">'+escape(copy.about)+'</span></time>';
    const content='<span class="nd-event-icon" aria-hidden="true">'+eventCopy[0]+'</span><div class="nd-event-copy"><div class="nd-event-heading tl-top-left"><span class="nd-event-time">'+time+(disney?'<span class="nd-event-estimate">'+escape(copy.estimate)+'</span>':'')+'</span><strong>'+title+'</strong></div><p>'+detail+'</p></div>';
    if(disney){
      li.id=disneyEventId(event.minute);
      // Existing sparkling-dreams.html; its canonical URL is https://www.michikusa-travel.com/sparkling-dreams.html.
      const link=document.createElement('a');link.className='nd-event-link';link.href=datedLink('sparkling-dreams.html');
      link.setAttribute('aria-label',clock+' · '+copy.encounter+' · '+copy.open);
      link.innerHTML=content+'<span class="nd-event-go" aria-hidden="true">↗</span>';li.append(link);
    }else li.innerHTML=content;
    const list=byId('timeline');const before=[...list.children].find(x=>Number(x.dataset.ndClock)>event.minute);list.insertBefore(li,before||null);
  }
  function enrich(){
    if(!ready||!byId('timelineSection'))return;
    const v=model();view=v;dateNote();const box=byId('nd-trip'),disney=byId('nd-disney');
    box.dataset.state=v.actual?'selected':'sample';disney.dataset.status=v.disney.status;disney.innerHTML=disneyHTML(v.disney);disney.hidden=v.disney.status!=='encounter';
    document.querySelectorAll('.nd-event,.nd-light-label,.nd-card-light').forEach(e=>e.remove());
    document.querySelectorAll('.nd-time-row').forEach(e=>e.replaceWith(...e.childNodes));
    document.querySelectorAll('.nd-ambient').forEach(e=>{e.classList.remove('nd-ambient');delete e.dataset.light;delete e.dataset.solarAltitude;e.style.removeProperty('--nd-tint');e.style.removeProperty('--nd-edge');e.style.removeProperty('--nd-face');});
    document.querySelectorAll('#timeline .tl-item').forEach(prepareName);
    const actual=v.actual&&v.context.status==='reference';
    byId('nd-trip-date').textContent=actual?new Intl.DateTimeFormat(edition,{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tokyo'}).format(new Date(M.dateEpoch(rideDate)))+' · '+clockLabel(rideDate,journey.depMin)+' '+text('depart',stationLabel(journey.boardId))+' (JST)':v.actual?copy.check:copy.unselected;
    box.hidden=!actual;
    if(!actual)return;
    const spots=typeof currentTimelineSpotCandidates==='function'?currentTimelineSpotCandidates():journey.spots;
    const clocks=new Map(spots.map(x=>[x.sp.id,x.clock]));
    [...byId('timeline').children].forEach(li=>{
      const text=li.querySelector('.tl-time')?.textContent||'',m=/([0-2]?\d):([0-5]\d)/.exec(text),clock=li.dataset.spot?clocks.get(li.dataset.spot):m?Number(m[1])*60+Number(m[2]):NaN;
      li.dataset.ndClock=clock;
      if(li.dataset.spot&&Number.isFinite(clock)&&v.solar.status==='calculated')cardLight(li,clock,v.solar);
    });
    const events=v.solar.events.filter(e=>solarNames[e.kind]);
    if(v.disney.status==='encounter')for(const match of v.disney.matches)events.push({kind:'disney',minute:match.time,detail:encounterPlace(match.segment)+' · '+text('seat',journey.direction==='west'?'E':'A')+' · '+copy.tolerance});
    events.sort((a,b)=>a.minute-b.minute).forEach(insertEvent);
  }
  const originalDark=isClearlyDark;
  isClearlyDark=function(clock,date){
    const v=model();if(v.actual&&v.context.status==='reference'&&v.solar.status==='calculated')return v.solar.at(clock)?.phase==='night';
    return originalDark(clock,date);
  };
  const originalRender=renderTimeline;
  renderTimeline=function(...args){const value=originalRender(...args);enrich();return value;};
  function init(){
    const time=byId('departTime'),now=byId('nowBtn');if(!time||!now)return;
    const row=time.closest('.setup-row');row.classList.add('nd-date-row');
    const label=row.querySelector('label');label.textContent=copy.dateTime;label.htmlFor='nd-date';label.removeAttribute('data-picker-text');
    const group=row.querySelector('.depart-wrap');group.classList.add('nd-date-time');
    const input=document.createElement('input');input.type='date';input.id='nd-date';input.setAttribute('aria-label',copy.dateLabel);input.min='1901-01-01';input.max='2099-12-31';input.value=rideDate;group.prepend(input);time.setAttribute('aria-label',copy.timeLabel);
    // Replace the old node so its browser-local nowClock handler cannot override JST.
    const current=document.createElement('button');current.type='button';current.id='nd-now';current.className='chip-btn';current.textContent=copy.now;current.setAttribute('aria-label',copy.reset);now.replaceWith(current);
    if(!(typeof journey!=='undefined'&&journey?.mode==='train'&&!journey.preview))time.value=seed.time;
    const note=document.createElement('p');note.id='nd-date-note';note.className='nd-date-note';note.setAttribute('aria-live','polite');row.after(note);
    const panel=document.createElement('section');panel.id='nd-trip';panel.className='nd-trip';panel.setAttribute('aria-label',copy.panel);panel.innerHTML='<p id="nd-trip-date" class="nd-trip-date"></p>';
    const target=byId('timelineSection').querySelector('.section-head');target.after(panel);
    const encounter=document.createElement('aside');encounter.id='nd-disney';encounter.className='nd-disney';encounter.setAttribute('aria-live','polite');byId('timelineFilterbar').after(encounter);encounter.addEventListener('click',jumpToEncounter);
    const details=document.createElement('details');details.className='nd-basis';details.innerHTML='<summary>'+escape(copy.basis)+'</summary><p>'+escape(copy.basisTime)+'</p><p>'+escape(copy.basisData)+'</p><p>'+escape(copy.basisSun)+'</p><p><a href="https://gml.noaa.gov/grad/solcalc/calcdetails.html" target="_blank" rel="noopener">'+escape(copy.source)+'</a> · <a href="https://aa.usno.navy.mil/faq/RST_defs" target="_blank" rel="noopener">'+escape(copy.definition)+'</a></p>';
    byId('timeline-calculation-note').after(details);
    input.addEventListener('change',updateDate);input.addEventListener('input',()=>{rideDate=input.value;cache=null;dateNote();});
    current.addEventListener('click',()=>{const p=M.jstParts();input.value=p.date;time.value=p.time;time.dispatchEvent(new Event('input',{bubbles:true}));rideDate=p.date;updateDate();});
    time.addEventListener('input',()=>{cache=null;enrich();});time.addEventListener('change',()=>{cache=null;enrich();});byId('findTrainsBtn').addEventListener('click',()=>{cache=null;enrich();});
    ready=true;saveDate();enrich();if(typeof journey!=='undefined'&&journey&&!journey.preview)renderTimeline();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.MADO_JOURNEY_LIGHT_EVENTS={getState:()=>({date:rideDate,context:view.context,actual:view.actual,solarStatus:view.solar?.status,solarEvents:view.solar?.events?.map(e=>({kind:e.kind,minute:e.minute,lat:e.point.lat,lng:e.point.lng,place:place(e.point)})),segments:view.solar?.segments,disneyStatus:view.disney?.status,disneyMatches:view.disney?.matches?.map(x=>({minute:x.time,clock:x.clock}))}),refresh:()=>{cache=null;renderTimeline();}};
})();
