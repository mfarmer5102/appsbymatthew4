import { do_send_message, do_get_chat_history } from '../data/chat.js';
import { StandardizedResponseObject } from '../_library/classes/responses.js';

export const send_message = async (req_objx) => {
    return new StandardizedResponseObject(
        200,
        await do_send_message(req_objx),
        null
    )
}

export const get_chat_history = async (req_objx) => {
    return new StandardizedResponseObject(
        200,
        await do_get_chat_history(req_objx),
        null
    )
}
