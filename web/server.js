const { promisify } = require("util")
const amqp = require("amqplib")
const express = require("express")
const app = express()
const http = require("http").Server(app)
const io = require("socket.io")(http)
const startServer = promisify(http.listen.bind(http))

const PORT = 8080
const exchange = "ping-pong"
const encoding = "utf8"

// This serves the static web app in production.
app.use(express.static("build"))

// Setup connection to rabbitmq
const setupConnection = () =>
  amqp
    .connect({ hostname: "rabbitmq", username: process.env.USER, password: process.env.PASSWORD })
    .then(conn => conn.createChannel())
    .then(ch => ch.assertExchange(exchange, "fanout", { durable: false }).then(() => ({ ch })))
    .then(({ ch }) => ch.assertQueue("", { exclusive: true }).then(q => ({ ch, q })))
    .then(({ ch, q }) => ch.bindQueue(q.queue, exchange, "").then(() => ({ ch, q })))
    .then(ctx => {
      console.log("Connection to rabbitmq established.")
      return ctx
    })

// Start web server
startServer(PORT)
  .then(() => console.log(`Server listening on *:${PORT}.`))
  .then(setupConnection)
  .then(({ ch, q }) => {
    // Emit all messages to all connected websockets.
    ch.consume(q.queue, msg => io.emit(exchange, msg.content.toString(encoding)), {
      noAck: true
    })
  })
  .catch(err => {
    if (err) {
      console.error("\n\nError!\n\n")
      console.error(err)
      console.error("\n\n")
      process.exit(1)
    }
  })
