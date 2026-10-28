# Device Diagnostics Lab case study

## Problem

Device-facing software must distinguish healthy responses from timeouts, malformed messages and disconnected peers. A test bench also needs to show whether a detected fault was expected, and preserve evidence that another developer can reproduce.

## Implemented scope

This new portfolio project provides a real TCP client/server lab using synthetic device readings. The runner exercises 11 explicit scenarios and exports JSON, CSV and attempt logs. Python source is hashed into each report. No physical device or industrial deployment is claimed.

## Engineering decisions

The simulator and transport use separate modules so future adapters can reuse the validation and report pipeline. New TCP connections on retries avoid carrying corrupted framing state forward. Only transport failures are retried; malformed and invalid data are reported immediately. A shared run/case identifier isolates retry recovery state from other executions.

Reports are first written to a staging directory. Only complete sets are renamed to their final run directory. This prevents a partially written report from appearing to be a completed result.

## Results

On the initial Windows/Python 3.12.14 verification, all 44 automated tests passed. The recorded simulator run matched all 11 test expectations. Nine scenarios intentionally produced diagnostic faults, demonstrating detection rather than a healthy device. A separate run changed one expectation and produced the intended failing exit code.

## Limitations and ownership

This personal project uses a purpose-built protocol, IPv4 loopback and synthetic readings. Physical interfaces, production firmware, environment testing and cross-platform performance were not validated.
