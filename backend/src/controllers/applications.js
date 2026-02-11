import {do_get_many, do_create, do_update, do_delete, do_vectorize} from '../data/applications.js';
import { StandardizedResponseObject } from '../_library/classes/responses.js';

export const get_many = async (req_objx) => {
    return new StandardizedResponseObject(
        200,
        await do_get_many(req_objx),
        null
    )
}

export const create = async (req_objx) => {
    return new StandardizedResponseObject(
        201,
        await do_create(req_objx),
        null
    )
}

export const update = async (req_objx) => {
    return new StandardizedResponseObject(
        200,
        await do_update(req_objx),
        null
    )
}

export const delete_one = async (req_objx) => {
    return new StandardizedResponseObject(
        200,
        await do_delete(req_objx),
        null
    )
}

export const vectorize = async (req_objx) => {
    return new StandardizedResponseObject(
        200,
        await do_vectorize(req_objx),
        null
    )
}