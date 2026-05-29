export class APIEndpointNotFoundError extends Error {
    constructor(endpoint) {
        super(`Endpoint "${endpoint}" was not found.`);
        this.name = 'APIEndpointNotFoundError';
    }
}