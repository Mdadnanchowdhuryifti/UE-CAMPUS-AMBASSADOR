# Security Specification — Ulterior Engineering CA Portal

## 1. Data Invariants
1. **Tier 0A (Main Developer Root — Strictly 2 Emails)**: ONLY `adnanchowdhury477@gmail.com` and `mdadnanchowdhuryifti@gmail.com` (with `email_verified == true`) hold Main Developer Root status. ONLY these two Main Developers can add, modify, or revoke `role == 'developer'` records in `/role_assignments/{emailKey}`, and neither Main Developer email record can be demoted or deleted.
2. **Tier 0B (Added Developer — Provisioned by Main Developers)**: A secondary Developer added by one of the two Main Developers (`role == 'developer'`) holds full operational control plus the ability to appoint/revoke Program Chair (`chair`) and Company CEO (`ceo`), but is strictly forbidden from adding, editing, or revoking `developer` assignments or touching Main Developer email keys.
3. **Tier 1 (Program Chair & Company CEO — Executive Parity)**: Both `chair` and `ceo` roles (appointed exclusively by Developers) hold identical full operational access across Chair Master, Recruitment Open/Close toggles, Secretary Hub, Leads 1–5, CA Portal, KPI weights, certificates, workshops, and subordinate role management (`secretary`, `lead1`–`lead5`, `ca`). Neither Chair nor CEO can enter Developer Mode or create/modify/delete `developer`, `chair`, or `ceo` assignments, nor alter `chairName`/`ceoName` directly.
4. **Granular Recruitment Closure Enforcement**: `/settings/program.recruitmentStatus` stores 7 booleans (`secretary`, `lead1`, `lead2`, `lead3`, `lead4`, `lead5`, `ca`) toggleable by Developers, Program Chair, and Company CEO. Creating a new document in `/applications/{applicationId}` MUST validate that `role` is one of the 7 official recruitment positions AND that its corresponding `recruitmentStatus` boolean is `true`.
5. **Strict Lead Segment & PII Isolation**: Leads 1–5 remain strictly isolated to their portfolio and squad; PII collections remain owner-or-reviewer-scoped; public collections (`ambassadors`, `workshops`, `certificates`, `settings`) contain zero PII.
6. **Immutable Audit Fields, Server Timestamps & Terminal State Locking**: `submitterUid`, `applicantUid`, `registrarUid`, `createdByUid`, and `createdAt` are immutable; `createdAt`/`updatedAt` must equal `request.time`; non-Full-Access reviewers cannot re-open finalized submissions/applications.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Secondary Developer Privilege Escalation**: A Developer-added secondary Developer attempts to add a new `'developer'` in `/role_assignments/newdev_at_gmail_com` (strictly restricted to the 2 Main Developer emails).
2. **Main Developer Account Sabotage**: Any actor (including a secondary Developer or Chair/CEO) attempts to delete or demote `/role_assignments/adnanchowdhury477_at_gmail_dot_com` or `/role_assignments/mdadnanchowdhuryifti_at_gmail_dot_com`.
3. **Chair or CEO Appointing Chair/CEO/Developer**: Appointed `chair` or `ceo` attempts to create `{ "role": "ceo" }`, `{ "role": "chair" }`, or `{ "role": "developer" }` in `/role_assignments/{emailKey}`.
4. **Closed Role Application Bypass**: Applicant submits `/applications/app_closed` with `{ "role": "Program Secretary" }` when `settings/program.recruitmentStatus.secretary == false`.
5. **Unverified Main Developer Email Spoofing**: Request with `email == "mdadnanchowdhuryifti@gmail.com"` and `email_verified == false` attempts to write `/settings/program` or `/role_assignments/{emailKey}`.
6. **Cross-Lead Segment Breach (Lead 1 -> Tech Pipeline)**: User with `role == "lead1"` attempts to update `/tech_pipeline/UE-LEAD-2026-101`.
7. **Cross-Squad Submission Approval (Lead 2 -> Squad A)**: User with `role == "lead2"` attempts to approve a `Squad A` submission in `/submissions/sub1`.
8. **Secretary Modifying Recruitment Status**: User with `role == "secretary"` attempts to toggle `recruitmentStatus` in `/settings/program`.
9. **Shadow Field Injection on Recruitment Settings**: Chair/CEO attempts to update `/settings/program` with an extra shadow key inside `recruitmentStatus` (`{ "admin": true }`) or overwrite `ceoName`/`chairName`.
10. **Identity Spoofing on Recruitment Application**: User A submits an application with `{ "applicantUid": "userB_uid" }` or mismatched `email`.
11. **PII Scraping on Applications**: General CA attempts `list` or `get` on another user's `/applications/{appId}`.
12. **ID Poisoning & Terminal State Re-Opening**: Attacker writes to `/certificates/evil$id` or Core Lead attempts to change an already `Approved` submission back to `Pending`.
