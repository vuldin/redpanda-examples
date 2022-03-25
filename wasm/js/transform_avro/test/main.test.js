const transform = require("../dist/main");
const { createRecordBatch } = require("@vectorizedio/wasm-api");
const assert = require("assert");
const nock = require("nock");

const record = {
  "Date":"12/10/2021",
  "CloseLast":"4712.02",
  "Volume":"--",
  "Open":"4687.64",
  "High":"4713.57",
  "Low":"4670.24"
};
const recordBatch = createRecordBatch({
  records: [{value: JSON.stringify(record)}]
});

describe("transform", function() {
  before(function () {
    nock.recorder.rec({ dont_print: true });
  });

  after(function () {
    nock.restore();
    nock.cleanAll();
  });

  it("transforms json to avro", function() {
    return transform.default.apply(recordBatch).then(result => {
      assert.equal(result.size, 1);
      assert(result.get("avro"));
      result.get("avro").records.forEach(avroRecord => {
        obj = transform.default.avroType.fromBuffer(avroRecord.value);
        assert.equal(
          JSON.stringify(obj),
          JSON.stringify(record)
        );
      })
    });
  });

  it("should not make network requests", function() {
    return transform.default.apply(recordBatch).then(() => {
      const nockCalls = nock.recorder.play();
      assert.equal(nockCalls.length, 0);
    });
  });
});
