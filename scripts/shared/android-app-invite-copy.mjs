// Fixed interface copy; the supplied official badge is Japanese or English.
export const INVITE_COPY = {
 ja: ['Androidアプリのご案内','画面を消して、車窓へ','画面を消しても乗車中の音声案内。','無料・登録不要。','Google Playで見る','案内を閉じて14日間表示しない','案内を閉じました。14日間表示しません。','案内を閉じました。保存できませんでした。','車窓図鑑をアプリでも','図鑑や旅の案内をアプリで。音声案内は東京〜新大阪に対応。'],
 en: ['Android app','Screen off. Listen on.','Ride audio continues with the screen off.','Free, no sign-up.','View on Google Play','Dismiss invitation for 14 days','Invitation hidden for 14 days.','Dismissed here; saving failed.','Explore the views in the app','Explore the field guide in the app. Audio guidance covers Tokyo–Shin-Osaka.'],
 fr: ['Application Android','Écran éteint, écoutez','Le guidage audio continue même écran éteint.','Gratuit, sans inscription.','Voir sur Google Play','Masquer cette invitation pendant 14 jours','Invitation masquée pendant 14 jours.','Invitation fermée ; enregistrement impossible.','Les paysages dans l’application','Explorez le guide dans l’application. Guidage audio de Tokyo à Shin-Osaka.'],
 de: ['Android-App','Bildschirm aus, weiterhören','Die Audioführung läuft bei ausgeschaltetem Bildschirm weiter.','Kostenlos, ohne Anmeldung.','Bei Google Play ansehen','Einladung für 14 Tage ausblenden','Einladung für 14 Tage ausgeblendet.','Geschlossen; Speichern fehlgeschlagen.','Die Aussicht in der App','Entdecken Sie den Reiseführer in der App. Audioführung: Tokio–Shin-Osaka.'],
 es: ['Aplicación Android','Apaga la pantalla y escucha','La guía de audio continúa con la pantalla apagada.','Gratis, sin registro.','Ver en Google Play','Ocultar la invitación durante 14 días','Invitación oculta durante 14 días.','Cerrado; no se pudo guardar.','Descubre las vistas en la app','Explora la guía en la app. Audio entre Tokio y Shin-Osaka.'],
 ko: ['Android 앱','화면을 꺼도 음성 안내','화면을 꺼도 승차 중 음성 안내가 계속됩니다.','무료·가입 불필요.','Google Play에서 보기','14일 동안 안내 숨기기','14일 동안 안내를 표시하지 않습니다.','안내를 닫았습니다. 저장하지 못했습니다.','앱에서도 차창 도감을','앱에서 차창 도감을 둘러보세요. 음성 안내는 도쿄~신오사카 구간을 지원합니다.'],
 'zh-Hant': ['Android 應用程式','關閉螢幕，繼續聆聽','關閉螢幕後，乘車語音導覽仍會繼續。','免費，無需註冊。','在 Google Play 查看','隱藏此提示14天','已隱藏提示14天。','已關閉提示，但無法儲存。','在應用程式探索車窗圖鑑','在應用程式瀏覽圖鑑。語音導覽支援東京至新大阪。'],
 'zh-Hans': ['Android 应用','关闭屏幕，继续聆听','关闭屏幕后，乘车语音导览仍会继续。','免费，无需注册。','在 Google Play 查看','隐藏此提示14天','已隐藏提示14天。','已关闭提示，但无法保存。','在应用中探索车窗图鉴','在应用中浏览图鉴。语音导览支持东京至新大阪。'],
};
export function inviteCopy(language, general = false) {
 const c = INVITE_COPY[language];
 if (!c) throw Error('Unsupported invitation language: '+language);
 const newTab={ja:'新しいタブで開きます',en:'opens a new tab',fr:'ouvre un nouvel onglet',de:'öffnet einen neuen Tab',es:'abre una pestaña nueva',ko:'새 탭에서 열림','zh-Hant':'在新分頁開啟','zh-Hans':'在新标签页打开'};
 return {label:c[0],title:c[general?8:1],body:c[general?9:2],free:c[3],play:c[4],playLabel:c[4]+' ('+newTab[language]+')',close:c[5],closed:c[6],failed:c[7]};
}
