"""Release checks, optional popup, offline behavior and cache-busted refresh preserve the venue/profile."""
from pathlib import Path
from urllib.parse import urlparse,parse_qs
import json,mimetypes,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
current=json.loads((ROOT/'version.json').read_text())['version']
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 state={'version':current,'offline':False}
 def asset(route):
  path=ROOT/urlparse(route.request.url).path.lstrip('/')
  if path.name=='version.json':
   if state['offline']:route.abort();return
   route.fulfill(json={'version':state['version']});return
  if path.is_dir():path=path/'index.html'
  route.fulfill(body=path.read_bytes(),content_type='text/javascript' if path.suffix in ['.mjs','.js'] else mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
 page.route('http://baseline.test/**',asset);page.goto('http://baseline.test/?court=oval-east');page.wait_for_function('window.tennisUpdates&&window.tennisLoading&&!tennisLoading.active',timeout=120000)
 page.evaluate('tennisUpdates.check()');assert page.locator('#updateNotice').is_hidden()
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').click();page.locator('#enterCourt').click();page.evaluate('__tennis.arrival.skip()');page.wait_for_function('!document.body.classList.contains("arriving")')
 state['version']='1'*20;page.evaluate('tennisUpdates.check()');assert page.locator('#updateNotice').is_visible();assert page.evaluate('__tennis.match.state')=='serve'
 page.screenshot(path='/workspace/tennis-update-popup-mobile.png');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('#dismissUpdate').click();assert page.locator('#updateNotice').is_hidden();page.evaluate('tennisUpdates.check()');assert page.locator('#updateNotice').is_hidden()
 state['offline']=True;page.evaluate('tennisUpdates.check()');assert page.locator('#updateNotice').is_hidden();state['offline']=False
 state['version']='bad-manifest';page.evaluate('tennisUpdates.check()');assert page.locator('#updateNotice').is_hidden()
 # A later release reappears; applying it preserves all URL parameters and local ownership/settings.
 state['version']='2'*20;page.evaluate('tennisUpdates.check()');assert page.locator('#updateNotice').is_visible();assert page.evaluate('__tennis.match.state')=='serve'
 saved=page.evaluate('JSON.stringify(__tennis.lobby.profile)')
 with page.expect_navigation(wait_until='domcontentloaded'):page.locator('#applyUpdate').click()
 query=parse_qs(urlparse(page.url).query);assert query['court']==['oval-east'];assert query['__update']==['2'*20]
 page.wait_for_function('window.__tennis&&window.tennisLoading&&!tennisLoading.active',timeout=120000);assert page.evaluate('JSON.stringify(__tennis.lobby.profile)')==saved;assert page.evaluate('__tennis.lobby.screen')=='landing'
 assert not errors,errors
 print('PASS: matching/offline/invalid versions stay quiet; new release popup leaves match running; Later deduplicates; subsequent updates reappear; refresh preserves court URL and saved profile. No browser errors.')
 browser.close()
