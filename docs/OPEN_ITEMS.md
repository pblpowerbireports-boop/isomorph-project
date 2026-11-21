# Open items

Advisories not fixed, work deliberately left for later, and questions not yet answered. Every package reads this list
at its start and closes what it can. An item is closed by a line saying which package closed it and how; it is never
just deleted.

| # | Since (package, round) | Item | Why it is open | Closed by |
| --- | --- | --- | --- | --- |
| 1 | 01, plan | **Data retention policy.** How long check records and call log entries are kept is a PBL policy not yet decided. No deletion is built in version 1. | Business decision for the owner. | |
| 2 | 01, plan | **`holder_type` null case.** When SurePass returns a `category` not in the mapping table, and the PAN's 4th letter is also unknown, the contract specifies `holder_type: null`. Is this acceptable for callers? | Requires owner confirmation. The CRM's code has the same gap. | |
| 3 | 01, plan | **Empty GSTIN list outcome.** When `gstins-by-pan` gets a valid response with an empty `gstin_list`, the contract returns `FOUND` with zero items. Should it be `NOT_FOUND` instead? | Requires owner confirmation. The CRM returns `FOUND`. Recorded in contract section 5.4. | |
