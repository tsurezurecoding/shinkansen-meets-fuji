"""Optional Playwright check using exact local payload at the production origin.
All requests are intercepted; no analytics/third-party traffic leaves the browser.
Requires Python Playwright and /usr/bin/chromium. Writes JSON under /tmp.
"""
from pathlib import Path
from urllib.parse import urlparse, unquote
import mimetypes,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
KEY='mado-android-app-invite-v2';BASE='https://www.michikusa-travel.com/'
UA='Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for file in ['index.html','en/index.html','guide.html','en/guide.html']:
  lang='en' if file.startswith('en/') else 'ja'
  c=b.new_context(user_agent=UA,viewport={'width':320,'height':568},locale='ja-JP')
  c.add_init_script("navigator.getInstalledRelatedApps=async()=>[]")
  x=c.new_page();analytics=[]
  def handle(r):
   u=urlparse(r.request.url)
   if u.hostname!='www.michikusa-travel.com':
    if u.hostname and ('google-analytics' in u.hostname or 'googletagmanager' in u.hostname):analytics.append(r.request.url)
    r.abort();return
   name=unquote(u.path.lstrip('/'))
   if not name or name.endswith('/'):name+='index.html'
   path=ROOT/name
   if path.is_file():r.fulfill(status=200,body=path.read_bytes(),content_type=mimetypes.guess_type(name)[0] or 'application/octet-stream')
   else:r.fulfill(status=404,body='Not found')
  x.route('**/*',handle)
  # Seed this origin without executing its scripts or initiating GA.
  x.route(BASE+'seed.html',lambda r:r.fulfill(body='<html></html>',content_type='text/html'))
  x.goto(BASE+'seed.html');x.evaluate("localStorage.setItem('mado-android-app-invite-v2',JSON.stringify({v:2,dismissedAt:Date.now()}));localStorage.setItem('mado-stamps-reset-test','keep');localStorage.setItem('mado-lang','"+lang+"')")
  x.goto(BASE+file+'?ga=off&android_invite_reset=1&lang='+lang+'#check',wait_until='domcontentloaded')
  x.wait_for_function("document.querySelector('#android-app-invite')&&!document.querySelector('#android-app-invite').hidden")
  assert 'android_invite_reset' not in x.url and 'ga=off' in x.url and x.url.endswith('#check')
  assert x.evaluate("localStorage.getItem('mado-android-app-invite-v2')") is None
  assert x.evaluate("localStorage.getItem('mado-stamps-reset-test')")=='keep'
  assert x.evaluate("localStorage.getItem('mado-lang')")==lang
  assert x.evaluate('window.MADO_ANALYTICS_DISABLED===true') and not analytics
  assert x.locator('script[src*="googletagmanager"]').count()==0
  x.locator('#android-app-invite-close').click();saved=x.evaluate("localStorage.getItem('mado-android-app-invite-v2')");assert saved
  x.reload(wait_until='domcontentloaded');assert x.locator('#android-app-invite').get_attribute('hidden') is not None
  assert x.evaluate("localStorage.getItem('mado-android-app-invite-v2')")==saved and not analytics
  x.goto(BASE+file+'?ga=off&android_invite_reset=1&lang='+lang,wait_until='domcontentloaded');x.wait_for_function("document.querySelector('#android-app-invite')&&!document.querySelector('#android-app-invite').hidden")
  assert not analytics and x.evaluate('window.MADO_ANALYTICS_DISABLED===true')
  # No network is allowed when restoring analytics; verify existing initialization only.
  x.goto(BASE+file+'?ga=on&lang='+lang,wait_until='domcontentloaded');assert x.evaluate("localStorage.getItem('mado-ga-optout')") is None
  assert x.evaluate('window.MADO_ANALYTICS_DISABLED===false')
  results.append({'page':file,'reset_consumed':True,'dismiss_reload_retained':True,'explicit_reset_again':True,'other_storage_preserved':True,'test_phase_analytics_requests':0,'ga_on_restores_existing_initializer_without_outbound_traffic':True,'source':'local route fixture at production origin'});c.close()
 b.close()
Path('/tmp/android-invite-reset-browser.json').write_text(json.dumps(results,indent=2)+'\n');print('PASS 4 actual-page reset/reload/reopen/GA-stop-and-restore fixture cases; no outbound network')
