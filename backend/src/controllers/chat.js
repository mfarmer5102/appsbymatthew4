import {do_send_message} from '../data/chat.js';

// The caller's IP and user agent come from attach_client, for the chat log.
export const send_message = async (req, res) => {
    res.status(200).json(await do_send_message({body: req.body, client: res.locals.client}));
};
