# http-url-watcher-agent

This is an agent which will watch a list of http urls and email you when
they change.

Every minute the agent checks a job list if any crawl are due to run. If
due, the URL will be crawled and compared against the last known version
of the content. If changed, the agent will send out emails to all who
have subscribed.

## Disclamer

This project is alpha and WIP and will most likely be split up into
several reusable node modules. For now it's not on NPM and just one big
pile of code.

## Setup

Set the following required environment variables:

- `SENDGRID_USERNAME`
- `SENDGRID_PASSWORD`

Set the following optional environment variables:

- `MONGO_URI` - defaults to `localhost/http-url-watcher-agent`
- `SENDGRID_FROM` - defaults to the recipients own email
- `OPBEAT_ORGANIZATION_ID` - Opbeat will be disabled if not set
- `OPBEAT_APP_ID` - Opbeat will be disabled if not set
- `OPBEAT_SECRET_TOKEN` - Opbeat will be disabled if not set

## Jobs

To create a job, add a document to the `jobs` collection in MongoDB. The
document should follow this schema:

```js
{
  notify: [ 'bob@example.com', ... ], // an array of emails that should be notified upon changes
  url: 'http://example.com',          // the full url to crawl
  query: '#content',                  // (optional) a css query used to extract the main HTML content that should be diffed
  interval: 10                        // (optional) number of minutes between each crawl (defaults to 60, minimum 10)
}
```

If the URL isn't for an HTML document, the query property shouldn't be
specified.

## License

MIT
