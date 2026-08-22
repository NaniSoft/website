import type { ChatTranscript } from './types';

export const CHAT_TRANSCRIPTS: readonly ChatTranscript[] = [
  {
    id: 'sensitive-data',
    question: 'Where is the Q3 financial model stored, and who has accessed it in the last 30 days?',
    exchange: [
      {
        role: 'user',
        text: 'Where is the Q3 financial model stored, and who has accessed it in the last 30 days?',
      },
      {
        role: 'agent',
        text: 'The file `s3://finance-prod/q3-2026/model.xlsx` is classified Confidential under policy FIN-PII-007. In the last 30 days, 4 identities accessed it: Sarah Chen, Mark Patel, the `etl-pipeline` service, and a deprecated `etl-backup` credential. Click any node to inspect.',
        artifact: 'graph-mini',
      },
    ],
  },
  {
    id: 'blast-radius',
    question: 'If the `okta-prod` service account is compromised, what data could an attacker reach?',
    exchange: [
      {
        role: 'user',
        text: 'If the `okta-prod` service account is compromised, what data could an attacker reach?',
      },
      {
        role: 'agent',
        text: 'From `okta-prod`, an attacker can reach 18 DataAssets across 6 buckets, including `customer-pii/`, `finance-prod/`, and `hr-salary/`. The blast radius crosses 3 trust boundaries. The path is shown on the right.',
        artifact: 'graph-blast',
      },
    ],
  },
  {
    id: 'compliance-at-t',
    question: 'On March 14 at 02:00 UTC, was access to `customer-pii/` by `svc-etl` compliant with `FIN-PII-007`?',
    exchange: [
      {
        role: 'user',
        text: 'On March 14 at 02:00 UTC, was access to `customer-pii/` by `svc-etl` compliant with FIN-PII-007?',
      },
      {
        role: 'agent',
        text: 'No. At 02:00 UTC on Mar 14, policy FIN-PII-007 was in version 4, which required MFA-tagged sessions for `svc-etl`. The access event at 02:00:11 UTC was tagged `mfa=false`. The same access would have been compliant under v3, which was active until Feb 28.',
        artifact: 'timeline',
      },
    ],
  },
];
