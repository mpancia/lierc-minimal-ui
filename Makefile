vendor = $(wildcard static/js/vendor/*)
site = $(wildcard static/js/lierc/*)
css = $(wildcard static/css/*)
map = static/site.map.js

all: index.html.br static/site.js static/site.css static/site.map.js

index.html.br index.html.gz: index.html
	cat index.html | bro > index.html.br
	gzip -c -k index.html > index.html.gz

static/site.map.js static/site.js: $(vendor) $(site)
	uglifyjs \
		--source-map /tmp/site.map.js \
		--source-map-url /$(map) \
		--prefix 1 \
		$(vendor) $(site) > /tmp/site.js
	install /tmp/site.js static/site.js
	cat static/site.js | bro > static/site.js.br
	gzip -c -k static/site.js > static/site.js.gz
	install /tmp/site.map.js static/site.map.js
	cat static/site.map.js | bro > static/site.map.js.br
	gzip -c -k static/site.map.js > static/site.map.js.gz

static/site.css: $(css)
	cat $(css) > /tmp/site.css
	install /tmp/site.css static/site.css
	cat static/site.css | bro > static/site.css.br
	gzip -c -k static/site.css > static/site.css.gz

.PHONY: watch
watch:
	bin/watch --exec make --dir . --ignore .gz --ignore .br --ignore .map.js
