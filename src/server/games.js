const express = require('express');
const router = express.Router();
const auth = require('./auth');
const GameLogic = require('./GameLogic.js');

const gamesList = [];
let gameId = 1;
const gamesManagement = express.Router();

gamesManagement.get('/allGames', auth.userAuthentication, (req, res) => {
    res.json(gamesList);
});

gamesManagement.get('/getGameById', (req, res) => {
    const id = req.query.id;
    const currentGame = gamesList.find(game => game.id === Number(id));
    res.json(currentGame);
});

gamesManagement.post('/addGame', auth.userAuthentication, (req, res) => {
    const bodyObj = JSON.parse(req.body);
    const currentGame = gamesList.find(game => game.name === bodyObj.name);

    if (!bodyObj.name) {
        res.status(401).send('game name empty');
        return;
    }
    else if (currentGame) {
        res.status(403).send('game name already exists');
        return;
    }

    bodyObj.id = gameId;
    gameId++;
    gamesList.push(bodyObj);
    res.sendStatus(201);
});

gamesManagement.post('/updateGameData', (req, res) => {
    const bodyObj = JSON.parse(req.body);
    const gameIndex = gamesList.findIndex(game => game.name === bodyObj.name);
    gamesList[gameIndex] = bodyObj;
    res.sendStatus(201);
});

gamesManagement.post('/removeGame', (req, res) => {
    const gameIndex = findGameIndex(req);
    gamesList.splice(gameIndex, 1);
    res.sendStatus(201);
});

function findGameIndex(req) {
    const bodyObj = JSON.parse(req.body);
    return gamesList.findIndex(game => game.name === bodyObj.name);
}

gamesManagement.get('/getGameDataById', (req, res) => {
    const id = req.query.id;
    const currentGame = gamesList.find(game => game.id === Number(id));
    res.json(currentGame.gameData);
});

gamesManagement.get('/createGame', (req, res) => {
    const id = req.query.id;
    const currentGame = gamesList.find(game => game.id === Number(id));
    createGame(currentGame);
    res.sendStatus(201);
});

gamesManagement.post('/checkCard', (req, res) => {
    const bodyObj = JSON.parse(req.body);
    const currentGame = findCurrGame(bodyObj.gameToCheck);
    const userName = bodyObj.gameToCheck.userName;
    GameLogic.checkCard(bodyObj.card, userName, currentGame.gameData);
    res.sendStatus(200);

});

gamesManagement.post('/setColorToTopCard', (req, res) => {
    const bodyObj = JSON.parse(req.body);
    const currentGame = findCurrGame(bodyObj.gameToCheck);
    GameLogic.setColorToTopCard(bodyObj.color, currentGame.gameData);
    res.sendStatus(200);

});

gamesManagement.post('/imDoneButtonClicked', (req, res) => {
    const bodyObj = JSON.parse(req.body);
    const currentGame = findCurrGame(bodyObj);
    GameLogic.imDoneButtonClicked(currentGame.gameData);
    res.sendStatus(200);
});

function findCurrGame(bodyObj) {
    const gameId = bodyObj.gameId;
    return gamesList.find(game => game.id === Number(gameId));
}


gamesManagement.post('/updatePlayerWatcher', (req, res) => {
    const bodyObj = JSON.parse(req.body);
    const userName = bodyObj.userName;
    const gameIndex = gamesList.findIndex(game => game.id === Number(bodyObj.gameId));
    const playerIndex = gamesList[gameIndex].gameData.players.findIndex(player => player.name === userName)
    gamesList[gameIndex].gameData.players[playerIndex].watcher = true;

    res.sendStatus(200);
});


gamesManagement.post('/checkStatusOnTableDeckClicked', (req, res) => {
    const bodyObj = JSON.parse(req.body);
    const currentGame = findCurrGame(bodyObj);
    const userName = bodyObj.userName;
    GameLogic.checkStatusOnTableDeckClicked(userName, currentGame.gameData);
    res.sendStatus(200);
});

gamesManagement.post('/updateActivePlayers', (req, res) => {
    const bodyObj = JSON.parse(req.body);
    const gameIndex = gamesList.findIndex(game => game.id === Number(bodyObj.gameId));
    gamesList[gameIndex].gameData.numOfActivePlayers--;
    if (gamesList[gameIndex].gameData.numOfActivePlayers === 0) {
        gamesList[gameIndex].Active = false;
        gamesList[gameIndex].gameData = { playersName: [], numOfActivePlayers: 0 };
        gamesList[gameIndex].numOfRegisterd = 0;
    }
    res.sendStatus(200);
});

gamesManagement.get('/getCardMarginLeftByGameId', (req, res) => {
    const id = req.query.id;
    const currentGame = gamesList.find(game => game.id === Number(id));
    let CardMarginLeft = GameLogic.resizeCards(currentGame);
    res.json(CardMarginLeft);
});

function createGame(currentGame) {
    currentGame.gameData.takenCardsCounter = 0;
    currentGame.gameData.numOfActivePlayers = currentGame.numOfPlayers;
    currentGame.gameData.playersWithCards = currentGame.numOfPlayers;
    currentGame.gameData.numOfPlayers = currentGame.numOfPlayers;
    currentGame.gameData.numOfTurns = 0
    currentGame.gameData.turnIndex = 0;
    currentGame.gameData.plus2 = 0;
    currentGame.gameData.gameStarted = false;
    currentGame.gameData.openTaki = false;
    currentGame.gameData.cardOnTop = null;
    currentGame.gameData.gameOver = false;
    GameLogic.gameTimer();
    currentGame.gameData.deck = GameLogic.createDeck();
    currentGame.gameData.players = GameLogic.shareCardsToPlayers(currentGame.numOfRegisterd, currentGame.gameData);
    currentGame.gameData.cardOnTop = GameLogic.drawOpeningCard(currentGame.gameData);
}
gamesManagement.get('/getChat', auth.userAuthentication, (req, res) => {
    const gameId = req.query.id;
    res.json(getCurrGameChatContent(gameId));
});

gamesManagement.post('/setInputInChat', auth.userAuthentication, (req, res) => {
    const bodyObj = JSON.parse(req.body);
    const userInfo = auth.getUserInfo(req.session.id);
    const newContent = {
        user: userInfo,
        text: bodyObj.text
    }
    addContentToGamesChat(newContent, bodyObj.gameId);
    res.sendStatus(200);
});

function addContentToGamesChat(newContent, gameId) {
    const gameIndex = gamesList.findIndex(game => game.id === Number(gameId));

    gamesList[gameIndex].gameData.chatContent.push(newContent);
}

function getCurrGameChatContent(gameId) {
    const gameIndex = gamesList.findIndex(game => game.id === Number(gameId));
    return gamesList[gameIndex].gameData.chatContent;
}

module.exports = gamesManagement
