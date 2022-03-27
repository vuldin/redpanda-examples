import avro from 'avsc'
import avroSchemaStr from 'http://localhost:18081/subjects/avro-market-activity-value/versions/latest'

import SimpleTransform from '../lib/simpleTransformHelper'

const avroSchema = JSON.parse(avroSchemaStr)
const avroType = avro.Type.forSchema(avroSchema)

// input topic must exist before deploying the transform
const inputTopic = 'market_activity'
// TODO output topic should match value below instead of market_activity._avro_
const outputTopic = 'avro'
// TODO serialize/deserialize may not be needed since we have processRecords
// mainly for testing purposes
const serialize = (str) => avroType.toBuffer(str)
const deserialize = (buffer) => avroType.fromBuffer(buffer)
// function that is called to transform each record
const transformFunction = (record) => {
  const obj = JSON.parse(record.value)
  return {
    ...record,
    value: serialize(obj),
  }
}

const transform = SimpleTransform({
  inputTopic,
  outputTopic,
  serialize,
  deserialize,
  transformFunction,
  options: {
    // topics that fire the transform function
    injectionPolicy: 'latest', // earliest, stored, latest
    // choose what happens on error
    onError: 'skip', // skip, deregister
  },
})

export default transform
