
NODE := $(shell which node)
EXE = lozzaexe

.PHONY:	all clean

all: $(EXE)

$(EXE):	lozza.js
	@echo "#!$(NODE)" > $(EXE)
	@cat lozza.js >> $(EXE)
	@chmod +x $(EXE)

clean:
	rm -f $(EXE)

