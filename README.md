# StockSense

StockSense is a multi-location inventory system that derives available stock from validated, auditable movements instead of editable quantity fields.

## Problem

Spreadsheet and manual inventory workflows lose traceability. When receipts, deliveries, transfers, adjustments, and physical counts are updated independently, stock becomes a mutable snapshot rather than a reliable record of what actually happened. The result is drift: balances can be changed without a clear chain of ownership, audit trail, or status boundary between draft work and finalized operations.

## Solution

StockSense uses one stock-movement model as the system of record. Inventory is not maintained as a writable quantity field; it is derived from movements with clear direction, status, and time. Only `done` movements affect availability; drafts and canceled documents have zero impact; finalized movements are immutable. This makes the ledger explainable, replayable, and auditable without requiring manual recalculation across every warehouse or product record.

## Core invariant

```text
available stock at a location =
completed inbound quantity - completed outbound quantity
```

### Operational model

The repository models the core inventory flow around a few explicit transaction types:

- Warehouses and multi-location inventory context
- Product catalog and stock movement inputs
- Receipts for inbound inventory
- Deliveries for outbound inventory
- Transfers between locations
- Adjustments and move history for reconciliation and review
- Role-based workflow for inventory managers and warehouse staff

This design keeps the stock calculation deterministic: if a document is not finalized, it does not change the available quantity; if it is finalized, it is treated as an immutable ledger event that can be traced back to the originating record.
