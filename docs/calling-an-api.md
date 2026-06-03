# Calling an API

`AddonAPICaller` lets your addon call endpoints exposed by another addon. Before the first call to a given server, it contacts that server to fetch its list of valid endpoints and caches them locally. This means you get a clear error if you reference an endpoint that does not exist, rather than a silent failure.

## Creating a caller

Create one `AddonAPICaller` instance per API server you want to call. Pass the server name and the API version you expect to target:

```js
import { AddonAPICaller } from './AddonAPIKit.js';

const playerInfoAPICaller = new AddonAPICaller('playerInfo', '1.0.0');
```

The name must match the server name the publishing addon passed to `new AddonAPIServer(name, version)`. The version is sent with every request so the server can detect mismatches.

Create the caller once at the top level of your script, outside any event handlers.

## Making a call

All calls go through the `call` instance method:

```js
playerInfoAPICaller.call(endpoint, parameterModel, parameterMap, returnDataModel)
```

| Argument | Description |
|----------|-------------|
| `endpoint` | The full endpoint path: `'serverName:endpointName'` |
| `parameterModel` | The PROTO model describing the parameters |
| `parameterMap` | The parameter values to send, as an object matching the model. Pass `undefined` when using `VoidModel`. |
| `returnDataModel` | The PROTO model describing the return value |

`call` is async and returns a Promise that resolves to the deserialized return value.

Parameter models must always be `PROTO.Object`. The library extracts arguments by calling `Object.values()` on the deserialized parameter map, so a raw primitive used directly as a parameter model will not work - wrap it in an object: `PROTO.Object({ value: PROTO.Int32 })`.

Learn more about Models in the [Models guide](./models.md).

## Endpoint naming

Endpoint paths follow the pattern `serverName:endpointName`. The server name and endpoint name are what the publishing addon passed to `new AddonAPIServer(name, version)` and `addEndpoint(name, ...)`. For the example API server in the [Publishing an API](./publishing-an-api.md) guide, the paths are:

- `'playerInfo:getCount'`
- `'playerInfo:getName'`

## Complete example

These calls match the endpoints defined in the [Publishing an API](./publishing-an-api.md) guide.

```js
import { AddonAPICaller, VoidModel, PROTO } from './AddonAPIKit.js';

const playerInfoAPICaller = new AddonAPICaller('playerInfo', '1.0.0');

// No parameters — pass VoidModel and undefined
const count = await playerInfoAPICaller.call('playerInfo:getCount', VoidModel, undefined, PROTO.Int32);
console.log(`${count} players online`);

// With parameters — pass the model and a matching object
const name = await playerInfoAPICaller.call(
    'playerInfo:getName',
    PROTO.Object({ index: PROTO.Int32 }),
    { index: 0 },
    PROTO.String
);
console.log(`First player: ${name}`);
```

## Error handling

If you call an endpoint the server does not expose, `AddonAPICaller` throws before sending the call:

```js
import { AddonAPICaller, APIEndpointNotFoundError, VoidModel, PROTO } from './AddonAPIKit.js';

const playerInfoAPICaller = new AddonAPICaller('playerInfo', '1.0.0');

try {
    const name = await playerInfoAPICaller.call('playerInfo:getName', PROTO.Object({ index: PROTO.Int32 }), { index: 0 }, PROTO.String);
} catch (error) {
    if (error instanceof APIEndpointNotFoundError) {
        console.warn('Endpoint does not exist:', error.message);
    }
}
```

If the server's callback threw an `APICallerError`, the error is returned in the response and carries the original error's name and message. If the callback threw any other error, it is returned as an internal server error.
