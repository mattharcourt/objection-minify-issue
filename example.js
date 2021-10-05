import { Model } from 'objection'
import Knex from 'knex'

import { default as dialect } from 'knex/lib/dialects/sqlite3/index.js'
import sqlite3 from 'sqlite3'
dialect.prototype._driver = () => sqlite3

class Primary extends Model {
  static get tableName() {
    return 'primary'
  }

  static get relationMappings() {
    return {
      related: {
        relation: Model.HasOneRelation,
        modelClass: Related,
        join: {
          from: 'primary.id',
          to: 'related.primary_id',
        },
      },
    }
  }
}

class Related extends Model {
  static get tableName() {
    return 'related'
  }
}

let knex
const connect = (filename) => {
  filename = filename || 'example.sqlite'

  knex = Knex({
    client: dialect,
    connection: { filename },
    useNullAsDefault: true,
  })

  Model.knex(knex)

  return Promise.resolve()
}

const verifySchema = async () => {
  if (
    (await knex.schema.hasTable('primary')) ||
    (await knex.schema.hasTable('related'))
  ) {
    return
  }

  await knex.schema.createTable('primary', (table) => {
    table.increments('id').primary()
    table.string('primary_prop')
  })

  await knex.schema.createTable('related', (table) => {
    table.increments('id').primary()
    table.integer('primary_id').references('primary.id')
    table.string('related_prop')
  })
}

let seedLimit // limit number of data insertions
const seedData = async () => {
  let n = ((await Primary.query().max('id'))[0]['max(`id`)'] || 0) + 1

  if (seedLimit && n > seedLimit) return

  await Primary.query().insertGraph({
    primary_prop: `Row ${n} primary property`,
    related: { related_prop: `Row ${n} related property` },
  })
}

const getData = async () => {
  return Primary.query().select('*').joinRelated('related')
}

const example = (filename = null, num = 2) => {
  seedLimit = num
  return connect(filename)
    .then(verifySchema)
    .then(seedData)
    .then(getData)
    .finally(() => knex.destroy())
}

example().then(console.log).catch(console.error)

export default example
