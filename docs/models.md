# Models

AddonAPIKit uses PROTO models from [MCBE-IPC](https://github.com/OmniacDev/MCBE-IPC) to define the types of data your endpoints accept and return. Because Minecraft's script event system carries everything as a string, PROTO serializes your typed values to binary and encodes them for transport. Models describe the shape of that data so the server and caller agree on how to read and write it.

Every endpoint needs a model for its parameters and one for its return value. If an endpoint takes no parameters or returns nothing meaningful, use `VoidModel`.

API Servers should publicly provide a model for each endpoint they expose, so that API Callers can use the same model to call the endpoint.

Models are built from the `PROTO` object exported by AddonAPIKit.

## Primitive Types

| Type | JS type | Notes |
|------|---------|-------|
| `PROTO.Void` | — | Produces no bytes. Use for endpoints with no parameters or no return value |
| `PROTO.Boolean` | `boolean` | |
| `PROTO.String` | `string` | UTF-16 |
| `PROTO.Int8` | `number` | -128 to 127 |
| `PROTO.Int16` | `number` | -32768 to 32767 |
| `PROTO.Int32` | `number` | -2147483648 to 2147483647 |
| `PROTO.UInt8` | `number` | 0 to 255 |
| `PROTO.UInt16` | `number` | 0 to 65535 |
| `PROTO.UInt32` | `number` | 0 to 4294967295 |
| `PROTO.Float32` | `number` | 32-bit float |
| `PROTO.Float64` | `number` | 64-bit float |
| `PROTO.Date` | `Date` | JavaScript Date object |
| `PROTO.UInt8Array` | `Uint8Array` | Raw byte array |

## Composite Types

| Type | Description |
|------|-------------|
| `PROTO.Object(schema)` | An object where each key maps to a PROTO type |
| `PROTO.Array(type)` | An array where every element is the same type |
| `PROTO.Tuple(...types)` | A fixed-length array with mixed types at specific positions |
| `PROTO.Optional(type)` | A value that may be `undefined` |
| `PROTO.Map(keyType, valueType)` | A JavaScript `Map` |
| `PROTO.Set(type)` | A JavaScript `Set` |
| `PROTO.Cached(type, depth?)` | Caches serialized values; avoids re-serializing frequently repeated data |

## Building Models

### Simple primitive

If an endpoint returns or receives a single primitive value, use the type directly:

```js
import { PROTO } from './AddonAPIKit.js';

const CountModel = PROTO.Int32;
```

### Object with multiple fields

Use `PROTO.Object` when you need to pass or return a structured value:

```js
const PlayerModel = PROTO.Object({
    name: PROTO.String,
    health: PROTO.Float32,
    level: PROTO.Int32
});
```

### Object with optional fields

Wrap a field in `PROTO.Optional` when it may not be present. The receiving end will see either the value or `undefined`:

```js
const PlayerModel = PROTO.Object({
    name: PROTO.String,
    team: PROTO.Optional(PROTO.String)
});
```

### Nested model

Models compose freely. This defines an object whose `members` field is an array of strings:

```js
const TeamModel = PROTO.Object({
    name: PROTO.String,
    members: PROTO.Array(PROTO.String)
});
```

## VoidModel

`VoidModel` is used to send or receive nothing.

```js
import { VoidModel } from './AddonAPIKit.js';
```

Use it as the parameter model when an endpoint takes no input, or as the return model when an endpoint has no meaningful return value. When used as the return model, the call still resolves - the data value is `undefined`, not an absence of response.

```js
// Endpoint that takes no input and returns nothing meaningful
controller.addEndpoint('reset', this.reset, VoidModel, VoidModel);
```

```js
// The call resolves with undefined as the data value
const result = await APIcaller.call('myAddon:reset', VoidModel, undefined, VoidModel);
// result === undefined, but the call completed successfully
```
