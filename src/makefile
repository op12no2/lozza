NODE := $(shell which -a node | while read path; do ver=$$($$path --version 2>/dev/null || echo "v0.0.0"); echo "$$ver $$path"; done | sort -Vr | head -n 1 | awk '{print $$2}')
EXE = lozzaexe
SRC = lozza.js

.PHONY: all clean

all: $(EXE)

$(EXE): $(SRC)
	@if [ -z "$(NODE)" ]; then \
		echo "Error: No valid Node.js installation found."; \
		exit 1; \
	fi
	@echo "#!$(NODE)" > $(EXE)
	@cat $(SRC) >> $(EXE)
	@chmod +x $(EXE)

clean:
	rm -f $(EXE)
