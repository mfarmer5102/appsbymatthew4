class StandardizedResponseObject {
    constructor(status_code, res_body, error=None) {
        this.status_code = status_code;
        this.res_body = res_body;
        this.error = error;
    }
}

/*
 class StandardizedResponseObject:
     def __init__(self, status_code, res_body, error=None):
         self.status_code = status_code
         self.res_body = res_body
         self.error = error
*/