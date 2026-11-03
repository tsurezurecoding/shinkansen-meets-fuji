// Fixed interface copy; the supplied official badge is Japanese or English.
export const INVITE_COPY = {
 ja: ['Androidアプリのご案内','アプリなら、案内ももっと便利に','見どころを通知や音声でお知らせ。','無料・登録不要。','Google Playで見る','案内を閉じて14日間表示しない','案内を閉じました。14日間表示しません。','案内を閉じました。保存できませんでした。','車窓図鑑をアプリでも','図鑑や旅の案内をアプリで。音声案内は東京〜新大阪に対応。'],
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
