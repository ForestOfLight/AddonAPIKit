import { system } from "@minecraft/server";
import { IPC, PROTO } from "./MCBE-IPC/ipc";
import { CallModelShell, EndpointsModel, ReturnModelShell, VoidModel } from "./APIModels";
import { APIEndpointNotFoundError } from "./Errors/APIEndpointNotFoundError";
import { APICallerError, APIErrorEnum } from "./AddonAPIKit";
import { APIServerError } from "./Errors/APIServerError";

export class AddonAPICaller {
    #name;
    #version;
    #validEndpointCache = [];

    constructor(name, version) {
        this.#name = name;
        this.#version = version;
    }

    async call(endpoint, parameterMapModel, parameterMap, returnDataModel) {
        await this.#tryPopulateEndpointCache(endpoint);
        if (this.#endpointExists(endpoint))
            return this.#callDirect(endpoint, parameterMapModel, parameterMap, returnDataModel);
        else
            throw new APIEndpointNotFoundError(endpoint);
    }

    async #tryPopulateEndpointCache(endpoint) {
        if (this.#validEndpointCache.length === 0) {
            const endpointBase = endpoint.split(':')[0];
            const validEndpoints = await this.#callDirect(endpointBase + ":endpoints", VoidModel, void 0, EndpointsModel);
            this.#validEndpointCache.push(...validEndpoints);
        }
    }

    async #callDirect(endpoint, parameterMapModel, parameterMap, returnDataModel) {
        const parameterPacket = { apiVersion: this.#version, parameterMap: parameterMap };
        const parameterModel = this.#resolveParameterModel(parameterMapModel);
        const returnModel = this.#resolveReturnModel(returnDataModel);
        console.info(`Sending to ${endpoint}: ${JSON.stringify(parameterPacket)}`);
        const returnPacket = await IPC.invoke(endpoint, parameterModel, parameterPacket, returnModel);
        console.info(`Received from ${endpoint}: ${JSON.stringify(returnPacket)}`);
        return this.#unwrapReturnPacket(returnPacket);
    }

    #endpointExists(endpoint) {
        return this.#validEndpointCache.includes(endpoint);
    }

    #resolveParameterModel(parameterMapModel) {
        return PROTO.Object({ ...CallModelShell, parameterMap: parameterMapModel });
    }

    #resolveReturnModel(returnDataModel) {
        return PROTO.Object({ ...ReturnModelShell, data: PROTO.Optional(returnDataModel) });
    }

    #unwrapReturnPacket(packet) {
        const { data, error } = packet;
        if (error.code === APIErrorEnum.Success)
            return data;
        else
            this.#throwAPIError(packet.error);
    }

    #throwAPIError(errorData) {
        switch(errorData.code) {
            case APIErrorEnum.Caller:
                throw new APICallerError(errorData);
            case APIErrorEnum.Server:
                throw new APIServerError(errorData);
            case APIErrorEnum.Unknown:
            default:
                throw new Error(errorData.message);
        }
    }
}