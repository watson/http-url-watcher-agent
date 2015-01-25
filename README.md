# http-url-watcher-agent

This is an agent which will watch a list of http urls and email you when
they change.

The agent checks the list of URL's every 10 minutes. If a URL have
changed since the last check it will send an email to all recipients.

## Disclamer

This project is alpha and WIP and will most likely be split up into
several reusable node modules. For now it's not on NPM and just one big
pile of code.

## Dependencies

This project expects that you have the following set up:

- A MongoDB database - configurable using environment variable `MONGO_URI`
- A SendGrid account - configurable using the two environment variables `SENDGRID_USERNAME` and `SENDGRID_PASSWORD`
- An Opbeat account - configurable using the three environment variables `OPBEAT_ORGANIZATION_ID`, `OPBEAT_APP_ID` and `OPBEAT_SECRET_TOKEN` (currently only logs if `NODE_ENV` is set to `production`)

## Configuration

Besides the environment variables mentioned above, you need to create a
collection in the Mongo database called `config`. In that collection you
should create a single document:

Example

```js
{
  sites: [
    {
      url: 'http://en.wikipedia.org/wiki/Web_crawler', // the full url to crawl
      query: '#content'                                // a css query used to extract the main HTML content that should be diffed
    }
  ],
  notify: [ 'bob@xample.com', 'alice@example.com ],    // a list of report recipients
  from: 'noreply@example.com'                          // the report from address
}
```

## License

MIT
