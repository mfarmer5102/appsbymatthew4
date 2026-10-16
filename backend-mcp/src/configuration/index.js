// The running server's Container, built on first use rather than at import. In AWS,
// building it means a Secrets Manager call, and a Web Function must be listening
// within 10 seconds of starting - so index.js listens first and warms this after.
// Tests construct their own Container.
import {Container} from './container.js';
import {resolve_secrets} from './secrets.js';

export {Container};

let pending = null;

// Concurrent first requests share one build. A failed build is forgotten, so the next
// request retries rather than replaying the same rejection for the environment's life.
export const get_container = () => {
    pending ??= resolve_secrets()
        .then((secrets) => new Container({secrets}))
        .catch((error) => {
            pending = null;
            throw error;
        });

    return pending;
};

// For shutdown: closes the Container only if one was ever built.
export const close_container = async () => {
    const container = await pending?.catch(() => null);
    await container?.close();
};
