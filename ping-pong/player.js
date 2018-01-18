"use strict"

const encoding = "utf8"
const amqp = require("amqplib/callback_api")
const ping = "Ping!"
const pong = "Pong!"
const q = "ping-pong"
const oneSecond = 1000
const tenSeconds = 10 * oneSecond

console.log("Booting ping-pong player!")

// A random time between 1s and 10s, in milliseconds
const randomTime = () => Math.floor(Math.random() * (tenSeconds - oneSecond)) + oneSecond

const handleError = err => {
  if (err) {
    console.error("\n\nError!\n\n")
    console.error(err)
    console.error("\n\n")
    process.exit(1)
  }
}

// Handle each incoming message
const onMessageReceived = (msg, send) => {
  console.log(msg)

  setTimeout(() => {
    if (msg === ping) {
      send(pong)
    } else {
      send(ping)
    }
  }, randomTime())
}

// Utility function to make a publisher function for a specific queue on a connection.
const makeSender = (q, ch) => msg => ch.sendToQueue(q, new Buffer(msg, encoding))

// Utility function to make a consumer of a queue that can also publish to the same queue.
const makeReceiver = (q, ch, send) => handler => {
  ch.consume(q, msg => handler(msg.content.toString(encoding), send), { noAck: true })
}

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
      ch.assertQueue(q, { durable: false })
      const send = makeSender(q, ch)
      const receive = makeReceiver(q, ch, send)

      // Subscribe to "ping-pong" queue
      receive(onMessageReceived)

      // Send an initial "Ping!"
      send(ping)
    })
  }
)
