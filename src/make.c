/*}}}*/
/*{{{  move makers*/
//
// pre_ and post_ are in relation to is_attacked() in search() for example.
// The pre_ functions (called via make_move) update enough for is_attacked
// (the bitboards) and leave a trail in lazy.* for the the net_ and post_
// functions to do the rest of the work.
//

/*{{{  post_move*/

static void post_move(Position *const pos) {

  int rights    = pos->rights;
  int ep        = pos->ep;
  uint64_t hash = pos->hash;

  const int from_piece = lazy.arg0;
  const int from       = lazy.arg1;
  const int to         = lazy.arg2;
  const int zob_base   = from_piece << 6;

  pos->board[to]   = from_piece;
  pos->board[from] = EMPTY;

  hash ^= zob_pieces[zob_base | from] ^ zob_pieces[zob_base | to];

  hash ^= zob_ep[ep];
  ep   = 0;
  hash ^= zob_ep[ep];

  hash   ^= zob_rights[rights];
  rights &= rights_masks[from] & rights_masks[to];
  hash   ^= zob_rights[rights];

  hash ^= zob_stm;

  pos->hash   = hash;
  pos->stm    ^= 1;
  pos->rights = (uint8_t)rights;
  pos->ep     = (uint8_t)ep;
  pos->hmc    = min(UINT8_MAX, pos->hmc + 1);

}

/*}}}*/
/*{{{  pre_move*/

static void pre_move(Position *const pos, const move_t move) {

  const int stm        = pos->stm;
  const int from       = (move >> 6) & 0x3F;
  const int to         = move & 0x3F;
  const int from_piece = pos->board[from];
  const uint64_t mask  = (1ULL << from) ^ (1ULL << to);

  pos->all[from_piece] ^= mask;
  pos->colour[stm]     ^= mask;
  pos->occupied        ^= mask;

  lazy.post_func = post_move;
  lazy.net_func  = net_move;
  lazy.arg0      = from_piece;
  lazy.arg1      = from;
  lazy.arg2      = to;

}

/*}}}*/

/*{{{  post_capture*/

static void post_capture(Position *const pos) {

  int rights    = pos->rights;
  int ep        = pos->ep;
  uint64_t hash = pos->hash;

  const int from       = lazy.arg1;
  const int to         = lazy.arg2;
  const int from_piece = lazy.arg0;
  const int to_piece   = lazy.arg3;
  const int zob_base   = from_piece << 6;

  pos->board[from] = EMPTY;
  pos->board[to]   = from_piece;

  hash ^= zob_pieces[zob_base | from] ^ zob_pieces[zob_base | to] ^ zob_pieces[(to_piece << 6) | to];

  hash ^= zob_ep[ep];
  ep   = 0;
  hash ^= zob_ep[ep];

  hash   ^= zob_rights[rights];
  rights &= rights_masks[from] & rights_masks[to];
  hash   ^= zob_rights[rights];

  hash ^= zob_stm;

  pos->hash   = hash;
  pos->stm    ^= 1;
  pos->rights = (uint8_t)rights;
  pos->ep     = (uint8_t)ep;
  pos->hmc    = 0;

}

/*}}}*/
/*{{{  pre_capture*/

static void pre_capture(Position *const pos, const move_t move) {

  uint64_t *const RESTRICT colour = pos->colour;
  uint64_t *const RESTRICT all    = pos->all;
  uint8_t  *const RESTRICT board  = pos->board;

  const int stm          = pos->stm;
  const int opp          = stm ^ 1;
  const int from         = (move >> 6) & 0x3F;
  const int to           = move & 0x3F;
  const uint64_t from_bb = 1ULL << from;
  const uint64_t to_bb   = 1ULL << to;
  const int from_piece   = board[from];
  const int to_piece     = board[to];
  const uint64_t mask    = from_bb ^ to_bb;

  all[from_piece] ^= mask;
  colour[stm]     ^= mask;
  all[to_piece]   ^= to_bb;
  colour[opp]     ^= to_bb;
  pos->occupied   ^= from_bb;

  lazy.post_func = post_capture;
  lazy.net_func  = net_capture;
  lazy.arg0      = from_piece;
  lazy.arg1      = from;
  lazy.arg2      = to;
  lazy.arg3      = to_piece;

}

/*}}}*/

/*{{{  post_ep_push*/

