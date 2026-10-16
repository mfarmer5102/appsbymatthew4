// What a model sees of an application: names rather than surrogate keys, and none of
// the admin-only columns (image file, timestamps). The REST routes return full rows for
// the site; the MCP tools pass theirs through this so the model reads less.
export const to_model_application = (row) => ({
    title: row.title,
    description: row.description,
    publish_date: row.publish_date,
    deployed_url: row.deployed_url,
    is_featured: row.is_featured,
    support_status: row.support_status,
    skills: row.skills,
    repository_urls: row.repository_urls,
});
