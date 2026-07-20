import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewKey,
  ViewSortDirection,
} from 'twenty-sdk/define';

import {
  OPPORTUNITY_LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_LEADS_VIEW_SORT_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: OPPORTUNITY_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Opportunities by Lead Score',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  icon: 'IconTargetArrow',
  key: ViewKey.INDEX,
  sorts: [
    {
      universalIdentifier: OPPORTUNITY_LEADS_VIEW_SORT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        OPPORTUNITY_LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.DESC,
    },
  ],
});
