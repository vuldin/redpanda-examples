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
> docker-compose -f docker-compose/compose-wasm.yaml up -d
[+] Running 2/2
 ⠿ Network redpanda_network  Created
 ⠿ Container redpanda        Started
```

## Populate the registry with schemas

The registry needs to have schemas at registered subjects, which can be done with the following commands:

```bash
> cd redpanda-examples/clients/js
> npm install
> node registry subject avro-market-activity-value add ../../schemas/market_activity.avsc
```

This uploads a schema to the subject `avro-market-activity-value`.
Run `node registry -h` for more details on this registry CLI.

## Build the transform bundle

Use `npm` to bundle up the JavaScript application:

```bash
> cd wasm/js/transform_avro
> npm install    # install js dependencies
> npm test       # run mocha tests
> npm run build  # bundle js application with esbuild
```

## Create the topic

Create the topic where the producer app will send messages.
This step is required since the consumed topic must exist prior to deploying the wasm coprocessor.

```bash
> rpk topic create market_activity
TOPIC            STATUS
market_activity  OK
```

List all current topics:
```bash
> rpk topic list
NAME             PARTITIONS  REPLICAS
_schemas         1           1
market_activity  1           1
```

The `_schemas` topic is automatically generated when the schemas are uploaded to the registry.

## Deploy the transform bundle to Redpanda

```bash
> rpk wasm deploy dist/main.js --name json2avro --description "Transforms JSON to AVRO"
Deploy successful!
```

## Produce JSON Records and Consume AVRO Results

Start two consumers (run each command below in a separate terminal):

```bash
> rpk topic consume market_activity
> rpk topic consume market_activity._avro_
```

The topic `market_activity._avro_` doesn't yet exist, but it will be automatically created once the wasm function begins consuming events from the topic `market_activity`.

Start the producer (in a third terminal):

```bash
> cd clients/js
> node producer -rd Date
```

The above command will output many lines of JSON string representations of the events being sent to topic `market_activity`.

Verify that you see output in the second terminal.
This will be a string representation of the Avro-serialized events being sent to `market_activity._avro_`.

## View Coproc Log

The coprocessor log on the Redpanda container shows status information and possibly errors if something went wrong.

```bash
> docker exec --user root -it redpanda /bin/bash
> tail -100f /var/lib/redpanda/coprocessor/logs/wasm
```

# Cleanup

## Remove Coproc

Occasionally you may want disable a deployed coprocessor, for instance when you want to deploy a new version of the transform.
Run the following command (make sure to use the same name as your previous deploy step):

```bash
> rpk wasm remove json2avro
```

## Stop docker compose resources

```bash
> docker-compose -f docker-compose/compose-wasm.yaml down
[+] Running 2/2
 ⠿ Container redpanda                       Removed   0.3s
 ⠿ Network docker-compose_redpanda_network  Removed   0.1s
```
