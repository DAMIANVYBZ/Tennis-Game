import assert from 'node:assert/strict';
import {COURTS,SITES,DEFAULT_VENUE,venueId,getVenue,requestedVenue,toCampusPosition} from '../venues.mjs';
import {freshProfile,normalizeProfile} from '../inventory.mjs';
assert.equal(SITES.length,3);assert.equal(COURTS.length,7);assert.equal(new Set(COURTS.map(c=>c.id)).size,7);
assert.equal(freshProfile().settings.venue,DEFAULT_VENUE);
for(const court of COURTS){assert.equal(venueId(court.id),court.id);const v=getVenue(court.id),p=toCampusPosition(court.id,0,0);assert.equal(p.x,court.x);assert.equal(p.z,court.z);assert(v.site.sourceFiles.length>0);assert.equal(normalizeProfile({settings:{venue:court.id}}).settings.venue,court.id)}
assert.equal(requestedVenue('?venue=commonwealth-west'),'commonwealth-hard');assert.equal(requestedVenue('?court=oval-east&venue=commonwealth-west'),'oval-east');assert.equal(requestedVenue('?courtId=stadium-east'),'stadium-east');assert.equal(requestedVenue('?court=unknown'),null);assert.equal(getVenue('unknown').id,DEFAULT_VENUE);assert.equal(venueId('https://evil.test/a.glb'),null);
assert.deepEqual(COURTS.filter(c=>c.siteId==='commonwealth-west').map(c=>c.x),[-630.5,-613.625,-595.875]);assert.equal(getVenue('oval-east').offset.x,13.5);assert.equal(getVenue('stadium-east').offset.x,20.5);assert.equal(getVenue('commonwealth-clay-east').offset.x,34.625);
assert.equal(venueId('jean-nelson-aka'),null,'Owner confirms that the hall courtyard is basketball, not tennis');
console.log('PASS: all 7 tennis court IDs in 3 sites, exact centres, same-site offsets, owner-corrected basketball exclusion, incoming URL precedence, aliases and saved selection.');
