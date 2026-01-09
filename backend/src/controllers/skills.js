import {do_get_many, do_create, do_update, do_delete} from '../data/skills.js';
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

/*
from src.data.entries import *
from src._library.classes.responses import StandardizedResponseObject
from src._library.classes.requests import StandardizedRequestObject


def get_many(req_objx: StandardizedRequestObject) -> StandardizedResponseObject:
    return StandardizedResponseObject(
        status_code=200,
        res_body=do_get_many(req_objx),
        error=None
    )

def create(req_objx: StandardizedRequestObject) -> StandardizedResponseObject:
    return StandardizedResponseObject(
        status_code=201,
        res_body=do_create(req_objx),
        error=None
    )

def update(req_objx: StandardizedRequestObject) -> StandardizedResponseObject:
    return StandardizedResponseObject(
        status_code=200,
        res_body=do_update(req_objx),
        error=None
    )


def delete(req_objx: StandardizedRequestObject) -> StandardizedResponseObject:
    return StandardizedResponseObject(
        status_code=200,
        res_body=do_delete(req_objx),
        error=None
    )
*/