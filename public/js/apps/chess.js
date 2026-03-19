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

    function isWhite(p) { return p >= W_PAWN && p <= W_KING; }
    function isBlack(p) { return p >= B_PAWN && p <= B_KING; }
    function colorOf(p) { if (isWhite(p)) return 'w'; if (isBlack(p)) return 'b'; return null; }
    function pieceType(p) {
        if (p === EMPTY) return null;
        if (isWhite(p)) return p;            // 1-6
        return p - 6;                         // map 7-12 -> 1-6
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

    const ChessApp = {
        canvas: null,
        ctx: null,
        container: null,
        abortController: null,
        board: null,
        turn: 'w',
        selected: null,       // {r, c}
        validMoves: [],       // [{r, c, special?}]
        lastMove: null,       // {fr, fc, tr, tc}
        enPassantTarget: null, // {r, c} square where en passant capture is possible
        castleRights: null,    // { wK, wQ, bK, bQ }
        gameOver: false,
        gameOverMsg: '',
        inCheck: false,
        statusEl: null,
        btnEl: null,

        // -----------------------------------------------------------
        // Lifecycle
        // -----------------------------------------------------------
        init: function (containerEl) {
            this.container = containerEl;
            this.abortController = new AbortController();

            // Wrapper
            var wrapper = document.createElement('div');
            wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:8px;user-select:none;';

            // Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.width = BOARD_PX;
            this.canvas.height = BOARD_PX;
            this.canvas.style.cssText = 'cursor:pointer;border:2px solid #333;';
            this.ctx = this.canvas.getContext('2d');
            wrapper.appendChild(this.canvas);

            // Status
            this.statusEl = document.createElement('div');
            this.statusEl.style.cssText = 'margin-top:8px;font-size:16px;font-weight:bold;color:#eee;text-align:center;min-height:24px;';
            wrapper.appendChild(this.statusEl);

            // New Game button
            this.btnEl = document.createElement('button');
            this.btnEl.textContent = 'New Game';
            this.btnEl.style.cssText = 'margin-top:8px;padding:6px 18px;font-size:14px;cursor:pointer;border:none;border-radius:4px;background:#769656;color:#fff;font-weight:bold;';
            wrapper.appendChild(this.btnEl);

            containerEl.appendChild(wrapper);

            // Event listeners
            var self = this;
            var signal = this.abortController.signal;
            this.canvas.addEventListener('click', function (e) { self._onClick(e); }, { signal: signal });
            this.btnEl.addEventListener('click', function () { self._newGame(); }, { signal: signal });

            this._newGame();
        },

        destroy: function () {
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }
            if (this.container) {
                this.container.innerHTML = '';
            }
            this.canvas = null;
            this.ctx = null;
            this.container = null;
            this.board = null;
            this.selected = null;
            this.validMoves = [];
            this.lastMove = null;
            this.statusEl = null;
            this.btnEl = null;
        },

        // -----------------------------------------------------------
        // Game setup
        // -----------------------------------------------------------
        _newGame: function () {
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
            this._updateStatus();
            this._draw();
        },

        // -----------------------------------------------------------
        // Click handling
        // -----------------------------------------------------------
        _onClick: function (e) {
            if (this.gameOver) return;
            var rect = this.canvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var c = Math.floor(x / SQ);
            var r = Math.floor(y / SQ);
            if (r < 0 || r > 7 || c < 0 || c > 7) return;

            // If a piece is already selected, try to move
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
                // Clicked on own piece -> reselect
                var piece = this.board[r][c];
                if (piece !== EMPTY && colorOf(piece) === this.turn) {
                    this.selected = { r: r, c: c };
                    this.validMoves = this._legalMovesFor(r, c);
                    this._draw();
                    return;
                }
                // Deselect
                this.selected = null;
                this.validMoves = [];
                this._draw();
                return;
            }

            // Select a piece
            var piece = this.board[r][c];
            if (piece !== EMPTY && colorOf(piece) === this.turn) {
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
            var fr = this.selected.r, fc = this.selected.c;
            var tr = move.r, tc = move.c;
            var piece = this.board[fr][fc];
            var captured = this.board[tr][tc];

            this.lastMove = { fr: fr, fc: fc, tr: tr, tc: tc };
            this.enPassantTarget = null;

            // En passant capture
            if (move.special === 'ep') {
                var capturedRow = (this.turn === 'w') ? tr + 1 : tr - 1;
                this.board[capturedRow][tc] = EMPTY;
            }

            // Castling
            if (move.special === 'castleK') {
                this.board[fr][7] = EMPTY;
                this.board[fr][5] = (this.turn === 'w') ? W_ROOK : B_ROOK;
            }
            if (move.special === 'castleQ') {
                this.board[fr][0] = EMPTY;
                this.board[fr][3] = (this.turn === 'w') ? W_ROOK : B_ROOK;
            }

            // Move piece
            this.board[tr][tc] = piece;
            this.board[fr][fc] = EMPTY;

            // Pawn double move -> set en passant target
            if (pieceType(piece) === W_PAWN && Math.abs(tr - fr) === 2) {
                this.enPassantTarget = { r: (fr + tr) / 2, c: fc };
            }

            // Pawn promotion (auto-queen)
            if (pieceType(piece) === W_PAWN) {
                if (this.turn === 'w' && tr === 0) this.board[tr][tc] = W_QUEEN;
                if (this.turn === 'b' && tr === 7) this.board[tr][tc] = B_QUEEN;
            }

            // Update castling rights
            if (piece === W_KING) { this.castleRights.wK = false; this.castleRights.wQ = false; }
            if (piece === B_KING) { this.castleRights.bK = false; this.castleRights.bQ = false; }
            if (piece === W_ROOK && fr === 7 && fc === 0) this.castleRights.wQ = false;
            if (piece === W_ROOK && fr === 7 && fc === 7) this.castleRights.wK = false;
            if (piece === B_ROOK && fr === 0 && fc === 0) this.castleRights.bQ = false;
            if (piece === B_ROOK && fr === 0 && fc === 7) this.castleRights.bK = false;
            // If a rook is captured on its starting square
            if (tr === 7 && tc === 0) this.castleRights.wQ = false;
            if (tr === 7 && tc === 7) this.castleRights.wK = false;
            if (tr === 0 && tc === 0) this.castleRights.bQ = false;
            if (tr === 0 && tc === 7) this.castleRights.bK = false;
        },

        _afterMove: function () {
            // Switch turn
            this.turn = (this.turn === 'w') ? 'b' : 'w';

            // Check detection
            this.inCheck = this._isInCheck(this.turn);

            // Checkmate / stalemate
            if (!this._hasAnyLegalMove(this.turn)) {
                this.gameOver = true;
                if (this.inCheck) {
                    this.gameOverMsg = (this.turn === 'w') ? 'Black wins!' : 'White wins!';
                } else {
                    this.gameOverMsg = 'Draw!';
                }
            }

            this._updateStatus();
        },

        _updateStatus: function () {
            if (!this.statusEl) return;
            if (this.gameOver) {
                this.statusEl.textContent = this.gameOverMsg;
            } else {
                var checkStr = this.inCheck ? ' (Check!)' : '';
                this.statusEl.textContent = (this.turn === 'w' ? 'White' : 'Black') + ' to move' + checkStr;
            }
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
            var self = this;

            function addIfValid(tr, tc, special) {
                if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return false;
                var target = board[tr][tc];
                if (target !== EMPTY && colorOf(target) === color) return false;
                moves.push({ r: tr, c: tc, special: special || null });
                return target === EMPTY; // return true if square was empty (for sliding)
            }

            function slide(dr, dc) {
                for (var i = 1; i <= 7; i++) {
                    if (!addIfValid(r + dr * i, c + dc * i)) break;
                }
            }

            if (type === W_PAWN) {
                var dir = (color === 'w') ? -1 : 1;
                var startRow = (color === 'w') ? 6 : 1;
                // Forward
                if (r + dir >= 0 && r + dir <= 7 && board[r + dir][c] === EMPTY) {
                    moves.push({ r: r + dir, c: c, special: null });
                    // Double move
                    if (r === startRow && board[r + 2 * dir][c] === EMPTY) {
                        moves.push({ r: r + 2 * dir, c: c, special: null });
                    }
                }
                // Captures
                for (var dc = -1; dc <= 1; dc += 2) {
                    var tr = r + dir, tc = c + dc;
                    if (tc < 0 || tc > 7 || tr < 0 || tr > 7) continue;
                    if (board[tr][tc] !== EMPTY && colorOf(board[tr][tc]) !== color) {
                        moves.push({ r: tr, c: tc, special: null });
                    }
                    // En passant
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
                // Castling
                if (castleRights) {
                    if (color === 'w') {
                        if (castleRights.wK && board[7][5] === EMPTY && board[7][6] === EMPTY &&
                            board[7][7] === W_ROOK && r === 7 && c === 4) {
                            moves.push({ r: 7, c: 6, special: 'castleK' });
                        }
                        if (castleRights.wQ && board[7][3] === EMPTY && board[7][2] === EMPTY &&
                            board[7][1] === EMPTY && board[7][0] === W_ROOK && r === 7 && c === 4) {
                            moves.push({ r: 7, c: 2, special: 'castleQ' });
                        }
                    } else {
                        if (castleRights.bK && board[0][5] === EMPTY && board[0][6] === EMPTY &&
                            board[0][7] === B_ROOK && r === 0 && c === 4) {
                            moves.push({ r: 0, c: 6, special: 'castleK' });
                        }
                        if (castleRights.bQ && board[0][3] === EMPTY && board[0][2] === EMPTY &&
                            board[0][1] === EMPTY && board[0][0] === B_ROOK && r === 0 && c === 4) {
                            moves.push({ r: 0, c: 2, special: 'castleQ' });
                        }
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
            // Check if square (r,c) is attacked by any piece of byColor
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
            // Promotion
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

                // Castling: king must not be in check, must not pass through check
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

            // Draw squares
            for (var r = 0; r < 8; r++) {
                for (var c = 0; c < 8; c++) {
                    var isLight = (r + c) % 2 === 0;
                    ctx.fillStyle = isLight ? '#EEEED2' : '#769656';

                    // Last move highlight
                    if (this.lastMove) {
                        if ((r === this.lastMove.fr && c === this.lastMove.fc) ||
                            (r === this.lastMove.tr && c === this.lastMove.tc)) {
                            ctx.fillStyle = isLight ? '#F6F669' : '#BACA2B';
                        }
                    }

                    // Selected piece highlight
                    if (this.selected && this.selected.r === r && this.selected.c === c) {
                        ctx.fillStyle = '#F6F669';
                    }

                    ctx.fillRect(c * SQ, r * SQ, SQ, SQ);

                    // Check highlight on king
                    if (this.inCheck) {
                        var king = (this.turn === 'w') ? W_KING : B_KING;
                        if (this.board[r][c] === king) {
                            ctx.fillStyle = 'rgba(235, 50, 50, 0.55)';
                            ctx.fillRect(c * SQ, r * SQ, SQ, SQ);
                        }
                    }
                }
            }

            // Draw valid move indicators
            for (var i = 0; i < this.validMoves.length; i++) {
                var m = this.validMoves[i];
                var isCapture = this.board[m.r][m.c] !== EMPTY || m.special === 'ep';
                ctx.beginPath();
                if (isCapture) {
                    // Ring on capture squares
                    ctx.arc(m.c * SQ + SQ / 2, m.r * SQ + SQ / 2, SQ / 2 - 4, 0, Math.PI * 2);
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
                    ctx.stroke();
                } else {
                    // Dot on empty squares
                    ctx.arc(m.c * SQ + SQ / 2, m.r * SQ + SQ / 2, 8, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                    ctx.fill();
                }
            }

            // Draw pieces
            ctx.font = '40px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (var r = 0; r < 8; r++) {
                for (var c = 0; c < 8; c++) {
                    var p = this.board[r][c];
                    if (p !== EMPTY) {
                        var ch = PIECE_UNICODE[p];
                        // Draw a subtle shadow for better visibility
                        ctx.fillStyle = 'rgba(0,0,0,0.2)';
                        ctx.fillText(ch, c * SQ + SQ / 2 + 1, r * SQ + SQ / 2 + 2);
                        ctx.fillStyle = isWhite(p) ? '#FFFFFF' : '#000000';
                        ctx.fillText(ch, c * SQ + SQ / 2, r * SQ + SQ / 2 + 1);
                    }
                }
            }

            // Rank / file labels
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
