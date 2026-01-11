import {skills_coll} from '../configuration/mongo.js';

export const do_get_many = async (req_objx) => {
    const name = req_objx.get_query_string_param("name");
    const code = req_objx.get_query_string_param("code");
    const skill_type_code = req_objx.get_query_string_param("skill_type");
    const is_visible_in_app_details = req_objx.get_query_string_param("visible");
    const is_proficient = req_objx.get_query_string_param("proficient");

    const sort_field = req_objx.get_query_string_param("sort") || 'code';
    const sort_order = req_objx.get_query_string_param("order") || 'asc';
    const sort_order_numeric = sort_order === 'asc' ? 1 : -1;
    const limit = req_objx.get_query_string_param("limit") || 50;
    const offset = req_objx.get_query_string_param("offset") || 0;

    let findObj = {};
    if (name) findObj.name = name;
    if (code) findObj.code = code;
    if (skill_type_code) findObj.skill_type_code = skill_type_code;
    if (is_visible_in_app_details !== undefined) {
        findObj.is_visible_in_app_details = is_visible_in_app_details === 'true';
    }
    if (is_proficient !== undefined) {
        findObj.is_proficient = is_proficient === 'true';
    }

    let options = {
        projection: {
            _id: 0,
            embeddings: 0
        }
    }

    let sortObj = {[sort_field]: sort_order_numeric};

    const skills = await skills_coll.ref
        .find(findObj, options)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort(sortObj)
        .toArray();

    const total = await skills_coll.ref.countDocuments(findObj);

    return {
        data: skills,
        pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: (Number(offset) + skills.length) < total
        }
    };
}

export const do_create = async (req_objx) => {
    const name = req_objx.get_req_body("name");
    const code = req_objx.get_req_body("code");
    const skill_type_code = req_objx.get_req_body("skill_type_code");
    const is_visible_in_app_details = req_objx.get_req_body("is_visible_in_app_details");
    const is_proficient = req_objx.get_req_body("is_proficient");

    const insertObj = {
        name,
        code,
        skill_type_code,
        is_visible_in_app_details,
        is_proficient,
        created_at: new Date()
    }
    return await skills_coll.ref.insertOne(insertObj)
}

export const do_update = async (req_objx) => {
    const name = req_objx.get_req_body("name");
    const code = req_objx.get_req_body("code");
    const skill_type_code = req_objx.get_req_body("skill_type_code");
    const is_visible_in_app_details = req_objx.get_req_body("is_visible_in_app_details");
    const is_proficient = req_objx.get_req_body("is_proficient");

    const filterObj = {
        code,
    }
    const updateObj = {
        $set: {
            name,
            code,
            skill_type_code,
            is_visible_in_app_details,
            is_proficient,
            updated_at: new Date(),
        }
    }
    const options = {
        upsert: false,
    }

    return await skills_coll.ref.updateOne(filterObj, updateObj, options)
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

    return await skills_coll.ref.updateOne(filterObj, updateObj, options)
}