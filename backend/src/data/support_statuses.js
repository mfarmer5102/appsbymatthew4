import {support_statuses_coll} from '../configuration/mongo.js';

export const do_get_many = async (req_objx) => {
    const label = req_objx.get_query_string_param("label");
    const code = req_objx.get_query_string_param("code");
    const limit = req_objx.get_query_string_param("limit") || 50;
    const offset = req_objx.get_query_string_param("offset") || 0;

    let findObj = {deleted_at: null};
    if (label) findObj.label = label;
    if (code) findObj.code = code;

    let options = {
        projection: {
            _id: 0,
            embeddings: 0
        }
    }

    const skillTypes = await support_statuses_coll.ref
        .find(findObj, options)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({ code: 1 })
        .toArray();

    const total = await support_statuses_coll.ref.countDocuments(findObj);

    return {
        data: skillTypes,
        pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: (Number(offset) + skillTypes.length) < total
        }
    };
}

export const do_create = async (req_objx) => {
    const label = req_objx.get_req_body("label");
    const code = req_objx.get_req_body("code");

    const insertObj = {
        label,
        code,
        created_at: new Date()
    }
    return await support_statuses_coll.ref.insertOne(insertObj)
}

export const do_update = async (req_objx) => {
    const label = req_objx.get_req_body("label");
    const code = req_objx.get_req_body("code");

    const filterObj = {
        code,
    }
    const updateObj = {
        $set: {
            label,
            code,
            updated_at: new Date(),
        }
    }
    const options = {
        upsert: false,
    }

    return await support_statuses_coll.ref.updateOne(filterObj, updateObj, options)
}

export const do_delete = async (req_objx) => {
    const code = req_objx.get_req_body("code");

    const filterObj = {
        code,
    }
    const updateObj = {
        $set: {
            updated_at: new Date(),
            deleted_at: new Date(),
        }
    }
    const options = {
        upsert: false,
    }

    return await support_statuses_coll.ref.updateOne(filterObj, updateObj, options)
}