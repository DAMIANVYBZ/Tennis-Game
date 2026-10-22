"""Real browser music playback, navigation, match silence and saved preferences."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 def open_page(context):
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  def asset(route):
   path=ROOT/urlparse(route.request.url).path.lstrip('/')
   if path.is_dir():path=path/'index.html'
   if not path.exists():route.fulfill(status=404,body='not found');return
   route.fulfill(body=path.read_bytes(),content_type='text/javascript' if path.suffix in ['.mjs','.js'] else mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
  page.route('http://baseline.test/**',asset);page.goto('http://baseline.test/');page.wait_for_function('window.__tennis?.characterStatus.state==="ready"',timeout=120000);return page,errors
 page,errors=open_page(browser.new_context(viewport={'width':1440,'height':900}))
 assert page.evaluate('__tennis.music.audio.paused && !__tennis.music.unlocked')
 page.locator('#menuMusic').click();page.wait_for_function('__tennis.music.state==="playing"&&__tennis.music.audio.currentTime>.15&&__tennis.music.ctx.state==="running"')
 assert page.evaluate('__tennis.music.audio.loop');assert 39<page.evaluate('__tennis.music.audio.duration')<41
 before=page.evaluate('__tennis.music.audio.currentTime');page.get_by_role('button',name='PLAY INTER-HALL MATCH').click();assert page.evaluate('__tennis.music.audio.currentTime')>=before
 page.get_by_role('button',name='Settings',exact=True).click();page.locator('[data-tab="audio"]').click();page.locator('[data-setting="musicVolume"]').fill('20');assert abs(page.evaluate('__tennis.music.gain.gain.value')-.2)<1e-6
 page.locator('[data-setting="musicEnabled"]').select_option('off');assert page.evaluate('__tennis.music.audio.paused && __tennis.music.gain.gain.value===0')
 page.locator('[data-setting="musicEnabled"]').select_option('on');page.wait_for_function('!__tennis.music.audio.paused')
 page.get_by_role('button',name='DONE').click();page.get_by_role('button',name='OPEN ASSET GALLERY').click();assert page.evaluate('!__tennis.music.audio.paused')
 page.locator('#enterCourt').click();assert page.evaluate('__tennis.music.audio.paused && __tennis.music.gain.gain.value===0');assert page.evaluate('__tennis.match.state')=='serve'
 stopped=page.evaluate('__tennis.music.audio.currentTime');page.wait_for_timeout(250);assert abs(page.evaluate('__tennis.music.audio.currentTime')-stopped)<.03
 page.locator('#court').focus();page.keyboard.press('p');assert page.evaluate('__tennis.match.state')=='paused';assert page.evaluate('__tennis.music.audio.paused')
 page.locator('#returnClub').click();page.wait_for_function('!__tennis.music.audio.paused');assert page.evaluate('__tennis.music.audio.currentTime')>=stopped
 # Hidden tabs stop music; returning only resumes it on pre-match pages.
 page.evaluate("Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))");assert page.evaluate('__tennis.music.audio.paused')
 page.evaluate("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))");page.wait_for_function('!__tennis.music.audio.paused')
 page.locator('#menuMusic').click();assert page.evaluate('!__tennis.lobby.profile.settings.musicEnabled && __tennis.music.audio.paused')
 page.reload();page.wait_for_function('!!window.__tennis');assert page.evaluate('!__tennis.music.enabled && __tennis.music.audio.paused && __tennis.lobby.profile.settings.musicVolume===20')
 page.locator('#menuMusic').click();page.wait_for_function('!__tennis.music.audio.paused');assert abs(page.evaluate('__tennis.music.gain.gain.value')-.2)<1e-6
 # An in-flight playback request cannot restart music after entering the court.
 page.evaluate("async()=>{const music=__tennis.music;music.stop();const pending=music.play();__tennis.lobby.navigate('court');await pending}");assert page.evaluate('__tennis.music.audio.paused && __tennis.music.gain.gain.value===0')
 assert not errors,errors
 phone,phone_errors=open_page(browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True))
 phone.get_by_role('button',name='PLAY INTER-HALL MATCH').tap();phone.wait_for_function('!__tennis.music.audio.paused');assert phone.evaluate('document.documentElement.scrollWidth<=innerWidth')
 phone.get_by_role('button',name='OPEN ASSET GALLERY').tap();phone.locator('#enterCourt').tap();assert phone.evaluate('__tennis.music.audio.paused && __tennis.music.gain.gain.value===0');assert not phone_errors,phone_errors
 print('PASS: gesture-started 40s loop; uninterrupted navigation; music volume and mute; silence throughout play/pause; menu return; hidden-tab suspension; saved choices; playback race; phone touch. No browser errors.')
 browser.close()
