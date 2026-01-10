export class StandardizedResponseObject {
    constructor(status_code, res_body, error=null) {
        this.status_code = status_code;
        this.res_body = res_body;
        this.error = error;
    }
}