static void post_ep_push(Position *const pos) {

  int ep        = pos->ep;
  uint64_t hash = pos->hash;

  const int from_piece = lazy.arg0;
  const int from       = lazy.arg1;
  const int to         = lazy.arg2;
  const int zob_base   = from_piece << 6;

  pos->board[to]   = from_piece;
  pos->board[from] = EMPTY;

  hash ^= zob_pieces[zob_base | from] ^ zob_pieces[zob_base | to];

  hash ^= zob_ep[ep];
  ep   = from + orth_offset[pos->stm];
  hash ^= zob_ep[ep];

  hash ^= zob_stm;

  pos->hash = hash;
  pos->stm  ^= 1;
  pos->ep   = (uint8_t)ep;
  pos->hmc  = 0;

}

/*}}}*/
/*{{{  pre_ep_push*/

static void pre_ep_push(Position *const pos, const move_t move) {

  const int stm        = pos->stm;
  const int from       = (move >> 6) & 0x3F;
  const int to         = move & 0x3F;
  const int from_piece = piece_index(PAWN, stm);
  const uint64_t mask  = (1ULL << from) ^ (1ULL << to);

  pos->all[from_piece] ^= mask;
  pos->colour[stm]     ^= mask;
  pos->occupied        ^= mask;

  lazy.post_func = post_ep_push;
  lazy.net_func  = net_move;
  lazy.arg0      = from_piece;
  lazy.arg1      = from;
  lazy.arg2      = to;

}

/*}}}*/

/*{{{  post_ep_capture*/

static void post_ep_capture(Position *const pos) {

  uint8_t *const RESTRICT board = pos->board;

  const int from_piece = lazy.arg0;
  const int from       = lazy.arg1;
  const int to         = lazy.arg2;
  const int opp_pawn   = lazy.arg3;
  const int pawn_sq    = lazy.arg4;
  const int zob_base   = from_piece << 6;

  int ep        = pos->ep;
  uint64_t hash = pos->hash;

  board[from]    = EMPTY;
  board[to]      = from_piece;
  board[pawn_sq] = EMPTY;

  hash ^= zob_pieces[zob_base | from] ^ zob_pieces[zob_base | to] ^ zob_pieces[(opp_pawn << 6) | pawn_sq];

  hash ^= zob_ep[ep];
  ep   = 0;
  hash ^= zob_ep[ep];

  hash ^= zob_stm;

  pos->hash = hash;
  pos->stm  ^= 1;
  pos->ep   = (uint8_t)ep;
  pos->hmc  = 0;

}

/*}}}*/
/*{{{  pre_ep_capture*/

static void pre_ep_capture(Position *const pos, const move_t move) {

  uint64_t *const RESTRICT all    = pos->all;
  uint64_t *const RESTRICT colour = pos->colour;

  const int stm          = pos->stm;
  const int opp          = stm ^ 1;
  const int from         = (move >> 6) & 0x3F;
  const int to           = move & 0x3F;
  const uint64_t from_bb = 1ULL << from;
  const uint64_t to_bb   = 1ULL << to;
  const int from_piece   = piece_index(PAWN, stm);
  const uint64_t mask    = from_bb ^ to_bb;
  const int opp_pawn     = piece_index(PAWN, opp);
  const int pawn_sq      = to + orth_offset[opp];
  const uint64_t pawn_bb = 1ull << pawn_sq;

  all[from_piece] ^= mask;
  colour[stm]     ^= mask;
  all[opp_pawn]   ^= pawn_bb;
  colour[opp]     ^= pawn_bb;
  pos->occupied   ^= mask ^ pawn_bb;

  lazy.post_func = post_ep_capture;
  lazy.net_func  = net_ep_capture;
  lazy.arg0      = from_piece;
  lazy.arg1      = from;
  lazy.arg2      = to;
  lazy.arg3      = opp_pawn;
  lazy.arg4      = pawn_sq;

}

/*}}}*/

/*{{{  post_castle*/

static void post_castle(Position *const pos) {

  uint8_t *const board = pos->board;

  int rights    = pos->rights;
  int ep        = pos->ep;
  uint64_t hash = pos->hash;

  const int from_piece   = lazy.arg0;
  const int from         = lazy.arg1;
  const int to           = lazy.arg2;
  const int rook         = lazy.arg3;
  const int rook_from_sq = lazy.arg4;
  const int rook_to_sq   = lazy.arg5;
  const int zob_base_k   = from_piece << 6;
  const int zob_base_r   = rook       << 6;

  board[from]         = EMPTY;
  board[to]           = from_piece;
  board[rook_from_sq] = EMPTY;
  board[rook_to_sq]   = rook;

  hash ^= zob_pieces[zob_base_k | from] ^ zob_pieces[zob_base_k | to] ^ zob_pieces[zob_base_r | rook_from_sq] ^ zob_pieces[zob_base_r | rook_to_sq];

  hash ^= zob_ep[ep];
  ep   = 0;
  hash ^= zob_ep[ep];

  hash   ^= zob_rights[rights];
  rights &= rights_masks[from] & rights_masks[to];
  hash   ^= zob_rights[rights];

  hash ^= zob_stm;

  pos->hash   = hash;
  pos->stm    ^= 1;
  pos->rights = (uint8_t)rights;
  pos->ep     = (uint8_t)ep;
  pos->hmc    = min(UINT8_MAX, pos->hmc + 1);

}

