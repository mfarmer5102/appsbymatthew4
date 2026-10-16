// Who may call the API from a browser. The site's own origins always; locally, any
// localhost port, since the Vite dev server (2020) and the Inspector pick their own.
export const SITE_ORIGIN = /^https:\/\/(www\.)?appsbymatthew\.com$/;

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const is_web_function = Boolean(process.env.AWS_LAMBDA_HTTP_ENDPOINT);

export const cors_options = {
    origin: (origin, callback) => {
        const allowed =
            !origin || // not a browser request, so CORS does not apply
            SITE_ORIGIN.test(origin) ||
            (!is_web_function && LOCAL_ORIGIN.test(origin)) ||
            origin === process.env.FRONTEND_URL;

        callback(null, allowed);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    // Authorization carries the admin code on write requests.
    allowedHeaders: ['Content-Type', 'Authorization'],
};
