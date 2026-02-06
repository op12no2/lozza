cat \
  src/a_glob.js \
  src/data.js \
  src/nodes.js \
  src/board.js \
  src/makemove.js \
  src/movegen.js \
  src/perft.js \
  src/search.js \
  src/uci.js \
  src/main.js > lozza.js
  
node lozza uci # check syntax
