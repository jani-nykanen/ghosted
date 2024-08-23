JS_FILES := $(wildcard js/*.js) $(wildcard js/*/*.js) $(wildcard js/*/*/*.js)

LEVEL_SRC_PATH := src/game/leveldata.ts


###########################


all: js


.PHONY: js
js:
	tsc

watch:
	tsc -w

server:
	python3 -m http.server


linecount:
	find . -name '*.ts' | xargs wc -l
	
###########################


.PHONY: closure
closure:
	rm -rf ./temp
	mkdir -p temp
	java -jar $(CLOSURE_PATH) --js $(JS_FILES) --js_output_file temp/out.js --compilation_level ADVANCED_OPTIMIZATIONS --language_out ECMASCRIPT_2020


compress: js closure


.PHONY: pack
pack:
	mkdir -p temp
	cp templates/index.html temp/index.html
	cp f.png temp/f.png
	cp g.png temp/g.png

.PHONY: zip
zip: 
	(cd temp; zip -r ../dist.zip .)
	advzip -z dist.zip
	wc -c dist.zip

.PHONY: clear_temp
clear_temp:
	rm -rf ./temp 


.PHONY: dist 
dist: compress pack zip clear_temp


###########################


.PHONY: levels
levels:
	echo -n "export const LEVEL_DATA = " > $(LEVEL_SRC_PATH)
	./levels/convert.py >> $(LEVEL_SRC_PATH)


###########################
