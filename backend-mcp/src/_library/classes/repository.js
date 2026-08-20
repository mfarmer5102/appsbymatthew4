// A repository owns the SQL for one part of the star schema; tools own the MCP-facing
// shape. Apart, two tools can share one query.
export class Repository {
    constructor(database) {
        if (!database) {
            throw new Error(`${new.target.name} requires a database.`);
        }

        this.database = database;
    }

    get schema() {
        return this.database.schema;
    }

    async query(text, params = []) {
        return await this.database.query(text, params);
    }
}
