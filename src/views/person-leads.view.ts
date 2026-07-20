import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewKey,
  ViewSortDirection,
} from 'twenty-sdk/define';

import {
  PERSON_LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_LEADS_VIEW_SORT_UNIVERSAL_IDENTIFIER,
  PERSON_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: PERSON_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'People by Lead Score',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  icon: 'IconTargetArrow',
  key: ViewKey.INDEX,
  sorts: [
    {
      universalIdentifier: PERSON_LEADS_VIEW_SORT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        PERSON_LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.DESC,
    },
  ],
});
