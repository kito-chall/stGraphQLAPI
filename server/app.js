const express = require('express')
const graphqlHTTP = require('express-graphql')
const mongoose = require('mongoose')
const schema = require('./schema/schema')
const env = require('./env.json')
const app = express()

mongoose.connect(env.MONGODB_ACCESS_URL)
mongoose.connection.once('open', () => {
  console.log('db connection')
})
app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}))

app.listen(4000, () => {
  console.log('listening port 4000')
})