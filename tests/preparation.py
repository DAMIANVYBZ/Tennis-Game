"""Phone preparation stays compact; settings and library open separate screens."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def asset(route):
  path=ROOT/urlparse(route.request.url).path.lstrip('/')
  if path.is_dir():path=path/'index.html'
  route.fulfill(body=path.read_bytes(),content_type='text/javascript' if path.suffix in ['.mjs','.js'] else mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
 page.route('http://baseline.test/**',asset);page.goto('http://baseline.test/');page.wait_for_function('window.__tennis?.environment.state==="ready"&&__tennis.characterStatus.state==="ready"',timeout=120000)
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').tap()
 assert page.locator('[data-control]').count()==3
 for button in page.locator('[data-control]').all():assert button.inner_text()=='';assert button.locator('svg').count()==1;assert button.get_attribute('aria-label')
 assert page.locator('.control-preview').count()==0;assert page.locator('[data-setting]').count()==0;assert page.locator('[data-slot]').count()==0
 for width,height in [(390,844),(320,568),(844,390)]:
  page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(150)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=f'/workspace/tennis-preparation-{width}.png')
  assert page.locator('#club').evaluate('(el)=>el.scrollHeight<=el.clientHeight+1'),(width,height,page.locator('#club').evaluate('(el)=>[el.scrollHeight,el.clientHeight]'))
  assert page.locator('#enterCourt').evaluate('(el)=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}')
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/workspace/tennis-compact-preparation.png')
 page.get_by_role('button',name='PS5 controller',exact=True).tap();assert page.locator('[data-control="ps5"]').get_attribute('aria-pressed')=='true'
 page.get_by_role('button',name='Settings',exact=True).tap();assert page.locator('.settings-page').is_visible();assert page.locator('.preparation-home').count()==0
 page.locator('[data-tab="controls"]').tap();assert page.locator('.control-preview').is_visible();assert 'Right stick' in page.locator('.settings-content').inner_text();page.screenshot(path='/workspace/tennis-mobile-controls-settings.png')
 page.locator('[data-tab="audio"]').tap();page.locator('[data-setting="musicVolume"]').fill('25');assert page.evaluate('__tennis.lobby.profile.settings.musicVolume')==25
 page.locator('[data-tab="court"]').tap();page.locator('[data-setting="hall"]').select_option('Volta Hall')
 page.get_by_role('button',name='DONE').tap();assert page.locator('.preparation-home').is_visible();assert page.locator('.control-preview').count()==0
 page.get_by_role('button',name='Open asset gallery').tap();assert page.locator('.asset-grid').is_visible();assert page.locator('.settings-page').count()==0
 page.go_back();assert page.locator('.preparation-home').is_visible();page.get_by_role('button',name='Settings',exact=True).tap();page.go_back();assert page.locator('.preparation-home').is_visible()
 page.reload();page.wait_for_function('!!window.__tennis');assert page.evaluate('__tennis.lobby.profile.settings.controls')=='ps5';assert page.evaluate('__tennis.lobby.profile.settings.hall')=='Volta Hall'
 assert not errors,errors
 print('PASS: icon-only accessible input buttons; no instructions/settings/gear dumped on preparation; no scrolling at 390×844, 320×568 and 844×390; separate settings sections and library; saved choices and browser Back. No browser errors.')
 browser.close()
