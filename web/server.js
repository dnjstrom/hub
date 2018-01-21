const { promisify } = require("util")
const amqp = require("amqplib")
const app = require("express")()
const http = require("http").Server(app)
const io = require("socket.io")(http)
const startServer = promisify(http.listen.bind(http))

const PORT = 8080
const exchange = "ping-pong"
const encoding = "utf8"

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html")
})

// Print connection events to console
io.on("connection", function(socket) {
  console.log("a user connected")

  socket.on("disconnect", function() {
    console.log("user disconnected")
  })
})

const setupConnection = () =>
  amqp
    .connect({ hostname: "rabbitmq", username: process.env.USER, password: process.env.PASSWORD })
    .then(conn => conn.createChannel())
    .then(ch => ch.assertExchange(exchange, "fanout", { durable: false }).then(() => ({ ch })))
    .then(({ ch }) => ch.assertQueue("", { exclusive: true }).then(q => ({ ch, q })))
    .then(({ ch, q }) => ch.bindQueue(q.queue, exchange, "").then(() => ({ ch, q })))
    .then(ctx => {
      console.log("Connection to Rabbitmq established.")
      return ctx
    })

// Start web server

startServer(PORT)
  .then(() => console.log(`Server listening on *:${PORT}.`))
  .then(setupConnection)
  .then(({ ch, q }) => {
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
