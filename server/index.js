const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", {message : "♟️ Chess Game ♙"});
});




io.on("connection", (socket) => {
    console.log("connected");

    if(!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if(!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole")
    }

    socket.on("move", (move) => {
        try {
            // check for valid move and turn 
            console.log(`${currentPlayer}`, players)
            if(chess.turn() === 'w' && socket.id !== players.white) return;
            if(chess.turn() === 'b' && socket.id !== players.black) return;

            const result = chess.move(move);
            if(result) {
                let message = "";
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
                if(chess.isCheck()) {
                    message = currentPlayer === "w" ? "Black gives check to White" : "White gives check to Black";
                    // io.emit("displayMessage", message)
                }
                if (chess.isGameOver()) {
                if (chess.isCheckmate()) {
                    message = currentPlayer === "w" ? "Black Wins by Checkmate" : "White Wins by Checkmate";
                } else if (chess.isDraw()) {
                    message = "Game Draw!";
                }
                    // io.emit("displayMessage", message)
                }
                io.emit("displayMessage", message)
              
            } else {
                console.log("Invalid Move", move);
                socket.emit("invalidMove", move);
            }
        } catch (error) {
            console.log("Error processing move:", error);
            socket.emit("invalidMove", move);
        }
    })

    socket.on("disconnect", () => {
        if(socket.id === players.white) {
            delete players.white;
        }
        else if(socket.id === players.black) {
            delete players.black;
        }
        console.log(players);
    })
})


server.listen(5000, () => {
    console.log("Server Listening");
})