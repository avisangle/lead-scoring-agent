import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewKey,
  ViewSortDirection,
} from 'twenty-sdk/define';

import {
  PERSON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_JOB_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_LEAD_SCORE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_LEADS_VIEW_FIELD_COMPANY_UNIVERSAL_IDENTIFIER,
  PERSON_LEADS_VIEW_FIELD_JOB_TITLE_UNIVERSAL_IDENTIFIER,
  PERSON_LEADS_VIEW_FIELD_LEAD_SCORE_STATUS_UNIVERSAL_IDENTIFIER,
  PERSON_LEADS_VIEW_FIELD_LEAD_SCORE_UNIVERSAL_IDENTIFIER,
  PERSON_LEADS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  PERSON_LEADS_VIEW_SORT_UNIVERSAL_IDENTIFIER,
  PERSON_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
  PERSON_NAME_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: PERSON_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'People by Lead Score',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  icon: 'IconTargetArrow',
  key: ViewKey.INDEX,
  fields: [
    {
      universalIdentifier: PERSON_LEADS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier:
        PERSON_LEADS_VIEW_FIELD_LEAD_SCORE_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        PERSON_LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier:
        PERSON_LEADS_VIEW_FIELD_LEAD_SCORE_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        PERSON_LEAD_SCORE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier:
        PERSON_LEADS_VIEW_FIELD_JOB_TITLE_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        PERSON_JOB_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: PERSON_LEADS_VIEW_FIELD_COMPANY_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        PERSON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 150,
    },
  ],
  sorts: [
    {
      universalIdentifier: PERSON_LEADS_VIEW_SORT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        PERSON_LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.DESC,
    },
  ],
});
