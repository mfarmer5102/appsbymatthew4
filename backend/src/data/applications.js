import {applications_coll} from '../configuration/mongo.js';
import {error_config} from "../configuration/errors.js";

export const do_get_many = async (req_objx) => {
    const title = req_objx.get_query_string_param("title");
    const featured = req_objx.get_query_string_param("featured");
    const support_status = req_objx.get_query_string_param("support_status");
    const limit = req_objx.get_query_string_param("limit") || 50;
    const offset = req_objx.get_query_string_param("offset") || 0;

    let findObj = {};
    findObj.deleted_date = null;
    if (title) findObj.title = title;
    if (featured !== undefined) {
        findObj.featured = featured === 'true';
    }
    if (support_status) findObj.support_status_code = support_status;

    let options = {
        projection: {
            _id: 0,
            embeddings: 0
        }
    }

    const applications = await applications_coll.ref
        .find(findObj, options)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({ publish_date: -1 })
        .toArray();

    const total = await applications_coll.ref.countDocuments(findObj);

    return {
        data: applications,
        pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: (Number(offset) + applications.length) < total
        }
    };
}

export const do_create = async (req_objx) => {
    const title = req_objx.get_req_body("title");
    const publish_date = Date.parse(req_objx.get_req_body("publish_date"));
    const associated_skill_codes = req_objx.get_req_body("associated_skill_codes");
    const is_featured = req_objx.get_req_body("is_featured");
    const image_url_relative = req_objx.get_req_body("image_url_relative");
    const deployed_link = req_objx.get_req_body("deployed_link");
    const description = req_objx.get_req_body("description");
    const repositories = req_objx.get_req_body("repositories");
    const support_status_code = req_objx.get_req_body("support_status_code");

    // Make sure an app with this title doesn't already exist
    const matched_title_count = await applications_coll.ref.countDocuments({title});
    if (matched_title_count > 0) throw new Error(error_config.select_error('application_already_exists'));

    const insertObj = {
        title,
        publish_date,
        associated_skill_codes,
        is_featured,
        image_url_relative,
        deployed_link,
        description,
        repositories,
        support_status_code,
        created_at: new Date(),
    }
    return await applications_coll.ref.insertOne(insertObj)
}

export const do_update = async (req_objx) => {
    const title = req_objx.get_req_body("title");
    const publish_date = Date.parse(req_objx.get_req_body("publish_date"));
    const associated_skill_codes = req_objx.get_req_body("associated_skill_codes");
    const is_featured = req_objx.get_req_body("is_featured");
    const image_url_relative = req_objx.get_req_body("image_url_relative");
    const deployed_link = req_objx.get_req_body("deployed_link");
    const description = req_objx.get_req_body("description");
    const repositories = req_objx.get_req_body("repositories");
    const support_status_code = req_objx.get_req_body("support_status_code");

    const filterObj = {
        title,
    }
    const updateObj = {
        $set: {
            title,
            publish_date,
            associated_skill_codes,
            is_featured,
            image_url_relative,
            deployed_link,
            description,
            repositories,
            support_status_code,
            updated_at: new Date(),
        }
    }
    const options = {
        upsert: false,
    }

    return await applications_coll.ref.updateOne(filterObj, updateObj, options)
}

export const do_delete = async (req_objx) => {
    const title = req_objx.get_req_body("title");

    const filterObj = {
        title,
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

    return await applications_coll.ref.updateOne(filterObj, updateObj, options)
}