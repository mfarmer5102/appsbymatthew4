import { do_send_message } from '../data/chat.js';
import { StandardizedResponseObject } from '../_library/classes/responses.js';

export const send_message = async (req_objx) => {
    return new StandardizedResponseObject(
        200,
        await do_send_message(req_objx),
        null
    )
}
