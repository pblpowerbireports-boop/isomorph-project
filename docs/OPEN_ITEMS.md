# Open items

Advisories not fixed, work deliberately left for later, and questions not yet answered. Every package reads this list
at its start and closes what it can. An item is closed by a line saying which package closed it and how; it is never
just deleted.

| # | Since (package, round) | Item | Why it is open | Closed by |
| --- | --- | --- | --- | --- |
| 1 | 01, plan | **Data retention policy.** How long check records and call log entries are kept is a PBL policy not yet decided. No deletion is built in version 1. | Business decision for the owner. | **Closed by package 01: the owner's answer of 21 November 2026** — keep everything for now and build no deletion. The policy for production is a new open item (item 4). |
| 2 | 01, plan | **`holder_type` null case.** When SurePass returns a `category` not in the mapping table, and the PAN's 4th letter is also unknown, the contract specifies `holder_type: null`. Is this acceptable for callers? | Requires owner confirmation. The CRM's code has the same gap. | **Closed by package 01: the owner's answer of 21 November 2026** — yes; `null` means "not known", as in the CRM. |
| 3 | 01, plan | **Empty GSTIN list outcome.** When `gstins-by-pan` gets a valid response with an empty `gstin_list`, the contract returns `FOUND` with zero items. Should it be `NOT_FOUND` instead? | Requires owner confirmation. The CRM returns `FOUND`. Recorded in contract section 5.4. | **Closed by package 01: the owner's answer of 21 November 2026** — `FOUND` with an empty list; "this PAN has no GST registrations" is an answer about the PAN. |
| 4 | 01, owner's audit | **Data retention policy for production.** Version 1 keeps everything; before production, decide how long to keep check records, call log entries and kept answers. | Business decision for the owner, to be taken before production (owner's answer, 21 November 2026). | |
