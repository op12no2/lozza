SHEBANG = #!/usr/bin/node
EXE = lozzaexe.js

.PHONY: all clean

all: $(EXE)

$(EXE): lozza.js
\t@echo "$(SHEBANG)" > $(EXE)
\t@cat lozza.js >> $(EXE)
\t@chmod +x $(EXE)

clean:
\trm -f $(EXE)

