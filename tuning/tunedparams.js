
{{{  tuned params 2.1 xray

// data=c:/projects/chessdata/quiet-labeled.epd
// useEval=1
// k=1.61
// err=0.05570027000606033
// last update Tue Sep 21 2021 13:00:38 GMT+0100 (British Summer Time)

const VALUE_VECTOR   = [0,100,347,351,536,1046,10000];
const WPAWN_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-15,-5,0,5,5,0,-5,-15,0,0,0,0,48,104,62,94,96,87,36,-16,0,0,0,0,-5,3,16,13,55,68,33,-12,0,0,0,0,-20,4,-12,10,8,3,5,-35,0,0,0,0,-32,-28,-7,3,1,4,-22,-38,0,0,0,0,-27,-25,-11,-10,-6,5,9,-19,0,0,0,0,-37,-19,-35,-26,-42,8,10,-32,0,0,0,0,-15,-5,0,5,5,0,-5,-15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WPAWN_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,23,28,23,40,10,44,55,0,0,0,0,17,17,11,-3,-12,-8,13,17,0,0,0,0,4,-9,-13,-26,-21,-15,-7,1,0,0,0,0,2,-4,-17,-22,-16,-18,-10,-6,0,0,0,0,-11,-11,-18,-13,-10,-13,-21,-16,0,0,0,0,-3,-12,2,-6,12,-7,-17,-16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WKNIGHT_PSTS   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-162,-87,-45,-44,31,-113,-40,-87,0,0,0,0,-75,-41,63,27,8,55,-7,-27,0,0,0,0,-41,43,24,50,72,96,46,48,0,0,0,0,0,24,6,31,30,70,26,33,0,0,0,0,1,18,16,12,28,24,29,5,0,0,0,0,-15,4,16,32,46,25,36,-6,0,0,0,0,-10,-29,2,14,20,26,17,7,0,0,0,0,-97,-4,-25,-9,21,4,-1,-5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WKNIGHT_PSTE   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-61,-55,-22,-40,-42,-41,-73,-113,0,0,0,0,-39,-22,-37,-12,-23,-41,-40,-70,0,0,0,0,-39,-37,-4,-7,-32,-26,-45,-65,0,0,0,0,-32,-13,9,4,9,-15,-18,-39,0,0,0,0,-32,-27,3,8,2,2,-10,-34,0,0,0,0,-39,-17,-13,-4,-8,-15,-36,-34,0,0,0,0,-56,-33,-22,-20,-20,-32,-41,-65,0,0,0,0,-39,-65,-42,-31,-44,-39,-64,-92,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WBISHOP_PSTS   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-43,-11,-118,-71,-51,-70,-10,-15,0,0,0,0,-28,9,-27,-35,15,14,53,-76,0,0,0,0,-28,34,28,17,14,47,28,-7,0,0,0,0,1,7,10,46,24,19,5,3,0,0,0,0,8,12,11,30,29,2,12,18,0,0,0,0,9,28,25,17,25,39,28,22,0,0,0,0,17,29,21,9,16,30,55,10,0,0,0,0,-14,19,14,10,19,14,-15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WBISHOP_PSTE   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-34,-41,-23,-23,-18,-24,-40,-47,0,0,0,0,-25,-28,-18,-30,-29,-24,-34,-26,0,0,0,0,-16,-31,-27,-29,-28,-32,-27,-19,0,0,0,0,-29,-18,-18,-22,-18,-23,-23,-24,0,0,0,0,-32,-27,-15,-15,-26,-19,-32,-37,0,0,0,0,-33,-28,-21,-22,-19,-30,-31,-37,0,0,0,0,-40,-40,-34,-26,-24,-36,-41,-52,0,0,0,0,-44,-34,-40,-29,-34,-35,-32,-37,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WROOK_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,26,10,29,29,-2,8,23,0,0,0,0,-6,6,25,37,40,39,-13,11,0,0,0,0,-6,2,1,9,-8,17,42,-4,0,0,0,0,-30,-22,1,16,3,16,-24,-32,0,0,0,0,-38,-30,-15,-9,4,-11,2,-33,0,0,0,0,-38,-15,-8,-9,7,-1,-4,-28,0,0,0,0,-32,-11,-7,3,9,10,-6,-59,0,0,0,0,-7,-5,6,14,15,12,-30,-8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WROOK_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,35,28,34,29,32,33,30,27,0,0,0,0,26,22,19,14,3,15,29,23,0,0,0,0,34,34,33,30,27,20,19,21,0,0,0,0,38,32,36,20,22,24,25,34,0,0,0,0,33,34,32,24,13,18,11,23,0,0,0,0,25,22,12,16,6,10,11,11,0,0,0,0,20,14,15,15,6,6,4,23,0,0,0,0,14,19,16,11,8,11,18,-7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WQUEEN_PSTS    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-25,-8,4,0,63,45,53,44,0,0,0,0,-17,-39,-3,11,-25,30,30,46,0,0,0,0,-10,-17,3,-23,18,56,40,49,0,0,0,0,-34,-30,-27,-28,-8,-4,-6,-10,0,0,0,0,-4,-37,-10,-16,-5,-7,-6,-4,0,0,0,0,-19,12,-4,4,7,3,14,6,0,0,0,0,-19,6,19,15,22,28,10,26,0,0,0,0,12,2,9,21,1,-1,-11,-32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WQUEEN_PSTE    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-9,29,33,33,31,26,5,31,0,0,0,0,-15,15,23,33,62,25,17,15,0,0,0,0,-7,18,8,72,58,43,38,19,0,0,0,0,30,32,35,57,64,51,69,57,0,0,0,0,-12,45,26,57,33,39,46,32,0,0,0,0,11,-29,18,4,4,22,22,22,0,0,0,0,-15,-26,-24,-14,-12,-25,-39,-34,0,0,0,0,-37,-35,-24,-33,3,-32,-22,-49,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WKING_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-95,41,25,-10,-91,-72,12,-21,0,0,0,0,40,22,-7,3,-33,9,-6,-61,0,0,0,0,35,29,26,-52,-14,26,58,-11,0,0,0,0,-15,1,-9,-46,-47,-36,-7,-54,0,0,0,0,-32,31,-26,-64,-63,-36,-27,-58,0,0,0,0,14,28,3,-26,-27,-9,22,-7,0,0,0,0,31,59,23,-30,-9,17,52,42,0,0,0,0,1,60,44,-31,40,-9,53,29,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WKING_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-131,-64,-39,-53,-22,-3,-30,-43,0,0,0,0,-35,-13,-4,-2,9,21,2,-1,0,0,0,0,-15,0,-2,5,5,36,27,-4,0,0,0,0,-18,2,9,12,13,21,15,-6,0,0,0,0,-32,-25,4,11,14,9,-5,-19,0,0,0,0,-36,-24,-8,1,3,-3,-14,-26,0,0,0,0,-51,-39,-19,-10,-8,-18,-30,-44,0,0,0,0,-80,-63,-47,-33,-57,-31,-54,-73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BPAWN_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-15,-5,0,5,5,0,-5,-15,0,0,0,0,-37,-19,-35,-26,-42,8,10,-32,0,0,0,0,-27,-25,-11,-10,-6,5,9,-19,0,0,0,0,-32,-28,-7,3,1,4,-22,-38,0,0,0,0,-20,4,-12,10,8,3,5,-35,0,0,0,0,-5,3,16,13,55,68,33,-12,0,0,0,0,48,104,62,94,96,87,36,-16,0,0,0,0,-15,-5,0,5,5,0,-5,-15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BPAWN_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-3,-12,2,-6,12,-7,-17,-16,0,0,0,0,-11,-11,-18,-13,-10,-13,-21,-16,0,0,0,0,2,-4,-17,-22,-16,-18,-10,-6,0,0,0,0,4,-9,-13,-26,-21,-15,-7,1,0,0,0,0,17,17,11,-3,-12,-8,13,17,0,0,0,0,20,23,28,23,40,10,44,55,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BKNIGHT_PSTS   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-97,-4,-25,-9,21,4,-1,-5,0,0,0,0,-10,-29,2,14,20,26,17,7,0,0,0,0,-15,4,16,32,46,25,36,-6,0,0,0,0,1,18,16,12,28,24,29,5,0,0,0,0,0,24,6,31,30,70,26,33,0,0,0,0,-41,43,24,50,72,96,46,48,0,0,0,0,-75,-41,63,27,8,55,-7,-27,0,0,0,0,-162,-87,-45,-44,31,-113,-40,-87,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BKNIGHT_PSTE   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-39,-65,-42,-31,-44,-39,-64,-92,0,0,0,0,-56,-33,-22,-20,-20,-32,-41,-65,0,0,0,0,-39,-17,-13,-4,-8,-15,-36,-34,0,0,0,0,-32,-27,3,8,2,2,-10,-34,0,0,0,0,-32,-13,9,4,9,-15,-18,-39,0,0,0,0,-39,-37,-4,-7,-32,-26,-45,-65,0,0,0,0,-39,-22,-37,-12,-23,-41,-40,-70,0,0,0,0,-61,-55,-22,-40,-42,-41,-73,-113,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BBISHOP_PSTS   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-14,19,14,10,19,14,-15,0,0,0,0,0,17,29,21,9,16,30,55,10,0,0,0,0,9,28,25,17,25,39,28,22,0,0,0,0,8,12,11,30,29,2,12,18,0,0,0,0,1,7,10,46,24,19,5,3,0,0,0,0,-28,34,28,17,14,47,28,-7,0,0,0,0,-28,9,-27,-35,15,14,53,-76,0,0,0,0,-43,-11,-118,-71,-51,-70,-10,-15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BBISHOP_PSTE   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-44,-34,-40,-29,-34,-35,-32,-37,0,0,0,0,-40,-40,-34,-26,-24,-36,-41,-52,0,0,0,0,-33,-28,-21,-22,-19,-30,-31,-37,0,0,0,0,-32,-27,-15,-15,-26,-19,-32,-37,0,0,0,0,-29,-18,-18,-22,-18,-23,-23,-24,0,0,0,0,-16,-31,-27,-29,-28,-32,-27,-19,0,0,0,0,-25,-28,-18,-30,-29,-24,-34,-26,0,0,0,0,-34,-41,-23,-23,-18,-24,-40,-47,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BROOK_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-7,-5,6,14,15,12,-30,-8,0,0,0,0,-32,-11,-7,3,9,10,-6,-59,0,0,0,0,-38,-15,-8,-9,7,-1,-4,-28,0,0,0,0,-38,-30,-15,-9,4,-11,2,-33,0,0,0,0,-30,-22,1,16,3,16,-24,-32,0,0,0,0,-6,2,1,9,-8,17,42,-4,0,0,0,0,-6,6,25,37,40,39,-13,11,0,0,0,0,15,26,10,29,29,-2,8,23,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BROOK_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,19,16,11,8,11,18,-7,0,0,0,0,20,14,15,15,6,6,4,23,0,0,0,0,25,22,12,16,6,10,11,11,0,0,0,0,33,34,32,24,13,18,11,23,0,0,0,0,38,32,36,20,22,24,25,34,0,0,0,0,34,34,33,30,27,20,19,21,0,0,0,0,26,22,19,14,3,15,29,23,0,0,0,0,35,28,34,29,32,33,30,27,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BQUEEN_PSTS    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,2,9,21,1,-1,-11,-32,0,0,0,0,-19,6,19,15,22,28,10,26,0,0,0,0,-19,12,-4,4,7,3,14,6,0,0,0,0,-4,-37,-10,-16,-5,-7,-6,-4,0,0,0,0,-34,-30,-27,-28,-8,-4,-6,-10,0,0,0,0,-10,-17,3,-23,18,56,40,49,0,0,0,0,-17,-39,-3,11,-25,30,30,46,0,0,0,0,-25,-8,4,0,63,45,53,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BQUEEN_PSTE    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-37,-35,-24,-33,3,-32,-22,-49,0,0,0,0,-15,-26,-24,-14,-12,-25,-39,-34,0,0,0,0,11,-29,18,4,4,22,22,22,0,0,0,0,-12,45,26,57,33,39,46,32,0,0,0,0,30,32,35,57,64,51,69,57,0,0,0,0,-7,18,8,72,58,43,38,19,0,0,0,0,-15,15,23,33,62,25,17,15,0,0,0,0,-9,29,33,33,31,26,5,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BKING_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,60,44,-31,40,-9,53,29,0,0,0,0,31,59,23,-30,-9,17,52,42,0,0,0,0,14,28,3,-26,-27,-9,22,-7,0,0,0,0,-32,31,-26,-64,-63,-36,-27,-58,0,0,0,0,-15,1,-9,-46,-47,-36,-7,-54,0,0,0,0,35,29,26,-52,-14,26,58,-11,0,0,0,0,40,22,-7,3,-33,9,-6,-61,0,0,0,0,-95,41,25,-10,-91,-72,12,-21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BKING_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-80,-63,-47,-33,-57,-31,-54,-73,0,0,0,0,-51,-39,-19,-10,-8,-18,-30,-44,0,0,0,0,-36,-24,-8,1,3,-3,-14,-26,0,0,0,0,-32,-25,4,11,14,9,-5,-19,0,0,0,0,-18,2,9,12,13,21,15,-6,0,0,0,0,-15,0,-2,5,5,36,27,-4,0,0,0,0,-35,-13,-4,-2,9,21,2,-1,0,0,0,0,-131,-64,-39,-53,-22,-3,-30,-43,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WOUTPOST       = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,20,15,37,24,36,0,0,0,0,0,0,12,21,31,18,44,48,0,0,0,0,0,0,16,20,23,19,26,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BOUTPOST       = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,20,23,19,26,22,0,0,0,0,0,0,12,21,31,18,44,48,0,0,0,0,0,0,18,20,15,37,24,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const EV             = [6,10,13,13,9,9,-3,-2,49,99,24,62,6,24,18,-1,-5,18,38,6,2,12,59,100,96,796,44,27,20,20,2];
const ATTACKS        = [0,0,1,1,3,3];
const WSTORM         = [0,0,0,31,5,4,-8,-1,0,5];
const WSHELTER       = [0,0,0,7,12,13,36,27,0,28];
const MOBILITY_S     = [0,0,5,7,4,2];
const MOBILITY_E     = [0,0,-1,2,2,4];
const IMBALN_S       = [-96,12,1,-2,1,-1,0,8,23];
const IMBALN_E       = [-96,-35,-21,-13,-5,2,15,23,26];
const IMBALB_S       = [-44,-4,4,2,1,4,4,9,13];
const IMBALB_E       = [15,-17,-14,-9,-10,-6,-3,-2,14];
const IMBALR_S       = [40,9,-4,-8,-8,-8,-4,-4,-3];
const IMBALR_E       = [-3,-8,0,2,1,5,8,15,24];
const IMBALQ_S       = [5,-9,-2,2,3,2,-1,-3,-20];
const IMBALQ_E       = [-22,-18,-1,-3,-6,-5,0,-4,-10];
const XRAY_S         = [0,0,0,1,-2,0,0];
const XRAY_E         = [0,0,0,1,-2,0,0];

}}}
{{{  tuned params 2.1 full e

// data=c:/projects/chessdata/quiet-labeled.epd
// useEval=1
// k=1.61
// err=0.05571027346551139
// last update Tue Sep 21 2021 02:54:30 GMT+0100 (British Summer Time)

const VALUE_VECTOR   = [0,100,347,351,536,1046,10000];
const WPAWN_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-15,-5,0,5,5,0,-5,-15,0,0,0,0,48,104,62,94,96,87,36,-16,0,0,0,0,-5,3,16,13,55,68,33,-12,0,0,0,0,-20,4,-12,10,8,3,5,-35,0,0,0,0,-32,-28,-7,3,1,4,-22,-38,0,0,0,0,-27,-25,-11,-10,-6,5,9,-19,0,0,0,0,-37,-19,-35,-26,-42,8,10,-32,0,0,0,0,-15,-5,0,5,5,0,-5,-15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WPAWN_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,23,28,23,40,10,44,55,0,0,0,0,17,17,11,-3,-12,-8,13,17,0,0,0,0,4,-9,-13,-26,-21,-15,-7,1,0,0,0,0,2,-4,-17,-22,-16,-18,-10,-6,0,0,0,0,-11,-11,-18,-13,-10,-13,-21,-16,0,0,0,0,-3,-12,2,-6,12,-7,-17,-16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WKNIGHT_PSTS   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-162,-87,-45,-44,31,-113,-40,-87,0,0,0,0,-75,-41,63,27,8,55,-7,-27,0,0,0,0,-41,43,24,50,72,96,46,48,0,0,0,0,0,24,6,31,30,70,26,33,0,0,0,0,1,18,16,12,28,24,29,5,0,0,0,0,-15,4,16,32,46,25,36,-6,0,0,0,0,-10,-29,2,14,20,26,17,7,0,0,0,0,-97,-4,-25,-9,21,4,-1,-5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WKNIGHT_PSTE   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-61,-55,-22,-40,-42,-41,-73,-113,0,0,0,0,-39,-22,-37,-12,-23,-41,-40,-70,0,0,0,0,-39,-37,-4,-7,-32,-26,-45,-65,0,0,0,0,-32,-13,9,4,9,-15,-18,-39,0,0,0,0,-32,-27,3,8,2,2,-10,-34,0,0,0,0,-39,-17,-13,-4,-8,-15,-36,-34,0,0,0,0,-56,-33,-22,-20,-20,-32,-41,-65,0,0,0,0,-39,-65,-42,-31,-44,-39,-64,-92,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WBISHOP_PSTS   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-43,-11,-118,-71,-51,-70,-10,-15,0,0,0,0,-28,9,-27,-35,15,14,53,-76,0,0,0,0,-28,34,28,17,14,47,28,-7,0,0,0,0,1,7,10,46,24,19,5,3,0,0,0,0,8,12,11,30,29,2,12,18,0,0,0,0,9,28,25,17,25,39,28,22,0,0,0,0,17,29,21,9,16,30,55,10,0,0,0,0,-14,19,14,10,19,14,-15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WBISHOP_PSTE   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-34,-41,-23,-23,-18,-24,-40,-47,0,0,0,0,-25,-28,-18,-30,-29,-24,-34,-26,0,0,0,0,-16,-31,-27,-29,-28,-32,-27,-19,0,0,0,0,-29,-18,-18,-22,-18,-23,-23,-24,0,0,0,0,-32,-27,-15,-15,-26,-19,-32,-37,0,0,0,0,-33,-28,-21,-22,-19,-30,-31,-37,0,0,0,0,-40,-40,-34,-26,-24,-36,-41,-52,0,0,0,0,-44,-34,-40,-29,-34,-35,-32,-37,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WROOK_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,26,10,29,29,-2,8,23,0,0,0,0,-6,6,25,37,40,39,-13,11,0,0,0,0,-6,2,1,9,-8,17,42,-4,0,0,0,0,-30,-22,1,16,3,16,-24,-32,0,0,0,0,-38,-30,-15,-9,4,-11,2,-33,0,0,0,0,-38,-15,-8,-9,7,-1,-4,-28,0,0,0,0,-32,-11,-7,3,9,10,-6,-59,0,0,0,0,-7,-5,6,14,15,12,-30,-8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WROOK_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,35,28,34,29,32,33,30,27,0,0,0,0,26,22,19,14,3,15,29,23,0,0,0,0,34,34,33,30,27,20,19,21,0,0,0,0,38,32,36,20,22,24,25,34,0,0,0,0,33,34,32,24,13,18,11,23,0,0,0,0,25,22,12,16,6,10,11,11,0,0,0,0,20,14,15,15,6,6,4,23,0,0,0,0,14,19,16,11,8,11,18,-7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WQUEEN_PSTS    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-25,-8,4,0,63,45,53,44,0,0,0,0,-17,-39,-3,11,-25,30,30,46,0,0,0,0,-10,-17,3,-23,18,56,40,49,0,0,0,0,-34,-30,-27,-28,-8,-4,-6,-10,0,0,0,0,-4,-37,-10,-16,-5,-7,-6,-4,0,0,0,0,-19,12,-4,4,7,3,14,6,0,0,0,0,-19,6,19,15,22,28,10,26,0,0,0,0,12,2,9,21,1,-1,-11,-32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WQUEEN_PSTE    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-9,29,33,33,31,26,5,31,0,0,0,0,-15,15,23,33,62,25,17,15,0,0,0,0,-7,18,8,72,58,43,38,19,0,0,0,0,30,32,35,57,64,51,69,57,0,0,0,0,-12,45,26,57,33,39,46,32,0,0,0,0,11,-29,18,4,4,22,22,22,0,0,0,0,-15,-26,-24,-14,-12,-25,-39,-34,0,0,0,0,-37,-35,-24,-33,3,-32,-22,-49,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WKING_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-95,41,25,-10,-91,-72,12,-21,0,0,0,0,40,22,-7,3,-33,9,-6,-61,0,0,0,0,35,29,26,-52,-14,26,58,-11,0,0,0,0,-15,1,-9,-46,-47,-36,-7,-54,0,0,0,0,-32,31,-26,-64,-63,-36,-27,-58,0,0,0,0,14,28,3,-26,-27,-9,22,-7,0,0,0,0,31,59,23,-30,-9,17,52,42,0,0,0,0,1,60,44,-31,40,-9,53,29,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WKING_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-131,-64,-39,-53,-22,-3,-30,-43,0,0,0,0,-35,-13,-4,-2,9,21,2,-1,0,0,0,0,-15,0,-2,5,5,36,27,-4,0,0,0,0,-18,2,9,12,13,21,15,-6,0,0,0,0,-32,-25,4,11,14,9,-5,-19,0,0,0,0,-36,-24,-8,1,3,-3,-14,-26,0,0,0,0,-51,-39,-19,-10,-8,-18,-30,-44,0,0,0,0,-80,-63,-47,-33,-57,-31,-54,-73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BPAWN_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-15,-5,0,5,5,0,-5,-15,0,0,0,0,-37,-19,-35,-26,-42,8,10,-32,0,0,0,0,-27,-25,-11,-10,-6,5,9,-19,0,0,0,0,-32,-28,-7,3,1,4,-22,-38,0,0,0,0,-20,4,-12,10,8,3,5,-35,0,0,0,0,-5,3,16,13,55,68,33,-12,0,0,0,0,48,104,62,94,96,87,36,-16,0,0,0,0,-15,-5,0,5,5,0,-5,-15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BPAWN_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-3,-12,2,-6,12,-7,-17,-16,0,0,0,0,-11,-11,-18,-13,-10,-13,-21,-16,0,0,0,0,2,-4,-17,-22,-16,-18,-10,-6,0,0,0,0,4,-9,-13,-26,-21,-15,-7,1,0,0,0,0,17,17,11,-3,-12,-8,13,17,0,0,0,0,20,23,28,23,40,10,44,55,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BKNIGHT_PSTS   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-97,-4,-25,-9,21,4,-1,-5,0,0,0,0,-10,-29,2,14,20,26,17,7,0,0,0,0,-15,4,16,32,46,25,36,-6,0,0,0,0,1,18,16,12,28,24,29,5,0,0,0,0,0,24,6,31,30,70,26,33,0,0,0,0,-41,43,24,50,72,96,46,48,0,0,0,0,-75,-41,63,27,8,55,-7,-27,0,0,0,0,-162,-87,-45,-44,31,-113,-40,-87,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BKNIGHT_PSTE   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-39,-65,-42,-31,-44,-39,-64,-92,0,0,0,0,-56,-33,-22,-20,-20,-32,-41,-65,0,0,0,0,-39,-17,-13,-4,-8,-15,-36,-34,0,0,0,0,-32,-27,3,8,2,2,-10,-34,0,0,0,0,-32,-13,9,4,9,-15,-18,-39,0,0,0,0,-39,-37,-4,-7,-32,-26,-45,-65,0,0,0,0,-39,-22,-37,-12,-23,-41,-40,-70,0,0,0,0,-61,-55,-22,-40,-42,-41,-73,-113,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BBISHOP_PSTS   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-14,19,14,10,19,14,-15,0,0,0,0,0,17,29,21,9,16,30,55,10,0,0,0,0,9,28,25,17,25,39,28,22,0,0,0,0,8,12,11,30,29,2,12,18,0,0,0,0,1,7,10,46,24,19,5,3,0,0,0,0,-28,34,28,17,14,47,28,-7,0,0,0,0,-28,9,-27,-35,15,14,53,-76,0,0,0,0,-43,-11,-118,-71,-51,-70,-10,-15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BBISHOP_PSTE   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-44,-34,-40,-29,-34,-35,-32,-37,0,0,0,0,-40,-40,-34,-26,-24,-36,-41,-52,0,0,0,0,-33,-28,-21,-22,-19,-30,-31,-37,0,0,0,0,-32,-27,-15,-15,-26,-19,-32,-37,0,0,0,0,-29,-18,-18,-22,-18,-23,-23,-24,0,0,0,0,-16,-31,-27,-29,-28,-32,-27,-19,0,0,0,0,-25,-28,-18,-30,-29,-24,-34,-26,0,0,0,0,-34,-41,-23,-23,-18,-24,-40,-47,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BROOK_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-7,-5,6,14,15,12,-30,-8,0,0,0,0,-32,-11,-7,3,9,10,-6,-59,0,0,0,0,-38,-15,-8,-9,7,-1,-4,-28,0,0,0,0,-38,-30,-15,-9,4,-11,2,-33,0,0,0,0,-30,-22,1,16,3,16,-24,-32,0,0,0,0,-6,2,1,9,-8,17,42,-4,0,0,0,0,-6,6,25,37,40,39,-13,11,0,0,0,0,15,26,10,29,29,-2,8,23,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BROOK_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,19,16,11,8,11,18,-7,0,0,0,0,20,14,15,15,6,6,4,23,0,0,0,0,25,22,12,16,6,10,11,11,0,0,0,0,33,34,32,24,13,18,11,23,0,0,0,0,38,32,36,20,22,24,25,34,0,0,0,0,34,34,33,30,27,20,19,21,0,0,0,0,26,22,19,14,3,15,29,23,0,0,0,0,35,28,34,29,32,33,30,27,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BQUEEN_PSTS    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,2,9,21,1,-1,-11,-32,0,0,0,0,-19,6,19,15,22,28,10,26,0,0,0,0,-19,12,-4,4,7,3,14,6,0,0,0,0,-4,-37,-10,-16,-5,-7,-6,-4,0,0,0,0,-34,-30,-27,-28,-8,-4,-6,-10,0,0,0,0,-10,-17,3,-23,18,56,40,49,0,0,0,0,-17,-39,-3,11,-25,30,30,46,0,0,0,0,-25,-8,4,0,63,45,53,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BQUEEN_PSTE    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-37,-35,-24,-33,3,-32,-22,-49,0,0,0,0,-15,-26,-24,-14,-12,-25,-39,-34,0,0,0,0,11,-29,18,4,4,22,22,22,0,0,0,0,-12,45,26,57,33,39,46,32,0,0,0,0,30,32,35,57,64,51,69,57,0,0,0,0,-7,18,8,72,58,43,38,19,0,0,0,0,-15,15,23,33,62,25,17,15,0,0,0,0,-9,29,33,33,31,26,5,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BKING_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,60,44,-31,40,-9,53,29,0,0,0,0,31,59,23,-30,-9,17,52,42,0,0,0,0,14,28,3,-26,-27,-9,22,-7,0,0,0,0,-32,31,-26,-64,-63,-36,-27,-58,0,0,0,0,-15,1,-9,-46,-47,-36,-7,-54,0,0,0,0,35,29,26,-52,-14,26,58,-11,0,0,0,0,40,22,-7,3,-33,9,-6,-61,0,0,0,0,-95,41,25,-10,-91,-72,12,-21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BKING_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-80,-63,-47,-33,-57,-31,-54,-73,0,0,0,0,-51,-39,-19,-10,-8,-18,-30,-44,0,0,0,0,-36,-24,-8,1,3,-3,-14,-26,0,0,0,0,-32,-25,4,11,14,9,-5,-19,0,0,0,0,-18,2,9,12,13,21,15,-6,0,0,0,0,-15,0,-2,5,5,36,27,-4,0,0,0,0,-35,-13,-4,-2,9,21,2,-1,0,0,0,0,-131,-64,-39,-53,-22,-3,-30,-43,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WOUTPOST       = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,20,15,37,24,36,0,0,0,0,0,0,12,21,31,18,44,48,0,0,0,0,0,0,16,20,23,19,26,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BOUTPOST       = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,20,23,19,26,22,0,0,0,0,0,0,12,21,31,18,44,48,0,0,0,0,0,0,18,20,15,37,24,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const EV             = [6,10,13,13,9,9,-3,-2,49,99,24,62,6,24,18,-1,-5,18,38,6,2,12,59,100,96,796,44,27,20,20,2];
const ATTACKS        = [0,0,1,1,3,3];
const WSTORM         = [0,0,0,31,5,4,-8,-1,0,5];
const WSHELTER       = [0,0,0,7,12,13,36,27,0,28];
const MOBILITY_S     = [0,0,5,7,4,2];
const MOBILITY_E     = [0,0,-1,2,2,4];
const IMBALN_S       = [-96,12,1,-2,1,-1,0,8,23];
const IMBALN_E       = [-96,-35,-21,-13,-5,2,15,23,26];
const IMBALB_S       = [-44,-4,4,2,1,4,4,9,13];
const IMBALB_E       = [15,-17,-14,-9,-10,-6,-3,-2,14];
const IMBALR_S       = [40,9,-4,-8,-8,-8,-4,-4,-3];
const IMBALR_E       = [-3,-8,0,2,1,5,8,15,24];
const IMBALQ_S       = [5,-9,-2,2,3,2,-1,-3,-20];
const IMBALQ_E       = [-22,-18,-1,-3,-6,-5,0,-4,-10];

}}}
{{{  tuned params 2.1 full q

// data=c:/projects/chessdata/quiet-labeled.epd
// k=1.61
// useEval=0
// err=0.054598312437863825
// last update Fri Sep 17 2021 14:14:35 GMT+0100 (British Summer Time)

const VALUE_VECTOR   = [0,100,348,351,536,1047,10000];
const WPAWN_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-15,-5,0,5,5,0,-5,-15,0,0,0,0,47,99,59,91,92,76,36,-14,0,0,0,0,-6,6,15,12,52,67,34,-13,0,0,0,0,-20,4,-12,11,8,3,4,-35,0,0,0,0,-32,-27,-6,4,1,4,-22,-38,0,0,0,0,-26,-25,-10,-10,-5,5,9,-19,0,0,0,0,-37,-19,-35,-26,-42,8,10,-32,0,0,0,0,-15,-5,0,5,5,0,-5,-15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WPAWN_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,20,23,21,35,8,40,53,0,0,0,0,16,15,9,-4,-13,-9,13,17,0,0,0,0,5,-8,-12,-26,-20,-15,-6,1,0,0,0,0,2,-3,-17,-21,-16,-17,-10,-6,0,0,0,0,-10,-11,-17,-13,-10,-13,-21,-16,0,0,0,0,-3,-12,2,-6,12,-7,-17,-16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WKNIGHT_PSTS   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-158,-87,-41,-43,34,-112,-38,-85,0,0,0,0,-77,-41,54,30,2,55,-9,-24,0,0,0,0,-40,46,25,52,77,94,48,47,0,0,0,0,1,24,7,33,31,72,27,34,0,0,0,0,1,18,17,13,30,24,30,5,0,0,0,0,-15,3,16,33,47,25,37,-5,0,0,0,0,-12,-31,4,13,19,26,18,8,0,0,0,0,-97,-4,-25,-8,22,2,-2,-6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WKNIGHT_PSTE   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-61,-55,-21,-43,-42,-46,-75,-113,0,0,0,0,-40,-22,-41,-12,-26,-42,-43,-72,0,0,0,0,-41,-36,-5,-9,-34,-30,-44,-65,0,0,0,0,-32,-13,10,5,9,-13,-18,-39,0,0,0,0,-31,-27,3,9,2,3,-10,-35,0,0,0,0,-38,-17,-13,-4,-8,-15,-34,-34,0,0,0,0,-54,-33,-22,-19,-20,-32,-41,-64,0,0,0,0,-40,-65,-41,-30,-44,-39,-63,-94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WBISHOP_PSTS   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-43,-10,-110,-65,-52,-68,-6,-16,0,0,0,0,-27,10,-26,-32,17,9,59,-78,0,0,0,0,-24,34,27,17,11,49,31,-6,0,0,0,0,2,4,10,46,25,21,2,4,0,0,0,0,7,14,11,31,30,1,10,17,0,0,0,0,10,27,25,17,26,40,28,21,0,0,0,0,21,28,22,9,16,30,55,9,0,0,0,0,-14,21,14,10,20,14,-16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WBISHOP_PSTE   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-29,-39,-22,-27,-19,-23,-40,-46,0,0,0,0,-25,-29,-18,-31,-29,-28,-37,-29,0,0,0,0,-14,-30,-28,-30,-31,-31,-28,-18,0,0,0,0,-28,-16,-18,-22,-17,-22,-23,-24,0,0,0,0,-32,-25,-15,-14,-26,-19,-32,-35,0,0,0,0,-31,-29,-21,-22,-19,-30,-31,-37,0,0,0,0,-40,-39,-33,-25,-23,-35,-41,-52,0,0,0,0,-44,-34,-39,-29,-33,-34,-30,-35,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WROOK_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,25,11,28,27,4,9,21,0,0,0,0,-6,6,25,36,39,36,-13,10,0,0,0,0,-6,3,4,8,-7,17,41,-4,0,0,0,0,-30,-22,2,16,4,16,-21,-32,0,0,0,0,-38,-30,-15,-7,6,-10,3,-31,0,0,0,0,-38,-16,-7,-8,7,-1,-3,-28,0,0,0,0,-33,-10,-7,3,10,10,-6,-60,0,0,0,0,-7,-5,6,14,15,12,-30,-8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WROOK_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,35,28,34,29,30,32,30,29,0,0,0,0,26,21,19,14,4,14,28,23,0,0,0,0,34,34,32,30,24,20,19,20,0,0,0,0,38,32,35,20,22,22,24,34,0,0,0,0,33,33,34,23,13,17,11,24,0,0,0,0,26,23,12,15,6,9,10,11,0,0,0,0,20,14,15,15,6,6,4,23,0,0,0,0,14,19,16,11,8,11,18,-7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WQUEEN_PSTS    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-25,-6,7,-1,59,43,49,44,0,0,0,0,-17,-38,-3,12,-23,28,23,46,0,0,0,0,-9,-14,-1,-19,17,57,36,49,0,0,0,0,-31,-29,-26,-28,-10,-4,-4,-10,0,0,0,0,-6,-37,-10,-16,-6,-6,-6,-3,0,0,0,0,-18,12,-2,3,7,4,16,7,0,0,0,0,-19,7,19,15,22,30,9,25,0,0,0,0,12,0,9,21,2,0,-11,-34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WQUEEN_PSTE    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-10,27,31,29,29,26,6,31,0,0,0,0,-17,15,23,33,62,22,10,15,0,0,0,0,-8,17,4,70,57,43,36,20,0,0,0,0,30,32,35,57,62,49,67,55,0,0,0,0,-11,45,25,57,32,39,46,32,0,0,0,0,11,-28,18,5,4,23,24,22,0,0,0,0,-16,-25,-24,-14,-11,-25,-39,-35,0,0,0,0,-38,-35,-24,-33,3,-32,-21,-47,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WKING_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-89,41,21,-13,-89,-68,11,-18,0,0,0,0,36,23,-5,0,-31,5,-7,-53,0,0,0,0,36,25,27,-54,-14,27,57,-10,0,0,0,0,-14,3,-8,-46,-44,-35,-4,-55,0,0,0,0,-30,32,-25,-61,-59,-36,-23,-58,0,0,0,0,17,30,5,-25,-26,-8,23,-7,0,0,0,0,31,60,23,-30,-8,17,52,42,0,0,0,0,-1,60,43,-32,40,-9,53,29,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WKING_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-133,-65,-36,-49,-24,0,-28,-42,0,0,0,0,-33,-13,-4,-2,10,23,2,0,0,0,0,0,-13,2,0,5,6,36,28,-3,0,0,0,0,-18,3,10,14,13,22,16,-6,0,0,0,0,-32,-24,5,12,15,9,-4,-19,0,0,0,0,-37,-23,-9,1,4,-2,-14,-26,0,0,0,0,-51,-40,-18,-10,-7,-18,-30,-44,0,0,0,0,-81,-63,-47,-33,-57,-31,-54,-73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BPAWN_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-15,-5,0,5,5,0,-5,-15,0,0,0,0,-37,-19,-35,-26,-42,8,10,-32,0,0,0,0,-26,-25,-10,-10,-5,5,9,-19,0,0,0,0,-32,-27,-6,4,1,4,-22,-38,0,0,0,0,-20,4,-12,11,8,3,4,-35,0,0,0,0,-6,6,15,12,52,67,34,-13,0,0,0,0,47,99,59,91,92,76,36,-14,0,0,0,0,-15,-5,0,5,5,0,-5,-15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BPAWN_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-3,-12,2,-6,12,-7,-17,-16,0,0,0,0,-10,-11,-17,-13,-10,-13,-21,-16,0,0,0,0,2,-3,-17,-21,-16,-17,-10,-6,0,0,0,0,5,-8,-12,-26,-20,-15,-6,1,0,0,0,0,16,15,9,-4,-13,-9,13,17,0,0,0,0,21,20,23,21,35,8,40,53,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BKNIGHT_PSTS   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-97,-4,-25,-8,22,2,-2,-6,0,0,0,0,-12,-31,4,13,19,26,18,8,0,0,0,0,-15,3,16,33,47,25,37,-5,0,0,0,0,1,18,17,13,30,24,30,5,0,0,0,0,1,24,7,33,31,72,27,34,0,0,0,0,-40,46,25,52,77,94,48,47,0,0,0,0,-77,-41,54,30,2,55,-9,-24,0,0,0,0,-158,-87,-41,-43,34,-112,-38,-85,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BKNIGHT_PSTE   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-40,-65,-41,-30,-44,-39,-63,-94,0,0,0,0,-54,-33,-22,-19,-20,-32,-41,-64,0,0,0,0,-38,-17,-13,-4,-8,-15,-34,-34,0,0,0,0,-31,-27,3,9,2,3,-10,-35,0,0,0,0,-32,-13,10,5,9,-13,-18,-39,0,0,0,0,-41,-36,-5,-9,-34,-30,-44,-65,0,0,0,0,-40,-22,-41,-12,-26,-42,-43,-72,0,0,0,0,-61,-55,-21,-43,-42,-46,-75,-113,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BBISHOP_PSTS   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-14,21,14,10,20,14,-16,0,0,0,0,0,21,28,22,9,16,30,55,9,0,0,0,0,10,27,25,17,26,40,28,21,0,0,0,0,7,14,11,31,30,1,10,17,0,0,0,0,2,4,10,46,25,21,2,4,0,0,0,0,-24,34,27,17,11,49,31,-6,0,0,0,0,-27,10,-26,-32,17,9,59,-78,0,0,0,0,-43,-10,-110,-65,-52,-68,-6,-16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BBISHOP_PSTE   = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-44,-34,-39,-29,-33,-34,-30,-35,0,0,0,0,-40,-39,-33,-25,-23,-35,-41,-52,0,0,0,0,-31,-29,-21,-22,-19,-30,-31,-37,0,0,0,0,-32,-25,-15,-14,-26,-19,-32,-35,0,0,0,0,-28,-16,-18,-22,-17,-22,-23,-24,0,0,0,0,-14,-30,-28,-30,-31,-31,-28,-18,0,0,0,0,-25,-29,-18,-31,-29,-28,-37,-29,0,0,0,0,-29,-39,-22,-27,-19,-23,-40,-46,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BROOK_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-7,-5,6,14,15,12,-30,-8,0,0,0,0,-33,-10,-7,3,10,10,-6,-60,0,0,0,0,-38,-16,-7,-8,7,-1,-3,-28,0,0,0,0,-38,-30,-15,-7,6,-10,3,-31,0,0,0,0,-30,-22,2,16,4,16,-21,-32,0,0,0,0,-6,3,4,8,-7,17,41,-4,0,0,0,0,-6,6,25,36,39,36,-13,10,0,0,0,0,17,25,11,28,27,4,9,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BROOK_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,19,16,11,8,11,18,-7,0,0,0,0,20,14,15,15,6,6,4,23,0,0,0,0,26,23,12,15,6,9,10,11,0,0,0,0,33,33,34,23,13,17,11,24,0,0,0,0,38,32,35,20,22,22,24,34,0,0,0,0,34,34,32,30,24,20,19,20,0,0,0,0,26,21,19,14,4,14,28,23,0,0,0,0,35,28,34,29,30,32,30,29,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BQUEEN_PSTS    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,9,21,2,0,-11,-34,0,0,0,0,-19,7,19,15,22,30,9,25,0,0,0,0,-18,12,-2,3,7,4,16,7,0,0,0,0,-6,-37,-10,-16,-6,-6,-6,-3,0,0,0,0,-31,-29,-26,-28,-10,-4,-4,-10,0,0,0,0,-9,-14,-1,-19,17,57,36,49,0,0,0,0,-17,-38,-3,12,-23,28,23,46,0,0,0,0,-25,-6,7,-1,59,43,49,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BQUEEN_PSTE    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-38,-35,-24,-33,3,-32,-21,-47,0,0,0,0,-16,-25,-24,-14,-11,-25,-39,-35,0,0,0,0,11,-28,18,5,4,23,24,22,0,0,0,0,-11,45,25,57,32,39,46,32,0,0,0,0,30,32,35,57,62,49,67,55,0,0,0,0,-8,17,4,70,57,43,36,20,0,0,0,0,-17,15,23,33,62,22,10,15,0,0,0,0,-10,27,31,29,29,26,6,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BKING_PSTS     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,60,43,-32,40,-9,53,29,0,0,0,0,31,60,23,-30,-8,17,52,42,0,0,0,0,17,30,5,-25,-26,-8,23,-7,0,0,0,0,-30,32,-25,-61,-59,-36,-23,-58,0,0,0,0,-14,3,-8,-46,-44,-35,-4,-55,0,0,0,0,36,25,27,-54,-14,27,57,-10,0,0,0,0,36,23,-5,0,-31,5,-7,-53,0,0,0,0,-89,41,21,-13,-89,-68,11,-18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BKING_PSTE     = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-81,-63,-47,-33,-57,-31,-54,-73,0,0,0,0,-51,-40,-18,-10,-7,-18,-30,-44,0,0,0,0,-37,-23,-9,1,4,-2,-14,-26,0,0,0,0,-32,-24,5,12,15,9,-4,-19,0,0,0,0,-18,3,10,14,13,22,16,-6,0,0,0,0,-13,2,0,5,6,36,28,-3,0,0,0,0,-33,-13,-4,-2,10,23,2,0,0,0,0,0,-133,-65,-36,-49,-24,0,-28,-42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const WOUTPOST       = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,19,15,34,22,30,0,0,0,0,0,0,13,21,32,20,45,48,0,0,0,0,0,0,18,21,23,21,28,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const BOUTPOST       = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,21,23,21,28,22,0,0,0,0,0,0,13,21,32,20,45,48,0,0,0,0,0,0,17,19,15,34,22,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const EV             = [6,10,13,13,9,9,-3,-2,49,99,24,62,7,25,18,-1,-4,19,41,7,3,14,57,102,92,794,41,25,20,20,2];
const ATTACKS        = [0,0,1,1,3,3];
const WSTORM         = [0,0,0,33,6,4,-8,-1,0,5];
const WSHELTER       = [0,0,0,7,12,13,37,34,0,28];
const MOBILITY_S     = [0,0,5,7,4,2];
const MOBILITY_E     = [0,0,-1,2,2,4];
const IMBALN_S       = [-95,5,1,-2,1,-1,0,8,23];
const IMBALN_E       = [-98,-31,-20,-13,-5,2,15,23,26];
const IMBALB_S       = [-37,-3,4,2,1,4,4,9,13];
const IMBALB_E       = [15,-14,-13,-8,-10,-6,-3,-2,14];
const IMBALR_S       = [37,7,-2,-7,-8,-8,-4,-4,-3];
const IMBALR_E       = [0,-7,1,2,1,5,8,15,24];
const IMBALQ_S       = [4,-10,-3,2,3,2,-1,-3,-19];
const IMBALQ_E       = [-19,-16,-1,-3,-6,-5,0,-4,-9];

}}}