/*}}}*/
/*{{{  pre_castle*/

static void pre_castle(Position *const pos, const move_t move) {

  uint64_t *const all    = pos->all;
  uint64_t *const colour = pos->colour;

  const int from              = (move >> 6) & 0x3F;
  const int to                = move & 0x3F;
  const uint64_t from_bb      = 1ULL << from;
  const uint64_t to_bb        = 1ULL << to;
  const int stm               = pos->stm;
  const int from_piece        = piece_index(KING, stm);
  const int rook              = piece_index(ROOK, stm);
  const uint64_t rook_from_bb = 1ULL << rook_from[to];
  const uint64_t rook_to_bb   = 1ULL << rook_to[to];
  const int rook_from_sq      = rook_from[to];
  const int rook_to_sq        = rook_to[to];
  const uint64_t mask_k       = from_bb ^ to_bb;
  const uint64_t mask_r       = rook_from_bb ^ rook_to_bb;

  all[from_piece] ^= mask_k;
  all[rook]       ^= mask_r;
  colour[stm]     ^= mask_k ^ mask_r;
  pos->occupied   ^= mask_k ^ mask_r;

  lazy.post_func = post_castle;
  lazy.net_func  = net_castle;
  lazy.arg0      = from_piece;
  lazy.arg1      = from;
  lazy.arg2      = to;
  lazy.arg3      = rook;
  lazy.arg4      = rook_from_sq;
  lazy.arg5      = rook_to_sq;

}

/*}}}*/

/*{{{  post_promo_push*/

static void post_promo_push(Position *const pos) {

  int ep        = pos->ep;
  uint64_t hash = pos->hash;

  const int from_piece = lazy.arg0;
  const int from       = lazy.arg1;
  const int to         = lazy.arg2;
  const int pro        = lazy.arg4;

  pos->board[from] = EMPTY;
  pos->board[to]   = pro;

  hash ^= zob_pieces[(from_piece << 6) | from] ^ zob_pieces[(pro << 6) | to];

  hash ^= zob_ep[ep];
  ep   = 0;
  hash ^= zob_ep[ep];

  hash ^= zob_stm;

  pos->hash = hash;
  pos->stm  ^= 1;
  pos->ep   = (uint8_t)ep;
  pos->hmc  = 0;

}

/*}}}*/
/*{{{  pre_promo_push*/

static void pre_promo_push(Position *const pos, const move_t move) {

  uint64_t *const all    = pos->all;
  uint64_t *const colour = pos->colour;

  const int from         = (move >> 6) & 0x3F;
  const int to           = move & 0x3F;
  const uint64_t from_bb = 1ULL << from;
  const uint64_t to_bb   = 1ULL << to;
  const int stm          = pos->stm;
  const int from_piece   = piece_index(PAWN, stm);
  const int pro          = piece_index(((move >> 12) & 3) + 1, stm);
  const uint64_t mask    = from_bb ^ to_bb;

  all[from_piece] ^= from_bb;
  all[pro]        ^= to_bb;
  colour[stm]     ^= mask;
  pos->occupied   ^= mask;

  lazy.post_func = post_promo_push;
  lazy.net_func  = net_promo_push;
  lazy.arg0      = from_piece;
  lazy.arg1      = from;
  lazy.arg2      = to;
  lazy.arg3      = EMPTY;
  lazy.arg4      = pro;

}

/*}}}*/

/*{{{  post_promo_capture*/

