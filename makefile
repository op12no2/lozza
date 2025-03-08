
SRC = lozza.macro
TGT = lozza.js


$(TGT): $(SRC)
	cpp -P $(SRC) -o $(TGT)
clean:
	rm -f $(TGT)
