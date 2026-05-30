import { system } from "@minecraft/server";
import { IPC, PROTO } from "./MCBE-IPC/ipc";
import { VoidModel } from "./APIModels";
import { APIEndpointNotFoundError } from "./Errors/APIEndpointNotFoundError";

export class AddonAPICaller {
    static #validEndpointCache = [];

    static async call(endpoint, parameterModel, parameterMap, returnDataModel) {
        if (this.#validEndpointCache.length === 0) {
            const endpointBase = endpoint.split(':')[0];
            await this.#populateValidEndpointCache(endpointBase);
        }
        if (this.#validEndpointCache.includes(endpoint))
            // Unwrap the packet so that this returns juse the return values of the functions.
            // How should error states be handled? They're just thrown, I think? Use the Error classes to show verbose strings.
            return await IPC.invoke(endpoint, parameterModel, parameterMap, returnDataModel).then(result => result.value);
        else
            throw new APIEndpointNotFoundError(endpoint);
    }

    static async #populateValidEndpointCache(endpointBase) {
        const endpointsEndpoint = endpointBase + ':endpoints';
        const validEndpoints = await IPC.invoke(endpointsEndpoint, VoidModel, void 0, PROTO.Boolean);
        this.#validEndpointCache.push(...validEndpoints);
    }
}