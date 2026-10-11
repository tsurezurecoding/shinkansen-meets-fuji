from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent;out=Path('/tmp/android-invite-production-evidence');out.mkdir(exist_ok=True)
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
 def copyfile(self,a,b):
  try:super().copyfile(a,b)
  except (BrokenPipeError,ConnectionResetError):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/';results=[]
UA='Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for path in ['index.html','guide.html','en/index.html','en/guide.html']:
  for width,height in [(320,568),(390,844),(1440,900)]:
   c=b.new_context(viewport={'width':width,'height':height},user_agent=UA,locale='ja-JP');x=c.new_page();x.route('https://**/*',lambda r:r.abort());x.goto(url+path+'?lang='+('en' if path.startswith('en/') else 'ja'));x.wait_for_function("document.querySelector('.context-play-badge')?.naturalWidth===646");x.wait_for_timeout(300)
   v=x.evaluate("""()=>{let card=document.querySelector('#android-app-invite'),r=card.getBoundingClientRect();let overlap=[...document.querySelectorAll('a,button,input,select,textarea,summary,nav,[role=button],.lang-landing-prompt')].filter(e=>!card.contains(e)&&e.getClientRects().length&&e.checkVisibility({checkVisibilityCSS:true,checkOpacity:true})&&getComputedStyle(e).visibility!=='hidden').filter(e=>{let t=e.getBoundingClientRect();return r.left<t.right&&r.right>t.left&&r.top<t.bottom&&r.bottom>t.top});return {visible:!card.hidden&&!card.inert&&getComputedStyle(card).visibility==='visible',height:r.height,overlap:overlap.map(e=>e.id||e.tagName),badge:card.querySelector('img.context-play-badge').src,close:[card.querySelector('button').offsetWidth,card.querySelector('button').offsetHeight],offscreen:r.left<0||r.right>innerWidth||r.top<0||r.bottom>innerHeight}}""")
   assert v['visible'] and not v['overlap'] and not v['offscreen'],(path,width,v)
   assert v['close']==[44,44] and v['height']<=190,(path,width,v)
   if width==320:x.screenshot(path=str(out/(path.replace('/','-')+'-320.png')))
   x.locator('#android-app-invite-close').click();assert x.locator('#android-app-invite').get_attribute('hidden') is not None;x.reload();assert x.locator('#android-app-invite').get_attribute('hidden') is not None
   x.evaluate("localStorage.removeItem('mado-android-app-invite-v2')");x.reload();x.wait_for_function("document.querySelector('.context-play-badge')?.naturalWidth===646")
   # Separate pages in one context receive real browser storage events.
   y=c.new_page();y.route('https://**/*',lambda r:r.abort());y.goto(url+'guide.html?lang=ja');y.wait_for_function("document.querySelector('.context-play-badge')?.naturalWidth===646");y.locator('#android-app-invite-close').click();x.wait_for_function("document.querySelector('#android-app-invite').hidden")
   results.append({'page':path,'width':width,**v,'dismiss_reload_real_storage_tab':True});c.close()
 b.close()
server.shutdown();(out/'browser-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n');print('PASS',len(results),'layout/dismiss/reload/multiple-tab cases')
