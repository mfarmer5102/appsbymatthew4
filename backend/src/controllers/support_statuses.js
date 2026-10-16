import {do_get_many, do_create, do_update, do_delete} from '../data/support_statuses.js';

// Express 5 forwards a rejected promise to the error handler in app.js, so none of
// these needs its own try/catch.

export const get_many = async (req, res) => {
    res.status(200).json(await do_get_many({query: req.query}));
};

export const create = async (req, res) => {
    res.status(201).json(await do_create({body: req.body}));
};

export const update = async (req, res) => {
    res.status(200).json(await do_update({body: req.body}));
};

export const delete_one = async (req, res) => {
    res.status(200).json(await do_delete({body: req.body}));
};
