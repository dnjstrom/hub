const { promisify } = require("util")
const amqp = require("amqplib/callback_api")
const app = require("express")()
const http = require("http").Server(app)
const io = require("socket.io")(http)
const PORT = 8080
const exchange = "ping-pong"
const encoding = "utf8"

// Print error messages to console
const handleError = err => {
  if (err) {
    console.error("\n\nError!\n\n")
    console.error(err)
    console.error("\n\n")
    process.exit(1)
  }
}

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

// Start web server
http.listen(PORT, function() {
  console.log(`listening on *:${PORT}`)

  // Connect to rabbitmq
  amqp.connect(
    {
      hostname: "rabbitmq",
      username: process.env.USER,
      password: process.env.PASSWORD
    },
    (err, conn) => {
      handleError(err)
      conn.createChannel((err, ch) => {
        handleError(err)

        // Set up Pub/Sub
        ch.assertExchange(exchange, "fanout", { durable: false })
        ch.assertQueue("", { exclusive: true }, function(err, q) {
          handleError(err)
          ch.bindQueue(q.queue, exchange, "")

          // Emit received messages on socket
          ch.consume(
            q.queue,
            msg => {
              const str = msg.content.toString(encoding)
              console.log("Emitting", str)
              io.emit(exchange, str)
            },
            {
              noAck: true
            }
          )
        })
      })
    }
  )
})
