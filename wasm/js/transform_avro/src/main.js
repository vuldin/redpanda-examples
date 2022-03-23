const avro = require("avsc");
const protobuf = require('protobufjs')
const {
  SimpleTransform,
  PolicyError,
  PolicyInjection,
  calculateRecordBatchSize
} = require("@vectorizedio/wasm-api");

const transform = new SimpleTransform();

/**
 * Topics that fire the transform function
 * - Earliest
 * - Stored
 * - Latest
 */
transform.subscribe([["market_activity", PolicyInjection.Latest]]);

/**
 * The strategy the transform engine will use when handling errors
 * - SkipOnFailure
 * - Deregister
 */
transform.errorHandler(PolicyError.SkipOnFailure);

/* TODO: Fetch Avro schema from repository */
const avroType = avro.Type.forSchema({
  name: "market_activity",
  type: "record",
  fields: [
    {name: "Date", type: "string"},
    {name: "CloseLast", type: "string"},
    {name: "Volume", type: "string"},
    {name: "Open", type: "string"},
    {name: "High", type: "string"},
    {name: "Low", type: "string"}
  ]
});

const jsonDescriptor = {
  "nested": {
    "market_activity": {
      "fields": {
        "Date": { "type": "string", "id": 1 },
        "CloseLast": { "type": "string", "id": 2 },
        "Volume": { "type": "string", "id": 3 },
        "Open": { "type": "string", "id": 4 },
        "High": { "type": "string", "id": 5 },
        "Low": { "type": "string", "id": 6 },
      }
    }
  }
}
const protoRoot = protobuf.Root.fromJSON(jsonDescriptor);
const protoSchema = protoRoot.lookupType('market_activity');

/* Auxiliar transform function for records */
const toAvro = (record) => {
  const obj = JSON.parse(record.value);
  return {
    ...record,
    value: avroType.toBuffer(obj),
  };
}

const toProto = (record) => {
  const obj = JSON.parse(record.value);
  return {
    ...record,
    value: protoSchema.encode(obj).finish(),
  };
}

/* Transform function */
transform.processRecord((batch) => {
  const result = new Map();
  const avroTransformedBatch = batch.map(({ header, records }) => {
    return {
      header,
      records: records.map(toAvro),
    };
  });
  const protoTransformedBatch = batch.map(({ header, records }) => {
    return {
      header,
      records: records.map(toProto),
    };
  });
  result.set("avro", avroTransformedBatch);
  result.set("proto", protoTransformedBatch);
  // processRecord function returns a Promise
  return Promise.resolve(result);
});

exports["default"] = transform;
exports["avro"] = avroType;
exports["proto"] = protoSchema;
