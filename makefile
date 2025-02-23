
NODE := $(shell which node)
EXE = lozzaexe
SRC = lozza.js

.PHONY: all clean

all: $(EXE)

$(EXE): $(SRC)
	@if [ -z "$(NODE)" ]; then \
		echo "Node not found"; \
		exit 1; \
	fi
	@echo "#!$(NODE)" > $(EXE)
	@cat $(SRC) >> $(EXE)
	@chmod +x $(EXE)

clean:
	rm -f $(EXE)




