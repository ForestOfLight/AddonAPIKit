export class APIController {
    #endpoints = {};

    get endpoints() {
        return this.#endpoints;
    }

    addEndpoint(endpoint, callback, parameterModel, returnModel) {
        this.#endpoints[endpoint] = { callback, parameterModel, returnModel };
    }
}