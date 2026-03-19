(function () {
    'use strict';

    // Piece constants
    const EMPTY = 0;
    const W_PAWN = 1, W_KNIGHT = 2, W_BISHOP = 3, W_ROOK = 4, W_QUEEN = 5, W_KING = 6;
    const B_PAWN = 7, B_KNIGHT = 8, B_BISHOP = 9, B_ROOK = 10, B_QUEEN = 11, B_KING = 12;

    const PIECE_UNICODE = {
        [W_KING]: '\u2654', [W_QUEEN]: '\u2655', [W_ROOK]: '\u2656',
        [W_BISHOP]: '\u2657', [W_KNIGHT]: '\u2658', [W_PAWN]: '\u2659',
        [B_KING]: '\u265A', [B_QUEEN]: '\u265B', [B_ROOK]: '\u265C',
        [B_BISHOP]: '\u265D', [B_KNIGHT]: '\u265E', [B_PAWN]: '\u265F',
    };

    // Piece values for AI evaluation
    const PIECE_VALUES = { 1: 100, 2: 320, 3: 330, 4: 500, 5: 900, 6: 20000 };

    // Piece-square tables (from white's perspective, flipped for black)
    const PST_PAWN = [
        0,  0,  0,  0,  0,  0,  0,  0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
        5,  5, 10, 25, 25, 10,  5,  5,
        0,  0,  0, 20, 20,  0,  0,  0,
        5, -5,-10,  0,  0,-10, -5,  5,
        5, 10, 10,-20,-20, 10, 10,  5,
        0,  0,  0,  0,  0,  0,  0,  0
    ];
    const PST_KNIGHT = [
        -50,-40,-30,-30,-30,-30,-40,-50,
        -40,-20,  0,  0,  0,  0,-20,-40,
        -30,  0, 10, 15, 15, 10,  0,-30,
        -30,  5, 15, 20, 20, 15,  5,-30,
        -30,  0, 15, 20, 20, 15,  0,-30,
        -30,  5, 10, 15, 15, 10,  5,-30,
        -40,-20,  0,  5,  5,  0,-20,-40,
        -50,-40,-30,-30,-30,-30,-40,-50
    ];
    const PST_BISHOP = [
        -20,-10,-10,-10,-10,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0, 10, 10, 10, 10,  0,-10,
        -10,  5,  5, 10, 10,  5,  5,-10,
        -10,  0,  5, 10, 10,  5,  0,-10,
        -10,  5,  5,  5,  5,  5,  5,-10,
        -10,  5,  0,  0,  0,  0,  5,-10,
        -20,-10,-10,-10,-10,-10,-10,-20
    ];
    const PST_ROOK = [
        0,  0,  0,  0,  0,  0,  0,  0,
        5, 10, 10, 10, 10, 10, 10,  5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        0,  0,  0,  5,  5,  0,  0,  0
    ];
    const PST_QUEEN = [
        -20,-10,-10, -5, -5,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0,  5,  5,  5,  5,  0,-10,
        -5,  0,  5,  5,  5,  5,  0, -5,
        0,  0,  5,  5,  5,  5,  0, -5,
        -10,  5,  5,  5,  5,  5,  0,-10,
        -10,  0,  5,  0,  0,  0,  0,-10,
        -20,-10,-10, -5, -5,-10,-10,-20
    ];
    const PST_KING = [
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -20,-30,-30,-40,-40,-30,-30,-20,
        -10,-20,-20,-20,-20,-20,-20,-10,
        20, 20,  0,  0,  0,  0, 20, 20,
        20, 30, 10,  0,  0, 10, 30, 20
    ];

    const PST = { 1: PST_PAWN, 2: PST_KNIGHT, 3: PST_BISHOP, 4: PST_ROOK, 5: PST_QUEEN, 6: PST_KING };

    function isWhite(p) { return p >= W_PAWN && p <= W_KING; }
    function isBlack(p) { return p >= B_PAWN && p <= B_KING; }
    function colorOf(p) { if (isWhite(p)) return 'w'; if (isBlack(p)) return 'b'; return null; }
    function pieceType(p) {
        if (p === EMPTY) return null;
        if (isWhite(p)) return p;
        return p - 6;
    }

    function initialBoard() {
        return [
            [B_ROOK, B_KNIGHT, B_BISHOP, B_QUEEN, B_KING, B_BISHOP, B_KNIGHT, B_ROOK],
            [B_PAWN, B_PAWN,   B_PAWN,   B_PAWN,  B_PAWN, B_PAWN,   B_PAWN,   B_PAWN],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [W_PAWN, W_PAWN,   W_PAWN,   W_PAWN,  W_PAWN, W_PAWN,   W_PAWN,   W_PAWN],
            [W_ROOK, W_KNIGHT, W_BISHOP, W_QUEEN, W_KING, W_BISHOP, W_KNIGHT, W_ROOK],
        ];
    }

    function cloneBoard(b) { return b.map(function (row) { return row.slice(); }); }

    const SQ = 60;
    const BOARD_PX = 480;
    const AI_DEPTH = 3;

    const ChessApp = {
        canvas: null,
        ctx: null,
        container: null,
        abortController: null,
        board: null,
        turn: 'w',
        selected: null,
        validMoves: [],
        lastMove: null,
        enPassantTarget: null,
        castleRights: null,
        gameOver: false,
        gameOverMsg: '',
        inCheck: false,
        aiThinking: false,
        aiTimeout: null,
        statusEl: null,
        btnEl: null,

        // -----------------------------------------------------------
        // Lifecycle
        // -----------------------------------------------------------
        init: function (containerEl) {
            this.container = containerEl;
            this.abortController = new AbortController();

            var wrapper = document.createElement('div');
            wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:8px;user-select:none;';

            this.canvas = document.createElement('canvas');
            this.canvas.width = BOARD_PX;
            this.canvas.height = BOARD_PX;
            this.canvas.style.cssText = 'cursor:pointer;border:2px solid #333;';
            this.ctx = this.canvas.getContext('2d');
            wrapper.appendChild(this.canvas);

            this.statusEl = document.createElement('div');
            this.statusEl.style.cssText = 'margin-top:8px;font-size:14px;font-weight:bold;color:#333;text-align:center;min-height:24px;';
            wrapper.appendChild(this.statusEl);

            this.btnEl = document.createElement('button');
            this.btnEl.textContent = 'New Game';
            this.btnEl.style.cssText = 'margin-top:8px;padding:6px 18px;font-size:13px;cursor:pointer;border:none;border-radius:4px;background:#769656;color:#fff;font-weight:bold;';
            wrapper.appendChild(this.btnEl);

            containerEl.appendChild(wrapper);

            var self = this;
            var signal = this.abortController.signal;
            this.canvas.addEventListener('click', function (e) { self._onClick(e); }, { signal: signal });
            this.btnEl.addEventListener('click', function () { self._newGame(); }, { signal: signal });

            this._newGame();
        },

        destroy: function () {
            if (this.aiTimeout) { clearTimeout(this.aiTimeout); this.aiTimeout = null; }
            if (this.abortController) { this.abortController.abort(); this.abortController = null; }
            if (this.container) { this.container.innerHTML = ''; }
            this.canvas = null; this.ctx = null; this.container = null;
            this.board = null; this.selected = null; this.validMoves = [];
            this.lastMove = null; this.statusEl = null; this.btnEl = null;
        },

        // -----------------------------------------------------------
        // Game setup
        // -----------------------------------------------------------
        _newGame: function () {
            if (this.aiTimeout) { clearTimeout(this.aiTimeout); this.aiTimeout = null; }
            this.board = initialBoard();
            this.turn = 'w';
            this.selected = null;
            this.validMoves = [];
            this.lastMove = null;
            this.enPassantTarget = null;
            this.castleRights = { wK: true, wQ: true, bK: true, bQ: true };
            this.gameOver = false;
            this.gameOverMsg = '';
            this.inCheck = false;
            this.aiThinking = false;
            this._updateStatus();
            this._draw();
        },

        // -----------------------------------------------------------
        // Click handling (white only)
        // -----------------------------------------------------------
        _onClick: function (e) {
            if (this.gameOver || this.aiThinking || this.turn !== 'w') return;
            var rect = this.canvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var c = Math.floor(x / SQ);
            var r = Math.floor(y / SQ);
            if (r < 0 || r > 7 || c < 0 || c > 7) return;

            if (this.selected) {
                var move = this._findMove(r, c);
                if (move) {
                    this._makeMove(move);
                    this.selected = null;
                    this.validMoves = [];
                    this._afterMove();
                    this._draw();
                    return;
                }
                var piece = this.board[r][c];
                if (piece !== EMPTY && colorOf(piece) === 'w') {
                    this.selected = { r: r, c: c };
                    this.validMoves = this._legalMovesFor(r, c);
                    this._draw();
                    return;
                }
                this.selected = null;
                this.validMoves = [];
                this._draw();
                return;
            }

            var piece = this.board[r][c];
            if (piece !== EMPTY && colorOf(piece) === 'w') {
                this.selected = { r: r, c: c };
                this.validMoves = this._legalMovesFor(r, c);
                this._draw();
            }
        },

        _findMove: function (r, c) {
            for (var i = 0; i < this.validMoves.length; i++) {
                if (this.validMoves[i].r === r && this.validMoves[i].c === c) return this.validMoves[i];
            }
            return null;
        },

        // -----------------------------------------------------------
        // Move execution
        // -----------------------------------------------------------
        _makeMove: function (move) {
            var fr = this.selected ? this.selected.r : move.fr;
            var fc = this.selected ? this.selected.c : move.fc;
            var tr = move.r, tc = move.c;
            var piece = this.board[fr][fc];

            this.lastMove = { fr: fr, fc: fc, tr: tr, tc: tc };
            this.enPassantTarget = null;

            if (move.special === 'ep') {
                var capturedRow = (this.turn === 'w') ? tr + 1 : tr - 1;
                this.board[capturedRow][tc] = EMPTY;
            }
            if (move.special === 'castleK') {
                this.board[fr][7] = EMPTY;
                this.board[fr][5] = (this.turn === 'w') ? W_ROOK : B_ROOK;
            }
            if (move.special === 'castleQ') {
                this.board[fr][0] = EMPTY;
                this.board[fr][3] = (this.turn === 'w') ? W_ROOK : B_ROOK;
            }

            this.board[tr][tc] = piece;
            this.board[fr][fc] = EMPTY;

            if (pieceType(piece) === W_PAWN && Math.abs(tr - fr) === 2) {
                this.enPassantTarget = { r: (fr + tr) / 2, c: fc };
            }
            if (pieceType(piece) === W_PAWN) {
                if (this.turn === 'w' && tr === 0) this.board[tr][tc] = W_QUEEN;
                if (this.turn === 'b' && tr === 7) this.board[tr][tc] = B_QUEEN;
            }

            if (piece === W_KING) { this.castleRights.wK = false; this.castleRights.wQ = false; }
            if (piece === B_KING) { this.castleRights.bK = false; this.castleRights.bQ = false; }
            if (piece === W_ROOK && fr === 7 && fc === 0) this.castleRights.wQ = false;
            if (piece === W_ROOK && fr === 7 && fc === 7) this.castleRights.wK = false;
            if (piece === B_ROOK && fr === 0 && fc === 0) this.castleRights.bQ = false;
            if (piece === B_ROOK && fr === 0 && fc === 7) this.castleRights.bK = false;
            if (tr === 7 && tc === 0) this.castleRights.wQ = false;
            if (tr === 7 && tc === 7) this.castleRights.wK = false;
            if (tr === 0 && tc === 0) this.castleRights.bQ = false;
            if (tr === 0 && tc === 7) this.castleRights.bK = false;
        },

        _afterMove: function () {
            this.turn = (this.turn === 'w') ? 'b' : 'w';
            this.inCheck = this._isInCheck(this.turn);

            if (!this._hasAnyLegalMove(this.turn)) {
                this.gameOver = true;
                if (this.inCheck) {
                    this.gameOverMsg = (this.turn === 'w') ? 'Black wins!' : 'White wins!';
                } else {
                    this.gameOverMsg = 'Draw — Stalemate!';
                }
            }
            this._updateStatus();

            // Trigger AI for black
            if (!this.gameOver && this.turn === 'b') {
                this._triggerAI();
            }
        },

        _triggerAI: function () {
            this.aiThinking = true;
            this.canvas.style.cursor = 'wait';
            var self = this;
            // Small delay so the UI updates before AI thinks
            this.aiTimeout = setTimeout(function () {
                self.aiTimeout = null;
                self._aiMove();
                self.aiThinking = false;
                self.canvas.style.cursor = 'pointer';
            }, 300);
        },

        _updateStatus: function () {
            if (!this.statusEl) return;
            if (this.gameOver) {
                this.statusEl.textContent = this.gameOverMsg;
            } else if (this.aiThinking) {
                this.statusEl.textContent = 'Computer is thinking...';
            } else {
                var checkStr = this.inCheck ? ' (Check!)' : '';
                this.statusEl.textContent = (this.turn === 'w' ? 'Your turn (White)' : 'Computer thinking...') + checkStr;
            }
        },

        // -----------------------------------------------------------
        // AI (Minimax with Alpha-Beta pruning)
        // -----------------------------------------------------------
        _aiMove: function () {
            var bestScore = -Infinity;
            var bestFrom = null;
            var bestMove = null;

            // Gather all legal moves for black
            for (var r = 0; r < 8; r++) {
                for (var c = 0; c < 8; c++) {
                    if (colorOf(this.board[r][c]) !== 'b') continue;
                    var moves = this._legalMovesFor(r, c);
                    for (var i = 0; i < moves.length; i++) {
                        var m = moves[i];
                        // Save state
                        var savedBoard = cloneBoard(this.board);
                        var savedEP = this.enPassantTarget;
                        var savedCR = { wK: this.castleRights.wK, wQ: this.castleRights.wQ, bK: this.castleRights.bK, bQ: this.castleRights.bQ };
                        var savedSelected = this.selected;

                        this.selected = { r: r, c: c };
                        this._makeMove(m);

                        var score = this._minimax(AI_DEPTH - 1, -Infinity, Infinity, false);

                        // Restore state
                        this.board = savedBoard;
                        this.enPassantTarget = savedEP;
                        this.castleRights = savedCR;
                        this.selected = savedSelected;

                        if (score > bestScore) {
                            bestScore = score;
                            bestFrom = { r: r, c: c };
                            bestMove = m;
                        }
                    }
                }
            }

            if (bestMove && bestFrom) {
                this.selected = bestFrom;
                this._makeMove(bestMove);
                this.selected = null;
                this.validMoves = [];
                this._afterMoveNoAI();
                this._draw();
            }
        },

        // After AI move, switch turn but don't re-trigger AI
        _afterMoveNoAI: function () {
            this.turn = (this.turn === 'w') ? 'b' : 'w';
            this.inCheck = this._isInCheck(this.turn);

            if (!this._hasAnyLegalMove(this.turn)) {
                this.gameOver = true;
                if (this.inCheck) {
                    this.gameOverMsg = (this.turn === 'w') ? 'You lose!' : 'You win!';
                } else {
                    this.gameOverMsg = 'Draw — Stalemate!';
                }
            }
            this._updateStatus();
        },

        _minimax: function (depth, alpha, beta, isMaximizing) {
            if (depth === 0) return this._evaluate();

            var color = isMaximizing ? 'b' : 'w';

            // Check for no legal moves
            var hasMove = false;

            if (isMaximizing) {
                var maxEval = -Infinity;
                for (var r = 0; r < 8; r++) {
                    for (var c = 0; c < 8; c++) {
                        if (colorOf(this.board[r][c]) !== 'b') continue;
                        var moves = this._legalMovesForAI(r, c, color);
                        for (var i = 0; i < moves.length; i++) {
                            hasMove = true;
                            var m = moves[i];
                            var savedBoard = cloneBoard(this.board);
                            var savedEP = this.enPassantTarget;
                            var savedCR = { wK: this.castleRights.wK, wQ: this.castleRights.wQ, bK: this.castleRights.bK, bQ: this.castleRights.bQ };
                            var savedTurn = this.turn;
                            var savedSelected = this.selected;

                            this.turn = 'b';
                            this.selected = { r: r, c: c };
                            this._makeMove(m);

                            var evl = this._minimax(depth - 1, alpha, beta, false);

                            this.board = savedBoard;
                            this.enPassantTarget = savedEP;
                            this.castleRights = savedCR;
                            this.turn = savedTurn;
                            this.selected = savedSelected;

                            if (evl > maxEval) maxEval = evl;
                            if (evl > alpha) alpha = evl;
                            if (beta <= alpha) return maxEval;
                        }
                    }
                }
                if (!hasMove) {
                    if (this._isInCheckOnBoard('b', this.board)) return -90000 + (AI_DEPTH - depth);
                    return 0;
                }
                return maxEval;
            } else {
                var minEval = Infinity;
                for (var r = 0; r < 8; r++) {
                    for (var c = 0; c < 8; c++) {
                        if (colorOf(this.board[r][c]) !== 'w') continue;
                        var moves = this._legalMovesForAI(r, c, color);
                        for (var i = 0; i < moves.length; i++) {
                            hasMove = true;
                            var m = moves[i];
                            var savedBoard = cloneBoard(this.board);
                            var savedEP = this.enPassantTarget;
                            var savedCR = { wK: this.castleRights.wK, wQ: this.castleRights.wQ, bK: this.castleRights.bK, bQ: this.castleRights.bQ };
                            var savedTurn = this.turn;
                            var savedSelected = this.selected;

                            this.turn = 'w';
                            this.selected = { r: r, c: c };
                            this._makeMove(m);

                            var evl = this._minimax(depth - 1, alpha, beta, true);

                            this.board = savedBoard;
                            this.enPassantTarget = savedEP;
                            this.castleRights = savedCR;
                            this.turn = savedTurn;
                            this.selected = savedSelected;

                            if (evl < minEval) minEval = evl;
                            if (evl < beta) beta = evl;
                            if (beta <= alpha) return minEval;
                        }
                    }
                }
                if (!hasMove) {
                    if (this._isInCheckOnBoard('w', this.board)) return 90000 - (AI_DEPTH - depth);
                    return 0;
                }
                return minEval;
            }
        },

        // Simplified legal moves for AI (no need to track castleRights in deep search for speed)
        _legalMovesForAI: function (r, c, turnColor) {
            var piece = this.board[r][c];
            if (piece === EMPTY) return [];
            var color = colorOf(piece);
            var pseudos = this._pseudoMovesFor(r, c, this.board, this.castleRights, this.enPassantTarget);
            var legal = [];
            var enemy = (color === 'w') ? 'b' : 'w';

            for (var i = 0; i < pseudos.length; i++) {
                var m = pseudos[i];
                if (m.special === 'castleK' || m.special === 'castleQ') {
                    if (this._isInCheckOnBoard(color, this.board)) continue;
                    var midC = m.special === 'castleK' ? 5 : 3;
                    if (this._isSquareAttacked(r, midC, enemy, this.board)) continue;
                    if (this._isSquareAttacked(m.r, m.c, enemy, this.board)) continue;
                }
                var simBoard = this._simulateMove(r, c, m.r, m.c, m.special, this.board);
                if (!this._isInCheckOnBoard(color, simBoard)) {
                    legal.push(m);
                }
            }
            return legal;
        },

        _evaluate: function () {
            // Positive = good for black, negative = good for white
            var score = 0;
            for (var r = 0; r < 8; r++) {
                for (var c = 0; c < 8; c++) {
                    var p = this.board[r][c];
                    if (p === EMPTY) continue;
                    var type = pieceType(p);
                    var val = PIECE_VALUES[type] || 0;
                    var pst = PST[type];
                    if (isWhite(p)) {
                        score -= val;
                        if (pst) score -= pst[r * 8 + c];
                    } else {
                        score += val;
                        // Flip table for black (mirror vertically)
                        if (pst) score += pst[(7 - r) * 8 + c];
                    }
                }
            }
            return score;
        },

        // -----------------------------------------------------------
        // Move generation
        // -----------------------------------------------------------
        _pseudoMovesFor: function (r, c, board, castleRights, enPassantTarget) {
            var piece = board[r][c];
            if (piece === EMPTY) return [];
            var color = colorOf(piece);
            var type = pieceType(piece);
            var moves = [];

            function addIfValid(tr, tc, special) {
                if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return false;
                var target = board[tr][tc];
                if (target !== EMPTY && colorOf(target) === color) return false;
                moves.push({ r: tr, c: tc, special: special || null });
                return target === EMPTY;
            }

            function slide(dr, dc) {
                for (var i = 1; i <= 7; i++) {
                    if (!addIfValid(r + dr * i, c + dc * i)) break;
                }
            }

            if (type === W_PAWN) {
                var dir = (color === 'w') ? -1 : 1;
                var startRow = (color === 'w') ? 6 : 1;
                if (r + dir >= 0 && r + dir <= 7 && board[r + dir][c] === EMPTY) {
                    moves.push({ r: r + dir, c: c, special: null });
                    if (r === startRow && board[r + 2 * dir][c] === EMPTY) {
                        moves.push({ r: r + 2 * dir, c: c, special: null });
                    }
                }
                for (var dc = -1; dc <= 1; dc += 2) {
                    var tr = r + dir, tc = c + dc;
                    if (tc < 0 || tc > 7 || tr < 0 || tr > 7) continue;
                    if (board[tr][tc] !== EMPTY && colorOf(board[tr][tc]) !== color) {
                        moves.push({ r: tr, c: tc, special: null });
                    }
                    if (enPassantTarget && enPassantTarget.r === tr && enPassantTarget.c === tc) {
                        moves.push({ r: tr, c: tc, special: 'ep' });
                    }
                }
            } else if (type === W_KNIGHT) {
                var offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
                for (var i = 0; i < offsets.length; i++) addIfValid(r + offsets[i][0], c + offsets[i][1]);
            } else if (type === W_BISHOP) {
                slide(-1,-1); slide(-1,1); slide(1,-1); slide(1,1);
            } else if (type === W_ROOK) {
                slide(-1,0); slide(1,0); slide(0,-1); slide(0,1);
            } else if (type === W_QUEEN) {
                slide(-1,-1); slide(-1,1); slide(1,-1); slide(1,1);
                slide(-1,0); slide(1,0); slide(0,-1); slide(0,1);
            } else if (type === W_KING) {
                for (var dr = -1; dr <= 1; dr++) {
                    for (var dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        addIfValid(r + dr, c + dc);
                    }
                }
                if (castleRights) {
                    if (color === 'w') {
                        if (castleRights.wK && board[7][5] === EMPTY && board[7][6] === EMPTY && board[7][7] === W_ROOK && r === 7 && c === 4)
                            moves.push({ r: 7, c: 6, special: 'castleK' });
                        if (castleRights.wQ && board[7][3] === EMPTY && board[7][2] === EMPTY && board[7][1] === EMPTY && board[7][0] === W_ROOK && r === 7 && c === 4)
                            moves.push({ r: 7, c: 2, special: 'castleQ' });
                    } else {
                        if (castleRights.bK && board[0][5] === EMPTY && board[0][6] === EMPTY && board[0][7] === B_ROOK && r === 0 && c === 4)
                            moves.push({ r: 0, c: 6, special: 'castleK' });
                        if (castleRights.bQ && board[0][3] === EMPTY && board[0][2] === EMPTY && board[0][1] === EMPTY && board[0][0] === B_ROOK && r === 0 && c === 4)
                            moves.push({ r: 0, c: 2, special: 'castleQ' });
                    }
                }
            }
            return moves;
        },

        _findKing: function (color, board) {
            var king = (color === 'w') ? W_KING : B_KING;
            for (var r = 0; r < 8; r++) {
                for (var c = 0; c < 8; c++) {
                    if (board[r][c] === king) return { r: r, c: c };
                }
            }
            return null;
        },

        _isSquareAttacked: function (r, c, byColor, board) {
            for (var row = 0; row < 8; row++) {
                for (var col = 0; col < 8; col++) {
                    var p = board[row][col];
                    if (p === EMPTY || colorOf(p) !== byColor) continue;
                    var type = pieceType(p);

                    if (type === W_PAWN) {
                        var dir = (byColor === 'w') ? -1 : 1;
                        if (row + dir === r && (col - 1 === c || col + 1 === c)) return true;
                    } else if (type === W_KNIGHT) {
                        var dr = Math.abs(row - r), dc = Math.abs(col - c);
                        if ((dr === 2 && dc === 1) || (dr === 1 && dc === 2)) return true;
                    } else if (type === W_KING) {
                        if (Math.abs(row - r) <= 1 && Math.abs(col - c) <= 1) return true;
                    } else if (type === W_BISHOP || type === W_QUEEN) {
                        if (Math.abs(row - r) === Math.abs(col - c) && row !== r) {
                            var stepR = (r - row) / Math.abs(r - row);
                            var stepC = (c - col) / Math.abs(c - col);
                            var blocked = false;
                            for (var i = 1; i < Math.abs(r - row); i++) {
                                if (board[row + stepR * i][col + stepC * i] !== EMPTY) { blocked = true; break; }
                            }
                            if (!blocked) return true;
                        }
                        if (type === W_BISHOP) continue;
                    }
                    if (type === W_ROOK || type === W_QUEEN) {
                        if (row === r && col !== c) {
                            var step = (c - col) / Math.abs(c - col);
                            var blocked = false;
                            for (var i = 1; i < Math.abs(c - col); i++) {
                                if (board[row][col + step * i] !== EMPTY) { blocked = true; break; }
                            }
                            if (!blocked) return true;
                        }
                        if (col === c && row !== r) {
                            var step = (r - row) / Math.abs(r - row);
                            var blocked = false;
                            for (var i = 1; i < Math.abs(r - row); i++) {
                                if (board[row + step * i][col] !== EMPTY) { blocked = true; break; }
                            }
                            if (!blocked) return true;
                        }
                    }
                }
            }
            return false;
        },

        _isInCheck: function (color) {
            return this._isInCheckOnBoard(color, this.board);
        },

        _isInCheckOnBoard: function (color, board) {
            var king = this._findKing(color, board);
            if (!king) return false;
            var enemy = (color === 'w') ? 'b' : 'w';
            return this._isSquareAttacked(king.r, king.c, enemy, board);
        },

        _simulateMove: function (fr, fc, tr, tc, special, board) {
            var b = cloneBoard(board);
            var piece = b[fr][fc];
            if (special === 'ep') {
                var dir = isWhite(piece) ? 1 : -1;
                b[tr + dir][tc] = EMPTY;
            }
            if (special === 'castleK') {
                b[fr][7] = EMPTY;
                b[fr][5] = isWhite(piece) ? W_ROOK : B_ROOK;
            }
            if (special === 'castleQ') {
                b[fr][0] = EMPTY;
                b[fr][3] = isWhite(piece) ? W_ROOK : B_ROOK;
            }
            b[tr][tc] = piece;
            b[fr][fc] = EMPTY;
            if (pieceType(piece) === W_PAWN) {
                if (isWhite(piece) && tr === 0) b[tr][tc] = W_QUEEN;
                if (isBlack(piece) && tr === 7) b[tr][tc] = B_QUEEN;
            }
            return b;
        },

        _legalMovesFor: function (r, c) {
            var piece = this.board[r][c];
            if (piece === EMPTY) return [];
            var color = colorOf(piece);
            var pseudos = this._pseudoMovesFor(r, c, this.board, this.castleRights, this.enPassantTarget);
            var legal = [];
            var enemy = (color === 'w') ? 'b' : 'w';

            for (var i = 0; i < pseudos.length; i++) {
                var m = pseudos[i];
                if (m.special === 'castleK' || m.special === 'castleQ') {
                    if (this._isInCheckOnBoard(color, this.board)) continue;
                    var midC = m.special === 'castleK' ? 5 : 3;
                    if (this._isSquareAttacked(r, midC, enemy, this.board)) continue;
                    if (this._isSquareAttacked(m.r, m.c, enemy, this.board)) continue;
                }
                var simBoard = this._simulateMove(r, c, m.r, m.c, m.special, this.board);
                if (!this._isInCheckOnBoard(color, simBoard)) {
                    legal.push(m);
                }
            }
            return legal;
        },

        _hasAnyLegalMove: function (color) {
            for (var r = 0; r < 8; r++) {
                for (var c = 0; c < 8; c++) {
                    if (colorOf(this.board[r][c]) === color) {
                        if (this._legalMovesFor(r, c).length > 0) return true;
                    }
                }
            }
            return false;
        },

        // -----------------------------------------------------------
        // Drawing
        // -----------------------------------------------------------
        _draw: function () {
            var ctx = this.ctx;
            if (!ctx) return;

            for (var r = 0; r < 8; r++) {
                for (var c = 0; c < 8; c++) {
                    var isLight = (r + c) % 2 === 0;
                    ctx.fillStyle = isLight ? '#EEEED2' : '#769656';

                    if (this.lastMove) {
                        if ((r === this.lastMove.fr && c === this.lastMove.fc) ||
                            (r === this.lastMove.tr && c === this.lastMove.tc)) {
                            ctx.fillStyle = isLight ? '#F6F669' : '#BACA2B';
                        }
                    }
                    if (this.selected && this.selected.r === r && this.selected.c === c) {
                        ctx.fillStyle = '#F6F669';
                    }
                    ctx.fillRect(c * SQ, r * SQ, SQ, SQ);

                    if (this.inCheck) {
                        var king = (this.turn === 'w') ? W_KING : B_KING;
                        if (this.board[r][c] === king) {
                            ctx.fillStyle = 'rgba(235, 50, 50, 0.55)';
                            ctx.fillRect(c * SQ, r * SQ, SQ, SQ);
                        }
                    }
                }
            }

            for (var i = 0; i < this.validMoves.length; i++) {
                var m = this.validMoves[i];
                var isCapture = this.board[m.r][m.c] !== EMPTY || m.special === 'ep';
                ctx.beginPath();
                if (isCapture) {
                    ctx.arc(m.c * SQ + SQ / 2, m.r * SQ + SQ / 2, SQ / 2 - 4, 0, Math.PI * 2);
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
                    ctx.stroke();
                } else {
                    ctx.arc(m.c * SQ + SQ / 2, m.r * SQ + SQ / 2, 8, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                    ctx.fill();
                }
            }

            ctx.font = '40px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (var r = 0; r < 8; r++) {
                for (var c = 0; c < 8; c++) {
                    var p = this.board[r][c];
                    if (p !== EMPTY) {
                        var ch = PIECE_UNICODE[p];
                        ctx.fillStyle = 'rgba(0,0,0,0.2)';
                        ctx.fillText(ch, c * SQ + SQ / 2 + 1, r * SQ + SQ / 2 + 2);
                        ctx.fillStyle = isWhite(p) ? '#FFFFFF' : '#000000';
                        ctx.fillText(ch, c * SQ + SQ / 2, r * SQ + SQ / 2 + 1);
                    }
                }
            }

            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            var files = 'abcdefgh';
            for (var c = 0; c < 8; c++) {
                var isLight = (7 + c) % 2 === 0;
                ctx.fillStyle = isLight ? '#769656' : '#EEEED2';
                ctx.fillText(files[c], c * SQ + SQ - 12, 7 * SQ + SQ - 14);
            }
            ctx.textAlign = 'right';
            for (var r = 0; r < 8; r++) {
                var isLight = (r) % 2 === 0;
                ctx.fillStyle = isLight ? '#769656' : '#EEEED2';
                ctx.fillText(String(8 - r), 10, r * SQ + 3);
            }
        },
    };

    window.ChessApp = ChessApp;
})();
