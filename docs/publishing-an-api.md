# Publishing an API

AddonAPIKit lets you expose named endpoints from your addon so other addons can call into your code. You define what data each endpoint accepts and returns using PROTO models, and the library handles serialization, routing, and error handling over Minecraft's script event system.

## Creating a server

A server is the entry point for your addon's API. Give it a name and a version. The name becomes the namespace for all your endpoints — callers reference them as `serverName:endpointName`. The version lets callers detect when they are talking to an incompatible server.

```js
import { AddonAPIServer } from './AddonAPIKit.js';

const apiServer = new AddonAPIServer('playerInfo', '1.0.0');
```

Create the server once at the top level of your script, outside any event handlers.

## Defining endpoints

Endpoints are registered through a controller. The preferred approach is to subclass `APIController`, which gives your endpoint callbacks access to shared state and helper methods via `this`.

```js
import { world } from '@minecraft/server';
import { APIController, VoidModel, PROTO } from './AddonAPIKit.js';

class PlayerController extends APIController {
    constructor() {
        super();
        this.addEndpoint('getCount', this.getCount, VoidModel, PROTO.Int32);
        this.addEndpoint('getName', this.getName, PROTO.Object({ index: PROTO.Int32 }), PROTO.String);
    }

    getCount() {
        return world.getPlayers().length;
    }

    getName(index) {
        return world.getPlayers()[index]?.name ?? '';
    }
}

apiServer.setupController(new PlayerController());
```

`addEndpoint` takes four arguments: the endpoint name, the callback, the parameter model, and the return model.

| Argument | Description |
|----------|-------------|
| `endpoint` | The full endpoint path: `'serverName:endpointName'` |
| `callback` | The function to call when the endpoint is invoked |
| `parameterModel` | The PROTO model describing the parameters |
| `returnDataModel` | The PROTO model describing the return value |

When a caller invokes the endpoint, the parameters are deserialized and passed to the callback as positional arguments in the order they appear in the model's keys. When `VoidModel` is used as the parameter model, the callback receives no arguments.

Parameter models must always be `PROTO.Object`. The library extracts arguments by calling `Object.values()` on the deserialized parameter map, so a raw primitive type like `PROTO.Int32` used directly as a parameter model will not work — wrap it in an object instead: `PROTO.Object({ value: PROTO.Int32 })`.

Learn more about Models in the [Models guide](./models.md).

### Direct instantiation

If you only have a few endpoints and don't need shared state, you can instantiate `APIController` directly and pass arrow functions as callbacks:

```js
import { world } from '@minecraft/server';
import { APIController, VoidModel, PROTO } from './AddonAPIKit.js';

const controller = new APIController();
controller.addEndpoint('getCount', () => world.getPlayers().length, VoidModel, PROTO.Int32);
controller.addEndpoint('getName', (index) => world.getPlayers()[index]?.name ?? '', PROTO.Object({ index: PROTO.Int32 }), PROTO.String);

apiServer.setupController(controller);
```

## Error handling

If a caller passes invalid input or makes a request your endpoint cannot fulfill, throw an `APICallerError` from your callback. This signals to the server that the problem is on the caller's side and sends a structured error back.

```js
import { APICallerError } from './AddonAPIKit.js';

class PlayerController extends APIController {
    // ...
    getName(index) {
        const player = world.getPlayers()[index];
        if (!player)
            throw new APICallerError(new RangeError(`No player at index ${index}`));
        return player.name;
    }
}
```

Any error that is not an `APICallerError` is treated as an unexpected server error — it is logged and returned to the caller as an internal error.

## Complete example

```js
import { world } from '@minecraft/server';
import { AddonAPIServer, APIController, APICallerError, VoidModel, PROTO } from './AddonAPIKit.js';

const apiServer = new AddonAPIServer('playerInfo', '1.0.0');

class PlayerController extends APIController {
    constructor() {
        super();
        this.addEndpoint('getCount', this.getCount, VoidModel, PROTO.Int32);
        this.addEndpoint('getName', this.getName, PROTO.Object({ index: PROTO.Int32 }), PROTO.String);
    }

    getCount() {
        return world.getPlayers().length;
    }

    getName(index) {
        const player = world.getPlayers()[index];
        if (!player)
            throw new APICallerError(new RangeError(`No player at index ${index}`));
        return player.name;
    }
}

apiServer.setupController(new PlayerController());
```
