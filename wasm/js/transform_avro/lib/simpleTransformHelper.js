import { PolicyError, PolicyInjection, SimpleTransform } from '@vectorizedio/wasm-api'

function getInjectionPolicy(str) {
  let result = -1
  switch (str.toLowerCase()) {
    case 'earliest':
      result = PolicyInjection.Earliest
      break
    case 'latest':
      result = PolicyInjection.Latest
      break
    case 'stored':
      result = PolicyInjection.Stored
      break
  }
  if (result === -1)
    throw new Error('invalid injection policy (valid values: earliest, stored, latest')
  return result
}

function getOnError(str) {
  let result = -1
  switch (str.toLowerCase()) {
    case 'skip':
      result = PolicyError.SkipOnFailure
      break
    case 'deregister':
      result = PolicyError.Deregister
      break
  }
  if (result === -1) throw new Error('invalid onError policy (valid values: skip, deregister')
  return result
}

export default function newSimpleTransform(all) {
  const {
    inputTopic,
    outputTopic,
    serialize,
    deserialize,
    transformFunction,
    options,
  } = all
  const injectionPolicy = getInjectionPolicy(options.injectionPolicy)
  const onError = getOnError(options.onError)
  let transform = new SimpleTransform()
  // TODO why does subscribe take an array?
  transform.subscribe([[inputTopic, injectionPolicy]])
  transform.errorHandler(onError)
  transform.inputTopic = inputTopic // new, optional
  transform.outputTopic = outputTopic // new, used in processRecord
  transform.serialize = serialize
  transform.deserialize = deserialize
  transform.transformFunction = transformFunction
  transform.options = options
  // TODO should be called processBatch (it's handling a batch of records)
  // TODO why does processRecord return a Map? each transform would have its own function
  async function processBatch(batch) {
    const result = new Map()
    // TODO header values are stubbed/incorrect
    // TODO records values (aside from value) are stubbed/incorrect
    // TODO why records.headers array?
    const transformedBatch = batch.map(({ header, records }) => {
      return {
        header,
        records: records.map(transformFunction),
      }
    })
    result.set(this.outputTopic, transformedBatch)

    return result
  }

  // TODO processRecord requires an async function
  transform.processRecord(processBatch)

  return transform
}
