"use strict"

const amqp = require("amqplib")

const encoding = "utf8"
const ping = "ping"
const pong = "pong"
const exchange = "ping-pong"
const oneSecond = 1000
const tenSeconds = 10 * oneSecond

// A random time between 1s and 10s, in milliseconds
const randomTime = () => Math.floor(Math.random() * (tenSeconds - oneSecond)) + oneSecond

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

const setupConnection = () =>
  amqp
    .connect({ hostname: "rabbitmq", username: process.env.USER, password: process.env.PASSWORD })
    .then(conn => conn.createChannel())
    .then(ch => ch.assertExchange(exchange, "fanout", { durable: false }).then(() => ({ ch })))
    .then(({ ch }) => ch.assertQueue("", { exclusive: true }).then(q => ({ ch, q })))
    .then(({ ch, q }) => ch.bindQueue(q.queue, exchange, "").then(() => ({ ch, q })))
    .then(ctx => {
      console.log("Connection established")
      return ctx
    })

// Start sending messages
setupConnection()
  .then(({ ch, q }) => {
    ch.consume(q.queue, msg => onMessageReceived(msg.content.toString(encoding), ch), {
      noAck: true
    })

    ch.publish(exchange, "", new Buffer(ping))
  })
  .catch(err => {
    if (err) {
      console.error("\n\nUnexpected Error!\n")
      console.error(err)
      console.error("\n")
      process.exit(1)
    }
  })
