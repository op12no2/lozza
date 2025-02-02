
NODE := $(shell which node)
EXE = lozzaexe
SRC = lozza.js

.PHONY: all clean

all: $(EXE)

$(EXE): $(SRC)
	@if [ -z "$(NODE)" ]; then \
		echo "Node not found; see https://github.com/op12no2/lozza/blob/master/doc/openbench.md"; \
		exit 1; \
	fi
	@echo "#!$(NODE)" > $(EXE)
	@cat $(SRC) >> $(EXE)
	@chmod +x $(EXE)

clean:
	rm -f $(EXE)
	rm cctry.log
	rm xloz*
	rm cctry.pgn
