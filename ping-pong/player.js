"use strict"

const encoding = "utf8"
const amqp = require("amqplib/callback_api")
const ping = "ping"
const pong = "pong"
const exchange = "ping-pong"
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
const onMessageReceived = (msg, ch) => {
  console.log(msg)

  setTimeout(() => {
    if (msg === ping) {
      ch.publish(exchange, "", new Buffer(pong))
    } else {
      ch.publish(exchange, "", new Buffer(ping))
    }
  }, randomTime())
}

// Utility function to make a publisher function for a specific queue on a connection.
const makeSender = (q, ch) => msg => {
  console.log("Sending", msg, "to", q)
  ch.publish(exchange, "", new Buffer("Hello World!"))
}

// Utility function to make a consumer of a queue that can also publish to the same queue.
const makeReceiver = (q, ch, send) => (handler, callback) => {
  ch.consume(q, msg => handler(msg.content.toString(encoding), send), { noAck: true }, callback)
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

      // Set up Pub/Sub
      ch.assertExchange(exchange, "fanout", { durable: false })
      ch.assertQueue("", { exclusive: true }, function(err, q) {
        handleError(err)
        ch.bindQueue(q.queue, exchange, "")

        ch.consume(q.queue, msg => onMessageReceived(msg.content.toString(encoding), ch), {
          noAck: true
        })

        ch.publish(exchange, "", new Buffer(ping))
      })
    })
  }
)
