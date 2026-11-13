// Fixed interface copy; the supplied official badge is Japanese or English.
export const INVITE_COPY = {
 ja: ['Androidアプリのご案内','アプリなら案内ももっと便利に','見どころを通知や音声でお知らせ。','無料・登録不要。','Google Playで見る','案内を閉じて14日間表示しない','案内を閉じました。14日間表示しません。','案内を閉じました。保存できませんでした。','車窓図鑑をアプリでも','図鑑や旅の案内をアプリで。音声案内は東京〜新大阪に対応。'],
 en: ['Android app','Better guidance with the app','Get notifications or audio for sights along the way.','Free, no sign-up.','View on Google Play','Dismiss invitation for 14 days','Invitation hidden for 14 days.','Dismissed here; saving failed.','Explore the views in the app','Explore the field guide in the app. Audio guidance covers Tokyo–Shin-Osaka.'],
 fr: ['Application Android','Un guidage plus pratique avec l’application','Recevez des notifications ou des annonces audio pour les sites à voir.','Gratuit, sans inscription.','Voir sur Google Play','Masquer cette invitation pendant 14 jours','Invitation masquée pendant 14 jours.','Invitation fermée ; enregistrement impossible.','Les paysages dans l’application','Explorez le guide dans l’application. Guidage audio de Tokyo à Shin-Osaka.'],
 de: ['Android-App','Noch bequemer mit der App','Benachrichtigungen oder Audiohinweise zu den Sehenswürdigkeiten unterwegs.','Kostenlos, ohne Anmeldung.','Bei Google Play ansehen','Einladung für 14 Tage ausblenden','Einladung für 14 Tage ausgeblendet.','Geschlossen; Speichern fehlgeschlagen.','Die Aussicht in der App','Entdecken Sie den Reiseführer in der App. Audioführung: Tokio–Shin-Osaka.'],
 es: ['Aplicación Android','Una guía más cómoda con la app','Recibe avisos o indicaciones de audio sobre los lugares de interés.','Gratis, sin registro.','Ver en Google Play','Ocultar la invitación durante 14 días','Invitación oculta durante 14 días.','Cerrado; no se pudo guardar.','Descubre las vistas en la app','Explora la guía en la app. Audio entre Tokio y Shin-Osaka.'],
 ko: ['Android 앱','앱으로 더 편리하게 안내받으세요','볼거리를 알림이나 음성으로 안내해 드려요.','무료·가입 불필요.','Google Play에서 보기','14일 동안 안내 숨기기','14일 동안 안내를 표시하지 않습니다.','안내를 닫았습니다. 저장하지 못했습니다.','앱에서도 차창 도감을','앱에서 차창 도감을 둘러보세요. 음성 안내는 도쿄~신오사카 구간을 지원합니다.'],
 'zh-Hant': ['Android 應用程式','用 App，導覽更方便','透過通知或語音提醒沿途看點。','免費，無需註冊。','在 Google Play 查看','隱藏此提示14天','已隱藏提示14天。','已關閉提示，但無法儲存。','在應用程式探索車窗圖鑑','在應用程式瀏覽圖鑑。語音導覽支援東京至新大阪。'],
 'zh-Hans': ['Android 应用','用 App，导览更方便','通过通知或语音提醒沿途看点。','免费，无需注册。','在 Google Play 查看','隐藏此提示14天','已隐藏提示14天。','已关闭提示，但无法保存。','在应用中探索车窗图鉴','在应用中浏览图鉴。语音导览支持东京至新大阪。'],
};
export function inviteCopy(language, general = false) {
 const c = INVITE_COPY[language];
 if (!c) throw Error('Unsupported invitation language: '+language);
 const newTab={ja:'新しいタブで開きます',en:'opens a new tab',fr:'ouvre un nouvel onglet',de:'öffnet einen neuen Tab',es:'abre una pestaña nueva',ko:'새 탭에서 열림','zh-Hant':'在新分頁開啟','zh-Hans':'在新标签页打开'};
 return {label:c[0],title:c[general?8:1],body:c[general?9:2],free:c[3],play:c[4],playLabel:c[4]+' ('+newTab[language]+')',close:c[5],closed:c[6],failed:c[7]};
}

// Train-result placement is localized independently of the eight-language floating invitation.
export const TRAIN_INVITE_COPY = {
 ja: ['画面を消しても車窓案内','案内を始めると、見どころを通知や音声でお知らせします。','Web版との違い・使い方'],
 en: ['Guidance with your screen off','Turn on guidance to get notifications or audio for sights along the way.','App features and setup'],
 fr: ['Le guidage, même écran éteint','Activez le guidage pour recevoir des notifications ou des annonces audio aux points d’intérêt.','Fonctionnalités et utilisation (anglais)'],
 de: ['Hinweise bei ausgeschaltetem Bildschirm','Aktivieren Sie die Begleitung, um Hinweise zu Sehenswürdigkeiten als Benachrichtigung oder Audio zu erhalten.','Funktionen und Nutzung (Englisch)'],
 es: ['Avisos con la pantalla apagada','Activa la guía para recibir notificaciones o avisos de audio sobre los lugares de interés.','Funciones y uso de la app (inglés)'],
 ko: ['화면을 꺼도 차창 안내','안내를 시작하면 볼거리를 알림이나 음성으로 알려 드려요.','앱 기능과 사용법 (영어)'],
 'zh-Hant': ['關閉螢幕，也不錯過風景','開始導覽後，透過通知或語音提醒沿途看點。','App 功能與使用方式（英文）'],
 'zh-Hans': ['关闭屏幕，也不错过风景','开始导览后，通过通知或语音提醒沿途看点。','App 功能与使用方式（英文）'],
 it: ['Avvisi anche a schermo spento','Avvia la guida per ricevere notifiche o avvisi audio sui luoghi lungo il percorso.','Funzioni e utilizzo dell’app (inglese)','La guida audio è disponibile in inglese e nelle altre lingue supportate dall’app.'],
 th: ['ปิดหน้าจอก็ไม่พลาดวิว','เริ่มการนำทางเพื่อรับการแจ้งเตือนหรือเสียงบรรยายเมื่อถึงจุดชมวิวระหว่างทาง','ฟังก์ชันและวิธีใช้แอป (ภาษาอังกฤษ)','เสียงบรรยายในแอปรองรับภาษาอังกฤษและภาษาอื่นที่มีให้บริการ'],
};
export function trainInviteCopy(language) {
 const row = TRAIN_INVITE_COPY[language];
 if (!row) throw Error('Unsupported train invitation language: '+language);
 const extra = {
  it: {label:'App Android',free:'Gratis, senza registrazione.',play:'Visualizza su Google Play',playLabel:'Visualizza su Google Play (si apre in una nuova scheda)'},
  th: {label:'แอป Android',free:'ฟรี ไม่ต้องลงทะเบียน',play:'ดูใน Google Play',playLabel:'ดูใน Google Play (เปิดแท็บใหม่)'},
 };
 return {...(extra[language] || inviteCopy(language)),title:row[0],body:row[1],learn:row[2],notice:row[3] || ''};
}
