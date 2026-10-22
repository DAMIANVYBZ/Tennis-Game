"""Full arrival, saved equipment and three input layouts in Chromium."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes,shutil,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 def setup(page):
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  def asset(route):
   path=ROOT/urlparse(route.request.url).path.lstrip('/')
   if path.is_dir():path=path/'index.html'
   if not path.exists():route.fulfill(status=404,body='not found');return
   route.fulfill(body=path.read_bytes(),content_type='text/javascript' if path.suffix in ['.mjs','.js'] else mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
  page.route('http://baseline.test/**',asset);page.goto('http://baseline.test/');page.wait_for_function('window.__tennis?.characterStatus.state==="ready"',timeout=120000);page.wait_for_function('!window.tennisLoading.active',timeout=120000);return errors
 page=browser.new_page(viewport={'width':1440,'height':960});errors=setup(page)
 assert page.locator('.ug-lobby').is_visible();assert page.evaluate('__tennis.match.state')=='menu'
 page.keyboard.press('Space');assert page.evaluate('__tennis.match.state')=='menu'
 page.evaluate("window.pad={index:0,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});pad.buttons[0].pressed=true;__tennis.pollPad()")
 assert page.evaluate('__tennis.match.state')=='menu'
 page.evaluate('pad.buttons[0].pressed=false;__tennis.pollPad();__tennis.lobby.pollPad()')
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').focus()
 page.evaluate('pad.buttons[0].pressed=true;__tennis.lobby.pollPad();pad.buttons[0].pressed=false;__tennis.lobby.pollPad()')
 assert page.locator('.preparation-home').is_visible()
 page.evaluate('pad.buttons[1].pressed=true;__tennis.lobby.pollPad();pad.buttons[1].pressed=false;__tennis.lobby.pollPad()')
 assert page.locator('.ug-lobby').is_visible()
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').click()
 assert page.locator('[data-control="keyboard"]').get_attribute('aria-pressed')=='true'
 page.locator('[data-control="touch"]').click();assert page.locator('body').get_attribute('data-controls')=='touch'
 page.locator('[data-control="ps5"]').click();assert page.locator('body').get_attribute('data-controls')=='ps5'
 page.locator('[data-control="keyboard"]').click()
 page.get_by_role('button',name='Settings',exact=True).click();page.locator('[data-tab="court"]').click();page.locator('[data-setting="hall"]').select_option('Volta Hall');page.locator('[data-tab="match"]').click();page.locator('[data-setting="difficulty"]').select_option('hard');page.locator('[data-setting="shotTiming"]').select_option('manual');page.locator('[data-setting="assist"]').fill('20');page.locator('[data-setting="shotTiming"]').select_option('auto');page.get_by_role('button',name='DONE').click()
 page.get_by_role('button',name='OPEN ASSET GALLERY').click();assert page.locator('.asset-card').count()==5
 page.get_by_role('button',name='Club shop',exact=True).click();assert page.locator('.asset-card').count()==13
 assert page.locator('[data-buy="cap"]').is_visible();assert page.evaluate('__tennis.lobby.profile.equipped.headwear')=='club-band'
 page.locator('[data-buy="cap"]').click();assert page.evaluate('__tennis.lobby.profile.credits')==145
 page.locator('[data-equip="cap"]').click();assert page.evaluate('__tennis.youModel.cap.visible && !__tennis.youModel.band.visible')
 page.locator('[data-buy="ocean-kit"]').click();page.locator('[data-equip="ocean-kit"]').click();assert page.evaluate('__tennis.lobby.profile.equipped.outfit')=='ocean-kit'
 assert page.locator('[data-buy="carbon-racket"]').is_disabled()
 page.locator('[data-buy="towel"]').click();page.locator('[data-equip="towel"]').click()
 page.locator('#enterCourt').click();page.evaluate('__tennis.arrival.skip()');page.wait_for_function('!document.body.classList.contains("arriving")');assert page.locator('body').get_attribute('data-screen')=='court'
 assert page.evaluate('__tennis.match.state')=='serve';assert page.evaluate('__tennis.match.difficulty')=='hard';assert page.evaluate('__tennis.match.assist')==.2
 assert page.locator('[data-shot="topspin"]').inner_text().startswith('Space'),repr(page.locator('[data-shot="topspin"]').inner_text());assert not page.locator('#joystick').is_visible()
 page.locator('#court').focus();page.keyboard.down('Space');page.wait_for_timeout(250);assert page.evaluate('__tennis.match.shot.type')=='topspin';page.keyboard.up('Space');assert page.evaluate('__tennis.match.state')=='toss'
 page.locator('#settingsButton').click();page.locator('#controlMode').select_option('touch');page.locator('#closeSettings').click();assert page.locator('#joystick').is_visible();assert page.locator('#touchSprint').is_visible();assert page.locator('[data-shot="topspin"]').inner_text().startswith('TOP')
 page.locator('#touchSprint').dispatch_event('pointerdown',{'pointerId':1,'clientX':10,'clientY':10});assert page.evaluate('!!__tennis.buildInput(.01).sprint');page.locator('#touchSprint').dispatch_event('pointerup',{'pointerId':1});assert not page.evaluate('!!__tennis.buildInput(.01).sprint')
 page.locator('#returnClub').click();assert page.evaluate('__tennis.match.state')=='paused'
 page.reload();page.wait_for_function('!!window.__tennis');assert page.locator('.ug-lobby').is_visible();assert page.evaluate('__tennis.lobby.profile.equipped.headwear')=='cap';assert page.evaluate('__tennis.lobby.profile.equipped.towel')=='towel';assert page.evaluate('__tennis.lobby.profile.settings.controls')=='touch'
 page.screenshot(path='/workspace/tennis-club-landing.png')
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').click();page.screenshot(path='/workspace/tennis-club-settings.png');page.get_by_role('button',name='OPEN ASSET GALLERY').click();page.screenshot(path='/workspace/tennis-club-gallery.png')
 page.go_back();assert page.locator('.preparation-home').is_visible()
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.get_by_role('button',name='OPEN ASSET GALLERY').click();page.screenshot(path='/workspace/tennis-club-mobile.png');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 # Theme tokens, hall names and completed-match rewards all drive the supplied UI.
 assert page.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--ug-blue").trim()')=='#002147'
 assert page.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--ug-gold").trim()')=='#d4af37'
 page.locator('#enterCourt').click();page.evaluate('__tennis.arrival.skip()');assert 'VOLTA' in page.locator('#youHall').inner_text()
 before=page.evaluate('__tennis.lobby.profile.credits')
 page.evaluate('__tennis.match.points={you:20,ai:18};__tennis.match.state="rally";__tennis.match.score("you","WINNER")')
 assert page.locator('#overlay').is_visible();assert page.locator('#earnedCredits').inner_text()=='+50';assert page.evaluate('__tennis.lobby.profile.credits')==before+50
 assert page.evaluate('__tennis.lobby.profile.matches.at(-1).hall')=='Volta Hall'
 page.screenshot(path='/workspace/tennis-ug-victory.png');page.locator('#resultLobby').click();page.locator('[data-go="standings"]').click();assert page.locator('.ug-standing').first.inner_text().find('Volta Hall')>=0
 page.screenshot(path='/workspace/tennis-ug-standings.png')
 assert not errors,errors
 mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);phone=mobile.new_page();phone_errors=setup(phone);assert phone.evaluate('__tennis.lobby.profile.settings.controls')=='touch'
 phone.get_by_role('button',name='PLAY INTER-HALL MATCH').click();phone.get_by_role('button',name='OPEN ASSET GALLERY').click();phone.locator('#enterCourt').click();phone.evaluate('__tennis.arrival.skip()');phone.wait_for_function('!document.body.classList.contains("arriving")');assert phone.locator('#joystick').is_visible();assert phone.locator('#touchSprint').is_visible();assert not phone_errors,phone_errors
 print('PASS: landing cannot auto-start; 3-page flow; all control layouts; touch sprint; owned/locked gear; credits, purchases and equipping; visible cap; saved preferences; browser Back; desktop and phone layouts. No browser errors.')
 browser.close()
