import { system } from "@minecraft/server";
import { IPC, PROTO } from "./MCBE-IPC/ipc";
import { VoidModel } from "./APIModels";
import { APIEndpointNotFoundError } from "./Errors/APIEndpointNotFoundError";
import { APICallerError, APIErrorEnum } from "./AddonAPIKit";
import { APIServerError } from "./Errors/APIServerError";

export class AddonAPICaller {
    static #validEndpointCache = [];

    static async call(endpoint, parameterModel, parameterMap, returnDataModel) {
        await AddonAPICaller.#tryPopulateEndpointCache(endpoint);
        if (AddonAPICaller.#endpointExists(endpoint)) {
            const response = await IPC.invoke(endpoint, parameterModel, parameterMap, returnDataModel).then(result => result.value);
            return AddonAPICaller.#unwrapPacket(response);
        } else {
            throw new APIEndpointNotFoundError(endpoint);
        }
    }

    static async #tryPopulateEndpointCache(endpoint) {
        if (AddonAPICaller.#validEndpointCache.length === 0) {
            const endpointBase = endpoint.split(':')[0];
            await AddonAPICaller.#populateValidEndpointCache(endpointBase);
        }
    }

    static #endpointExists(endpoint) {
        return AddonAPICaller.#validEndpointCache.includes(endpoint);
    }

    static async #populateValidEndpointCache(endpointBase) {
        const endpointsEndpoint = endpointBase + ':endpoints';
        const validEndpoints = await IPC.invoke(endpointsEndpoint, VoidModel, void 0, PROTO.Boolean);
        AddonAPICaller.#validEndpointCache.push(...validEndpoints);
    }

    static #unwrapPacket(packet) {
        const { data, error } = packet;
        if (error.code === APIErrorEnum.Success)
            return data;
        else
            AddonAPICaller.#throwAPIError(packet.error);
    }

    static #throwAPIError(errorData) {
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