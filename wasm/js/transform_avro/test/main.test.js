const transform = require("../dist/main").default;
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

describe("the transform", function() {
  before(function () {
    nock.recorder.rec({ dont_print: true });
  });

  after(function () {
    nock.restore();
    nock.cleanAll();
  });

  it("serializes", async function() {
    const result = await transform.apply(recordBatch);
    assert.equal(result.size, 1);
    assert(result.get(transform.outputTopic));
    result.get(transform.outputTopic).records.forEach(avroRecord => {
      obj = transform.deserialize(avroRecord.value);
      assert.equal(
        JSON.stringify(obj),
        JSON.stringify(record)
      );
    })
  });

  it("doesn't make network requests", async function() {
    await transform.apply(recordBatch);
    const nockCalls = nock.recorder.play();
    assert.equal(nockCalls.length, 0);
  });
});
