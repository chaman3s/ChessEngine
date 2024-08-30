// Import necessary modules
const express = require('express');
const { Chess } = require('chess.js');
const pgnParser = require('pgn-parser');

// Import custom modules
const analyse = require('./lib/analysis');

// Initialize the Express application
const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies

// Utility function to validate and parse PGN
const parsePGN = (pgn) => {
    if (!pgn) throw new Error("PGN is required.");
    const [parsedPGN] = pgnParser.parse(pgn);
    if (!parsedPGN) throw new Error("Invalid PGN.");
    return parsedPGN;
};

// Utility function to process moves and generate positions
const generatePositions = (parsedPGN) => {
    const board = new Chess();
    const positions = [{ fen: board.fen() }]; // Initial position

    for (const pgnMove of parsedPGN.moves) {
        const moveSAN = pgnMove.move;
        const move = board.move(moveSAN);

        if (!move) throw new Error("PGN contains illegal moves.");

        positions.push({
            fen: board.fen(),
            move: {
                san: moveSAN,
                uci: move.from + move.to,
            },
        });
    }

    return positions;
};

// /parse route to parse PGN and return positions
app.post('/parse', (req, res) => {
    try {
        const { pgn } = req.body;
        const parsedPGN = parsePGN(pgn);
        const positions = generatePositions(parsedPGN);
        res.json({ positions });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// /report route to generate analysis report
app.post('/report', async (req, res) => {
    try {
        const { positions } = req.body;
        if (!positions) throw new Error("Positions parameter is required.");

        const results = await analyse(positions);
        res.json({ results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to generate report." });
    }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
