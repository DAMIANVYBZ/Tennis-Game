# Campus tennis environments

The tennis game uses surrounding geometry from `DAMIANVYBZ/Legon-world-Test` at commit `dc022c169a40514d783a494743cdabdebff4034b`. That repository was inspected read only; the popup and main-game integration remain with its developer.

Jean Nelson Aka Hall's courtyard is **basketball**, as confirmed by the owner. Its incorrect `tennis` label in the source does not make it a selectable tennis location. There are three tennis sites and seven individual courts in this implementation.

| Site | Court ID | Main-game centre (x, z metres) |
| --- | --- | --- |
| Athletic Oval | `oval-west` | -77.5, 376 |
| Athletic Oval | `oval-east` | -64, 376 |
| Commonwealth west | `commonwealth-hard` | -630.5, -73 |
| Commonwealth west | `commonwealth-clay-west` | -613.625, -73 |
| Commonwealth west | `commonwealth-clay-east` | -595.875, -73 |
| Stadium / pool | `stadium-west` | 538, 1434.5 |
| Stadium / pool | `stadium-east` | 558.5, 1434.5 |

## Opening the matching location

Use `https://tennis-legon.pages.dev/?court=COURT_ID`. For example:

- https://tennis-legon.pages.dev/?court=oval-west
- https://tennis-legon.pages.dev/?court=commonwealth-hard
- https://tennis-legon.pages.dev/?court=stadium-west

`courtId` is also accepted. Site aliases such as `?venue=athletic-oval`, `?venue=commonwealth-west` and `?venue=sports-stadium` select their first court. The explicit URL wins over the saved browser choice. Without a valid incoming location the player's saved selection is used, initially Oval west. Settings lets the player change locations before entering court. Character and environment loading must finish before court entry; failed downloads offer retry.

`venues.mjs` contains source positions and local transforms for integration reference. Source coordinates are x east and z south, with datum latitude 5.6518, longitude -0.1871. Local playable courts remain centred at zero; changing courts shifts the imported surroundings to match. Changing ends does not move the campus.

## Visual source and practical adjustments

The Oval retains its sports grounds, running track, nearby annexes, trees and roads. Commonwealth retains the sunken terrace, stone walls, chain-link fencing, worn hard surface, red-soil courts and vegetation. The stadium precinct retains the neighbouring tennis court, pool/diving tower, gym and nearby buildings in their source positions. Distant features may be outside the match camera's view.

The Oval source used a short schematic tennis enclosure. Only that enclosure and playing surfaces were extended to regulation-length run-offs; surrounding features keep their source positions. Source nets were replaced by the gameplay net and matching neighbour nets. Hard courts retain the requested faded blue; Commonwealth red-soil courts keep their source colour. The environment change does not alter ball physics.

Custom main-game grass/weathering shaders are not exported. Geometry, canvas textures and vertex colours are retained, with opaque textures compressed. This matches the supplied game model, rather than claiming a new real-world site survey. Asset provenance, source model names, adjustments and hashes are recorded in `assets/venues/SOURCE.json`.

## Reproducing exports

Copy the source repository's `src` and `public` directories into a separate scratch project; never run the exporter against an editable main-game checkout. Copy `tools/export-campus-environments.mjs` to that scratch project's root and serve it through Vite with Three.js 0.180.0. Its exported `PLANS` and browser export functions define the three site crops. `tools/optimize-venue-glb.py` compresses opaque embedded images after export. Preview images are actual renders of the tennis game.

Validation: `node tests/venues.mjs` checks the site registry, surveyed centres, URL aliases, saved choices and basketball exclusion. `python tests/venues.py` checks real GLB rendering, all seven court selections, source offsets, loading failure/retry, rapid changes and mobile layout in Chromium.
