[![Slack](https://img.shields.io/badge/Slack-Redpanda%20Community-blue)](https://redpanda.com/slack)

# Javascript client

This app provides scripts for various client tasks.

## Install dependencies

```bash
npm i
```


More details on each script and its associated tasks are below.

## producer.js

This script reads data from a csv file and sends this data to a topic.
Use the script with the following command:
```bash
node producer.js --brokers localhost:19092
```

By default the following values are used:
| Variable | Value |
| - | - |
| path to CSV file | `../../spark/scala/src/main/resources/spx_historical_data.csv` |
| topic | `market_activity` |

The above defaults can be overwritten by passing in args:
```bash
node producer.js --brokers localhost:19092 --topic some-topic --csv "path-to-some-csv-file.csv"
```

## upload-schema.js

This script reads the following schema files and uploads them to the registry.
Run the script with the following command:
```bash
node upload-schemas.js
```

Below are more details on the files and associated subjects:
| File | Subject |
| - | - |
| `schemas/market_activity.avsc` | avro-market-activity-value |
| `schemas/market_activity.proto` | proto-market-activity-value |
