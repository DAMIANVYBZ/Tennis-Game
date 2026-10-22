"""Campus assets, selection, URL routing, loading failure and recovery in real WebGL."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes, shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def asset(route):
  path=ROOT/urlparse(route.request.url).path.lstrip('/')
  if path.is_dir():path=path/'index.html'
  if not path.exists():route.fulfill(status=404,body='missing');return
  route.fulfill(body=path.read_bytes(),content_type='text/javascript' if path.suffix in ['.mjs','.js'] else mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
 page.route('http://baseline.test/**',asset)
 def ready():page.wait_for_function('window.__tennis?.environment.state==="ready" && __tennis.characterStatus.state==="ready"',timeout=120000)
 def open_court():
  page.get_by_role('button',name='PLAY INTER-HALL MATCH').click();page.get_by_role('button',name='OPEN ASSET GALLERY').click();page.locator('#enterCourt').click();page.evaluate('__tennis.arrival.skip()')
 page.goto('http://baseline.test/?court=oval-east');ready()
 assert page.evaluate('__tennis.environment.venue.id')=='oval-east'
 open_court();assert page.evaluate('__tennis.match.state')!='menu'
 assert page.evaluate('__tennis.environment.root.children[0].position.x')==-13.5
 page.locator('#returnClub').click();page.get_by_role('button',name='Settings',exact=True).click();page.locator('[data-tab="court"]').click()
 options=page.locator('[data-setting="venue"] option');assert options.count()==7
 assert 'Jean' not in options.all_text_contents()
 for court in ['oval-west','commonwealth-hard','commonwealth-clay-west','commonwealth-clay-east','stadium-west','stadium-east']:
  page.locator('[data-setting="venue"]').select_option(court);ready()
  assert page.evaluate('__tennis.environment.root.userData.venue')==court
  assert page.evaluate('() => {let meshes=0;__tennis.environment.root.children[0].traverse(o=>{if(o.isMesh)meshes++});return meshes}')>10
 assert page.evaluate('__tennis.environment.cache.size')==3
 assert page.evaluate('__tennis.environment.root.children[0].position.x')==-20.5
 # Menu choice survives reload; explicit incoming location takes precedence.
 page.goto('http://baseline.test/');ready();assert page.evaluate('__tennis.lobby.profile.settings.venue')=='stadium-east'
 page.goto('http://baseline.test/?venue=commonwealth-west');ready();assert page.evaluate('__tennis.lobby.profile.settings.venue')=='commonwealth-hard'
 # The first request can fail without admitting the player into an empty scene.
 page.route('**/athletic-oval.glb',lambda r:r.fulfill(status=503,body='temporary failure'))
 page.goto('http://baseline.test/?court=oval-west');page.wait_for_function('window.__tennis?.environment.state==="error"',timeout=120000)
 assert page.locator('#bootLoading').is_visible();assert page.locator('#bootRetry').is_visible()
 page.unroute('**/athletic-oval.glb');page.locator('#bootRetry').click();ready();page.wait_for_function('!window.tennisLoading.active',timeout=120000)
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').click();page.get_by_role('button',name='OPEN ASSET GALLERY').click();assert page.locator('#enterCourt').is_enabled()
 # Rapid selection cannot display an obsolete environment after its download finishes.
 page.evaluate("__tennis.environment.select('commonwealth-hard');__tennis.environment.select('stadium-west')")
 page.wait_for_function('__tennis.environment.state==="ready" && __tennis.environment.root.userData.venue==="stadium-west"',timeout=120000)
 page.wait_for_timeout(1500);assert page.evaluate('__tennis.environment.root.userData.venue')=='stadium-west'
 # Mobile settings remain usable with all seven choices.
 page.set_viewport_size({'width':390,'height':844});page.evaluate("__tennis.lobby.navigate('settings')")
 page.locator('[data-tab="court"]').click();page.locator('[data-setting="venue"]').select_option('oval-east');ready()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('PASS: all 7 rendered court choices, source scene offsets/cache, URL and saved selection, basketball exclusion, failed-load gating/retry, rapid selection and mobile layout. No browser errors.')
 browser.close()
