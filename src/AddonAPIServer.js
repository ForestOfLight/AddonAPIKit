import { IPC, PROTO } from "./MCBE-IPC/ipc";
import { APICallerError } from "./Errors/APICallerError";
import { APIErrorEnum } from "./Errors/APIErrorEnum";
import { APIServerError } from "./Errors/APIServerError";
import { APIVersionMismatchError } from "./Errors/APIVersionMismatchError";
import { CallModelShell, ReturnModelShell } from "./APIModels";
import { EndpointsController } from "./EndpointsController";

export class AddonAPIServer {
    #name;
    #version;
    #allEndpoints = [];

    constructor(name, version) {
        this.#name = name;
        this.#version = version;
        const endpointsController = new EndpointsController(this);
        this.setupController(endpointsController);
    }

    get name() {
        return this.#name;
    }

    get version() {
        return this.#version;
    }

    get endpointBase() {
        return this.#name + ':';
    }

    get endpoints() {
        return this.#allEndpoints;
    }

    setupController(apiController) {
        for (const [endpoint, features] of Object.entries(apiController.endpoints)) {
            const {callback, parameterModel, returnModel} = features;
            const boundCallback = callback.bind(apiController);
            this.#setupEndpoint(endpoint, boundCallback, parameterModel, returnModel);
        }
    }

    #setupEndpoint(endpoint, callback, parameterModel, returnDataModel) {
        const callPacketModel = this.#resolveCallModel(parameterModel);
        const returnPacketModel = this.#resolveReturnModel(returnDataModel);
        const endpointPath = this.endpointBase + endpoint;
        IPC.handle(endpointPath, callPacketModel, returnPacketModel, (callPacket) => {
            console.info(`Received at ${endpointPath}: ${JSON.stringify(callPacket)}`);
            const apiVersion = callPacket.apiVersion;
            const parameters = this.#resolveParameters(callPacket);
            const returnPacket = this.#handleCallback(apiVersion, callback, parameters);
            console.info(`Replying ${JSON.stringify(returnPacket)}`);
            return returnPacket;
        });
        this.#allEndpoints.push(endpointPath);
    }

    #handleCallback(apiVersion, callback, parameters) {
        try {
            this.#assertVersionsMatch(apiVersion);
            const returnValue = callback(...parameters);
            return this.#bundleReturnPacket({ code: APIErrorEnum.Success }, returnValue);
        } catch(error) {
            if (error instanceof APICallerError) {
                const errorPacket = this.#resolveErrorPacket(error);
                return this.#bundleReturnPacket(errorPacket);
            }
            console.error(error, error.stack);
            const apiError = new APIServerError(error);
            const errorPacket = this.#resolveErrorPacket(apiError);
            return this.#bundleReturnPacket(errorPacket);
        }
    }

    #assertVersionsMatch(versionToCheck) {
        if (versionToCheck !== this.version) {
            const apiVersionMismatchError = new APIVersionMismatchError(this.version, versionToCheck);
            throw new APICallerError(apiVersionMismatchError);
        }
    }

    #resolveCallModel(parameterModel) {
        return PROTO.Object({ ...CallModelShell, parameterMap: parameterModel });
    }

    #resolveReturnModel(returnDataModel) {
        return PROTO.Object({ ...ReturnModelShell, data: PROTO.Optional(returnDataModel) });
    }

    #resolveParameters(callPacket) {
        if (callPacket.parameterMap === void 0)
            return [];
        return Object.values(callPacket.parameterMap);
    }

    #bundleReturnPacket(errorPacket, returnValue = void 0) {
        return { 
            apiVersion: this.version,
            data: returnValue,
            error: errorPacket
        };
    }

    #resolveErrorPacket(error) {
        return {
            code: error.errorCode,
            name: error.thrownError.name,
            message: error.thrownError.message
        };
    }
}