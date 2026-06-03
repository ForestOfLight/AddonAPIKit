import { PROTO } from "./MCBE-IPC/ipc";

export const VoidModel = PROTO.Optional(PROTO.Void);

export const ErrorModel = PROTO.Optional(PROTO.Object({
    code: PROTO.Int8,
    name: PROTO.Optional(PROTO.String),
    message: PROTO.Optional(PROTO.String)
}));

export const ReturnModelShell = {
    apiVersion: PROTO.String,
    data: void 0,
    error: ErrorModel
};

export const CallModelShell = {
    apiVersion: PROTO.String,
    parameterMap: void 0
};

export const EndpointModel = PROTO.String;
export const EndpointsModel = PROTO.Array(EndpointModel);
