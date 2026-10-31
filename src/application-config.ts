import { defineApplication } from 'twenty-sdk/define';

import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const REPOSITORY_URL = 'https://github.com/avisangle/lead-scoring-agent';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  category: 'Sales',
  logo: 'public/logo.svg',
  websiteUrl: REPOSITORY_URL,
  issueReportUrl: `${REPOSITORY_URL}/issues`,
  emailSupport: 'support@reportstack.app',
});
