const express = require('express')
const app = express()
app.use(express.json())
const sqlite3 = require('sqlite3')
const path = require('path')
const {open} = require('sqlite')
let db = null
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

const initialDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(
        'Server Running At https://viraji7f3fnjscpscvyl.drops.nxtwave.tech',
      )
    })
  } catch (e) {
    console.log(`DB server : ${e.message}`)
    process.exit(1)
  }
}
initialDB()

app.get('/players/', async (req, res) => {
  const playerDataQuery = `
    SELECT *
    FROM 
        player_details
    ORDER BY
        player_id
    ;
    `
  const playerData = await db.all(playerDataQuery)
  res.send(
    playerData.map(eachplayer => ({
      playerId: eachplayer.player_id,
      playerName: eachplayer.player_name,
    })),
  )
})

app.get('/players/:playerId/', async (req, res) => {
  const {playerId} = req.params

  const onePlayerDataQuery = `
    SELECT *
    FROM 
        player_details
    WHERE
        player_id = ${playerId}
    ;
    `
  const onePlayerData = await db.get(onePlayerDataQuery)
  res.send({
    playerId: onePlayerData.player_id,
    playerName: onePlayerData.player_name,
  })
})

app.put('/players/:playerId/', async (req, res) => {
  const {playerId} = req.params
  const playerUdateDetail = req.body
  const {playerName} = playerUdateDetail

  const updatePlayerDetailQuery = `
    UPDATE 
        player_details
    SET
        player_name = '${playerName}'
    WHERE
        player_id = ${playerId};
    `
  await db.run(updatePlayerDetailQuery)
  res.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (req, res) => {
  const {matchId} = req.params
  const matchDetailsQuery = `
    SELECT * 
    FROM
        match_details
    WHERE
        match_id = ${matchId};
    `
  const matchDetailsData = await db.all(matchDetailsQuery)
  res.send(
    matchDetailsData.map(eachMatch => ({
      matchId: eachMatch.match_id,
      match: eachMatch.match,
      year: eachMatch.year,
    })),
  )
})

app.get('/players/:playerId/matches', async (req, res) => {
  const {playerId} = req.params
  const playerWhoPLayMatchesQuery = `
    SELECT *
FROM match_details
WHERE match_id IN (
    SELECT match_id
    FROM player_match_score
    WHERE player_id = ${playerId}
);
    `
  const playerWhoPLayMatchesData = await db.all(playerWhoPLayMatchesQuery)
  res.send(
    playerWhoPLayMatchesData.map(eachMatch => ({
      matchId: eachMatch.match_id,
      match: eachMatch.match,
      year: eachMatch.year,
    })),
  )
})

app.get('/matches/:matchId/players', async (req, res) => {
  const {matchId} = req.params
  const playerInAmatchQuery = `
    SELECT * 
    FROM
    player_details
    WHERE
    player_id IN (
        SELECT player_id FROM player_match_score
        Where match_id = ${matchId}
    );
    `
  const playerInAmatchData = await db.all(playerInAmatchQuery)
  res.send(
    playerInAmatchData.map(eachplayer => ({
      playerId: eachplayer.player_id,
      playerName: eachplayer.player_name,
    })),
  )
})

app.get('/players/:playerId/playerScores', async (req, res) => {
  const {playerId} = req.params
  const playerStatsQuery = `
 SELECT
    player_details.player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
FROM player_details
LEFT JOIN player_match_score ON player_details.player_id = player_match_score.player_id
WHERE player_details.player_id = ${playerId}
GROUP BY player_details.player_id, player_details.player_name;

  `
  const playerStatsData = await db.get(playerStatsQuery)
  res.send(playerStatsData)
})

module.exports = app
