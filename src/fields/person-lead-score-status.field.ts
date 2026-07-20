import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_LEAD_SCORE_STATUS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PERSON_LEAD_SCORE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'leadScoreStatus',
  label: 'Lead Score Status',
  description: 'Scoring lifecycle state.',
  icon: 'IconStatusChange',
  isNullable: true,
  options: [
    { label: 'Queued', value: 'QUEUED', position: 0, color: 'yellow' },
    { label: 'Scored', value: 'SCORED', position: 1, color: 'green' },
    { label: 'Skipped', value: 'SKIPPED', position: 2, color: 'gray' },
    { label: 'Failed', value: 'FAILED', position: 3, color: 'red' },
  ],
});
