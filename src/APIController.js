export class APIController {
    #endpoints = {};
    
    constructor() {
        if (this.constructor === APIController)
            throw new Error("Cannot instantiate abstract class 'APIController'");
    }

    get endpoints() {
        return this.#endpoints;
    }

    addEndpoint(endpoint, callback, parameterModel, returnModel) {
        this.#endpoints[endpoint] = { callback, parameterModel, returnModel };
    }
}