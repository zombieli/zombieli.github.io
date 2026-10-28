# Protocol and requirements

Version 0.1 uses a new, project-specific protocol named `diagnostics-sim/1`. This specification describes a software simulator, not an existing physical product.

## Request and response

One UTF-8 JSON object followed by a newline, one request per TCP connection. Request fields are `protocol`, `request_id`, `run_case_id`, `operation` and `scenario`. Operation is `get_status`. Scenario controls explicit fault injection.

A valid response echoes the protocol and request identifier and includes non-empty strings `device_id` and `firmware`, status `ready`, `busy` or `fault`, temperature in the lab range -50 to 150 C, and supply voltage in the lab range 0 to 60 V. Boolean values, strings masquerading as numbers, NaN and infinity are invalid. These ranges are validation rules, not certified operating limits.

## Failure semantics

| Observation | Diagnostic | Retry |
| --- | --- | --- |
| Connection refused or closed before response | connection_error | Up to max_attempts |
| Deadline exceeded | timeout | Up to max_attempts |
| Invalid JSON, oversized or unterminated frame | protocol_error | No |
| Wrong request ID, missing or invalid status field | validation_error | No |
| Unexpected runner exception | internal_error | No; test outcome error |

`max_attempts` includes the first attempt. Each attempt opens a fresh connection with a fresh request ID, but retains the run/case ID to allow recovery scenarios. Source configuration is validated before any connection opens. Version 0.1 accepts only the literal loopback address `127.0.0.1`.

## Requirement traceability

| Requirement | Implementation | Verification |
| --- | --- | --- |
| P1-R01 Connection and discovery | transport.py | TCP suite and unavailable endpoint test |
| P1-R02 Read and validate status | protocol.py | Malformed JSON, missing fields, wrong ID, non-finite/type/range tests |
| P1-R03 Deadline and bounded retries | transport.py and runner.py | Timeout, disconnect and recovery scenarios |
| P1-R04 Repeatable faults | simulator.py | 11 explicit scenarios and independent-run recovery test |
| P1-R05 Report export | reporting.py | JSON/CSV/log consistency, duplicate output and write-error tests |
| P1-R06 Single-command execution | cli.py | CLI subprocess tests for exit codes 0 and 1; config/output errors 2 |
| P1-R07 Physical device | Not implemented | Deferred; no hardware claim |

## Difference from the original plan

The first version uses TCP loopback rather than an unconfirmed serial or MQTT interface. It writes a source SHA-256 identifier instead of requiring a Git commit, so evidence remains attributable before the initial commit. The project is newly designed; previous university source and devices are not dependencies.
