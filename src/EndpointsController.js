import { APIController } from "./APIController";
import { EndpointModel, EndpointsModel, VoidModel } from "./APIModels";
import { PROTO } from "./MCBE-IPC/ipc";

export class EndpointsController extends APIController {
    #api;

    constructor(api) {
        this.#api = api;
        this.addEndpoint("endpoints", this.getEndpoints, VoidModel, EndpointsModel);
        this.addEndpoint("endpoints:has", this.hasEndpoint, EndpointModel, PROTO.Boolean);
    }

    getEndpoints() {
        return this.#api.endpoints;
    }

    hasEndpoint(endpoint) {
        return this.getEndpoints().includes(endpoint);
    }
}
