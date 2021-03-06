const { Pool } = require("pg");
const pool = new Pool({
    connectionString: process.env.LIGHTPOLL_DB
});

async function initialise () {
    const client = await pool.connect();
    try {
        const createUsers = "CREATE TABLE IF NOT EXISTS users \
            (id bigserial PRIMARY KEY, \
            username varchar(30) UNIQUE NOT NULL, \
            display varchar(30) UNIQUE NOT NULL, \
            pass_hash text NOT NULL, \
            created timestamp NOT NULL)";
        const createPolls = "CREATE TABLE IF NOT EXISTS polls \
            (id bigserial PRIMARY KEY, \
            name varchar(140) NOT NULL, \
            description varchar(500) NOT NULL, \
            edit_token text NOT NULL, \
            enforce_unique boolean NOT NULL, \
            owner_id bigint REFERENCES users (id) ON DELETE CASCADE, \
            created timestamp NOT NULL, \
            modified timestamp NOT NULL)";
        const createPollOptions = "CREATE TABLE IF NOT EXISTS poll_options \
            (id bigserial PRIMARY KEY, \
            poll_id bigint REFERENCES polls (id) ON DELETE CASCADE NOT NULL, \
            value varchar(140) NOT NULL, \
            created timestamp NOT NULL)";
        const createPollVotes = "CREATE TABLE IF NOT EXISTS poll_votes \
            (id bigserial PRIMARY KEY, \
            poll_id bigint REFERENCES polls (id) ON DELETE CASCADE NOT NULL, \
            poll_option_id bigint REFERENCES poll_options (id) ON DELETE CASCADE NOT NULL, \
            voter_id bigint, \
            voter_ip text, \
            created timestamp NOT NULL)";
        await client.query(createUsers);
        await client.query(createPolls);
        await client.query(createPollOptions);
        await client.query(createPollVotes);
        await client.query("COMMIT");
        console.log(`Connected to PostgreSQL.`);
    } catch (e) {
        await client.query("ROLLBACK");
        console.log(e);
    } finally {
        client.release();
    }
}

module.exports = {
    initialise,
    query: (statement, params) => pool.query(statement, params),
    connect: () => pool.connect()
}