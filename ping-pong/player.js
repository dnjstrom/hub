"use strict"

const encoding = "utf8"
const amqp = require("amqplib/callback_api")
const ping = new Buffer("Ping!", encoding)
const pong = new Buffer("Pong!", encoding)
const q = "ping-pong"
const oneSecond = 1000
const tenSeconds = 10 * oneSecond

console.log("Booting ping-pong player!")

const randomTime = () => Math.floor(Math.random() * (tenSeconds - oneSecond)) + oneSecond

const handleError = err => {
  if (err) {
    console.error("\n\nError!\n\n")
    console.error(err)
    console.error("\n\n")
    process.exit(1)
  }
}

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

      ch.consume(
        q,
        msg => {
          const str = msg.content.toString(encoding)
          console.log(str)

          setTimeout(() => {
            if (str === ping.toString(encoding)) {
              ch.sendToQueue(q, pong)
            } else {
              ch.sendToQueue(q, ping)
            }
          }, randomTime())
        },
        { noAck: true }
      )

      ch.sendToQueue(q, ping)
    })
  }
)
