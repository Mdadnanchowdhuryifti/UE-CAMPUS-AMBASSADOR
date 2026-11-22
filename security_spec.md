# Security Specification — Ulterior Engineering CA Portal

## 1. Data Invariants
1. **Tier 0 (Platform Developer) Root Supremacy**: Only the bootstrapped Platform Developer (`adnanchowdhury477@gmail.com`, `email_verified == true`) or a Developer-assigned `role == 'developer'` entry in `/role_assignments/{emailKey}` holds supreme root control over the entire website, including appointing/revoking the Program Chair (`chair`), appointing other Developers, and performing destructive deletions across core collections.
2. **Tier 1 (Program Chair — Appointed by Developer)**: A Program Chair (`role == 'chair'`) has full operational access to all program segments (Chair Master, Secretary Hub, Leads 1–5, CA Portal, KPI weights, certificates, workshops, recruitment approvals) and may assign/revoke subordinate roles (`secretary`, `lead1`–`lead5`, `ca`), but is strictly forbidden from creating, modifying, or deleting any `developer` or `chair` role assignment.
3. **No Self-Assigned Roles**: No Secretary, Core Lead, General CA, or unassigned user can create, update, or delete any document in `/role_assignments/{emailKey}`.
4. **Strict Lead Segment Isolation**:
   - Lead 1 (`lead1`) manages Operations/HR & Squad A submissions only.
   - Lead 2 (`lead2`) manages Workshops & Squad B submissions only.
   - Lead 3 (`lead3`) manages Tech Lead Pipeline & Squad C submissions only.
   - Lead 4 (`lead4`) manages Campaign Kits & Squad D submissions only.
   - Lead 5 (`lead5`) manages Club Pitches & Squad E submissions only.
5. **PII Isolation**: Collections storing emails or personal contact strings (`role_assignments`, `applications`, `workshop_registrations`, `club_pitches`) are strictly restricted to owner (`uid`) or authorized full-access/segment reviewers; public collections (`ambassadors`, `workshops`, `certificates`, `settings`) contain zero PII.
6. **Immutable Audit Fields & Server Timestamps**: `submitterUid`, `applicantUid`, `registrarUid`, `createdByUid`, and `createdAt` cannot be modified after creation; `createdAt` / `updatedAt` must equal `request.time`.
7. **Terminal State Locking**: Once an `ActivitySubmission` or `RecruitmentApplication` transitions out of `Pending` (`Approved` or `Rejected`), non-Full-Access users cannot mutate it again.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Chair Privilege Escalation to Developer**: Appointed `chair` tries to create/update `/role_assignments/chair_at_gmail_com` with `{ "role": "developer" }` or revoke the Developer's role doc.
2. **Chair Appointing Another Chair**: Appointed `chair` tries to appoint `{ "role": "chair" }` in `/role_assignments/friend_at_gmail_com` (strictly Developer-only).
3. **Email Spoofing Without Verification**: Request with `email == "adnanchowdhury477@gmail.com"` and `email_verified == false` attempts to write `/settings/program`.
4. **Cross-Lead Segment Breach (Lead 1 -> Tech Pipeline)**: User with `role == "lead1"` attempts to update `/tech_pipeline/UE-LEAD-2026-101`.
5. **Cross-Squad Submission Approval (Lead 2 -> Squad A)**: User with `role == "lead2"` attempts to approve a `Squad A` submission in `/submissions/sub1`.
6. **Secretary Privilege Escalation**: User with `role == "secretary"` attempts to issue a certificate in `/certificates/UE-CA-2026-999` or modify `/settings/program`.
7. **Shadow Field Injection**: General CA creates a submission with extra ghost field `{ "isVerified": true }`.
8. **Status Pre-Approval Spoofing**: General CA creates a submission with `{ "status": "Approved" }` instead of `"Pending"`.
9. **Identity Spoofing on Create**: User A submits an application with `{ "applicantUid": "userB_uid" }`.
10. **PII Scraping on Applications**: General CA attempts `list` or `get` on another user's `/applications/{appId}`.
11. **Terminal State Re-Opening**: Core Lead attempts to change an already `Approved` submission back to `Pending`.
12. **ID Poisoning & Timestamp Forgery**: Attacker writes to `/certificates/../../evil$id` or sends a backdated `createdAt` not equal to `request.time`.
