import {BUILD_VERSION} from './build-version.mjs';
const popup=document.getElementById('updateNotice'),refresh=document.getElementById('applyUpdate'),later=document.getElementById('dismissUpdate');
let pending=null,dismissed=null,checking=false;
export async function checkForUpdate(){
 if(checking||document.hidden||window.tennisLoading?.active)return;
 checking=true;const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),8000);
 try{const response=await fetch(new URL('./version.json',import.meta.url),{cache:'no-store',signal:abort.signal});if(!response.ok)return;const data=await response.json();if(typeof data.version!=='string'||! /^[a-f0-9]{16,64}$/.test(data.version))return;
 if(data.version===BUILD_VERSION){pending=null;popup.hidden=true;return}
 pending=data.version;if(pending!==dismissed)popup.hidden=false;
 }catch{/* Offline checks never interrupt the game. */}finally{clearTimeout(timeout);checking=false}
}
refresh.onclick=()=>{if(!pending)return;window.__tennis?.lobby.save();refresh.disabled=true;refresh.textContent='Applying update…';const url=new URL(location.href);url.searchParams.set('__update',pending);location.replace(url.href)};
later.onclick=()=>{dismissed=pending;popup.hidden=true;if(document.body.dataset.screen==='court')document.getElementById('court')?.focus()};
window.addEventListener('tennis:ready',checkForUpdate);window.addEventListener('online',checkForUpdate);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkForUpdate()});
setInterval(checkForUpdate,60000);setTimeout(checkForUpdate,15000);
window.tennisUpdates={check:checkForUpdate,get current(){return BUILD_VERSION},get pending(){return pending}};