static void post_promo_capture(Position *const pos) {

  int rights    = pos->rights;
  int ep        = pos->ep;
  uint64_t hash = pos->hash;

  const int from_piece = lazy.arg0;
  const int from       = lazy.arg1;
  const int to         = lazy.arg2;
  const int to_piece   = lazy.arg3;
  const int pro        = lazy.arg4;

  pos->board[from] = EMPTY;
  pos->board[to]   = pro;

  hash ^= zob_pieces[from_piece << 6 | from] ^ zob_pieces[to_piece << 6 | to] ^ zob_pieces[pro << 6 | to];

  hash ^= zob_ep[ep];
  ep   = 0;
  hash ^= zob_ep[ep];

  hash   ^= zob_rights[rights];
  rights &= rights_masks[from] & rights_masks[to];
  hash   ^= zob_rights[rights];

  hash ^= zob_stm;

  pos->hash   = hash;
  pos->stm    ^= 1;
  pos->rights = (uint8_t)rights;
  pos->ep     = (uint8_t)ep;
  pos->hmc    = 0;

}

/*}}}*/
/*{{{  pre_promo_capture*/

static void pre_promo_capture(Position *const pos, const move_t move) {

  uint64_t *const RESTRICT all    = pos->all;
  uint64_t *const RESTRICT colour = pos->colour;

  const int from         = (move >> 6) & 0x3F;
  const int to           = move & 0x3F;
  const uint64_t from_bb = 1ULL << from;
  const uint64_t to_bb   = 1ULL << to;
  const int stm          = pos->stm;
  const int from_piece   = piece_index(PAWN, stm);
  const int to_piece     = pos->board[to];
  const int pro          = piece_index(((move >> 12) & 3) + 1, stm);

  all[from_piece] ^= from_bb;
  all[to_piece]   ^= to_bb;
  all[pro]        ^= to_bb;
  colour[stm]     ^= from_bb ^ to_bb;
  colour[stm^1]   ^= to_bb;
  pos->occupied   ^= from_bb;

  lazy.post_func = post_promo_capture;
  lazy.net_func  = net_promo_capture;
  lazy.arg0      = from_piece;
  lazy.arg1      = from;
  lazy.arg2      = to;
  lazy.arg3      = to_piece;
  lazy.arg4      = pro;

}

/*}}}*/

/*{{{  init_move_funcs*/

static void init_move_funcs(void) {

  move_funcs[0]  = pre_move;
  move_funcs[1]  = pre_move;
  move_funcs[2]  = pre_castle;
  move_funcs[3]  = pre_ep_push;
  move_funcs[4]  = pre_promo_push;
  move_funcs[5]  = pre_promo_push;
  move_funcs[6]  = pre_promo_push;
  move_funcs[7]  = pre_promo_push;
  move_funcs[8]  = pre_capture;
  move_funcs[9]  = pre_ep_capture;
  move_funcs[10] = pre_capture;
  //spare;
  move_funcs[12] = pre_promo_capture;
  move_funcs[13] = pre_promo_capture;
  move_funcs[14] = pre_promo_capture;
  move_funcs[15] = pre_promo_capture;

}

/*}}}*/
/*{{{  make_move_pre*/

static inline void make_move_pre(Position *const pos, const move_t move) {

  const int mt = (move >> 12) & 0xF;

  move_funcs[mt](pos, move);

  /* switch is slower
  switch (mt) {
    case 0:  pre_move(pos, move); break;
    case 1:  pre_move(pos, move); break;
    case 2:  pre_castle(pos, move); break;
    case 3:  pre_push(pos, move); break;
    case 4:  pre_promo_push(pos, move); break;
    case 5:  pre_promo_push(pos, move); break;
    case 6:  pre_promo_push(pos, move); break;
    case 7:  pre_promo_push(pos, move); break;
    case 8:  pre_capture(pos, move); break;
    case 9:  pre_ep_capture(pos, move); break;
    case 10: pre_capture(pos, move); break;
    case 11: break;
    case 12: pre_promo_capture(pos, move); break;
    case 13: pre_promo_capture(pos, move); break;
    case 14: pre_promo_capture(pos, move); break;
    case 15: pre_promo_capture(pos, move); break;
  }
  */

}

/*}}}*/
/*{{{  make_move_post*/
//
// Call the _post func set up by the _pre_func.
//

static inline void make_move_post(Position *const pos) {

  lazy.post_func(pos);

}


/*}}}*/

/*{{{  make_null_move*/

static void make_null_move(Position *const pos) {

  int ep        = pos->ep;
  uint64_t hash = pos->hash;

  hash ^= zob_ep[ep];
  ep   = 0;
  hash ^= zob_ep[ep];

  hash ^= zob_stm;

  pos->hash = hash;
  pos->stm  ^= 1;
  pos->ep   = (uint8_t)ep;
  pos->hmc  = 0;

}

/*}}}*/

/*}}}*/