"""Boot gate follows real asset readiness, warms rendering, and recovers from failed downloads."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 def asset(route):
  path=ROOT/urlparse(route.request.url).path.lstrip('/')
  if path.is_dir():path=path/'index.html'
  route.fulfill(body=path.read_bytes(),content_type='text/javascript' if path.suffix in ['.mjs','.js'] else mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
 page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.route('http://baseline.test/**',asset)
 held=[];page.route('**/female.glb',lambda r:held.append(r));page.goto('http://baseline.test/',wait_until='domcontentloaded');page.wait_for_function('window.__tennis?.environment.state==="ready"',timeout=120000)
 assert page.locator('#bootLoading').is_visible();assert page.locator('#clubShell').get_attribute('inert') is not None
 assert page.locator('.ug-lobby').is_visible() is False
 assert int(page.locator('#bootPercent').inner_text().rstrip('%'))<100
 assert page.evaluate('__tennis.match.state')=='menu';page.keyboard.press('Space');assert page.evaluate('__tennis.match.state')=='menu'
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path='/workspace/tennis-loading-mobile.png')
 page.unroute('**/female.glb')
 for route in held:asset(route)
 page.wait_for_function('!window.tennisLoading.active',timeout=120000)
 assert page.locator('#bootLoading').is_hidden();assert page.locator('.ug-lobby').is_visible();assert page.locator('#clubShell').get_attribute('inert') is None
 assert page.locator('#bootPercent').inner_text()=='100%';assert page.evaluate('__tennis.renderer.info.render.triangles')>10000
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').click();assert page.locator('.preparation-home').is_visible()
 # A real failed player download stays on the loader and is retried without reloading the page.
 page.route('**/male.glb',lambda r:r.fulfill(status=503,body='temporary failure'));page.reload(wait_until='domcontentloaded');page.wait_for_function('window.__tennis?.characterStatus.state==="error"',timeout=120000)
 assert page.locator('#bootLoading').is_visible();assert page.locator('#bootRetry').is_visible();assert page.locator('#clubShell').get_attribute('inert') is not None
 page.unroute('**/male.glb');page.locator('#bootRetry').click();page.wait_for_function('!window.tennisLoading.active',timeout=120000);assert page.locator('.ug-lobby').is_visible()
 assert not errors,errors
 # A failed entry module still has a working, independently loaded error screen.
 broken=browser.new_page();broken.route('http://baseline.test/**',asset);broken.route('**/game.js',lambda r:r.abort());broken.goto('http://baseline.test/',wait_until='domcontentloaded');broken.wait_for_function('!document.getElementById("bootRetry").hidden')
 assert broken.locator('#bootLoading').is_visible();assert 'could not download' in broken.locator('#bootStatus').inner_text()
 print('PASS: real delayed model keeps boot screen visible and menus inert; completion waits for models, court, images and rendered scene; mobile layout; failed-download retry; entry-module failure. No browser errors.')
 browser.close()
