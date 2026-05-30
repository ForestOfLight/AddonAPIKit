# AddonAPIKit

Expose APIs from your Minecraft Bedrock addons so other addons can call into them.

AddonAPIKit builds on [MCBE-IPC](https://github.com/OmniacDev/MCBE-IPC) to provide a typed, request-response API layer over Minecraft's script event system. One addon defines named endpoints with typed parameters and return values; any other addon can call those endpoints by name and get results back asynchronously.

## Installation

Download `AddonAPIKit.js` from the [releases page](../../releases) and copy it into your addon's script directory. Import from it directly.

## Quick example

```js
// Server addon — expose a getCount endpoint
import { world } from '@minecraft/server';
import { AddonAPIServer, APIController, VoidModel, PROTO } from './AddonAPIKit.js';

const server = new AddonAPIServer('playerInfo', '1.0.0');
const controller = new APIController();
controller.addEndpoint('getCount', () => world.getPlayers().length, VoidModel, PROTO.Int32);
server.setupController(controller);
```

```js
// Caller addon — call it from another addon
import { AddonAPICaller, VoidModel, PROTO } from './AddonAPIKit.js';

const count = await AddonAPICaller.call('playerInfo:getCount', VoidModel, undefined, PROTO.Int32);
console.log(`${count} players online`);
```

## Guides

- [Publishing an API](docs/publishing-an-api.md) — define endpoints and expose them from your addon
- [Calling an API](docs/calling-an-api.md) — call endpoints exposed by another addon
- [Models](docs/models.md) — define PROTO models for parameters and return values
