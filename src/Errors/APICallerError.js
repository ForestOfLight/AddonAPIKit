import { APIErrorEnum } from "./APIErrorEnum";

export class APICallerError extends Error {
    constructor(error) {
        const message = error.name + ': ' + error.message;
        super(message);
        this.thrownError = error;
        this.errorCode = APIErrorEnum.Caller;
        this.name = "APICallerError";
    }
}