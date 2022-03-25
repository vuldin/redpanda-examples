import avro from 'avsc'
import avroSchemaStr from 'http://localhost:18081/subjects/avro-market-activity-value/versions/latest'
import { PolicyError, PolicyInjection, SimpleTransform } from '@vectorizedio/wasm-api'

const transform = new SimpleTransform()
transform.subscribe([['market_activity', PolicyInjection.Latest]])
transform.errorHandler(PolicyError.SkipOnFailure)

const avroSchema = JSON.parse(avroSchemaStr)
transform.avroType = avro.Type.forSchema(avroSchema)

transform.processRecord(async (recordBatch) => {
  const result = new Map()
  const avroTransformedRecord = recordBatch.map(({ header, records }) => {
    return {
      header,
      records: records.map((record) => {
        const obj = JSON.parse(record.value)
        return {
          ...record,
          value: transform.avroType.toBuffer(obj),
        }
      }),
    }
  })
  result.set('avro', avroTransformedRecord)

  return result
})

export { transform as default }
