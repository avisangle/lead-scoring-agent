import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewKey,
  ViewSortDirection,
} from 'twenty-sdk/define';

import {
  OPPORTUNITY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_LEAD_SCORE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_LEADS_VIEW_FIELD_AMOUNT_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_LEADS_VIEW_FIELD_LEAD_SCORE_STATUS_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_LEADS_VIEW_FIELD_LEAD_SCORE_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_LEADS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_LEADS_VIEW_FIELD_STAGE_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_LEADS_VIEW_SORT_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: OPPORTUNITY_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Opportunities by Lead Score',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  icon: 'IconTargetArrow',
  key: ViewKey.INDEX,
  fields: [
    {
      universalIdentifier:
        OPPORTUNITY_LEADS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        OPPORTUNITY_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier:
        OPPORTUNITY_LEADS_VIEW_FIELD_LEAD_SCORE_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        OPPORTUNITY_LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier:
        OPPORTUNITY_LEADS_VIEW_FIELD_LEAD_SCORE_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        OPPORTUNITY_LEAD_SCORE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier:
        OPPORTUNITY_LEADS_VIEW_FIELD_AMOUNT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        OPPORTUNITY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier:
        OPPORTUNITY_LEADS_VIEW_FIELD_STAGE_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        OPPORTUNITY_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 130,
    },
  ],
  sorts: [
    {
      universalIdentifier: OPPORTUNITY_LEADS_VIEW_SORT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        OPPORTUNITY_LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.DESC,
    },
  ],
});
