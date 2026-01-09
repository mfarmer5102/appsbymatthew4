import {skill_types_coll} from '../configuration/mongo.js';

export const do_get_many = async (req_objx) => {
    const limit = req_objx.get_state("limit") || 50;
    const offset = req_objx.get_state("offset") || 0;

    let findObj = {};

    let options = {
        projection: {
            _id: 0,
            embeddings: 0
        }
    }

    const skillTypes = await skill_types_coll.ref
        .find(findObj, options)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({ label: 1 })
        .toArray();

    const total = await skill_types_coll.ref.countDocuments(findObj);

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

// export const do_get_one = async (req_objx) => {
//     let findObj = {}
//     let options = {
//         projection: {
//             _id: 0,
//             embeddings: 0
//         }
//     }
//     return await skill_types_coll.ref.findOne(findObj, options);
// }

// export function do_create(req_objx) {
//     provided_entry_date = req_objx.get_req_body('entryDate')
//     formatted_entry_date = new Date(provided_entry_date)
//     entries_coll.ref.insert_one({
//         "username": req_objx.get_state("username"),
//         "entry_date": formatted_entry_date,
//         "comments": req_objx.get_req_body('comments'),
//         "created_date": new Date(),
//         "amount": parseFloat(req_objx.get_req_body('amount')),
//         "source_key": req_objx.get_req_body('sourceKey'),
//     })
//     return
// }

// export function do_update(req_objx) {
//     find_obj = {"_id": ObjectId(req_objx.get_req_body("_id"))}
//     update_obj = {"last_edited_date": new Date()}
//     if (req_objx.get_req_body("entryDate") !== null) {
//         update_obj['entry_date'] = new Date(req_objx.get_req_body('entryDate'))
//     }
//     if (req_objx.get_req_body("comments") !== null) {
//         update_obj['comments'] = req_objx.get_req_body("comments")
//     }
//     if (req_objx.get_req_body("amount") !== null) {
//         update_obj['amount'] = parseFloat(req_objx.get_req_body("amount"))
//     }
//     entries_coll.ref.update_one(find_obj, {"$set": update_obj})
//     return
// }

// export function do_delete(req_objx) {
//     find_obj = {"_id": ObjectId(req_objx.get_req_body("_id"))}
//     update_obj = {"deleted_date": new Date()}
//     entries_coll.ref.update_one(find_obj, {"$set": update_obj})
//     return
// }

/*
from datetime import datetime

from bson import ObjectId

from src.configuration.mongo import entries_coll
from src._library.classes.requests import StandardizedRequestObject


def do_get_many(req_objx: StandardizedRequestObject):
    username =  req_objx.get_state("username")
    source_key = req_objx.get_query_string_param("sourceKey")
    page_size = req_objx.get_query_string_param("pageSize")
    sort_column = req_objx.get_query_string_param("sortColumn")
    sort_direction = req_objx.get_query_string_param("sortDirection")

    find_obj = {
        "username": username,
        "source_key": source_key,
        "deleted_date": None
    }
    sort_obj = {
        sort_column: int(sort_direction)
    }

    results = list(entries_coll.ref.find(find_obj).sort(sort_obj))

    for item in results:
        # Extract
        id = item.get('_id')
        user_id = item.get('user_id')
        source_id = item.get('source_id')
        amount = item.get('amount')
        entry_date = item.get('entry_date')
        created_date = item.get('created_date')
        last_edited_date = item.get('last_edited_date')
        # Format
        if id is not None: item['_id'] = str(id)
        if user_id is not None: item['user_id'] = str(user_id)
        if source_id is not None: item['source_id'] = str(source_id)
        if amount is not None: item['amount'] = float(str(amount))
        if entry_date is not None: item['entry_date'] = entry_date.isoformat()
        if created_date is not None: item['created_date'] = created_date.isoformat()
        if last_edited_date is not None: item['last_edited_date'] = last_edited_date.isoformat()

    return results

def do_create(req_objx: StandardizedRequestObject):
    provided_entry_date = req_objx.get_req_body('entryDate')
    print('provided entry date', provided_entry_date)
    formatted_entry_date = datetime.strptime(provided_entry_date, '%Y-%m-%d')
    entries_coll.ref.insert_one({
        "username": req_objx.get_state("username"),
        "entry_date": datetime.strptime(req_objx.get_req_body('entryDate'), '%Y-%m-%d'),
        "comments": req_objx.get_req_body('comments'),
        "created_date": datetime.now(),
        "amount": float(req_objx.get_req_body('amount')),
        "source_key": req_objx.get_req_body('sourceKey'),
    })
    return

def do_update(req_objx: StandardizedRequestObject):
    find_obj = {"_id": ObjectId(req_objx.get_req_body("_id"))}
    update_obj = {"last_edited_date": datetime.now()}
    if req_objx.get_req_body("entryDate") is not None:
        update_obj['entry_date'] = datetime.strptime(req_objx.get_req_body('entryDate'), '%Y-%m-%d'),
    if req_objx.get_req_body("comments") is not None: update_obj['comments'] = req_objx.get_req_body("comments")
    if req_objx.get_req_body("amount") is not None: update_obj['amount'] = float(req_objx.get_req_body("amount"))
    entries_coll.ref.update_one(find_obj, {"$set": update_obj})
    return

def do_delete(req_objx: StandardizedRequestObject):
    find_obj = {"_id": ObjectId(req_objx.get_req_body("_id"))}
    update_obj = {"deleted_date": datetime.now()}
    entries_coll.ref.update_one(find_obj, {"$set": update_obj})
    return
*/