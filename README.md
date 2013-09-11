# Eisago-web

Next-gen Clojuredocs web app. A work in progress.

## Getting started
This app uses [ElasticSearch](http://www.elasticsearch.org/) as the database.
To set it up and populate it with documents, follow the instructions from the
[Eisago API](https://github.com/clojuredocs/web) project. Pregenerated docs
for Clojure 1.5.1 are available as `clojure-1.5.1.json.gz` in the `/resources` directory.

Then, start elasticsearch:

    $ elasticsearch -f

And to start a web server for the application, run:

    $ lein ring server