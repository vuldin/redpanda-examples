# Redpanda Data Transforms: JSON to AVRO

This example JavaScript transform uses the async engine to map JSON formatted messages to an AVRO schema.

# Tool versions

Versions for tools used in this project are listed below.
Other versions may work, but make sure to use the following versions or higher if you run into issues:

| Tool | Version |
| - | - |
| curl | 7.77.0 |
| docker | v20.10.13 |
| docker-compose | v1.29.2 |
| jq | jq-1.6 |
| node | v12.22.11 |
| rpk | v21.11.9 |

## Start Redpanda Container

To run the example locally, spin up a Redpanda node with Docker:

```bash
> cd redpanda-examples/wasm
> docker-compose up -d

[+] Running 2/2
 ⠿ Network redpanda_network  Created
 ⠿ Container redpanda        Started
```

## Build the transform bundle

Use `npm` to bundle up the JavaScript application:

```bash
> cd redpanda-examples/wasm/js/transform_avro
> npm install    # install js dependencies
> npm test       # run mocha tests
> npm run build  # bundle js application with esbuild
```

## Populate the registry with schemas

The registry needs to have schemas at registered subjects, which can be done with the following commands:

```bash
> cd redpanda-examples/clients/js
> npm install
> node upload-schemas.js
```

This uploads a schema to each of the following subjects: `avro-market-activity-value` and `proto-market-activity-value`.
More details on the `upload-schemas.js` script and the schema registry can be found [here](../../../clients/js/README.md).

## Create the topic

Create the topic where the producer app will send messages.
This step is required since the consumed topic must exist prior to deploying the wasm coprocessor.

```bash
> rpk --brokers localhost:19092 topic create market_activity
TOPIC            STATUS
market_activity  OK
```

List all current topics:
```bash
> rpk --brokers localhost:19092 topic list
NAME             PARTITIONS  REPLICAS
_schemas         1           1
market_activity  1           1
```

The `_schemas` topic is automatically generated when the schemas are uploaded to the registry.

## Deploy the transform bundle to Redpanda

```bash
> rpk --brokers localhost:19092 wasm deploy dist/main.js --name json2avro --description "Transforms JSON to AVRO"
Deploy successful!
```

## Produce JSON Records and Consume AVRO Results

Start two consumers (run each command below in a separate terminal):

```bash
> rpk --brokers localhost:19092 topic consume market_activity
> rpk --brokers localhost:19092 topic consume market_activity._avro_
```

The topic `market_activity._avro_` doesn't yet exist, but it will be automatically created once the wasm function begins consuming events from the topic `market_activity`.

Start the producer (in a third terminal):

```bash
> cd redpanda-examples/clients/js
> node producer.js --brokers localhost:19092
```

The above command will output many lines of JSON string representations of the events being sent to topic `market_activity`.

## View Coproc Log

The coprocessor log on the Redpanda container shows status information and possibly errors if something went wrong.

```bash
> docker exec --user root -it redpanda /bin/bash
> tail -100f /var/lib/redpanda/coprocessor/logs/wasm
```

## Remove Coproc

Occasionally you may want disable a deployed coprocessor, for instance when you want to deploy a new version of the transform.
Run the following command (make sure to use the same name as your previous deploy step):

```bash
> rpk --brokers localhost:19092 wasm remove json2avro
```
