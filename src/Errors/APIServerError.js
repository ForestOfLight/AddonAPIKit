import { APIErrorEnum } from "./APIErrorEnum";

export class APIServerError extends Error {
    constructor(error) {
        const message = error.name + ': ' + error.message;
        super(message);
        this.thrownError = error;
        this.errorCode = APIErrorEnum.Server;
        this.name = "APIServerError";
    }
}